const express = require('express');
const router = express.Router();
const prisma = require("../services/db");
const { mapId } = require("../services/compatibility");

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

    // Analytics: Activity over last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const activityOverTime = await prisma.user.groupBy({
      by: ['createdAt'],
      _count: { _all: true },
      where: { createdAt: { gte: sevenDaysAgo } },
      orderBy: { createdAt: 'asc' }
    });

    res.json({
      metrics: {
        totalUsers,
        totalQuizzes,
        totalSessions,
        activeToday,
        avgScore: 72
      },
      recentActivity: {
        users: mapId(recentUsers),
        quizzes: mapId(recentQuizzes)
      },
      activityOverTime
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
    res.json({ users: mapId(users) });
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
    res.json({ message: `User status updated to ${status}`, user: mapId(user) });
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
    res.json({ quizzes: mapId(quizzes) });
  } catch (err) {
    console.error("Admin quizzes list error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/quizzes/:id/publish', async (req, res) => {
  try {
    const { isPublished } = req.body;
    const quiz = await prisma.quiz.update({
      where: { id: req.params.id },
      data: { isPublished }
    });
    res.json({ message: `Quiz publication status updated`, quiz: mapId(quiz) });
  } catch (err) {
    console.error("Admin quiz publish update error:", err);
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

// 4. News Management
router.get('/news', async (req, res) => {
  try {
    const news = await prisma.news.findMany({
      orderBy: { createdAt: 'desc' },
      include: { author: { select: { name: true } } }
    });
    res.json({ news: mapId(news) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/news', async (req, res) => {
  try {
    const { title, content, image, category, isPinned } = req.body;
    const news = await prisma.news.create({
      data: {
        title,
        content,
        image,
        category: category || "General",
        isPinned: isPinned || false,
        authorId: req.user.id
      }
    });
    res.json({ message: "News created", news: mapId(news) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/news/:id', async (req, res) => {
  try {
    const { title, content, image, category, isPinned } = req.body;
    const news = await prisma.news.update({
      where: { id: req.params.id },
      data: { title, content, image, category, isPinned }
    });
    res.json({ message: "News updated", news: mapId(news) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/news/:id', async (req, res) => {
  try {
    await prisma.news.delete({ where: { id: req.params.id } });
    res.json({ message: "News deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. System Configuration
router.get('/settings', async (req, res) => {
  try {
    const settings = await prisma.systemConfig.findMany();
    const configMap = {};
    settings.forEach(s => {
      configMap[s.key] = s.value;
    });
    res.json({ settings: configMap });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/settings', async (req, res) => {
  try {
    const { key, value } = req.body;
    const setting = await prisma.systemConfig.upsert({
      where: { key },
      update: { value },
      create: { key, value }
    });
    res.json({ message: "Setting updated", setting });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── 6. Subscription Management ───────────────────────────────────────────────

// List all subscriptions with user + usage
router.get('/subscriptions', async (req, res) => {
  try {
    const { plan, status, q } = req.query;

    const subs = await prisma.subscription.findMany({
      where: {
        ...(plan   ? { plan }   : {}),
        ...(status ? { status } : {}),
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true, createdAt: true },
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Enrich with quota
    const enriched = await Promise.all(subs.map(async (sub) => {
      const quota = await prisma.usageQuota.findUnique({ where: { userId: sub.userId } });
      return { ...sub, quota };
    }));

    // Filter by search query
    const filtered = q
      ? enriched.filter(s =>
          s.user.name.toLowerCase().includes(q.toLowerCase()) ||
          s.user.email.toLowerCase().includes(q.toLowerCase())
        )
      : enriched;

    res.json({ subscriptions: filtered });
  } catch (err) {
    console.error("Admin subscriptions list error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Override a user's plan (admin superpower)
router.put('/subscriptions/:userId/override', async (req, res) => {
  try {
    const { plan, status, durationDays } = req.body;
    const { userId } = req.params;

    const validPlans = ['free', 'pro', 'elite', 'institution'];
    if (plan && !validPlans.includes(plan)) {
      return res.status(400).json({ error: "Invalid plan" });
    }

    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + (durationDays || 30));

    const sub = await prisma.subscription.upsert({
      where: { userId },
      update: {
        plan: plan || 'pro',
        status: status || 'active',
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
      },
      create: {
        userId,
        plan: plan || 'pro',
        status: status || 'active',
        currentPeriodEnd: periodEnd,
      }
    });

    // Reset quota on override
    await prisma.usageQuota.upsert({
      where: { userId },
      update: { aiGenerations: 0, pdfUploads: 0 },
      create: { userId, resetAt: periodEnd }
    });

    res.json({ message: `Plan overridden to ${plan} for ${durationDays || 30} days`, sub: mapId(sub) });
  } catch (err) {
    console.error("Admin plan override error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Cancel a user's subscription
router.post('/subscriptions/:userId/cancel', async (req, res) => {
  try {
    const { userId } = req.params;
    const sub = await prisma.subscription.update({
      where: { userId },
      data: { status: 'cancelled', plan: 'free', cancelAtPeriodEnd: false }
    });
    res.json({ message: 'Subscription cancelled', sub: mapId(sub) });
  } catch (err) {
    console.error("Admin subscription cancel error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Revenue metrics
router.get('/subscriptions/metrics', async (req, res) => {
  try {
    const [totalSubs, activeSubs, trialSubs, proPlan, elitePlan, instPlan] = await Promise.all([
      prisma.subscription.count(),
      prisma.subscription.count({ where: { status: 'active' } }),
      prisma.subscription.count({ where: { status: 'trialing' } }),
      prisma.subscription.count({ where: { plan: 'pro',         status: 'active' } }),
      prisma.subscription.count({ where: { plan: 'elite',       status: 'active' } }),
      prisma.subscription.count({ where: { plan: 'institution', status: 'active' } }),
    ]);

    const mrr = (proPlan * 99) + (elitePlan * 499) + (instPlan * 4999);

    res.json({
      totalSubs,
      activeSubs,
      trialSubs,
      breakdown: { pro: proPlan, elite: elitePlan, institution: instPlan },
      estimatedMRR: mrr,
    });
  } catch (err) {
    console.error("Admin subscription metrics error:", err);
    res.status(500).json({ error: err.message });
  }
});

// List device trials (audit)
router.get('/device-trials', async (req, res) => {
  try {
    const trials = await prisma.deviceTrial.findMany({
      orderBy: { usedAt: 'desc' },
      take: 100,
    });
    res.json({ trials });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

