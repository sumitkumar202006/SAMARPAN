'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Zap, Crown, Building2, ArrowRight, X, Star, Shield } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { toast } from '@/lib/toast';
import api from '@/lib/axios';

// ── Device fingerprint (stable hash of browser signals) ──────────────────────
async function getDeviceFingerprint(): Promise<string> {
  const nav = navigator as Navigator & { deviceMemory?: number };
  const signals = [
    nav.userAgent,
    nav.language,
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    nav.hardwareConcurrency || 0,
    nav.deviceMemory || 0,
  ].join('|');

  const buffer = new TextEncoder().encode(signals);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const DEFAULT_PLAN_PRICES = {
  pro:         { monthly: 99,   yearly: 999   },
  elite:       { monthly: 499,  yearly: 4999  },
  institution: { monthly: 4999, yearly: 49999 },
};

const DEFAULT_PLAN_LIMITS: Record<string, any> = {
  free:        { aiGenerations: 5,     pdfUploads: 5,     ratedMatches: false, allModes: false, messaging: false },
  pro:         { aiGenerations: 50,    pdfUploads: 10,    ratedMatches: true,  allModes: true,  messaging: true  },
  elite:       { aiGenerations: 99999, pdfUploads: 99999, ratedMatches: true,  allModes: true,  messaging: true  },
  institution: { aiGenerations: 500,   pdfUploads: 99999, ratedMatches: true,  allModes: true,  messaging: true  },
};

const PLAN_STATIC = [
  {
    id: 'free',
    name: 'Spark',
    label: 'Free',
    defaultPrice: { monthly: 0, yearly: 0 },
    color: 'from-slate-500 to-slate-600',
    glow: 'rgba(100,116,139,0.2)',
    icon: Shield,
    tag: null,
  },
  {
    id: 'pro',
    name: 'Blaze',
    label: 'Pro',
    defaultPrice: { monthly: 99, yearly: 999 },
    color: 'from-indigo-500 to-violet-600',
    glow: 'rgba(99,102,241,0.25)',
    icon: Zap,
    tag: 'MOST POPULAR',
  },
  {
    id: 'elite',
    name: 'Storm',
    label: 'Elite',
    defaultPrice: { monthly: 499, yearly: 4999 },
    color: 'from-amber-500 to-orange-600',
    glow: 'rgba(245,158,11,0.25)',
    icon: Crown,
    tag: 'POWER USER',
  },
];

// Dynamically build feature bullets from live limits
function buildFeatures(planId: string, limits: Record<string, any>) {
  const l = limits[planId] || DEFAULT_PLAN_LIMITS[planId] || {};
  const isUnlimited = (v: number) => v >= 9999;

  const aiText = isUnlimited(l.aiGenerations)
    ? 'Unlimited AI Generations'
    : `${l.aiGenerations ?? 0} AI Quiz Generations / month`;
  const pdfText = isUnlimited(l.pdfUploads)
    ? 'Unlimited PDF Uploads'
    : l.pdfUploads > 0
      ? `${l.pdfUploads} PDF-to-Quiz Uploads / month`
      : 'PDF-to-Quiz Upload';

  if (planId === 'free') {
    return [
      { text: aiText,                              ok: true             },
      { text: pdfText,                             ok: l.pdfUploads > 0 },
      { text: 'All Battle Modes (1v1, 2v2, 4v4)', ok: !!l.allModes     },
      { text: 'Rated Matches',                    ok: !!l.ratedMatches },
      { text: 'Full Post-Match Analytics',        ok: false            },
      { text: 'E2EE Social Messaging',            ok: !!l.messaging    },
      { text: 'Daily 2x XP Bonus',               ok: false            },
      { text: 'Custom Avatar Frame',              ok: false            },
    ];
  }
  if (planId === 'pro') {
    return [
      { text: aiText,                              ok: true          },
      { text: pdfText,                             ok: true          },
      { text: 'All Battle Modes (1v1, 2v2, 4v4)', ok: !!l.allModes  },
      { text: 'Rated Matches',                    ok: !!l.ratedMatches },
      { text: 'Full Post-Match Analytics',        ok: true          },
      { text: 'E2EE Social Messaging',            ok: !!l.messaging },
      { text: 'Daily 2x XP Bonus',               ok: true          },
      { text: 'Bronze Avatar Frame',              ok: true          },
    ];
  }
  // elite / institution
  return [
    { text: aiText,                  ok: true },
    { text: pdfText,                 ok: true },
    { text: 'All Battle Modes',      ok: !!l.allModes     },
    { text: 'Rated Matches',         ok: !!l.ratedMatches },
    { text: 'Full Analytics + Export', ok: true },
    { text: 'E2EE Social Messaging', ok: !!l.messaging },
    { text: 'Daily 3x XP Bonus',     ok: true },
    { text: 'Gold Avatar Frame',     ok: true },
    { text: 'Tournament Hosting',   ok: true },
    { text: 'Priority Support',     ok: true },
  ];
}

declare global {
  interface Window { Razorpay: any; }
}

export default function PricingPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState<string | null>(null);
  const [trialState, setTrialState] = useState<'idle' | 'loading' | 'activating' | 'done' | 'used' | 'disabled'>('idle');
  const [currentPlan, setCurrentPlan] = useState<string>('free');
  const [livePrices, setLivePrices] = useState<Record<string, { monthly: number; yearly: number }> | null>(null);
  const [liveLimits, setLiveLimits] = useState<Record<string, any>>(DEFAULT_PLAN_LIMITS);

  // Build PLANS with live prices + live limits merged in
  const PLANS = PLAN_STATIC.map(p => ({
    ...p,
    price: p.id === 'free'
      ? p.defaultPrice
      : (livePrices?.[p.id] ?? p.defaultPrice),
    features: buildFeatures(p.id, liveLimits),
  }));

  // Helper: load Razorpay script on demand (lazy, prevents 150 KB cold-load)
  const ensureRazorpay = useCallback((): Promise<void> => {
    if (window.Razorpay) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://checkout.razorpay.com/v1/checkout.js';
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('Failed to load Razorpay'));
      document.head.appendChild(s);
    });
  }, []);

  // Load current plan
  useEffect(() => {
    if (!user) return;
    api.get('/api/billing/status')
      .then(r => setCurrentPlan(r.data.plan || 'free'))
      .catch(() => {});
  }, [user]);

  // Load live prices + limits + trial config from backend
  useEffect(() => {
    // Fetch prices & trial config (public endpoint)
    api.get('/api/billing/plan-prices')
      .then(r => {
        if (r.data.prices) setLivePrices(r.data.prices);
        if (r.data.trial?.enabled === false) setTrialState('disabled');
      })
      .catch(() => {});

    // Fetch live plan limits from admin config endpoint
    api.get('/api/admin/plan-config')
      .then(r => {
        if (r.data.limits) setLiveLimits(r.data.limits);
      })
      .catch(() => {}); // falls back to DEFAULT_PLAN_LIMITS silently
  }, []);

  // Load Razorpay script lazily — removed eager load (saves 150 KB on page open)
  // Script is loaded on-demand inside handleSubscribe / handleStartTrial

  const handleSubscribe = async (planId: string) => {
    if (!user) { router.push('/auth'); return; }
    if (planId === 'free') return;

    setLoading(planId);
    try {
      // Ensure Razorpay is loaded before proceeding
      await ensureRazorpay();

      // Step 1: Create recurring Razorpay subscription
      const { data } = await api.post('/api/billing/create-subscription', {
        plan: planId,
        interval: billingPeriod,
      });

      const rzp = new window.Razorpay({
        key:             data.key,
        subscription_id: data.subscriptionId,
        name:            'Samarpan Arena',
        description:     `${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan — ${billingPeriod} (Auto-pay)`,
        image:           '/icon.png',
        prefill:         data.prefill,
        theme:           { color: '#6366f1' },
        handler: async (response: any) => {
          try {
            await api.post('/api/billing/verify-subscription', {
              ...response,
              plan: planId,
              interval: billingPeriod,
            });
            router.push('/billing?success=true');
          } catch {
            toast.error('Payment verified but activation failed. Contact support.');
          }
        },
        modal: { ondismiss: () => setLoading(null) },
      });
      rzp.open();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.response?.data?.error || 'Failed to initiate payment');
      setLoading(null);
    }
  };

  const handleStartTrial = async () => {
    if (!user) { router.push('/auth'); return; }
    setTrialState('loading');

    try {
      // Ensure Razorpay is loaded before proceeding
      await ensureRazorpay();

      const fp = await getDeviceFingerprint();

      // Step 1: Create ₹1 mandate order
      const { data } = await api.post('/api/billing/create-trial-mandate', { fingerprint: fp });

      setTrialState('activating');

      const rzp = new window.Razorpay({
        key:         data.key,
        order_id:    data.orderId,
        amount:      100, // ₹1 in paise
        currency:    'INR',
        name:        'Samarpan Arena',
        description: `${data.trialDays}-Day Free Trial — ₹1 authorization only (₹${data.realAmount}/mo charged after trial ends)`,
        image:       '/icon.png',
        prefill:     data.prefill,
        theme:       { color: '#6366f1' },
        handler: async (response: any) => {
          try {
            await api.post('/api/billing/verify-trial-mandate', {
              ...response,
              fingerprint: fp,
            });
            setTrialState('done');
            setTimeout(() => router.push('/billing'), 2000);
          } catch (err: any) {
            const code = err?.response?.data?.error;
            if (code === 'trial_used') setTrialState('used');
            else { toast.error('Trial activation failed. Contact support.'); setTrialState('idle'); }
          }
        },
        modal: { ondismiss: () => setTrialState('idle') },
      });
      rzp.open();
    } catch (err: any) {
      const code = err?.response?.data?.error;
      if (code === 'trial_used')     { setTrialState('used'); return; }
      if (code === 'trial_disabled') { setTrialState('disabled'); return; }
      toast.error(err?.response?.data?.message || 'Failed to initiate trial');
      setTrialState('idle');
    }
  };

  return (
    <div className="min-h-screen bg-background text-white py-24 px-6 relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-accent/8 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-amber-500/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-black uppercase tracking-widest mb-6">
            <Zap size={12} fill="currentColor" />
            Choose Your Arena Tier
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-4">
            Level Up Your<br />
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">Samarpan Experience</span>
          </h1>
          <p className="text-text-soft text-lg max-w-xl mx-auto leading-relaxed">
            Unlock AI-powered quizzes, competitive battles, and elite analytics. Cancel anytime.
          </p>

          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-5 py-2.5 rounded-2xl text-sm font-black transition-all ${billingPeriod === 'monthly' ? 'bg-accent text-white shadow-[0_0_20px_rgba(99,102,241,0.4)]' : 'bg-white/5 text-text-soft hover:bg-white/10'}`}
            >Monthly</button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-5 py-2.5 rounded-2xl text-sm font-black transition-all relative ${billingPeriod === 'yearly' ? 'bg-accent text-white shadow-[0_0_20px_rgba(99,102,241,0.4)]' : 'bg-white/5 text-text-soft hover:bg-white/10'}`}
            >
              Yearly
              <span className="absolute -top-2.5 -right-2.5 bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">-15%</span>
            </button>
          </div>
        </motion.div>

        {/* Plan Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {PLANS.map((plan, i) => {
            const Icon = plan.icon;
            const price = billingPeriod === 'yearly' ? plan.price.yearly : plan.price.monthly;
            const isActive = currentPlan === plan.id;
            const isPro = plan.id === 'pro';

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`relative glass rounded-[36px] p-8 border flex flex-col overflow-hidden transition-all ${isPro ? 'border-accent/40 shadow-[0_0_40px_rgba(99,102,241,0.2)]' : 'border-white/5'}`}
                style={{ boxShadow: isPro ? `0 0 60px ${plan.glow}` : undefined }}
              >
                {plan.tag && (
                  <div className={`absolute top-0 right-8 bg-gradient-to-r ${plan.color} text-white text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-b-xl`}>
                    {plan.tag}
                  </div>
                )}

                {/* Icon + name */}
                <div className="mb-6">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4 shadow-lg`}>
                    <Icon size={22} className="text-white" />
                  </div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-text-soft mb-1">{plan.label} Plan</p>
                  <h2 className="text-2xl font-black tracking-tight">{plan.name}</h2>
                </div>

                {/* Price */}
                <div className="mb-8">
                  {price === 0 ? (
                    <div className="text-4xl font-black tracking-tighter">Free <span className="text-base text-text-soft font-bold">forever</span></div>
                  ) : (
                    <div className="flex items-end gap-1">
                      <span className="text-xl font-bold text-text-soft">₹</span>
                      <span className="text-5xl font-black tracking-tighter">{price}</span>
                      <span className="text-text-soft text-sm font-bold mb-1">/{billingPeriod === 'yearly' ? 'yr' : 'mo'}</span>
                    </div>
                  )}
                  {billingPeriod === 'yearly' && price > 0 && (
                    <p className="text-emerald-400 text-xs font-bold mt-1">
                      Save ₹{(plan.price.monthly * 12) - plan.price.yearly} vs monthly
                    </p>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 flex-1 mb-8">
                  {plan.features.map((f, fi) => (
                    <li key={fi} className={`flex items-center gap-3 text-sm ${f.ok ? '' : 'opacity-30'}`}>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${f.ok ? `bg-gradient-to-br ${plan.color}` : 'bg-white/10'}`}>
                        {f.ok ? <Check size={10} className="text-white" /> : <X size={10} className="text-white" />}
                      </div>
                      <span className={`font-medium ${f.ok ? 'text-white' : 'text-text-soft'}`}>{f.text}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {isActive ? (
                  <div className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-center text-sm font-black uppercase tracking-widest text-text-soft">
                    ✓ Current Plan
                  </div>
                ) : plan.id === 'free' ? (
                  <div className="w-full py-4 rounded-2xl bg-white/5 text-center text-sm font-black uppercase tracking-widest text-text-soft">
                    Always Free
                  </div>
                ) : (
                  <button
                    id={`subscribe-${plan.id}`}
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={!!loading}
                    className={`w-full py-4 rounded-2xl bg-gradient-to-r ${plan.color} text-white text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg disabled:opacity-60`}
                    style={{ boxShadow: `0 10px 30px ${plan.glow}` }}
                  >
                    {loading === plan.id ? (
                      <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    ) : (
                      <>Upgrade to {plan.name} <ArrowRight size={16} /></>
                    )}
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Free Trial Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-[40px] border border-indigo-500/20 p-10 text-center relative overflow-hidden shadow-[0_0_60px_rgba(99,102,241,0.1)]"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-accent/5 blur-[80px] rounded-full pointer-events-none" />

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-black uppercase tracking-widest mb-6">
            <Star size={12} fill="currentColor" />
            New Users Only
          </div>

          <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-3">
            Try Blaze Pro Free<br />
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">for 30 Days</span>
          </h2>
          <p className="text-text-soft mb-8 max-w-md mx-auto">
            One free trial per device. Just ₹1 to authorize auto-pay — no further charge during trial.
            Full Pro access: AI generations, rated battles, analytics, and messaging.
          </p>

          <AnimatePresence mode="wait">
            {trialState === 'done' && (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-4 px-8 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-black inline-flex items-center gap-2">
                <Check size={18} /> Trial Activated — Auto-pay set for after trial! Redirecting…
              </motion.div>
            )}
            {trialState === 'used' && (
              <motion.div key="used" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-4 px-8 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 font-black inline-flex items-center gap-2">
                <X size={18} /> Trial already used on this device.
              </motion.div>
            )}
            {trialState === 'disabled' && (
              <motion.div key="disabled" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-4 px-8 rounded-2xl bg-white/5 border border-white/10 text-text-soft font-black inline-flex items-center gap-2">
                <X size={18} /> Free trials are currently paused. Check back soon!
              </motion.div>
            )}
            {(trialState === 'idle' || trialState === 'loading' || trialState === 'activating') && (
              <motion.button
                key="btn"
                id="start-free-trial"
                onClick={handleStartTrial}
                disabled={trialState !== 'idle'}
                className="px-10 py-5 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-black uppercase tracking-widest text-sm flex items-center gap-3 mx-auto hover:opacity-90 transition-all shadow-[0_10px_40px_rgba(99,102,241,0.4)] disabled:opacity-60"
              >
                {trialState === 'idle'      && <><Star size={16} fill="currentColor" /> Start 30-Day Trial — Only ₹1 to Authorize</>}
                {trialState === 'loading'   && <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Opening payment…</>}
                {trialState === 'activating' && <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Activating trial…</>}
              </motion.button>
            )}
          </AnimatePresence>

          <p className="text-text-soft text-xs mt-4">
            ₹1 authorizes auto-pay — full Pro access unlocked immediately. Real plan price auto-debited only after trial ends.
            Cancel anytime before trial ends and pay nothing more.{' '}
            <a href="/terms" className="underline underline-offset-2 hover:text-white transition-colors">Refund policy</a>.
          </p>
        </motion.div>


        {/* Institution CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 glass rounded-[32px] border border-white/5 p-8 flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-lg">
              <Building2 size={24} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-teal-400 mb-1">Institution Plan</p>
              <h3 className="text-xl font-black tracking-tight">For Colleges & Coaching Centers</h3>
              <p className="text-text-soft text-sm">200 seats, class leaderboards, teacher controls. ₹4,999/mo</p>
            </div>
          </div>
          <a
            href="mailto:samarpan.quiz.auth@gmail.com?subject=Institution Plan Inquiry"
            className="flex-shrink-0 px-8 py-4 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-black uppercase tracking-widest text-sm flex items-center gap-2 hover:opacity-90 transition-all shadow-[0_10px_30px_rgba(20,184,166,0.3)]"
          >
            Contact Sales <ArrowRight size={16} />
          </a>
        </motion.div>

      </div>
    </div>
  );
}
