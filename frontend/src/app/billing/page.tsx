'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, Crown, Shield, ArrowUpRight, RefreshCw, 
  XCircle, Check, AlertTriangle, Calendar, BarChart2, 
  FileText, Clock, Star, ArrowRight
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/axios';
import Link from 'next/link';
import { toast } from '@/lib/toast';

interface BillingStatus {
  plan: string;
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  trialEndsAt: string | null;
  usage: {
    aiGenerations: { used: number; limit: number };
    pdfUploads:    { used: number; limit: number };
  };
  features: {
    aiGenerations: number;
    pdfUploads: number;
    ratedMatches: boolean;
    allModes: boolean;
    messaging: boolean;
  };
  resetAt: string | null;
}

const PLAN_META: Record<string, { name: string; icon: React.ElementType; color: string; glow: string; label: string }> = {
  free:        { name: 'Spark',       icon: Shield,   color: 'from-slate-500 to-slate-600',   glow: 'rgba(100,116,139,0.2)', label: 'Free'        },
  pro:         { name: 'Blaze',       icon: Zap,      color: 'from-[#CC0000] to-violet-600', glow: 'rgba(99,102,241,0.3)', label: 'Pro'         },
  elite:       { name: 'Storm',       icon: Crown,    color: 'from-amber-500 to-orange-600',  glow: 'rgba(245,158,11,0.3)', label: 'Elite'       },
  institution: { name: 'Institution', icon: Star,     color: 'from-teal-500 to-cyan-600',     glow: 'rgba(20,184,166,0.3)', label: 'Institution' },
};

function UsageBar({ label, used, limit, color }: { label: string; used: number; limit: number; color: string }) {
  const pct = limit >= 9999 ? 0 : Math.min((used / limit) * 100, 100);
  const isUnlimited = limit >= 9999;
  const isDanger = pct > 80;

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-black uppercase tracking-widest text-text-soft">{label}</span>
        <span className={`text-xs font-black ${isDanger ? 'text-red-400' : 'text-white'}`}>
          {isUnlimited ? '∞ Unlimited' : `${used} / ${limit}`}
        </span>
      </div>
      {!isUnlimited && (
        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`h-full rounded-full bg-gradient-to-r ${isDanger ? 'from-red-500 to-red-600' : color}`}
          />
        </div>
      )}
      {isUnlimited && (
        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
          <div className={`h-full w-full rounded-full bg-gradient-to-r ${color} opacity-40`} />
        </div>
      )}
    </div>
  );
}

