const express = require("express");
const router  = express.Router();
const Razorpay = require("razorpay");
const crypto   = require("crypto");
const prisma   = require("../services/db");
const { authenticate, getEffectivePlan, getEffectiveLimits, getNextMonthReset } = require("../middleware/planGate");

// ─── Lazy Razorpay client ─────────────────────────────────────────────────────
let _rzp = null;
function getRzp() {
  if (_rzp) return _rzp;
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set.");
  }
  _rzp = new Razorpay({
    key_id:     process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
  return _rzp;
}

// ─── Default configs (overridden by DB/admin panel) ───────────────────────────
const DEFAULT_PLAN_PRICES = {
  pro:         { monthly: 99,   yearly: 999   },
  elite:       { monthly: 499,  yearly: 4999  },
  institution: { monthly: 4999, yearly: 49999 },
};

const DEFAULT_TRIAL_CONFIG = {
  enabled:      true,
  durationDays: 30,
  plan:         "pro",
  deviceLocked: true,
};

// ─── Config helpers ───────────────────────────────────────────────────────────
async function getConfigKey(key, fallback) {
  try {
    const row = await prisma.systemConfig.findUnique({ where: { key } });
    return row ? row.value : fallback;
  } catch { return fallback; }
}
async function getPlanPrices()  { return getConfigKey("plan_prices",  DEFAULT_PLAN_PRICES);  }
async function getTrialConfig() { return getConfigKey("trial_config", DEFAULT_TRIAL_CONFIG); }

// ─── Razorpay Plan management ─────────────────────────────────────────────────
// Razorpay subscriptions require a Plan object. We store plan IDs in SystemConfig
// so they are shared across instances. If a plan doesn't exist yet, we create it.
async function getOrCreateRazorpayPlan(planKey, interval, amount) {
  const planIdsRow = await prisma.systemConfig.findUnique({ where: { key: "razorpay_plan_ids" } });
  const stored     = (planIdsRow?.value) || {};
  const lookupKey  = `${planKey}_${interval}`;

  if (stored[lookupKey]) return stored[lookupKey];

  // Create new plan in Razorpay
  const rzpPlan = await getRzp().plans.create({
    period:   interval === "yearly" ? "yearly" : "monthly",
    interval: 1,
    item: {
      name:        `Samarpan ${planKey.charAt(0).toUpperCase() + planKey.slice(1)} (${interval})`,
      amount:      amount * 100, // paise
      unit_amount: amount * 100,
      currency:    "INR",
    },
  });

  // Persist for reuse
  await prisma.systemConfig.upsert({
    where:  { key: "razorpay_plan_ids" },
    update: { value: { ...stored, [lookupKey]: rzpPlan.id } },
    create: { key:   "razorpay_plan_ids", value: { [lookupKey]: rzpPlan.id } },
  });

  return rzpPlan.id;
}

// ─── GET /api/billing/plan-prices  (public) ───────────────────────────────────
router.get("/plan-prices", async (req, res) => {
  try {
    const prices = await getPlanPrices();
    const trial  = await getTrialConfig();
    res.json({
      prices,
      trial: { enabled: trial.enabled, durationDays: trial.durationDays, plan: trial.plan },
    });
  } catch {
    res.json({ prices: DEFAULT_PLAN_PRICES, trial: { enabled: true, durationDays: 30, plan: "pro" } });
  }
});

// ─── GET /api/billing/status ──────────────────────────────────────────────────
router.get("/status", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const plan   = await getEffectivePlan(userId);
    const sub    = await prisma.subscription.findUnique({ where: { userId } });
    const quota  = await prisma.usageQuota.findUnique({ where: { userId } });
    const limits = (await getEffectiveLimits())[plan] || {};

    res.json({
      plan,
      status:            sub?.status || "none",
      currentPeriodEnd:  sub?.currentPeriodEnd  || null,
      cancelAtPeriodEnd: sub?.cancelAtPeriodEnd  || false,
      trialEndsAt:       sub?.trialEndsAt        || null,
      autopayEnabled:    !!(sub?.razorpaySubId),
      usage: {
        aiGenerations: { used: quota?.aiGenerations || 0, limit: limits.aiGenerations },
        pdfUploads:    { used: quota?.pdfUploads    || 0, limit: limits.pdfUploads    },
      },
      features: limits,
      resetAt: quota?.resetAt || null,
    });
  } catch (err) {
    console.error("[Billing] Status error:", err);
    res.status(500).json({ error: "Failed to load billing status" });
  }
});

