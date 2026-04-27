const express = require('express');
const router  = express.Router();
const prisma  = require('../services/db');
const { authenticate } = require('../middleware/planGate');

// ─── Guard: caller must be acting as themselves ────────────────────────────────
// Rejects requests where the userId in body/params doesn't match the JWT owner.
function selfOnly(extractId) {
  return (req, res, next) => {
    const claimedId = extractId(req);
    if (claimedId && claimedId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden: you can only act as yourself.' });
    }
    next();
  };
}

// ─── 1. Search Users (authenticated — shows friendship status relative to caller) ──
router.get('/search', authenticate, async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) return res.status(400).json({ error: 'Username query required' });

    const userId = req.user.id; // always use the verified caller

    const users = await prisma.user.findMany({
      where: {
        username: { contains: username.toLowerCase(), mode: 'insensitive' },
        NOT: { id: userId }, // exclude self from results
      },
      select: { id: true, name: true, username: true, avatar: true },
      take: 10,
    });

    const userResults = await Promise.all(users.map(async (u) => {
      const friendship = await prisma.friendship.findFirst({
        where: {
          OR: [
            { userId, friendId: u.id },
            { userId: u.id, friendId: userId },
          ],
        },
      });
      return {
        ...u,
        status:      friendship ? friendship.status : null,
        isRequester: friendship ? friendship.userId === userId : false,
      };
    }));

    res.json(userResults);
  } catch (err) {
    console.error('User search error:', err);
    res.status(500).json({ error: 'Search failed' });
  }
});

// ─── 1.1. Get Pending Friend Requests (own only) ───────────────────────────────
router.get(
  '/pending/:userId',
  authenticate,
  selfOnly((req) => req.params.userId),
  async (req, res) => {
    try {
      const pending = await prisma.friendship.findMany({
        where: { friendId: req.user.id, status: 'pending' },
        include: {
          user: { select: { id: true, name: true, username: true, avatar: true } },
        },
      });
      res.json(pending.map((p) => ({ ...p.user, friendshipId: p.id })));
    } catch (err) {
      console.error('Pending requests error:', err);
      res.status(500).json({ error: 'Failed to fetch pending requests' });
    }
  }
);

// ─── 2. Send Friend Request ────────────────────────────────────────────────────
router.post(
  '/request',
  authenticate,
  selfOnly((req) => req.body.userId),
  async (req, res) => {
    try {
      const userId   = req.user.id; // enforced by selfOnly
      const { friendId } = req.body;
      if (!friendId) return res.status(400).json({ error: 'friendId required' });
      if (userId === friendId) return res.status(400).json({ error: 'Cannot add yourself' });

      // Verify target user exists
      const target = await prisma.user.findUnique({ where: { id: friendId }, select: { id: true } });
      if (!target) return res.status(404).json({ error: 'User not found' });

      const friendship = await prisma.friendship.upsert({
        where:  { userId_friendId: { userId, friendId } },
        update: { status: 'pending' },
        create: { userId, friendId, status: 'pending' },
      });

      res.json(friendship);
    } catch (err) {
      console.error('Friend request error:', err);
      res.status(500).json({ error: 'Failed to send request' });
    }
  }
);

// ─── 3. Manage Friendship (Accept / Block / Remove / Pin) ─────────────────────
router.put(
  '/manage',
  authenticate,
  selfOnly((req) => req.body.userId),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { friendId, action } = req.body;

      if (!friendId) return res.status(400).json({ error: 'friendId required' });
      const validActions = ['accept', 'block', 'remove', 'pin', 'unpin'];
      if (!action || !validActions.includes(action)) {
        return res.status(400).json({ error: `action must be one of: ${validActions.join(', ')}` });
      }

      if (action === 'remove') {
        await prisma.friendship.deleteMany({
          where: {
            OR: [
              { userId, friendId },
              { userId: friendId, friendId: userId },
            ],
          },
        });
        return res.json({ message: 'Friend removed' });
      }

      const updateData = {};
      if (action === 'accept') updateData.status  = 'accepted';
      if (action === 'block')  updateData.status  = 'blocked';
      if (action === 'pin')    updateData.isPinned = true;
      if (action === 'unpin')  updateData.isPinned = false;

      const friendship = await prisma.friendship.findFirst({
        where: {
          OR: [
            { userId, friendId },
            { userId: friendId, friendId: userId },
          ],
        },
      });
      if (!friendship) return res.status(404).json({ error: 'Friendship not found' });

      // Only the *recipient* can accept; only the *initiator* can block/pin
      if (action === 'accept' && friendship.friendId !== userId) {
        return res.status(403).json({ error: 'Only the recipient can accept a request.' });
      }

      const updated = await prisma.friendship.update({
        where: { id: friendship.id },
        data:  updateData,
      });

      res.json(updated);
    } catch (err) {
      console.error('Friend management error:', err);
      res.status(500).json({ error: 'Action failed' });
    }
  }
);

