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

// List ALL users with their subscription (free users show as virtual 'free' sub)
router.get('/subscriptions', async (req, res) => {
  try {
    const { plan, status, q } = req.query;

    // Fetch all users, then join subscriptions
    const whereUser = {};
    if (q) {
      whereUser.OR = [
        { name:  { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ];
    }

    const allUsers = await prisma.user.findMany({
      where: whereUser,
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: { id: true, name: true, email: true, avatar: true, createdAt: true },
    });

    // Fetch all existing subscriptions in one query
    const existingSubs = await prisma.subscription.findMany({
      where: { userId: { in: allUsers.map(u => u.id) } },
    });
    const subByUser = Object.fromEntries(existingSubs.map(s => [s.userId, s]));

    // Fetch all quotas in one query
    const quotas = await prisma.usageQuota.findMany({
      where: { userId: { in: allUsers.map(u => u.id) } },
    });
    const quotaByUser = Object.fromEntries(quotas.map(q => [q.userId, q]));

    // Build enriched list — every user gets a record
    let enriched = allUsers.map(user => {
      const sub = subByUser[user.id];
      return {
        id:               sub?.id          || `virtual_${user.id}`,
        userId:           user.id,
        plan:             sub?.plan         || 'free',
        status:           sub?.status       || 'active',
        currentPeriodEnd: sub?.currentPeriodEnd || null,
        trialEndsAt:      sub?.trialEndsAt   || null,
        cancelAtPeriodEnd: sub?.cancelAtPeriodEnd || false,
        createdAt:        sub?.createdAt     || user.createdAt,
        user,
        quota: quotaByUser[user.id] || null,
        isVirtual: !sub,  // true = no real sub row, they're on free
      };
    });

    // Apply plan / status filters AFTER enrichment
    if (plan)   enriched = enriched.filter(r => r.plan   === plan);
    if (status) enriched = enriched.filter(r => r.status === status);

    res.json({ subscriptions: enriched });
  } catch (err) {
    console.error('Admin subscriptions list error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Override a user's plan (admin superpower)
// Also updates user.plan directly so JWT-less reads stay consistent
router.put('/subscriptions/:userId/override', async (req, res) => {
  try {
    const { plan, status, durationDays } = req.body;
    const { userId } = req.params;

    const validPlans = ['free', 'pro', 'elite', 'institution'];
    if (plan && !validPlans.includes(plan)) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    const finalPlan   = plan   || 'pro';
    const finalStatus = status || 'active';
    const periodEnd   = new Date();
    periodEnd.setDate(periodEnd.getDate() + (durationDays || 30));

    // 1. Update (or create) Subscription row
    const sub = await prisma.subscription.upsert({
      where:  { userId },
      update: {
        plan:              finalPlan,
        status:            finalStatus,
        currentPeriodEnd:  periodEnd,
        cancelAtPeriodEnd: false,
      },
      create: {
        userId,
        plan:             finalPlan,
        status:           finalStatus,
        currentPeriodEnd: periodEnd,
      },
    });

    // 2. Also update User.plan so direct user.plan reads stay fresh
    await prisma.user.update({
      where: { id: userId },
      data:  { plan: finalPlan },
    });

    // 3. Reset quota on override
    await prisma.usageQuota.upsert({
      where:  { userId },
      update: { aiGenerations: 0, pdfUploads: 0, resetAt: periodEnd },
      create: { userId, aiGenerations: 0, pdfUploads: 0, resetAt: periodEnd },
    });

    res.json({ message: `Plan set to ${finalPlan} for ${durationDays || 30} days`, sub: mapId(sub) });
  } catch (err) {
    console.error('Admin plan override error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Assign Plan to user by ID (used by user management panel) ────────────────
router.put('/users/:id/plan', async (req, res) => {
  try {
    const { plan, durationDays } = req.body;
    const { id: userId } = req.params;

    const validPlans = ['free', 'pro', 'elite', 'institution'];
    if (!plan || !validPlans.includes(plan)) {
      return res.status(400).json({ error: 'Invalid plan. Use: free, pro, elite, or institution' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + (durationDays || 30));

    // Update User.plan
    await prisma.user.update({ where: { id: userId }, data: { plan } });

    // Upsert Subscription
    const sub = await prisma.subscription.upsert({
      where:  { userId },
      update: {
        plan,
        status:            plan === 'free' ? 'cancelled' : 'active',
        currentPeriodEnd:  plan === 'free' ? null : periodEnd,
        cancelAtPeriodEnd: false,
      },
      create: {
        userId,
        plan,
        status:           plan === 'free' ? 'cancelled' : 'active',
        currentPeriodEnd: plan === 'free' ? null : periodEnd,
      },
    });

    // Reset quota when upgrading
    if (plan !== 'free') {
      await prisma.usageQuota.upsert({
        where:  { userId },
        update: { aiGenerations: 0, pdfUploads: 0, resetAt: periodEnd },
        create: { userId, aiGenerations: 0, pdfUploads: 0, resetAt: periodEnd },
      });
    }

    res.json({ message: `${user.name} assigned to ${plan} plan`, sub: mapId(sub) });
  } catch (err) {
    console.error('Admin assign plan error:', err);
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

    // Read dynamic prices from DB for accurate MRR
    const prices = await getConfigKey('plan_prices', DEFAULT_PLAN_PRICES);
    const mrr = (proPlan * (prices.pro?.monthly || 99))
              + (elitePlan * (prices.elite?.monthly || 499))
              + (instPlan  * (prices.institution?.monthly || 4999));

    res.json({
      totalSubs,
      activeSubs,
      trialSubs,
      breakdown: { pro: proPlan, elite: elitePlan, institution: instPlan },
      estimatedMRR: mrr,
      prices,
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


// ─── 7. Plan Configuration (Prices, Limits, Trial Settings) ───────────────────

// Default plan prices (used if not overridden in DB)
const DEFAULT_PLAN_PRICES = {
  pro:         { monthly: 99,   yearly: 999   },
  elite:       { monthly: 499,  yearly: 4999  },
  institution: { monthly: 4999, yearly: 49999 },
};

// Default plan limits (used if not overridden in DB)
const DEFAULT_PLAN_LIMITS = {
  free:        { aiGenerations: 5,     pdfUploads: 5,     ratedMatches: false, allModes: false, messaging: false },
  pro:         { aiGenerations: 50,    pdfUploads: 10,    ratedMatches: true,  allModes: true,  messaging: true  },
  elite:       { aiGenerations: 99999, pdfUploads: 99999, ratedMatches: true,  allModes: true,  messaging: true  },
  institution: { aiGenerations: 500,   pdfUploads: 99999, ratedMatches: true,  allModes: true,  messaging: true  },
};

// Default trial config
const DEFAULT_TRIAL_CONFIG = {
  enabled: true,
  durationDays: 30,
  plan: 'pro',
  deviceLocked: true,
  maxTrialsTotal: null, // null = unlimited
};

// Helper: read a JSON key from SystemConfig with fallback
async function getConfigKey(key, fallback) {
  const row = await prisma.systemConfig.findUnique({ where: { key } });
  return row ? row.value : fallback;
}

// GET /api/admin/plan-config/prices
router.get('/plan-config/prices', async (req, res) => {
  try {
    const prices = await getConfigKey('plan_prices', DEFAULT_PLAN_PRICES);
    res.json({ prices, defaults: DEFAULT_PLAN_PRICES });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/plan-config/prices
router.put('/plan-config/prices', async (req, res) => {
  try {
    const { prices } = req.body;
    if (!prices) return res.status(400).json({ error: 'prices object required' });

    // Validate shape
    const required = ['pro', 'elite', 'institution'];
    for (const plan of required) {
      if (prices[plan] === undefined) return res.status(400).json({ error: `Missing price for plan: ${plan}` });
      if (typeof prices[plan].monthly !== 'number' || typeof prices[plan].yearly !== 'number') {
        return res.status(400).json({ error: `Invalid price format for ${plan} (need monthly/yearly numbers)` });
      }
    }

    // ── CRITICAL: Clear cached Razorpay Plan IDs for plans whose price changed ──
    // Razorpay Plans are immutable — changing price requires creating a new Plan.
    // We detect which plans changed and remove only those keys from the cache.
    try {
      const oldPrices = await getConfigKey('plan_prices', DEFAULT_PLAN_PRICES);
      const cachedPlanIds = await getConfigKey('razorpay_plan_ids', {});
      const updatedCache = { ...cachedPlanIds };
      let cacheChanged = false;

      for (const plan of required) {
        for (const interval of ['monthly', 'yearly']) {
          const oldAmt = oldPrices[plan]?.[interval];
          const newAmt = prices[plan]?.[interval];
          if (oldAmt !== newAmt) {
            // Price changed → invalidate the cached Razorpay Plan ID for this combo
            const key = `${plan}_${interval}`;
            if (updatedCache[key]) {
              delete updatedCache[key];
              cacheChanged = true;
              console.log(`[Admin] Price changed for ${plan}/${interval}: ₹${oldAmt} → ₹${newAmt}. Cleared cached Razorpay plan ID.`);
            }
          }
        }
      }

      if (cacheChanged) {
        await prisma.systemConfig.upsert({
          where:  { key: 'razorpay_plan_ids' },
          update: { value: updatedCache },
          create: { key: 'razorpay_plan_ids', value: updatedCache },
        });
      }
    } catch (cacheErr) {
      // Non-fatal — log but proceed with price update
      console.warn('[Admin] Could not clear Razorpay plan ID cache:', cacheErr.message);
    }

    await prisma.systemConfig.upsert({
      where: { key: 'plan_prices' },
      update: { value: prices },
      create: { key: 'plan_prices', value: prices },
    });
    res.json({ message: 'Plan prices updated. Razorpay plan IDs refreshed for changed prices.', prices });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/plan-config/limits
router.get('/plan-config/limits', async (req, res) => {
  try {
    const limits = await getConfigKey('plan_limits', DEFAULT_PLAN_LIMITS);
    res.json({ limits, defaults: DEFAULT_PLAN_LIMITS });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/plan-config/limits
router.put('/plan-config/limits', async (req, res) => {
  try {
    const { limits } = req.body;
    if (!limits) return res.status(400).json({ error: 'limits object required' });

    await prisma.systemConfig.upsert({
      where: { key: 'plan_limits' },
      update: { value: limits },
      create: { key: 'plan_limits', value: limits },
    });
    res.json({ message: 'Plan limits updated', limits });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/plan-config/trial
router.get('/plan-config/trial', async (req, res) => {
  try {
    const trial = await getConfigKey('trial_config', DEFAULT_TRIAL_CONFIG);
    const trialCount = await prisma.deviceTrial.count();
    res.json({ trial, defaults: DEFAULT_TRIAL_CONFIG, totalTrialsUsed: trialCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/plan-config/trial
router.put('/plan-config/trial', async (req, res) => {
  try {
    const { trial } = req.body;
    if (!trial) return res.status(400).json({ error: 'trial config object required' });

    await prisma.systemConfig.upsert({
      where: { key: 'trial_config' },
      update: { value: trial },
      create: { key: 'trial_config', value: trial },
    });
    res.json({ message: 'Trial config updated', trial });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/plan-config  (combined read for the UI)
router.get('/plan-config', async (req, res) => {
  try {
    const [prices, limits, trial] = await Promise.all([
      getConfigKey('plan_prices', DEFAULT_PLAN_PRICES),
      getConfigKey('plan_limits', DEFAULT_PLAN_LIMITS),
      getConfigKey('trial_config', DEFAULT_TRIAL_CONFIG),
    ]);
    const totalTrialsUsed = await prisma.deviceTrial.count();
    res.json({ prices, limits, trial, totalTrialsUsed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/plan-config/razorpay-plans
router.get('/plan-config/razorpay-plans', async (req, res) => {
  try {
    const planIds = await getConfigKey('razorpay_plan_ids', {});
    res.json({ planIds });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/plan-config/razorpay-plans
router.put('/plan-config/razorpay-plans', async (req, res) => {
  try {
    const { planIds } = req.body;
    if (!planIds || typeof planIds !== 'object') {
      return res.status(400).json({ error: 'planIds object required' });
    }
    await prisma.systemConfig.upsert({
      where:  { key: 'razorpay_plan_ids' },
      update: { value: planIds },
      create: { key: 'razorpay_plan_ids', value: planIds },
    });
    res.json({ message: 'Razorpay plan IDs updated', planIds });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
