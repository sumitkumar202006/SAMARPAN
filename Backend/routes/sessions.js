const express = require("express");
const router  = express.Router();
const prisma  = require("../services/db");
const { mapId } = require("../services/compatibility");
const { authenticate } = require("../middleware/planGate");
const { getEffectivePlan } = require("../middleware/planGate");

// ─── POST /api/sessions/start — Host/create game session ─────────────────────
router.post("/start", async (req, res) => {
  const { generateQuizQuestions } = require("../services/gptService");
  const { PLAN_LIMITS } = require("../middleware/planGate");
  try {
    const {
      quizId,
      topic,
      difficulty,
      numQuestions,
      hostEmail,
      mode,
      timerSeconds,
      timerMode,
      totalSessionTime,
      rated,
      battleType
    } = req.body;

    if (!hostEmail) return res.status(400).json({ error: "hostEmail required" });

    const user = await prisma.user.findUnique({ where: { email: hostEmail.toLowerCase().trim() } });
    if (!user) return res.status(400).json({ error: "Host user not found." });

    // Plan enforcement
    const plan   = await getEffectivePlan(user.id);
    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

    if (rated && !limits.ratedMatches) {
      return res.status(402).json({ error: "Rated matches require Blaze Pro or higher." });
    }
    if (battleType && battleType !== "1v1" && !limits.allModes) {
      return res.status(402).json({ error: `${battleType} mode requires Blaze Pro or higher.` });
    }

    let finalQuizId = quizId;

    // PATH A: AI Synthesis
    if (!quizId && topic) {
      console.log(`[AI-Forge] Synthesizing quiz for: ${topic}`);
      try {
        const questions = await generateQuizQuestions(topic, difficulty || "medium", numQuestions || 10, user);
        const synthQuiz = await prisma.quiz.create({
          data: {
            title:      `Rapid Arena: ${topic}`,
            topic,
            authorId:   user.id,
            questions,
            aiGenerated: true,
            difficulty:  difficulty || "medium"
          }
        });
        finalQuizId = synthQuiz.id;
      } catch (aiErr) {
        console.error("AI Generation failed during host setup:", aiErr);
        return res.status(500).json({ error: "AI Synthesis Failed. Please try an existing quiz or check your topic." });
      }
    }

    if (!finalQuizId) return res.status(400).json({ error: "Select a quiz or enter a topic." });

    const quiz = await prisma.quiz.findUnique({ where: { id: finalQuizId } });
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });

    // Generate unique PIN
    let pin;
    let attempts = 0;
    while (attempts < 10) {
      pin = String(Math.floor(100000 + Math.random() * 900000));
      const exists = await prisma.gameSession.findUnique({ where: { pin } });
      if (!exists) break;
      attempts++;
    }

    const finalBattleType = mode === "battle" ? battleType : null;

    const game = await prisma.gameSession.create({
      data: {
        quizId:     quiz.id,
        hostId:     user.id,
        mode:       mode || "rapid",
        timerSeconds: timerSeconds || 30,
        rated:      rated !== false,
        battleType: finalBattleType,
        teamScores: finalBattleType && finalBattleType !== "1v1" ? { "Team A": 0, "Team B": 0 } : null,
        pin,
        metadata: {
          timerMode:        timerMode || "per-question",
          totalSessionTime: totalSessionTime || 10,
          playAsHost:       req.body.playAsHost !== false,
          pointsPerQ:       req.body.pointsPerQ || 100,
          penaltyPoints:    req.body.penaltyPoints || 50,
          strictFocus:      req.body.strictFocus === true,
          allowBacktrack:   req.body.allowBacktrack !== false
        }
      }
    });

    // Update lastPlayedAt for streak tracking
    await prisma.user.update({
      where: { id: user.id },
      data:  { lastPlayedAt: new Date() }
    });

    console.log(`[Host] Arena ready for ${hostEmail}. Mode: ${mode}, Rated: ${rated}, PIN: ${pin}`);
    return res.json({ message: "Arena ready", gameId: game.id, pin: game.pin });
  } catch (err) {
    console.error("CRITICAL Host start error:", err.stack || err);
    return res.status(500).json({ error: "Could not start game", details: err.message });
  }
});