export default function BillingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [successMsg, setSuccessMsg] = useState(searchParams.get('success') === 'true');

  const fetchBillingStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/billing/status');
      setStatus(res.data);
    } catch {
      // silently fail — UI shows placeholder state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) { router.push('/auth'); return; }
    fetchBillingStatus();
  }, [user, fetchBillingStatus]);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await api.post('/api/billing/cancel');
      await fetchBillingStatus();
      setShowCancelConfirm(false);
    } catch {
      toast.error('Failed to cancel. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  const plan = status?.plan || 'free';
  const meta = PLAN_META[plan] || PLAN_META.free;
  const PlanIcon = meta.icon;

  const periodEnd = status?.currentPeriodEnd ? new Date(status.currentPeriodEnd) : null;
  const trialEnd  = status?.trialEndsAt      ? new Date(status.trialEndsAt)      : null;
  const resetAt   = status?.resetAt          ? new Date(status.resetAt)          : null;
  const isTrialing = status?.status === 'trialing';
  const isFree     = plan === 'free';

  return (
    <div className="min-h-screen bg-background text-white py-16 px-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/5 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-4xl mx-auto space-y-8">

        {/* Success banner */}
        <AnimatePresence>
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="glass rounded-3xl border border-[#00D4B4]/30 bg-[#00D4B4]/5 p-5 flex items-center gap-4"
            >
              <div className="w-10 h-10 rounded-xl bg-[#00D4B4]/20 flex items-center justify-center text-[#00D4B4] flex-shrink-0">
                <Check size={20} />
              </div>
              <div>
                <p className="font-black text-[#00D4B4]">Payment Successful!</p>
                <p className="text-sm text-text-soft">Your plan has been upgraded. All features are now unlocked.</p>
              </div>
              <button onClick={() => setSuccessMsg(false)} className="ml-auto text-text-soft hover:text-white"><XCircle size={18} /></button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-1">Subscription</h1>
          <p className="text-text-soft">Manage your Qyro Arena plan and usage.</p>
        </div>

        {/* Plan card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-[40px] border p-8 relative overflow-hidden"
          style={{ borderColor: `rgba(99,102,241,0.2)`, boxShadow: `0 0 60px ${meta.glow}` }}
        >
          <div className="absolute top-0 right-0 w-[300px] h-[300px] opacity-5 blur-[80px]" style={{ background: `radial-gradient(circle, ${meta.glow} 0%, transparent 70%)` }} />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
            {/* Plan info */}
            <div className="flex items-center gap-5">
              <div className={`w-16 h-16 rounded-3xl bg-gradient-to-br ${meta.color} flex items-center justify-center shadow-xl`}>
                <PlanIcon size={28} className="text-white" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-text-soft mb-1">{meta.label} Plan</p>
                <h2 className="text-3xl font-black tracking-tight">{meta.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  {isTrialing && (
                    <span className="px-2 py-0.5 rounded-full bg-[#CC0000]/20 border border-[#CC0000]/30 text-[#CC0000] text-[9px] font-black uppercase tracking-widest">
                      Free Trial
                    </span>
                  )}
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                    status?.status === 'active'   ? 'bg-[#00D4B4]/20 text-[#00D4B4] border border-[#00D4B4]/30' :
                    status?.status === 'trialing' ? 'bg-[#CC0000]/20 text-[#CC0000] border border-[#CC0000]/30' :
                    'bg-white/5 text-text-soft border border-white/5'
                  }`}>
                    {status?.status || 'inactive'}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              {!isFree && periodEnd && (
                <div className="flex items-center gap-2 text-xs text-text-soft">
                  <Calendar size={12} />
                  <span>
                    {status?.cancelAtPeriodEnd ? 'Cancels' : (isTrialing ? 'Trial ends' : 'Renews')} on{' '}
                    <span className="text-white font-bold">{periodEnd.toLocaleDateString()}</span>
                  </span>
                </div>
              )}
              {isTrialing && trialEnd && (
                <div className="flex items-center gap-2 text-xs text-[#CC0000]">
                  <Clock size={12} />
                  <span>Trial ends: <span className="font-bold">{trialEnd.toLocaleDateString()}</span></span>
                </div>
              )}

              <div className="flex gap-3">
                <Link
                  href="/pricing"
                  className={`px-6 py-3 rounded-2xl bg-gradient-to-r ${meta.color} text-white text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:opacity-90 transition-all shadow-lg`}
                >
                  {isFree ? 'Upgrade Plan' : 'Change Plan'} <ArrowUpRight size={14} />
                </Link>
                {!isFree && !status?.cancelAtPeriodEnd && (
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    className="px-6 py-3 rounded-2xl bg-white/5 border border-white/5 text-xs font-black uppercase tracking-widest text-text-soft hover:text-red-400 hover:border-red-500/20 hover:bg-red-500/5 transition-all"
                  >
                    Cancel
                  </button>
                )}
                {status?.cancelAtPeriodEnd && (
                  <div className="flex items-center gap-2 text-xs text-amber-400 px-4 py-3 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                    <AlertTriangle size={12} />
                    Cancels {periodEnd?.toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Usage meters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-[32px] border border-white/5 p-8 space-y-6"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
              <BarChart2 size={18} className="text-accent" />
              Monthly Usage
            </h3>
            {resetAt && (
              <div className="flex items-center gap-1.5 text-xs text-text-soft">
                <RefreshCw size={10} />
                Resets {resetAt.toLocaleDateString()}
              </div>
            )}
          </div>

          <UsageBar
            label="AI Quiz Generations"
            used={status?.usage.aiGenerations.used ?? 0}
            limit={status?.usage.aiGenerations.limit ?? 5}
            color="from-[#CC0000] to-violet-600"
          />
          <UsageBar
            label="PDF Uploads"
            used={status?.usage.pdfUploads.used ?? 0}
            limit={status?.usage.pdfUploads.limit ?? 0}
            color="from-teal-500 to-cyan-600"
          />

          {isFree && (
            <div className="rounded-2xl bg-accent/5 border border-accent/20 p-4 flex items-start gap-3">
              <Zap size={16} className="text-accent flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-black text-accent mb-0.5">Unlock more with Blaze Pro</p>
                <p className="text-xs text-text-soft">50 AI generations, 10 PDF uploads, rated battles — just ₹99/mo.</p>
              </div>
              <Link href="/pricing" className="ml-auto flex-shrink-0 text-xs font-black text-accent hover:underline flex items-center gap-1">
                Upgrade <ArrowRight size={10} />
              </Link>
            </div>
          )}
        </motion.div>

        {/* Feature summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-[32px] border border-white/5 p-8"
        >
          <h3 className="text-lg font-black tracking-tight flex items-center gap-2 mb-6">
            <FileText size={18} className="text-accent" />
            Plan Features
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              {
                label: 'AI Quiz Generations',
                value: (status?.usage.aiGenerations.limit ?? 0) >= 9999
                  ? 'Unlimited'
                  : `${status?.usage.aiGenerations.limit ?? 5}/mo`,
              },
              {
                label: 'PDF Uploads',
                value: (status?.usage.pdfUploads.limit ?? 0) >= 9999
                  ? 'Unlimited'
                  : `${status?.usage.pdfUploads.limit ?? 0}/mo`,
              },
              {
                label: 'Rated Battles',
                value: status?.features?.ratedMatches ? 'Included' : 'Not included',
              },
              {
                label: 'All Battle Modes',
                value: status?.features?.allModes ? 'Included' : '1v1 only',
              },
              {
                label: 'E2EE Messaging',
                value: status?.features?.messaging ? 'Included' : 'Not included',
              },
              {
                label: 'XP Bonus',
                value: plan === 'elite' ? '3× daily' : plan === 'pro' ? '2× daily' : '1×',
              },
            ].map((f) => (
              <div key={f.label} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                <span className="text-sm text-text-soft font-medium">{f.label}</span>
                <span className={`text-sm font-black ${f.value === 'Not included' ? 'text-text-soft opacity-50' : 'text-white'}`}>
                  {f.value}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

      </div>

      {/* Cancel Confirm Modal */}
      <AnimatePresence>
        {showCancelConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={() => setShowCancelConfirm(false)} />
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass max-w-md w-full p-8 rounded-[40px] border border-white/5 relative z-10 text-center space-y-6"
            >
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400">
                <AlertTriangle size={32} />
              </div>
              <div>
                <h3 className="text-xl font-black tracking-tight mb-2">Cancel Subscription?</h3>
                <p className="text-sm text-text-soft leading-relaxed">
                  Your plan will remain active until <strong className="text-white">{periodEnd?.toLocaleDateString()}</strong>. After that, you&apos;ll be moved to the free Spark plan.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="w-full py-4 rounded-2xl bg-red-500 text-white font-black uppercase tracking-widest text-sm hover:bg-red-600 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {cancelling ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Yes, Cancel Plan'}
                </button>
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="w-full py-4 rounded-2xl bg-white/5 border border-white/5 font-black uppercase tracking-widest text-xs text-text-soft hover:bg-white/10 transition-all"
                >
                  Keep My Plan
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
