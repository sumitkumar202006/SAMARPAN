const express = require("express");
const router  = express.Router();
const prisma  = require("../services/db");
const { mapId } = require("../services/compatibility");
const { generateQuizQuestions } = require("../services/gptService");
const { authenticate, getEffectivePlan, PLAN_LIMITS } = require("../middleware/planGate");

// ─── POST /api/quizzes — Create quiz (authenticated) ───────────────────────────
router.post("/", authenticate, async (req, res) => {
  try {
    const { title, topic, authorId, questions, tags, aiGenerated } = req.body;

    if (!title || !questions || !questions.length) {
      return res.status(400).json({ error: "title and at least 1 question required" });
    }

    // Validate question schema
    const valid = questions.every(q =>
      q.question &&
      Array.isArray(q.options) &&
      q.options.length === 4 &&
      typeof q.correctIndex === "number" &&
      q.correctIndex >= 0 &&
      q.correctIndex <= 3
    );
    if (!valid) {
      return res.status(400).json({ error: "Each question must have question, 4 options, and a valid correctIndex (0-3)" });
    }

    // Resolve authorId: prefer authenticated user, fall back to body (email lookup)
    let resolvedAuthorId = req.user?.id;

    // Resolve authorId fallback: body email lookup for legacy calls
    if (!resolvedAuthorId && typeof authorId === "string" && authorId.includes("@")) {
      const u = await prisma.user.findUnique({ where: { email: authorId.toLowerCase().trim() } });
      if (!u) return res.status(400).json({ error: "User not found for this authorId" });
      resolvedAuthorId = u.id;
    }
    if (!resolvedAuthorId) return res.status(400).json({ error: "Could not resolve author" });

    // Deduplicate questions by text (AI quality control)
    const seen = new Set();
    const dedupedQuestions = questions.filter(q => {
      const key = q.question.trim().toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const quiz = await prisma.quiz.create({
      data: {
        title,
        topic:       topic || "",
        authorId:    resolvedAuthorId,
        questions:   dedupedQuestions,
        aiGenerated: !!aiGenerated,
        tags:        tags || (topic ? [topic.toLowerCase()] : []),
      }
    });

    return res.json({ message: "Quiz created", quizId: quiz.id, quiz: mapId(quiz) });
  } catch (err) {
    console.error("Create quiz error:", err);
    return res.status(500).json({ error: "Failed to create quiz" });
  }
});

// ─── GET /api/quizzes/user/:email — User's quizzes ───────────────────────────
router.get("/user/:email", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { email: req.params.email.toLowerCase().trim() } });
    if (!user) return res.json({ quizzes: [] });
    const quizzes = await prisma.quiz.findMany({
      where:   { authorId: user.id },
      orderBy: { createdAt: "desc" }
    });
    return res.json({ quizzes: mapId(quizzes) });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch user quizzes" });
  }
});

// ─── GET /api/quizzes/public — Public/trending quizzes ───────────────────────
router.get("/public", async (req, res) => {
  try {
    const quizzes = await prisma.quiz.findMany({
      where:   { isPublished: true },
      take:    20,
      orderBy: { playCount: "desc" }
    });
    return res.json({ quizzes: mapId(quizzes) });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch public quizzes" });
  }
});

// ─── GET /api/quizzes/search — Search quizzes ────────────────────────────────
router.get("/search", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json({ quizzes: [] });

    const quizzes = await prisma.quiz.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { topic: { contains: q, mode: "insensitive" } },
        ],
        isPublished: true
      },
      take:    30,
      orderBy: { playCount: "desc" }
    });

    return res.json({ quizzes: mapId(quizzes) });
  } catch (err) {
    console.error("Search error:", err);
    return res.status(500).json({ error: "Search failed" });
  }
});

// ─── GET /api/quizzes/:id — Single quiz ──────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const quiz = await prisma.quiz.findUnique({ where: { id: req.params.id } });
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });
    return res.json(mapId(quiz));
  } catch (err) {
    console.error("Fetch quiz by ID error:", err);
    return res.status(500).json({ error: "Failed to fetch quiz" });
  }
});

// ─── DELETE /api/quizzes/:id — Delete quiz (owner only) ──────────────────────
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const quiz = await prisma.quiz.findUnique({ where: { id: req.params.id } });
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });
    if (quiz.authorId !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ error: "Not authorized to delete this quiz" });
    }
    await prisma.quiz.delete({ where: { id: req.params.id } });
    return res.json({ message: "Quiz deleted" });
  } catch (err) {
    console.error("Delete quiz error:", err);
    return res.status(500).json({ error: "Failed to delete quiz" });
  }
});

module.exports = router;
