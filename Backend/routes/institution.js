const express  = require("express");
const router   = express.Router();
const prisma   = require("../services/db");
const { authenticate } = require("../middleware/planGate");
const { Parser } = require("json2csv"); // npm install json2csv

// ─── Helper: generate random join code ────────────────────────────────────────
function randomCode(prefix = "INST") {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = prefix + "-";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// ─── POST /api/institution/create — Create institution ────────────────────────
router.post("/create", authenticate, async (req, res) => {
  try {
    const { name, logoUrl, website } = req.body;
    if (!name) return res.status(400).json({ error: "Institution name is required" });

    // Check user is on institution plan
    const sub = await prisma.subscription.findUnique({ where: { userId: req.user.id } });
    if (!sub || sub.plan !== "institution") {
      return res.status(402).json({ error: "Institution plan required to create an institution" });
    }

    // Check doesn't already own one
    const existing = await prisma.institution.findUnique({ where: { ownerId: req.user.id } });
    if (existing) return res.status(400).json({ error: "You already own an institution", institution: existing });

    let code;
    let attempts = 0;
    do {
      code = randomCode("INST");
      const exists = await prisma.institution.findUnique({ where: { code } });
      if (!exists) break;
      attempts++;
    } while (attempts < 10);

    const institution = await prisma.institution.create({
      data: { name, code, ownerId: req.user.id, logoUrl, website }
    });

    // Auto-join owner as admin
    await prisma.institutionMember.create({
      data: { institutionId: institution.id, userId: req.user.id, role: "admin" }
    });

    return res.status(201).json({ institution });
  } catch (err) {
    console.error("Institution create error:", err);
    res.status(500).json({ error: "Failed to create institution" });
  }
});

// ─── GET /api/institution/me — Get my institution ─────────────────────────────
router.get("/me", authenticate, async (req, res) => {
  try {
    // Owner
    let institution = await prisma.institution.findUnique({
      where:   { ownerId: req.user.id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true, name: true, username: true, avatar: true, avatarFrame: true,
                globalRating: true, totalWins: true, totalLosses: true, dailyStreak: true,
                createdAt: true
              }
            }
          }
        },
        assignments: {
          include: { assignedBy: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
          take: 20
        },
        _count: { select: { members: true, assignments: true } }
      }
    });

    // Or member
    if (!institution) {
      const membership = await prisma.institutionMember.findFirst({
        where:   { userId: req.user.id },
        include: {
          institution: {
            include: {
              _count: { select: { members: true } }
            }
          }
        }
      });
      if (membership) {
        return res.json({ institution: membership.institution, role: membership.role, isMember: true });
      }
      return res.status(404).json({ error: "No institution found" });
    }

    return res.json({ institution, role: "owner", isOwner: true });
  } catch (err) {
    console.error("Institution me error:", err);
    res.status(500).json({ error: "Failed to load institution" });
  }
});

// ─── POST /api/institution/join — Join by code ────────────────────────────────
router.post("/join", authenticate, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: "Join code is required" });

    const institution = await prisma.institution.findUnique({ where: { code: code.toUpperCase().trim() } });
    if (!institution) return res.status(404).json({ error: "Invalid join code" });

    const existing = await prisma.institutionMember.findUnique({
      where: { institutionId_userId: { institutionId: institution.id, userId: req.user.id } }
    });
    if (existing) return res.status(400).json({ error: "Already a member" });

    const member = await prisma.institutionMember.create({
      data: { institutionId: institution.id, userId: req.user.id, role: "student" }
    });

    return res.json({ member, institution: { name: institution.name, code: institution.code } });
  } catch (err) {
    console.error("Institution join error:", err);
    res.status(500).json({ error: "Failed to join institution" });
  }
});

// ─── GET /api/institution/analytics — Class-wide analytics ───────────────────
router.get("/analytics", authenticate, async (req, res) => {
  try {
    const institution = await prisma.institution.findUnique({ where: { ownerId: req.user.id } });
    if (!institution) return res.status(404).json({ error: "No institution found" });

    const members = await prisma.institutionMember.findMany({
      where: { institutionId: institution.id },
      include: {
        user: {
          select: {
            id: true, name: true, username: true, avatar: true,
            globalRating: true, totalWins: true, totalLosses: true,
            dailyStreak: true, bestWinStreak: true, xp: true, plan: true
          }
        }
      }
    });

    const userIds = members.map(m => m.user.id);

    // Aggregate answer logs for members
    const answerLogs = await prisma.answerLog.findMany({
      where: { userId: { in: userIds } },
      select: { userId: true, isCorrect: true, timeTaken: true, questionIndex: true }
    });

    const stats = {};
    answerLogs.forEach(log => {
      if (!stats[log.userId]) stats[log.userId] = { correct: 0, total: 0, totalTime: 0 };
      stats[log.userId].total++;
      if (log.isCorrect) stats[log.userId].correct++;
      stats[log.userId].totalTime += log.timeTaken;
    });

    const memberStats = members.map(m => ({
      ...m.user,
      role:       m.role,
      joinedAt:   m.joinedAt,
      accuracy:   stats[m.user.id] ? Math.round((stats[m.user.id].correct / stats[m.user.id].total) * 100) : 0,
      totalPlayed: stats[m.user.id]?.total || 0,
      avgTime:    stats[m.user.id] ? (stats[m.user.id].totalTime / stats[m.user.id].total).toFixed(2) : 0,
    }));

    const avgRating   = memberStats.reduce((s, m) => s + m.globalRating, 0) / (memberStats.length || 1);
    const avgAccuracy = memberStats.reduce((s, m) => s + m.accuracy, 0)    / (memberStats.length || 1);

    return res.json({
      institution,
      memberStats,
      summary: {
        totalMembers: memberStats.length,
        avgRating:    Math.round(avgRating),
        avgAccuracy:  Math.round(avgAccuracy),
        totalGames:   answerLogs.length
      }
    });
  } catch (err) {
    console.error("Institution analytics error:", err);
    res.status(500).json({ error: "Failed to load analytics" });
  }
});

