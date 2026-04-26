const express  = require("express");
const router   = express.Router();
const prisma   = require("../services/db");
const { authenticate } = require("../middleware/planGate");

// ─── Helper ───────────────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  authenticate(req, res, next);
}

// ─── GET /api/marketplace — Browse public quiz marketplace ────────────────────
router.get("/", async (req, res) => {
  try {
    const { topic, difficulty, sort = "popular", page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { isPublished: true, isMarketplace: true };
    if (topic)      where.topic      = { contains: topic, mode: "insensitive" };
    if (difficulty) where.difficulty = difficulty;

    const orderBy =
      sort === "popular"  ? { playCount:    "desc" } :
      sort === "rating"   ? { averageRating:"desc" } :
      sort === "newest"   ? { createdAt:    "desc" } :
                            { playCount:    "desc" };

    const [quizzes, total] = await Promise.all([
      prisma.quiz.findMany({
        where,
        orderBy,
        skip,
        take: parseInt(limit),
        include: {
          author: { select: { name: true, username: true, avatar: true, avatarFrame: true } },
          _count:  { select: { reviews: true, sessions: true } }
        }
      }),
      prisma.quiz.count({ where })
    ]);

    return res.json({ quizzes, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    console.error("Marketplace list error:", err);
    res.status(500).json({ error: "Failed to load marketplace" });
  }
});

// ─── GET /api/marketplace/:id — Single quiz detail with reviews ────────────────
router.get("/:id", async (req, res) => {
  try {
    const quiz = await prisma.quiz.findUnique({
      where: { id: req.params.id },
      include: {
        author:  { select: { name: true, username: true, avatar: true, avatarFrame: true } },
        reviews: {
          orderBy: { createdAt: "desc" },
          take: 20,
          include: { user: { select: { name: true, username: true, avatar: true } } }
        },
        _count: { select: { reviews: true, sessions: true } }
      }
    });
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });
    return res.json({ quiz });
  } catch (err) {
    console.error("Marketplace quiz detail error:", err);
    res.status(500).json({ error: "Failed to load quiz" });
  }
});

// ─── POST /api/marketplace/:id/list — Toggle marketplace listing ──────────────
router.post("/:id/list", requireAuth, async (req, res) => {
  try {
    const quiz = await prisma.quiz.findUnique({ where: { id: req.params.id } });
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });
    if (quiz.authorId !== req.user.id) return res.status(403).json({ error: "Not your quiz" });

    const updated = await prisma.quiz.update({
      where: { id: req.params.id },
      data:  { isMarketplace: !quiz.isMarketplace }
    });
    return res.json({ isMarketplace: updated.isMarketplace });
  } catch (err) {
    console.error("Marketplace list toggle error:", err);
    res.status(500).json({ error: "Failed to update listing" });
  }
});

// ─── POST /api/marketplace/:id/review — Submit a review ──────────────────────
router.post("/:id/review", requireAuth, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: "Rating must be 1-5" });

    const quizId = req.params.id;
    const userId = req.user.id;

    // Upsert review
    const review = await prisma.quizReview.upsert({
      where:  { quizId_userId: { quizId, userId } },
      create: { quizId, userId, rating: parseInt(rating), comment },
      update: { rating: parseInt(rating), comment }
    });

    // Recalculate averageRating
    const agg = await prisma.quizReview.aggregate({
      where:   { quizId },
      _avg:    { rating: true },
      _count:  { rating: true }
    });

    await prisma.quiz.update({
      where: { id: quizId },
      data:  { averageRating: agg._avg.rating || 0, reviewCount: agg._count.rating }
    });

    return res.json({ review });
  } catch (err) {
    console.error("Review submit error:", err);
    res.status(500).json({ error: "Failed to submit review" });
  }
});

// ─── POST /api/marketplace/:id/remix — Fork a quiz ────────────────────────────
router.post("/:id/remix", requireAuth, async (req, res) => {
  try {
    const original = await prisma.quiz.findUnique({ where: { id: req.params.id } });
    if (!original || !original.isMarketplace) return res.status(404).json({ error: "Quiz not available for remix" });

    const remixed = await prisma.quiz.create({
      data: {
        title:        `${original.title} (Remixed)`,
        topic:        original.topic,
        authorId:     req.user.id,
        questions:    original.questions,
        aiGenerated:  false,
        tags:         [...(original.tags || []), "remixed"],
        difficulty:   original.difficulty,
        isPublished:  false,   // Draft by default
        isMarketplace:false,
      }
    });

    return res.json({ quiz: remixed, message: "Quiz remixed successfully! Edit it in your library." });
  } catch (err) {
    console.error("Remix error:", err);
    res.status(500).json({ error: "Failed to remix quiz" });
  }
});

module.exports = router;
