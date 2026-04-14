const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Quiz = require('../models/Quiz');
const GameSession = require('../models/GameSession');

// 1. Dashboard Aggregate Stats
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalQuizzes = await Quiz.countDocuments();
    const totalSessions = await GameSession.countDocuments();
    
    // Active today (simple check for updated users)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const activeToday = await User.countDocuments({ updatedAt: { $gte: startOfDay } });

    // Recent Activity Feed (Recent users and recent quizzes)
    const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5).select('name email createdAt');
    const recentQuizzes = await Quiz.find().sort({ createdAt: -1 }).limit(5).select('title topic createdAt');

    res.json({
      metrics: {
        totalUsers,
        totalQuizzes,
        totalSessions,
        activeToday,
        avgScore: 68 // Placeholder until real score tracking is implemented
      },
      recentActivity: {
        users: recentUsers,
        quizzes: recentQuizzes
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. User Management
router.get('/users', async (req, res) => {
  try {
    const { q, status } = req.query;
    const filter = {};
    if (q) filter.$or = [{ name: new RegExp(q, 'i') }, { email: new RegExp(q, 'i') }];
    if (status) filter.status = status;

    const users = await User.find(filter).sort({ createdAt: -1 }).limit(100);
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/users/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json({ message: `User status updated to ${status}`, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Quiz Management
router.get('/quizzes', async (req, res) => {
  try {
    const quizzes = await Quiz.find()
      .populate('author', 'name email')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ quizzes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/quizzes/:id', async (req, res) => {
  try {
    await Quiz.findByIdAndDelete(req.params.id);
    res.json({ message: 'Quiz deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