// ─── POST /api/billing/create-subscription ───────────────────────────────────
// Creates a Razorpay RECURRING subscription (auto-pay every month/year).
// Replace the old create-order → this is the new primary payment entry point.
router.post("/create-subscription", authenticate, async (req, res) => {
  try {
    const { plan, interval } = req.body;
    if (!["pro", "elite", "institution"].includes(plan)) {
      return res.status(400).json({ error: "Invalid plan" });
    }

    const planPrices = await getPlanPrices();
    const amount     = planPrices[plan]?.[interval === "yearly" ? "yearly" : "monthly"];
    if (!amount) return res.status(400).json({ error: "Invalid plan/interval" });

    // Get or create Razorpay plan for this price
    const rzpPlanId = await getOrCreateRazorpayPlan(plan, interval, amount);

    // How many billing cycles: 10 years (effectively unlimited)
    const totalCount = interval === "yearly" ? 10 : 120;

    const subscription = await getRzp().subscriptions.create({
      plan_id:         rzpPlanId,
      total_count:     totalCount,
      quantity:        1,
      customer_notify: 1,
      notes: {
        userId:   req.user.id,
        email:    req.user.email,
        plan,
        interval,
        type:     "subscription",
      },
    });

    res.json({
      subscriptionId: subscription.id,
      key:            process.env.RAZORPAY_KEY_ID,
      amount:         amount * 100,
      currency:       "INR",
      plan,
      interval,
      prefill: { name: req.user.name, email: req.user.email },
    });
  } catch (err) {
    console.error("[Billing] Create subscription error:", err);
    res.status(500).json({ error: "Failed to create subscription. " + err.message });
  }
});

// ─── POST /api/billing/verify-subscription ───────────────────────────────────
// Verifies Razorpay subscription payment and activates the plan in DB.
router.post("/verify-subscription", authenticate, async (req, res) => {
  try {
    const {
      razorpay_subscription_id,
      razorpay_payment_id,
      razorpay_signature,
      plan,
      interval,
    } = req.body;
    const userId = req.user.id;

    // Razorpay subscription signature: HMAC(payment_id|subscription_id)
    const expectedSig = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)
      .digest("hex");

    if (expectedSig !== razorpay_signature) {
      return res.status(400).json({ error: "Signature mismatch — payment verification failed." });
    }

    const periodEnd = new Date();
    if (interval === "yearly") periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    else                       periodEnd.setMonth(periodEnd.getMonth() + 1);

    await prisma.subscription.upsert({
      where:  { userId },
      update: {
        plan,
        status:            "active",
        razorpaySubId:     razorpay_subscription_id,
        currentPeriodEnd:  periodEnd,
        cancelAtPeriodEnd: false,
        trialEndsAt:       null,
      },
      create: {
        userId,
        plan,
        status:           "active",
        razorpaySubId:    razorpay_subscription_id,
        currentPeriodEnd: periodEnd,
      },
    });

    await prisma.usageQuota.upsert({
      where:  { userId },
      update: { aiGenerations: 0, pdfUploads: 0, resetAt: getNextMonthReset() },
      create: { userId, resetAt: getNextMonthReset() },
    });

    res.json({
      success: true,
      message: `${plan.charAt(0).toUpperCase() + plan.slice(1)} plan activated with auto-pay!`,
      plan,
      currentPeriodEnd: periodEnd,
      autopayEnabled:   true,
    });
  } catch (err) {
    console.error("[Billing] Verify subscription error:", err);
    res.status(500).json({ error: "Failed to verify subscription" });
  }
});

