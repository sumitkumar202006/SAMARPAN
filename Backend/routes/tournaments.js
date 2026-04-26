const express = require("express");
const router  = express.Router();
const prisma  = require("../services/db");
const { mapId } = require("../services/compatibility");
const { authenticate, getEffectivePlan } = require("../middleware/planGate");
const { createNotification } = require("./notifications");

// ─── GET /api/tournaments — List tournaments ──────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const { status } = req.query;
    const tournaments = await prisma.tournament.findMany({
      where:   status ? { status } : {},
      include: { _count: { select: { participants: true } } },
      orderBy: { startTime: "asc" }
    });
    res.json({ tournaments: mapId(tournaments) });
  } catch (err) {
    console.error("[Tournaments] List error:", err);
    res.status(500).json({ error: "Failed to fetch tournaments" });
  }
});

// ─── GET /api/tournaments/:id — Tournament detail ─────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const t = await prisma.tournament.findUnique({
      where:   { id: req.params.id },
      include: {
        participants: {
          include: { user: { select: { id: true, name: true, username: true, avatar: true, globalRating: true } } },
          orderBy: { registeredAt: "asc" }
        }
      }
    });
    if (!t) return res.status(404).json({ error: "Tournament not found" });
    res.json(mapId(t));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch tournament" });
  }
});

// ─── POST /api/tournaments — Create tournament (requires pro+) ────────────────
router.post("/", authenticate, async (req, res) => {
  try {
    const plan = await getEffectivePlan(req.user.id);
    if (plan === "free") {
      return res.status(402).json({ error: "Tournament hosting requires Blaze Pro or higher." });
    }

    const { name, description, quizId, maxPlayers, format, startTime, prize, requiredPlan } = req.body;
    if (!name) return res.status(400).json({ error: "Tournament name required" });

    const tournament = await prisma.tournament.create({
      data: {
        name,
        description: description || null,
        hostId:      req.user.id,
        quizId:      quizId    || null,
        maxPlayers:  maxPlayers || 16,
        format:      format    || "single_elimination",
        startTime:   startTime ? new Date(startTime) : null,
        prize:       prize     || null,
        requiredPlan: requiredPlan || null,
        status:      "registration"
      }
    });

    res.json({ message: "Tournament created", tournament: mapId(tournament) });
  } catch (err) {
    console.error("[Tournaments] Create error:", err);
    res.status(500).json({ error: "Failed to create tournament" });
  }
});

// ─── POST /api/tournaments/:id/register — Register for tournament ─────────────
router.post("/:id/register", authenticate, async (req, res) => {
  try {
    const tournament = await prisma.tournament.findUnique({
      where:   { id: req.params.id },
      include: { _count: { select: { participants: true } } }
    });
    if (!tournament) return res.status(404).json({ error: "Tournament not found" });
    if (tournament.status !== "registration") return res.status(400).json({ error: "Registration is not open" });

    if (tournament._count.participants >= tournament.maxPlayers) {
      return res.status(400).json({ error: "Tournament is full" });
    }

    // Check plan requirement
    if (tournament.requiredPlan) {
      const userPlan = await getEffectivePlan(req.user.id);
      const planOrder = ["free", "pro", "elite", "institution"];
      if (planOrder.indexOf(userPlan) < planOrder.indexOf(tournament.requiredPlan)) {
        return res.status(402).json({ error: `This tournament requires ${tournament.requiredPlan} plan or higher.` });
      }
    }

    const participant = await prisma.tournamentParticipant.create({
      data: {
        tournamentId: tournament.id,
        userId:       req.user.id,
      }
    });

    // Notify host
    createNotification(tournament.hostId, {
      type:    "system",
      title:   "New Tournament Registration",
      message: `${req.user.name} joined your tournament "${tournament.name}"`,
      link:    `/tournaments/${tournament.id}`
    }).catch(() => {});

    res.json({ message: "Registered successfully", participant: mapId(participant) });
  } catch (err) {
    if (err.code === "P2002") return res.status(409).json({ error: "Already registered" });
    console.error("[Tournaments] Register error:", err);
    res.status(500).json({ error: "Failed to register" });
  }
});

// ─── POST /api/tournaments/:id/start — Start tournament (host only) ───────────
router.post("/:id/start", authenticate, async (req, res) => {
  try {
    const tournament = await prisma.tournament.findUnique({
      where:   { id: req.params.id },
      include: { participants: { include: { user: true } } }
    });
    if (!tournament) return res.status(404).json({ error: "Tournament not found" });
    if (tournament.hostId !== req.user.id) return res.status(403).json({ error: "Only the host can start" });

    const participants = tournament.participants;
    if (participants.length < 2) return res.status(400).json({ error: "Need at least 2 participants" });

    // Generate single-elimination bracket
    const bracket = generateBracket(participants.map(p => ({ id: p.userId, name: p.user.name })));

    await prisma.tournament.update({
      where: { id: tournament.id },
      data:  { status: "running", bracket, startTime: new Date() }
    });

    // Notify all participants
    await Promise.all(participants.map(p =>
      createNotification(p.userId, {
        type:    "system",
        title:   `Tournament Started: ${tournament.name}`,
        message: "The tournament has begun! Check your bracket.",
        link:    `/tournaments/${tournament.id}`
      }).catch(() => {})
    ));

    res.json({ message: "Tournament started", bracket });
  } catch (err) {
    console.error("[Tournaments] Start error:", err);
    res.status(500).json({ error: "Failed to start tournament" });
  }
});

// ─── Bracket generator — Single elimination ───────────────────────────────────
function generateBracket(players) {
  // Shuffle players
  const shuffled = [...players].sort(() => Math.random() - 0.5);

  // Pad to next power of 2
  const targetSize = Math.pow(2, Math.ceil(Math.log2(shuffled.length)));
  while (shuffled.length < targetSize) shuffled.push({ id: null, name: "BYE" });

  const rounds = [];
  let current = shuffled;

  while (current.length > 1) {
    const matches = [];
    for (let i = 0; i < current.length; i += 2) {
      matches.push({ player1: current[i], player2: current[i + 1], winner: null, score: null });
    }
    rounds.push({ matches, completed: false });
    current = matches.map(() => null); // Placeholders for winners
  }

  return { rounds, champion: null };
}

module.exports = router;
