const express = require('express');
const router = express.Router();
const prisma = require("../services/db");

// 1. Search Users by precise username
router.get('/search', async (req, res) => {
  try {
    const { username, userId } = req.query;
    if (!username) return res.status(400).json({ error: "Username query required" });

    const users = await prisma.user.findMany({
      where: {
        username: {
          contains: username.toLowerCase(),
          mode: 'insensitive'
        }
      },
      select: {
        id: true,
        name: true,
        username: true,
        avatar: true
      },
      take: 10
    });

    // If userId provided, check friendship status for each found user
    let userResults = users;
    if (userId) {
      userResults = await Promise.all(users.map(async (u) => {
        const friendship = await prisma.friendship.findFirst({
          where: {
            OR: [
              { userId, friendId: u.id },
              { userId: u.id, friendId: userId }
            ]
          }
        });
        return {
          ...u,
          status: friendship ? friendship.status : null,
          isRequester: friendship ? friendship.userId === userId : false
        };
      }));
    }

    res.json(userResults);
  } catch (err) {
    console.error("User search error:", err);
    res.status(500).json({ error: "Search failed" });
  }
});

// 1.1. Get Pending Friend Requests
router.get('/pending/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const pending = await prisma.friendship.findMany({
      where: {
        friendId: userId,
        status: 'pending'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true
          }
        }
      }
    });
    res.json(pending.map(p => ({ ...p.user, friendshipId: p.id })));
  } catch (err) {
    console.error("Pending requests error:", err);
    res.status(500).json({ error: "Failed to fetch pending requests" });
  }
});

// 2. Send Friend Request
router.post('/request', async (req, res) => {
  try {
    const { userId, friendId } = req.body;
    if (!userId || !friendId) return res.status(400).json({ error: "Missing IDs" });
    if (userId === friendId) return res.status(400).json({ error: "Cannot add yourself" });

    const friendship = await prisma.friendship.upsert({
      where: {
        userId_friendId: { userId, friendId }
      },
      update: { status: 'pending' },
      create: {
        userId,
        friendId,
        status: 'pending'
      }
    });

    res.json(friendship);
  } catch (err) {
    console.error("Friend request error:", err);
    res.status(500).json({ error: "Failed to send request" });
  }
});

// 3. Manage Friend status (Accept, Block, Remove, Pin)
router.put('/manage', async (req, res) => {
  try {
    const { userId, friendId, action } = req.body;
    // action: 'accept', 'block', 'remove', 'pin', 'unpin'
    
    if (action === 'remove') {
      await prisma.friendship.deleteMany({
        where: {
          OR: [
            { userId, friendId },
            { userId: friendId, friendId: userId }
          ]
        }
      });
      return res.json({ message: "Friend removed" });
    }

    const updateData = {};
    if (action === 'accept') updateData.status = 'accepted';
    if (action === 'block') updateData.status = 'blocked';
    if (action === 'pin') updateData.isPinned = true;
    if (action === 'unpin') updateData.isPinned = false;

    // Use findFirst then update because of the OR relationship
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId, friendId },
          { userId: friendId, friendId: userId }
        ]
      }
    });

    if (!friendship) return res.status(404).json({ error: "Friendship not found" });

    const updated = await prisma.friendship.update({
      where: { id: friendship.id },
      data: updateData
    });

    res.json(updated);
  } catch (err) {
    console.error("Friend management error:", err);
    res.status(500).json({ error: "Action failed" });
  }
});

// 4. Get Friends List (Accepted)
router.get('/list/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [{ userId }, { friendId: userId }],
        status: 'accepted'
      },
      include: {
        user: { select: { id: true, name: true, username: true, avatar: true } },
        friend: { select: { id: true, name: true, username: true, avatar: true } }
      },
      orderBy: { isPinned: 'desc' }
    });

    // Map to simple friend objects
    const friends = friendships.map(f => {
      const other = f.userId === userId ? f.friend : f.user;
      return {
        ...other,
        isPinned: f.isPinned,
        shipId: f.id
      };
    });

    res.json(friends);
  } catch (err) {
    console.error("Fetch friends error:", err);
    res.status(500).json({ error: "Failed to list friends" });
  }
});

// 5. Get Messages
router.get('/messages/:userId/:friendId', async (req, res) => {
  try {
    const { userId, friendId } = req.params;
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: friendId },
          { senderId: friendId, receiverId: userId }
        ]
      },
      orderBy: { createdAt: 'asc' },
      take: 50
    });
    res.json(messages);
  } catch (err) {
    console.error("Fetch messages error:", err);
    res.status(500).json({ error: "Failed to load messages" });
  }
});

module.exports = router;