// ─── POST /api/billing/create-trial-mandate ──────────────────────────────────
// Creates a ₹1 Razorpay order to authorize the trial auto-pay mandate.
// User pays ₹1 now → trial activated → real amount auto-debited after trial ends.
router.post("/create-trial-mandate", authenticate, async (req, res) => {
  try {
    const { fingerprint } = req.body;
    const userId          = req.user.id;

    if (!fingerprint) return res.status(400).json({ error: "Device fingerprint required" });

    const trialConfig = await getTrialConfig();

    if (!trialConfig.enabled) {
      return res.status(403).json({ error: "trial_disabled", message: "Free trials are currently disabled." });
    }

    // Device lock check
    if (trialConfig.deviceLocked !== false) {
      const existing = await prisma.deviceTrial.findUnique({ where: { fingerprint } });
      if (existing) return res.status(409).json({ error: "trial_used", message: "This device has already used the free trial." });
    }

    const existingSub = await prisma.subscription.findUnique({ where: { userId } });
    if (existingSub && ["active", "trialing"].includes(existingSub.status)) {
      return res.status(409).json({ error: "already_subscribed", message: "You already have an active plan." });
    }

    const trialPlan  = trialConfig.plan || "pro";
    const planPrices = await getPlanPrices();
    const realAmount = planPrices[trialPlan]?.monthly || 99;

    // ₹1 order for mandate authorization
    const order = await getRzp().orders.create({
      amount:   100, // ₹1 in paise
      currency: "INR",
      receipt:  `trial_${userId.slice(0, 8)}_${Date.now()}`,
      notes: {
        userId,
        email:      req.user.email,
        fingerprint,
        type:       "trial_mandate",
        trialPlan,
        realAmount,
        durationDays: trialConfig.durationDays || 30,
      },
    });

    res.json({
      orderId:      order.id,
      amount:       100,
      currency:     "INR",
      key:          process.env.RAZORPAY_KEY_ID,
      trialPlan,
      trialDays:    trialConfig.durationDays || 30,
      realAmount,
      prefill: { name: req.user.name, email: req.user.email },
    });
  } catch (err) {
    console.error("[Billing] Create trial mandate error:", err);
    res.status(500).json({ error: "Failed to create trial mandate. " + err.message });
  }
});

// ─── POST /api/billing/verify-trial-mandate ──────────────────────────────────
// Verifies ₹1 payment, activates trial in DB, and schedules a real-price
// Razorpay subscription that starts automatically after the trial ends.
router.post("/verify-trial-mandate", authenticate, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, fingerprint } = req.body;
    const userId = req.user.id;

    // Verify ₹1 payment signature (order flow)
    const expectedSig = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSig !== razorpay_signature) {
      return res.status(400).json({ error: "Signature mismatch — mandate verification failed." });
    }

    const trialConfig  = await getTrialConfig();
    const trialPlan    = trialConfig.plan    || "pro";
    const durationDays = trialConfig.durationDays || 30;

    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + durationDays);

    // Register device fingerprint
    if (trialConfig.deviceLocked !== false && fingerprint) {
      await prisma.deviceTrial.upsert({
        where:  { fingerprint },
        update: {},
        create: { fingerprint, email: req.user.email },
      });
    }

    // Activate trial subscription
    await prisma.subscription.upsert({
      where:  { userId },
      update: {
        plan:             trialPlan,
        status:           "trialing",
        trialEndsAt:      trialEnd,
        currentPeriodEnd: trialEnd,
        cancelAtPeriodEnd: false,
      },
      create: {
        userId,
        plan:             trialPlan,
        status:           "trialing",
        trialEndsAt:      trialEnd,
        currentPeriodEnd: trialEnd,
      },
    });

    // Reset usage quota
    await prisma.usageQuota.upsert({
      where:  { userId },
      update: { aiGenerations: 0, pdfUploads: 0, resetAt: getNextMonthReset() },
      create: { userId, resetAt: getNextMonthReset() },
    });

    // Schedule a Razorpay subscription to auto-start AFTER the trial ends
    // (so the user is auto-charged the real price from month 2 onwards)
    let autopayScheduled = false;
    let futureSubId      = null;
    try {
      const planPrices = await getPlanPrices();
      const realAmount = planPrices[trialPlan]?.monthly || 99;
      const rzpPlanId  = await getOrCreateRazorpayPlan(trialPlan, "monthly", realAmount);

      // start_at = trial end date + 1 day (Unix timestamp)
      const startAt = Math.floor(trialEnd.getTime() / 1000) + 86400;

      const futureSub = await getRzp().subscriptions.create({
        plan_id:         rzpPlanId,
        total_count:     120,
        quantity:        1,
        start_at:        startAt,
        customer_notify: 1,
        notes: { userId, email: req.user.email, plan: trialPlan, interval: "monthly", type: "post_trial" },
      });

      futureSubId = futureSub.id;

      // Store future subscription ID for webhook renewals
      await prisma.subscription.update({
        where: { userId },
        data:  { razorpaySubId: futureSubId },
      });

      autopayScheduled = true;
    } catch (subErr) {
      // Non-fatal: trial still works; subscription just needs manual setup later
      console.warn("[Billing] Post-trial subscription scheduling failed:", subErr.message);
    }

    res.json({
      success:         true,
      message:         `${durationDays}-day ${trialPlan} trial activated! Auto-pay will begin after your trial.`,
      trialEndsAt:     trialEnd,
      trialPlan,
      durationDays,
      autopayScheduled,
    });
  } catch (err) {
    console.error("[Billing] Verify trial mandate error:", err);
    res.status(500).json({ error: "Failed to activate trial" });
  }
});

