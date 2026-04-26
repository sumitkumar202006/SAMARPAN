const express  = require("express");
const router   = express.Router();
const prisma   = require("../services/db");
const { authenticate } = require("../middleware/planGate");

// ─── GET /api/events — Browse upcoming scheduled events ───────────────────────
router.get("/", async (req, res) => {
  try {
    const { status = "upcoming" } = req.query;

    const where = status === "all"
      ? {}
      : { status };

    const events = await prisma.scheduledEvent.findMany({
      where,
      orderBy: { scheduledAt: "asc" },
      take: 50,
      include: {
        _count: { select: { rsvps: true } },
        rsvps: {
          select: { userId: true }
        }
      }
    });

    return res.json({ events });
  } catch (err) {
    console.error("Events list error:", err);
    res.status(500).json({ error: "Failed to load events" });
  }
});

// ─── POST /api/events — Create a scheduled event ─────────────────────────────
router.post("/", authenticate, async (req, res) => {
  try {
    const { quizId, title, description, scheduledAt, maxPlayers, isPublic, recurrence } = req.body;

    if (!quizId || !title || !scheduledAt) {
      return res.status(400).json({ error: "quizId, title, and scheduledAt are required" });
    }

    const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });
    if (quiz.authorId !== req.user.id) return res.status(403).json({ error: "Only the quiz author can schedule events" });

    const event = await prisma.scheduledEvent.create({
      data: {
        quizId,
        hostId:      req.user.id,
        title,
        description,
        scheduledAt: new Date(scheduledAt),
        maxPlayers:  parseInt(maxPlayers) || 100,
        isPublic:    isPublic !== false,
        recurrence:  recurrence || null,
      }
    });

    // Auto-RSVP the host
    await prisma.eventRsvp.create({
      data: { eventId: event.id, userId: req.user.id }
    });

    // Send notification to followers / all users (broadcast to first 200)
    const allUsers = await prisma.user.findMany({ take: 200, select: { id: true } });
    await prisma.notification.createMany({
      data: allUsers
        .filter(u => u.id !== req.user.id)
        .map(u => ({
          userId:  u.id,
          type:    "system",
          title:   `📅 New Event: ${title}`,
          message: `A new quiz event has been scheduled! Join and RSVP to secure your spot.`,
          link:    `/events`
        })),
      skipDuplicates: true
    });

    return res.status(201).json({ event });
  } catch (err) {
    console.error("Event create error:", err);
    res.status(500).json({ error: "Failed to create event" });
  }
});

// ─── POST /api/events/:id/rsvp — Toggle RSVP ─────────────────────────────────
router.post("/:id/rsvp", authenticate, async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId  = req.user.id;

    const event = await prisma.scheduledEvent.findUnique({ where: { id: eventId } });
    if (!event) return res.status(404).json({ error: "Event not found" });

    const existing = await prisma.eventRsvp.findUnique({
      where: { eventId_userId: { eventId, userId } }
    });

    if (existing) {
      await prisma.eventRsvp.delete({ where: { id: existing.id } });
      return res.json({ rsvped: false });
    } else {
      const count = await prisma.eventRsvp.count({ where: { eventId } });
      if (count >= event.maxPlayers) {
        return res.status(400).json({ error: "Event is full" });
      }
      await prisma.eventRsvp.create({ data: { eventId, userId } });
      return res.json({ rsvped: true });
    }
  } catch (err) {
    console.error("RSVP toggle error:", err);
    res.status(500).json({ error: "Failed to toggle RSVP" });
  }
});

// ─── GET /api/events/:id — Single event detail ───────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const event = await prisma.scheduledEvent.findUnique({
      where:   { id: req.params.id },
      include: {
        rsvps: {
          include: { user: { select: { name: true, username: true, avatar: true, avatarFrame: true } } }
        },
        _count: { select: { rsvps: true } }
      }
    });
    if (!event) return res.status(404).json({ error: "Event not found" });
    return res.json({ event });
  } catch (err) {
    console.error("Event detail error:", err);
    res.status(500).json({ error: "Failed to load event" });
  }
});

// ─── DELETE /api/events/:id — Delete an event ─────────────────────────────────
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const event = await prisma.scheduledEvent.findUnique({ where: { id: req.params.id } });
    if (!event) return res.status(404).json({ error: "Event not found" });
    if (event.hostId !== req.user.id) return res.status(403).json({ error: "Not your event" });

    await prisma.scheduledEvent.delete({ where: { id: req.params.id } });
    return res.json({ message: "Event deleted" });
  } catch (err) {
    console.error("Event delete error:", err);
    res.status(500).json({ error: "Failed to delete event" });
  }
});

module.exports = router;
