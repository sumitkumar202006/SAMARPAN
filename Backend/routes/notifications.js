const express = require("express");
const router  = express.Router();
const prisma  = require("../services/db");
const { authenticate } = require("../middleware/planGate");

// ─── GET /api/notifications — Get user's notifications ───────────────────────
router.get("/", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const notifs = await prisma.notification.findMany({
      where:   { userId },
      orderBy: { createdAt: "desc" },
      take:    50
    });
    res.json({ notifications: notifs });
  } catch (err) {
    console.error("[Notifications] Fetch error:", err);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// ─── GET /api/notifications/unread-count ─────────────────────────────────────
router.get("/unread-count", authenticate, async (req, res) => {
  try {
    const count = await prisma.notification.count({
      where: { userId: req.user.id, isRead: false }
    });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: "Failed to count notifications" });
  }
});

// ─── POST /api/notifications/mark-read — Mark all as read ────────────────────
router.post("/mark-read", authenticate, async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data:  { isRead: true }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to mark notifications" });
  }
});

// ─── POST /api/notifications/mark-read/:id — Mark single as read ─────────────
router.post("/mark-read/:id", authenticate, async (req, res) => {
  try {
    await prisma.notification.update({
      where: { id: req.params.id },
      data:  { isRead: true }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to mark notification" });
  }
});

// ─── DELETE /api/notifications/:id ───────────────────────────────────────────
router.delete("/:id", authenticate, async (req, res) => {
  try {
    await prisma.notification.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete notification" });
  }
});

module.exports = router;

// ─── Notification helpers (exported for use in server.js/billing.js) ─────────
async function createNotification(userId, { type, title, message, link = null, metadata = null }) {
  try {
    return await prisma.notification.create({
      data: { userId, type, title, message, link, metadata }
    });
  } catch (err) {
    console.error("[Notifications] Create error:", err.message);
    return null;
  }
}

// Notify all friends of a user about an event
async function notifyFriends(userId, notification) {
  try {
    const friendships = await prisma.friendship.findMany({
      where: { OR: [{ userId }, { friendId: userId }], status: "accepted" }
    });
    const friendIds = friendships.map(f => f.userId === userId ? f.friendId : f.userId);
    await Promise.all(friendIds.map(fid => createNotification(fid, notification)));
  } catch (err) {
    console.error("[Notifications] Friend notify error:", err.message);
  }
}

// ─── Single clean export — all consumers use the same object ─────────────────
module.exports = {
  router,
  createNotification,
  notifyFriends,
};