// ─── POST /api/billing/check-device-trial ────────────────────────────────────
router.post("/check-device-trial", async (req, res) => {
  try {
    const { fingerprint } = req.body;
    if (!fingerprint) return res.json({ used: false });
    const existing = await prisma.deviceTrial.findUnique({ where: { fingerprint } });
    res.json({ used: !!existing });
  } catch { res.status(500).json({ error: "Check failed" }); }
});

// ─── POST /api/billing/cancel ─────────────────────────────────────────────────
router.post("/cancel", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const sub    = await prisma.subscription.findUnique({ where: { userId } });
    if (!sub) return res.status(404).json({ error: "No active subscription" });

    // Cancel Razorpay subscription so auto-debit stops
    if (sub.razorpaySubId) {
      try {
        await getRzp().subscriptions.cancel(sub.razorpaySubId, { cancel_at_cycle_end: 1 });
      } catch (rzpErr) {
        console.warn("[Billing] Razorpay cancel failed (may be already cancelled):", rzpErr.message);
      }
    }

    await prisma.subscription.update({
      where: { userId },
      data:  { cancelAtPeriodEnd: true },
    });

    res.json({
      success:         true,
      message:         "Subscription will cancel at end of billing period. Auto-pay stopped.",
      currentPeriodEnd: sub.currentPeriodEnd,
    });
  } catch (err) {
    console.error("[Billing] Cancel error:", err);
    res.status(500).json({ error: "Failed to cancel subscription" });
  }
});

// ─── POST /api/billing/webhook (Razorpay) ────────────────────────────────────
router.post("/webhook", async (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"];
    const secret    = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
    const body      = req.rawBody ? req.rawBody.toString("utf8") : JSON.stringify(req.body);

    const expectedSig = crypto.createHmac("sha256", secret).update(body).digest("hex");
    if (expectedSig !== signature) return res.status(400).json({ error: "Invalid webhook signature" });

    const event = JSON.parse(body);
    console.log(`[Billing Webhook] Event: ${event.event}`);

    if (event.event === "subscription.activated") {
      // Subscription is now live (first charge succeeded or post-trial start)
      const subId = event.payload?.subscription?.entity?.id;
      if (subId) {
        const periodEnd = new Date();
        periodEnd.setMonth(periodEnd.getMonth() + 1);
        const notes = event.payload?.subscription?.entity?.notes || {};
        await prisma.subscription.updateMany({
          where: { razorpaySubId: subId },
          data:  { status: "active", currentPeriodEnd: periodEnd, trialEndsAt: null },
        });
      }
    } else if (event.event === "subscription.charged") {
      // Monthly/yearly renewal
      const subId = event.payload?.subscription?.entity?.id;
      if (subId) {
        const periodEnd = new Date();
        periodEnd.setMonth(periodEnd.getMonth() + 1);
        await prisma.subscription.updateMany({
          where: { razorpaySubId: subId },
          data:  { status: "active", currentPeriodEnd: periodEnd },
        });
      }
    } else if (event.event === "subscription.cancelled") {
      const subId = event.payload?.subscription?.entity?.id;
      if (subId) {
        await prisma.subscription.updateMany({
          where: { razorpaySubId: subId },
          data:  { status: "cancelled", plan: "free", cancelAtPeriodEnd: false },
        });
      }
    } else if (event.event === "subscription.halted") {
      // Payment failed for renewal
      const subId = event.payload?.subscription?.entity?.id;
      if (subId) {
        await prisma.subscription.updateMany({
          where: { razorpaySubId: subId },
          data:  { status: "past_due" },
        });
      }
    } else if (event.event === "payment.captured") {
      // Check if this is a ₹1 trial mandate — nothing extra needed as
      // verify-trial-mandate already handled DB state
    }

    res.json({ status: "ok" });
  } catch (err) {
    console.error("[Billing Webhook] Error:", err);
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

// ─── Legacy: POST /api/billing/create-order & verify-payment ─────────────────
// Kept for backward compatibility. New flow uses create-subscription instead.
router.post("/create-order", authenticate, async (req, res) => {
  // Redirect to subscription flow response format
  return res.status(410).json({
    error:    "deprecated",
    message:  "Use /api/billing/create-subscription for recurring auto-pay.",
    redirect: "/api/billing/create-subscription",
  });
});

module.exports = router;
