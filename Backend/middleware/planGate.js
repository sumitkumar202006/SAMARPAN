const jwt = require("jsonwebtoken");
const prisma = require("../services/db");

// ─── Plan Configuration ────────────────────────────────────────────────────────
// Default limits (used if DB has no override from admin panel)
const DEFAULT_PLAN_LIMITS = {
  free:        { aiGenerations: 5,     pdfUploads: 0,     ratedMatches: false, allModes: false, messaging: false },
  pro:         { aiGenerations: 50,    pdfUploads: 10,    ratedMatches: true,  allModes: true,  messaging: true  },
  elite:       { aiGenerations: 99999, pdfUploads: 99999, ratedMatches: true,  allModes: true,  messaging: true  },
  institution: { aiGenerations: 500,   pdfUploads: 99999, ratedMatches: true,  allModes: true,  messaging: true  },
};

// Exported for backward compat (static reference)
const PLAN_LIMITS = DEFAULT_PLAN_LIMITS;

function getNextMonthReset() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

// ─── Reads effective limits from DB (admin-configured), falls back to defaults ─
async function getEffectiveLimits() {
  try {
    const row = await prisma.systemConfig.findUnique({ where: { key: 'plan_limits' } });
    if (row && row.value && typeof row.value === 'object') {
      // Merge with defaults to ensure all plans & keys are present
      const merged = {};
      for (const plan of Object.keys(DEFAULT_PLAN_LIMITS)) {
        merged[plan] = { ...DEFAULT_PLAN_LIMITS[plan], ...(row.value[plan] || {}) };
      }
      return merged;
    }
  } catch { /* fallback */ }
  return DEFAULT_PLAN_LIMITS;
}

// ─── Authenticate middleware (reusable) ────────────────────────────────────────
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Authentication required" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) return res.status(401).json({ error: "User not found" });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// ─── Get user's effective plan ─────────────────────────────────────────────────
async function getEffectivePlan(userId) {
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  if (!sub) return "free";

  // Check if trial is active
  if (sub.status === "trialing" && sub.trialEndsAt && new Date(sub.trialEndsAt) > new Date()) {
    // Read trial config to get the plan it grants
    try {
      const row = await prisma.systemConfig.findUnique({ where: { key: 'trial_config' } });
      return row?.value?.plan || "pro";
    } catch { return "pro"; }
  }

  // Cancelled or past_due → downgrade to free
  if (sub.status === "cancelled" || sub.status === "past_due") return "free";

  return sub.plan || "free";
}

// ─── Quota check factory ───────────────────────────────────────────────────────
function checkQuota(resource) {
  return async function (req, res, next) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: "Not authenticated" });

      const plan = await getEffectivePlan(userId);
      // Read limits from DB (admin-configured) with fallback
      const limits = await getEffectiveLimits();
      const limit = limits[plan]?.[resource] ?? 0;

      // Get or create quota record
      let quota = await prisma.usageQuota.findUnique({ where: { userId } });

      // Reset if past reset date
      if (quota && new Date(quota.resetAt) < new Date()) {
        quota = await prisma.usageQuota.update({
          where: { userId },
          data: { aiGenerations: 0, pdfUploads: 0, resetAt: getNextMonthReset() }
        });
      }

      const used = quota?.[resource] ?? 0;

      if (used >= limit) {
        return res.status(402).json({
          error: "quota_exceeded",
          message: `Your ${plan} plan allows ${limit} ${resource} per month. Upgrade to unlock more.`,
          plan,
          limit,
          used,
          upgradeUrl: "/pricing"
        });
      }

      // Increment usage
      await prisma.usageQuota.upsert({
        where: { userId },
        update: { [resource]: { increment: 1 } },
        create: { userId, [resource]: 1, resetAt: getNextMonthReset() }
      });

      req.userPlan = plan;
      next();
    } catch (err) {
      console.error("[PlanGate] Quota check error:", err);
      next(); // Fail open — don't block users on middleware errors
    }
  };
}

// ─── Feature gate (non-quota boolean features) ────────────────────────────────
function requireFeature(feature) {
  return async function (req, res, next) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: "Not authenticated" });

      const plan = await getEffectivePlan(userId);
      // Read limits from DB (admin-configured)
      const limits = await getEffectiveLimits();
      const allowed = limits[plan]?.[feature] ?? false;

      if (!allowed) {
        return res.status(402).json({
          error: "feature_locked",
          message: `This feature requires a paid plan. Upgrade to unlock.`,
          plan,
          feature,
          upgradeUrl: "/pricing"
        });
      }

      req.userPlan = plan;
      next();
    } catch (err) {
      console.error("[PlanGate] Feature gate error:", err);
      next();
    }
  };
}

module.exports = {
  authenticate,
  getEffectivePlan,
  getEffectiveLimits,
  checkQuota,
  requireFeature,
  PLAN_LIMITS,
  DEFAULT_PLAN_LIMITS,
  getNextMonthReset,
};
