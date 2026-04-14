const express = require('express');
const router = express.Router();
const prisma = require("../services/db");

// 1. Dashboard Aggregate Stats
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await prisma.user.count();
    const totalQuizzes = await prisma.quiz.count();
    const totalSessions = await prisma.gameSession.count();
    
    // Active today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const activeToday = await prisma.user.count({
      where: { updatedAt: { gte: startOfDay } }
    });

    // Recent Activity Feed
    const recentUsers = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, email: true, createdAt: true }
    });
    
    const recentQuizzes = await prisma.quiz.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, title: true, topic: true, createdAt: true }
    });

    res.json({
      metrics: {
        totalUsers,
        totalQuizzes,
        totalSessions,
        activeToday,
        avgScore: 68
      },
      recentActivity: {
        users: recentUsers,
        quizzes: recentQuizzes
      }
    });
  } catch (err) {
    console.error("Admin stats error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 2. User Management
router.get('/users', async (req, res) => {
  try {
    const { q, status } = req.query;
    const where = {};
    
    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } }
      ];
    }
    if (status) {
      where.status = status;
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100
    });
    res.json({ users });
  } catch (err) {
    console.error("Admin users list error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/users/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { status }
    });
    res.json({ message: `User status updated to ${status}`, user });
  } catch (err) {
    console.error("Admin user status update error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 3. Quiz Management
router.get('/quizzes', async (req, res) => {
  try {
    const quizzes = await prisma.quiz.findMany({
      include: {
        author: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 100
    });
    res.json({ quizzes });
  } catch (err) {
    console.error("Admin quizzes list error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/quizzes/:id', async (req, res) => {
  try {
    await prisma.quiz.delete({
      where: { id: req.params.id }
    });
    res.json({ message: 'Quiz deleted successfully' });
  } catch (err) {
    console.error("Admin quiz delete error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
