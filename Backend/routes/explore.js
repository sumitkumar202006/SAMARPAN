const express = require("express");
const router  = express.Router();
const prisma  = require("../services/db");
const { mapId } = require("../services/compatibility");
const { cache } = require("../services/cache");

// ─── GET /api/explore/home — Personalized home feed ──────────────────────────
router.get("/home", async (req, res) => {
  try {
    const { email } = req.query;
    let user = null;
    if (email) {
      user = await prisma.user.findUnique({
        where:  { email: email.toLowerCase().trim() },
        select: { preferredField: true, course: true, college: true, customField: true }
      });
    }

    // Cache trending (shared for all users — 2 min TTL)
    const trending = await cache.getOrSet('explore:trending', 120, () =>
      prisma.quiz.findMany({
        where:   { isPublished: true },
        orderBy: { playCount: "desc" },
        take:    5,
        select:  { id: true, title: true, topic: true, difficulty: true, playCount: true, tags: true }
      })
    );

    // Live sessions — short cache (15s) as they change fast
    const events = await cache.getOrSet('explore:live', 15, () =>
      prisma.gameSession.findMany({
        where:   { status: "waiting" },
        include: { quiz: { select: { id: true, title: true, topic: true } } },
        take:    5,
        orderBy: { createdAt: "desc" }
      })
    );

    // Recommended: personalized if logged in, else recent (cache per user or global)
    let recommended = [];
    if (user) {
      const personalFields = [user.preferredField, user.course, user.college, user.customField].filter(Boolean);
      if (personalFields.length > 0) {
        recommended = await prisma.quiz.findMany({
          where: {
            isPublished: true,
            OR: personalFields.flatMap(f => [
              { topic: { contains: f, mode: "insensitive" } },
              { tags:  { has: f.toLowerCase() } }
            ])
          },
          orderBy: { playCount: "desc" },
          take:    6,
          select:  { id: true, title: true, topic: true, difficulty: true, playCount: true, tags: true }
        });
      }
    }

    // Fallback / anonymous — cached 60s
    if (recommended.length < 3) {
      recommended = await cache.getOrSet('explore:recent', 60, () =>
        prisma.quiz.findMany({
          where:   { isPublished: true },
          orderBy: { createdAt: "desc" },
          take:    6,
          select:  { id: true, title: true, topic: true, difficulty: true, playCount: true, tags: true }
        })
      );
    }

    return res.json({
      trending:    mapId(trending),
      events:      mapId(events),
      recommended: mapId(recommended)
    });
  } catch (err) {
    console.error("Explore home error:", err);
    return res.status(500).json({ error: "Failed to load explore feed" });
  }
});

// ─── GET /api/explore/leaderboard — Public leaderboard (top 50) ───────────────
// Supports ?period=weekly|monthly|all-time  and  ?category=<topic>
// Each period+category combination is individually cached
router.get("/leaderboard", async (req, res) => {
  try {
    const period   = (req.query.period   || 'all-time').toLowerCase();
    const category = (req.query.category || 'all').toLowerCase();
    const cacheKey = `explore:leaderboard:${period}:${category}`;

    // Determine the date floor for period filtering
    let dateFloor = null;
    if (period === 'weekly')  dateFloor = new Date(Date.now() - 7  * 24 * 60 * 60 * 1000);
    if (period === 'monthly') dateFloor = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const scores = await cache.getOrSet(cacheKey, 60, async () => {
      // All-time global (no date/category filter) — simple user list
      if (!dateFloor && category === 'all') {
        const users = await prisma.user.findMany({
          orderBy: { globalRating: "desc" },
          take:    50,
          select:  {
            name:          true,
            username:      true,
            globalRating:  true,
            xp:            true,
            avatar:        true,
            avatarFrame:   true,
            totalWins:     true,
            totalLosses:   true,
            bestWinStreak: true,
          }
        });
        return users.map((u, idx) => ({
          rank:          idx + 1,
          name:          u.name,
          username:      u.username,
          score:         u.globalRating,
          xp:            u.xp,
          avatar:        u.avatar,
          avatarFrame:   u.avatarFrame || 'none',
          totalWins:     u.totalWins    || 0,
          totalLosses:   u.totalLosses  || 0,
          bestWinStreak: u.bestWinStreak || 0,
        }));
      }

      // Period / category filter — aggregate via RatingHistory
      const historyWhere = {};
      if (dateFloor)          historyWhere.createdAt = { gte: dateFloor };
      if (category !== 'all') historyWhere.category  = { equals: category, mode: 'insensitive' };

      // Group rating changes by userId, sum delta, join user
      const history = await prisma.ratingHistory.findMany({
        where:   historyWhere,
        select:  { userId: true, delta: true, user: { select: { name: true, username: true, globalRating: true, xp: true, avatar: true, avatarFrame: true, totalWins: true, bestWinStreak: true } } }
      });

      const aggregated = {};
      for (const h of history) {
        if (!aggregated[h.userId]) {
          aggregated[h.userId] = { ...h.user, score: 0, totalWins: h.user.totalWins || 0, bestWinStreak: h.user.bestWinStreak || 0 };
        }
        aggregated[h.userId].score += (h.delta || 0);
      }

      const sorted = Object.values(aggregated)
        .sort((a, b) => b.score - a.score)
        .slice(0, 50)
        .map((u, idx) => ({
          rank:          idx + 1,
          name:          u.name,
          username:      u.username,
          score:         u.score,
          xp:            u.xp,
          avatar:        u.avatar,
          avatarFrame:   u.avatarFrame || 'none',
          totalWins:     u.totalWins,
          bestWinStreak: u.bestWinStreak,
        }));

      // Fallback to global all-time if no history found
      if (sorted.length === 0) {
        const users = await prisma.user.findMany({
          orderBy: { globalRating: "desc" },
          take:    20,
          select:  { name: true, username: true, globalRating: true, xp: true, avatar: true, avatarFrame: true, totalWins: true, bestWinStreak: true }
        });
        return users.map((u, idx) => ({ rank: idx + 1, name: u.name, username: u.username, score: u.globalRating, xp: u.xp, avatar: u.avatar, avatarFrame: u.avatarFrame || 'none', totalWins: u.totalWins || 0, bestWinStreak: u.bestWinStreak || 0 }));
      }

      return sorted;
    });

    return res.json({ scores });
  } catch (err) {
    console.error("Leaderboard error:", err);
    return res.status(500).json({ error: "Failed to load leaderboard" });
  }
});

module.exports = router;
