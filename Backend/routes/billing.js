const express = require("express");
const router = express.Router();
const Razorpay = require("razorpay");
const crypto = require("crypto");
const prisma = require("../services/db");
const { authenticate, getEffectivePlan, PLAN_LIMITS, getNextMonthReset } = require("../middleware/planGate");

const rzp = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ─── Razorpay Plan IDs (create these in Razorpay Dashboard) ──────────────────
// We use monthly subscriptions. Create plans in dashboard and paste IDs here.
const RAZORPAY_PLAN_IDS = {
  pro:   process.env.RAZORPAY_PLAN_PRO   || "plan_pro_placeholder",
  elite: process.env.RAZORPAY_PLAN_ELITE || "plan_elite_placeholder",
};

const PLAN_PRICES = {
  pro:         { monthly: 99,   yearly: 999  },
  elite:       { monthly: 499,  yearly: 4999 },
  institution: { monthly: 4999, yearly: 49999},
};

// ─── GET /api/billing/status ──────────────────────────────────────────────────
// Returns current plan, usage, and quota info
router.get("/status", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const plan = await getEffectivePlan(userId);
    const sub = await prisma.subscription.findUnique({ where: { userId } });
    const quota = await prisma.usageQuota.findUnique({ where: { userId } });

    const limits = PLAN_LIMITS[plan];

    res.json({
      plan,
      status: sub?.status || "none",
      currentPeriodEnd: sub?.currentPeriodEnd || null,
      cancelAtPeriodEnd: sub?.cancelAtPeriodEnd || false,
      trialEndsAt: sub?.trialEndsAt || null,
      usage: {
        aiGenerations: { used: quota?.aiGenerations || 0, limit: limits.aiGenerations },
        pdfUploads:     { used: quota?.pdfUploads    || 0, limit: limits.pdfUploads    },
      },
      features: limits,
      resetAt: quota?.resetAt || null,
    });
  } catch (err) {
    console.error("[Billing] Status error:", err);
    res.status(500).json({ error: "Failed to load billing status" });
  }
});

// ─── POST /api/billing/activate-trial ─────────────────────────────────────────
// 1-month free trial, gated by device fingerprint (one per device)
router.post("/activate-trial", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { fingerprint } = req.body;

    if (!fingerprint) {
      return res.status(400).json({ error: "Device fingerprint required" });
    }

    // Check if this device has already used a trial
    const existingTrial = await prisma.deviceTrial.findUnique({
      where: { fingerprint }
    });

    if (existingTrial) {
      return res.status(409).json({
        error: "trial_used",
        message: "This device has already used the free trial."
      });
    }

    // Check if user already has a subscription
    const existingSub = await prisma.subscription.findUnique({ where: { userId } });
    if (existingSub && existingSub.status !== "none") {
      return res.status(409).json({
        error: "already_subscribed",
        message: "You already have an active plan."
      });
    }

    // Register device fingerprint
    await prisma.deviceTrial.create({
      data: { fingerprint, email: req.user.email }
    });

    // Create 1-month trial subscription
    const trialEnd = new Date();
    trialEnd.setMonth(trialEnd.getMonth() + 1);

    await prisma.subscription.upsert({
      where: { userId },
      update: {
        plan: "pro",
        status: "trialing",
        trialEndsAt: trialEnd,
        currentPeriodEnd: trialEnd,
      },
      create: {
        userId,
        plan: "pro",
        status: "trialing",
        trialEndsAt: trialEnd,
        currentPeriodEnd: trialEnd,
      }
    });

    // Ensure quota record exists
    await prisma.usageQuota.upsert({
      where: { userId },
      update: {},
      create: { userId, resetAt: getNextMonthReset() }
    });

    res.json({
      success: true,
      message: "1-month Pro trial activated!",
      trialEndsAt: trialEnd,
    });
  } catch (err) {
    console.error("[Billing] Trial activation error:", err);
    res.status(500).json({ error: "Failed to activate trial" });
  }
});

// ─── POST /api/billing/check-device-trial ─────────────────────────────────────
// Check if a device fingerprint has used its trial
router.post("/check-device-trial", async (req, res) => {
  try {
    const { fingerprint } = req.body;
    if (!fingerprint) return res.json({ used: false });

    const existing = await prisma.deviceTrial.findUnique({ where: { fingerprint } });
    res.json({ used: !!existing });
  } catch (err) {
    res.status(500).json({ error: "Check failed" });
  }
});

