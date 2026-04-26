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
// Cached 60s — most expensive query on the platform
router.get("/leaderboard", async (req, res) => {
  try {
    const scores = await cache.getOrSet('explore:leaderboard', 60, async () => {
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
    });

    return res.json({ scores });
  } catch (err) {
    console.error("Leaderboard error:", err);
    return res.status(500).json({ error: "Failed to load leaderboard" });
  }
});

module.exports = router;