// ─── GET /api/institution/export — Export member stats as CSV ─────────────────
router.get("/export", authenticate, async (req, res) => {
  try {
    const institution = await prisma.institution.findUnique({ where: { ownerId: req.user.id } });
    if (!institution) return res.status(404).json({ error: "No institution found" });

    const members = await prisma.institutionMember.findMany({
      where: { institutionId: institution.id },
      include: { user: { select: { name: true, username: true, globalRating: true, totalWins: true, totalLosses: true, dailyStreak: true, xp: true } } }
    });

    const rows = members.map(m => ({
      Name:        m.user.name,
      Username:    m.user.username || "",
      Role:        m.role,
      ELO:         m.user.globalRating,
      Wins:        m.user.totalWins,
      Losses:      m.user.totalLosses,
      Streak:      m.user.dailyStreak,
      XP:          m.user.xp,
      JoinedAt:    m.joinedAt.toISOString().split("T")[0]
    }));

    const parser = new Parser();
    const csv    = parser.parse(rows);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${institution.name.replace(/\s+/g, "_")}_members.csv"`);
    return res.send(csv);
  } catch (err) {
    console.error("Export error:", err);
    res.status(500).json({ error: "Export failed" });
  }
});

// ─── POST /api/institution/assign — Assign a quiz to institution ───────────────
router.post("/assign", authenticate, async (req, res) => {
  try {
    const { quizId, title, dueAt } = req.body;
    if (!quizId) return res.status(400).json({ error: "quizId is required" });

    const institution = await prisma.institution.findUnique({ where: { ownerId: req.user.id } });
    if (!institution) return res.status(404).json({ error: "No institution found" });

    const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });

    const assignment = await prisma.quizAssignment.create({
      data: {
        institutionId: institution.id,
        quizId,
        assignedById:  req.user.id,
        title:         title || quiz.title,
        dueAt:         dueAt ? new Date(dueAt) : null
      }
    });

    // Notify all members
    const members = await prisma.institutionMember.findMany({ where: { institutionId: institution.id } });
    await prisma.notification.createMany({
      data: members
        .filter(m => m.userId !== req.user.id)
        .map(m => ({
          userId:  m.userId,
          type:    "system",
          title:   `📝 New Assignment: ${title || quiz.title}`,
          message: dueAt ? `Due: ${new Date(dueAt).toDateString()}` : "No deadline set.",
          link:    `/play/${quizId}`
        })),
      skipDuplicates: true
    });

    return res.status(201).json({ assignment });
  } catch (err) {
    console.error("Assignment error:", err);
    res.status(500).json({ error: "Failed to assign quiz" });
  }
});

// ─── DELETE /api/institution/member/:userId — Remove member ───────────────────
router.delete("/member/:userId", authenticate, async (req, res) => {
  try {
    const institution = await prisma.institution.findUnique({ where: { ownerId: req.user.id } });
    if (!institution) return res.status(403).json({ error: "Not an institution owner" });

    await prisma.institutionMember.deleteMany({
      where: { institutionId: institution.id, userId: req.params.userId }
    });
    return res.json({ message: "Member removed" });
  } catch (err) {
    res.status(500).json({ error: "Failed to remove member" });
  }
});

// ─── DELETE /api/institution/assignment/:id — Remove assignment ────────────────
router.delete("/assignment/:id", authenticate, async (req, res) => {
  try {
    const institution = await prisma.institution.findUnique({ where: { ownerId: req.user.id } });
    if (!institution) return res.status(403).json({ error: "Not an institution owner" });

    const assignment = await prisma.quizAssignment.findUnique({ where: { id: req.params.id } });
    if (!assignment) return res.status(404).json({ error: "Assignment not found" });
    if (assignment.institutionId !== institution.id) return res.status(403).json({ error: "Not your assignment" });

    await prisma.quizAssignment.delete({ where: { id: req.params.id } });
    return res.json({ message: "Assignment removed" });
  } catch (err) {
    res.status(500).json({ error: "Failed to remove assignment" });
  }
});

module.exports = router;