// ─── 4. Get Friends List (own only) ───────────────────────────────────────────
router.get(
  '/list/:userId',
  authenticate,
  selfOnly((req) => req.params.userId),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const friendships = await prisma.friendship.findMany({
        where: { OR: [{ userId }, { friendId: userId }], status: 'accepted' },
        include: {
          user:   { select: { id: true, name: true, username: true, avatar: true, publicKey: true } },
          friend: { select: { id: true, name: true, username: true, avatar: true, publicKey: true } },
        },
        orderBy: { isPinned: 'desc' },
      });

      const friends = friendships.map((f) => {
        const other = f.userId === userId ? f.friend : f.user;
        return { ...other, isPinned: f.isPinned, shipId: f.id };
      });

      res.json(friends);
    } catch (err) {
      console.error('Fetch friends error:', err);
      res.status(500).json({ error: 'Failed to list friends' });
    }
  }
);

// ─── 5. Get Messages (caller must be one of the two parties) ──────────────────
router.get('/messages/:userId/:friendId', authenticate, async (req, res) => {
  try {
    const { userId, friendId } = req.params;

    // Caller must be one of the two conversation participants
    if (req.user.id !== userId && req.user.id !== friendId) {
      return res.status(403).json({ error: 'Forbidden: not a participant in this conversation.' });
    }

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: friendId },
          { senderId: friendId, receiverId: userId },
        ],
      },
      orderBy: { createdAt: 'asc' },
      take: 50,
    });

    res.json(messages);
  } catch (err) {
    console.error('Fetch messages error:', err);
    res.status(500).json({ error: 'Failed to load messages' });
  }
});

// ─── 6. Mark Messages as Read (own inbox only) ────────────────────────────────
router.post(
  '/messages/mark-read',
  authenticate,
  selfOnly((req) => req.body.userId),
  async (req, res) => {
    try {
      const userId   = req.user.id;
      const { friendId } = req.body;
      if (!friendId) return res.status(400).json({ error: 'friendId required' });

      await prisma.message.updateMany({
        where: { senderId: friendId, receiverId: userId, isRead: false },
        data:  { isRead: true },
      });
      res.json({ ok: true });
    } catch (err) {
      console.error('Mark read error:', err);
      res.status(500).json({ error: 'Failed to mark as read' });
    }
  }
);

// ─── 7. Unread Count (own only) ───────────────────────────────────────────────
router.get(
  '/unread/:userId',
  authenticate,
  selfOnly((req) => req.params.userId),
  async (req, res) => {
    try {
      const count = await prisma.message.count({
        where: { receiverId: req.user.id, isRead: false },
      });
      res.json({ unread: count });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch unread count' });
    }
  }
);

// ─── 8. Clear Chat — permanently delete all messages between caller & friend ──
// Both the caller's sent AND received messages in that conversation are deleted.
// The friend's copy is also wiped (shared conversation — either party can clear).
router.delete(
  '/messages/:friendId',
  authenticate,
  async (req, res) => {
    try {
      const userId   = req.user.id;
      const { friendId } = req.params;
      if (!friendId) return res.status(400).json({ error: 'friendId required' });

      // Verify they are actually friends (prevent clearing stranger's chat)
      const friendship = await prisma.friendship.findFirst({
        where: {
          OR: [
            { userId, friendId, status: 'accepted' },
            { userId: friendId, friendId: userId, status: 'accepted' },
          ],
        },
      });
      if (!friendship) return res.status(403).json({ error: 'Not friends with this user.' });

      const { count } = await prisma.message.deleteMany({
        where: {
          OR: [
            { senderId: userId,   receiverId: friendId },
            { senderId: friendId, receiverId: userId   },
          ],
        },
      });

      res.json({ cleared: count });
    } catch (err) {
      console.error('Clear chat error:', err);
      res.status(500).json({ error: 'Failed to clear chat' });
    }
  }
);

module.exports = router;