// ─── GET /api/sessions/analytics/:pin ────────────────────────────────────────
router.get("/analytics/:pin", async (req, res) => {
  const { pin } = req.params;
  try {
    const session = await prisma.gameSession.findUnique({
      where:   { pin },
      include: { quiz: true, answerLogs: true }
    });

    if (!session) return res.status(404).json({ error: "Session not found" });

    const players     = {};
    const questions   = session.quiz.questions;
    const questionPerformance = questions.map(() => ({ correct: 0, incorrect: 0, totalTime: 0, responses: 0 }));

    session.answerLogs.forEach(log => {
      if (!players[log.playerName]) {
        players[log.playerName] = { name: log.playerName, correct: 0, incorrect: 0, total: 0, accuracy: 0, totalTime: 0, answers: [] };
      }
      const p = players[log.playerName];
      p.total++;
      if (log.isCorrect) p.correct++; else p.incorrect++;
      p.totalTime += log.timeTaken;
      p.answers.push(log);
      p.accuracy = (p.correct / p.total) * 100;

      if (questionPerformance[log.questionIndex]) {
        const qp = questionPerformance[log.questionIndex];
        qp.responses++;
        if (log.isCorrect) qp.correct++; else qp.incorrect++;
        qp.totalTime += log.timeTaken;
      }
    });

    return res.json({
      session: { pin: session.pin, title: session.quiz.title, mode: session.mode, createdAt: session.createdAt },
      playerPerformance: Object.values(players),
      leaderboard:       session.metadata?.finalLeaderboard || null,
      questionPerformance: questionPerformance.map((q, idx) => ({
        ...q,
        accuracy: q.responses > 0 ? (q.correct / q.responses) * 100 : 0,
        avgTime:  q.responses > 0 ? q.totalTime / q.responses : 0,
        question: questions[idx]?.question || ""
      }))
    });
  } catch (err) {
    console.error("Analytics error:", err);
    res.status(500).json({ error: "Failed to load analytics" });
  }
});

// ─── GET /api/sessions/session/:pin — Session by PIN ─────────────────────────
router.get("/session/:pin", async (req, res) => {
  try {
    const session = await prisma.gameSession.findUnique({
      where:   { pin: req.params.pin },
      include: { quiz: true }
    });
    if (!session) return res.status(404).json({ error: "Session not found" });
    const mapped      = mapId(session);
    mapped.hostId     = session.hostId;
    if (session.metadata) mapped.playAsHost = session.metadata.playAsHost !== false;
    return res.json(mapped);
  } catch (err) {
    console.error("Session fetch error:", err);
    return res.status(500).json({ error: "Failed to fetch session" });
  }
});

// ─── GET /api/sessions/active/:email — Active sessions for host ───────────────
router.get("/active/:email", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { email: req.params.email.toLowerCase().trim() } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const activeSessions = await prisma.gameSession.findMany({
      where: {
        hostId: user.id,
        status: { in: ["waiting", "running"] },
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      },
      include: { quiz: { select: { title: true } } },
      orderBy: { createdAt: "desc" }
    });

    return res.json({ sessions: mapId(activeSessions) });
  } catch (err) {
    console.error("Active sessions fetch error:", err);
    return res.status(500).json({ error: "Failed to fetch active sessions" });
  }
});

// ─── GET /api/sessions/ratings/:email — Rating history for profile page ────────
router.get("/ratings/:email", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { email: req.params.email.toLowerCase().trim() },
      select: { id: true }
    });
    if (!user) return res.status(404).json({ error: "User not found" });

    // Fetch last 30 completed sessions where the user was host or participant
    const sessions = await prisma.gameSession.findMany({
      where: {
        status: "finished",
        OR: [
          { hostId: user.id },
          { answerLogs: { some: { userId: user.id } } }
        ]
      },
      select: {
        mode:      true,
        createdAt: true,
        metadata:  true,
      },
      orderBy: { createdAt: "desc" },
      take: 30
    });

    // Extract rating history from session metadata
    const history = sessions
      .filter(s => s.metadata?.ratingChange !== undefined)
      .map(s => ({
        mode:      s.mode,
        createdAt: s.createdAt,
        change:    s.metadata.ratingChange   || 0,
        oldRating: s.metadata.oldRating      || 1200,
        newRating: s.metadata.newRating      || 1200,
      }));

    return res.json({ history });
  } catch (err) {
    console.error("Ratings history error:", err);
    return res.status(500).json({ error: "Failed to fetch rating history" });
  }
});

module.exports = router;