// ─── POST /api/billing/create-order ───────────────────────────────────────────
// Creates a Razorpay order for one-time or subscription payment
router.post("/create-order", authenticate, async (req, res) => {
  try {
    const { plan, interval } = req.body; // interval: "monthly" | "yearly"
    if (!["pro", "elite", "institution"].includes(plan)) {
      return res.status(400).json({ error: "Invalid plan" });
    }

    const amount = PLAN_PRICES[plan]?.[interval === "yearly" ? "yearly" : "monthly"];
    if (!amount) return res.status(400).json({ error: "Invalid plan/interval" });

    // Create Razorpay order (amount in paise)
    const order = await rzp.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: `sub_${req.user.id.slice(0, 8)}_${Date.now()}`,
      notes: {
        userId: req.user.id,
        email:  req.user.email,
        plan,
        interval,
      }
    });

    res.json({
      orderId:   order.id,
      amount:    order.amount,
      currency:  order.currency,
      key:       process.env.RAZORPAY_KEY_ID,
      plan,
      interval,
      prefill: {
        name:  req.user.name,
        email: req.user.email,
      }
    });
  } catch (err) {
    console.error("[Billing] Create order error:", err);
    res.status(500).json({ error: "Failed to create payment order" });
  }
});

// ─── POST /api/billing/verify-payment ─────────────────────────────────────────
// Verifies Razorpay payment signature and activates subscription
router.post("/verify-payment", authenticate, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan, interval } = req.body;
    const userId = req.user.id;

    // Verify signature
    const expectedSig = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSig !== razorpay_signature) {
      return res.status(400).json({ error: "Payment verification failed. Signature mismatch." });
    }

    // Calculate period end
    const periodEnd = new Date();
    if (interval === "yearly") {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    // Activate subscription
    await prisma.subscription.upsert({
      where: { userId },
      update: {
        plan,
        status: "active",
        razorpaySubId: razorpay_payment_id,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
        trialEndsAt: null,
      },
      create: {
        userId,
        plan,
        status: "active",
        razorpaySubId: razorpay_payment_id,
        currentPeriodEnd: periodEnd,
      }
    });

    // Reset quota on new subscription
    await prisma.usageQuota.upsert({
      where: { userId },
      update: { aiGenerations: 0, pdfUploads: 0, resetAt: getNextMonthReset() },
      create: { userId, resetAt: getNextMonthReset() }
    });

    res.json({
      success: true,
      message: `${plan.charAt(0).toUpperCase() + plan.slice(1)} plan activated!`,
      plan,
      currentPeriodEnd: periodEnd,
    });
  } catch (err) {
    console.error("[Billing] Verify payment error:", err);
    res.status(500).json({ error: "Failed to verify payment" });
  }
});

// ─── POST /api/billing/cancel ─────────────────────────────────────────────────
router.post("/cancel", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const sub = await prisma.subscription.findUnique({ where: { userId } });
    if (!sub) return res.status(404).json({ error: "No active subscription" });

    await prisma.subscription.update({
      where: { userId },
      data: { cancelAtPeriodEnd: true }
    });

    res.json({
      success: true,
      message: "Subscription will cancel at end of billing period.",
      currentPeriodEnd: sub.currentPeriodEnd
    });
  } catch (err) {
    console.error("[Billing] Cancel error:", err);
    res.status(500).json({ error: "Failed to cancel subscription" });
  }
});

// ─── POST /api/billing/webhook (Razorpay webhook) ─────────────────────────────
router.post("/webhook", async (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"];
    const secret   = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
    
    // We captured req.rawBody in server.js express.json()
    const body = req.rawBody ? req.rawBody.toString('utf8') : JSON.stringify(req.body);

    const expectedSig = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    if (expectedSig !== signature) {
      return res.status(400).json({ error: "Invalid webhook signature" });
    }

    const event = JSON.parse(body);
    console.log(`[Billing Webhook] Event: ${event.event}`);

    if (event.event === "payment.captured") {
      // Payment confirmed — already handled by verify-payment
    } else if (event.event === "subscription.cancelled") {
      const subId = event.payload?.subscription?.entity?.id;
      if (subId) {
        await prisma.subscription.updateMany({
          where: { razorpaySubId: subId },
          data:  { status: "cancelled", plan: "free" }
        });
      }
    } else if (event.event === "subscription.charged") {
      // Renewal
      const subId = event.payload?.subscription?.entity?.id;
      if (subId) {
        const periodEnd = new Date();
        periodEnd.setMonth(periodEnd.getMonth() + 1);
        await prisma.subscription.updateMany({
          where: { razorpaySubId: subId },
          data:  { status: "active", currentPeriodEnd: periodEnd }
        });
      }
    }

    res.json({ status: "ok" });
  } catch (err) {
    console.error("[Billing Webhook] Error:", err);
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

module.exports = router;
