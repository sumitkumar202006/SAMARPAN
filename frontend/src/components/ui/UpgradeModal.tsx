'use client';

// UpgradeModal re-export with window event listener wired in
// This version listens to 'samarpan:quota_exceeded' fired by axios interceptor.

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Crown, ArrowRight, Lock, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface UpgradeModalData {
  resource: string;
  plan: string;
  used?: number;
  limit?: number;
  message?: string;
}

interface UpgradeModalContextType {
  show: (data: UpgradeModalData) => void;
  hide: () => void;
}

const UpgradeModalContext = createContext<UpgradeModalContextType>({
  show: () => {},
  hide: () => {},
});

export function useUpgradeModal() {
  return useContext(UpgradeModalContext);
}

const RESOURCE_LABELS: Record<string, string> = {
  aiGenerations: 'AI Quiz Generations',
  pdfUploads:    'PDF Uploads',
  ratedMatches:  'Rated Matches',
  allModes:      '2v2 / 4v4 Battles',
  messaging:     'E2EE Messaging',
};

const PLAN_PERKS: Record<string, string[]> = {
  pro:   ['50 AI Generations/mo', '10 PDF Uploads/mo', 'All battle modes', 'Rated ranked matches', '2× XP bonuses', 'E2EE Messaging'],
  elite: ['Unlimited AI Generations', 'Unlimited PDF Uploads', '3× XP bonuses', 'Tournament hosting', 'Priority support'],
};

export function UpgradeModalProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<UpgradeModalData | null>(null);

  const show = useCallback((d: UpgradeModalData) => setData(d), []);
  const hide = useCallback(() => setData(null), []);

  // Listen to axios 402 interceptor events
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as UpgradeModalData;
      show(detail);
    };
    window.addEventListener('samarpan:quota_exceeded', handler);
    return () => window.removeEventListener('samarpan:quota_exceeded', handler);
  }, [show]);

  const isFree = !data?.plan || data.plan === 'free';
  const perks = PLAN_PERKS[isFree ? 'pro' : 'elite'] || [];

  return (
    <UpgradeModalContext.Provider value={{ show, hide }}>
      {children}

      <AnimatePresence>
        {data && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9000] flex items-end sm:items-center justify-center p-4"
          >
            {/* Backdrop */}
            <motion.div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={hide} />

            {/* Card */}
            <motion.div
              initial={{ scale: 0.92, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 40 }}
              transition={{ type: 'spring', damping: 20, stiffness: 260 }}
              className="relative z-10 w-full max-w-md rounded-[32px] overflow-hidden border border-white/10 shadow-[0_0_80px_rgba(99,102,241,0.25)]"
              style={{ background: 'linear-gradient(145deg,#0d0d1a,#0f0f23)' }}
            >
              {/* Top glow bar */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
              <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none" />

              {/* Header */}
              <div className="relative p-6 pb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                    <Lock size={22} className="text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-0.5">Feature Locked</p>
                    <h2 className="text-xl font-black tracking-tight text-white">Upgrade to Unlock</h2>
                  </div>
                </div>
                <button onClick={hide} className="p-2 rounded-xl hover:bg-white/10 text-white/40 hover:text-white transition-all">
                  <X size={18} />
                </button>
              </div>

              {/* Quota warning banner */}
              <div className="mx-6 mb-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3">
                <AlertTriangle size={16} className="text-amber-400 shrink-0" />
                <div>
                  <p className="text-xs font-black text-amber-300">
                    {RESOURCE_LABELS[data.resource] || data.resource} limit reached
                  </p>
                  <p className="text-[10px] text-white/50 mt-0.5">
                    {data.message || `You have reached your ${data.plan || 'free'} plan limit.`}
                    {data.limit !== undefined && ` (${data.used ?? 0} / ${data.limit} used)`}
                  </p>
                </div>
              </div>

              {/* Plan cards */}
              <div className="px-6 pb-4 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-3">Unlock with</p>

                {/* Blaze Pro */}
                <Link href="/pricing" onClick={hide}
                  className="group block p-4 rounded-2xl border border-indigo-500/30 bg-indigo-500/5 hover:bg-indigo-500/10 hover:border-indigo-500/50 transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                        <Zap size={14} className="text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-white">Blaze Pro</p>
                        <p className="text-[9px] text-indigo-400 font-black tracking-widest uppercase">Most popular</p>
                      </div>
                    </div>
                    <p className="text-lg font-black text-white">₹99<span className="text-[10px] text-white/40 font-normal">/mo</span></p>
                  </div>
                  <ul className="space-y-1 mb-2">
                    {PLAN_PERKS.pro.slice(0, 4).map(p => (
                      <li key={p} className="text-[10px] text-white/50 flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-indigo-400 inline-block shrink-0" />{p}
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center justify-end">
                    <ArrowRight size={14} className="text-indigo-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>

                {/* Storm Elite */}
                <Link href="/pricing" onClick={hide}
                  className="group block p-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 hover:border-amber-500/40 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                        <Crown size={12} className="text-white" />
                      </div>
                      <p className="text-sm font-black text-white">Storm Elite — ₹499/mo</p>
                    </div>
                    <ArrowRight size={13} className="text-amber-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <p className="text-[10px] text-white/40 mt-1 ml-9">Unlimited AI, PDF, all modes + 3× XP</p>
                </Link>
              </div>

              {/* Main CTA */}
              <div className="px-6 pb-6 space-y-2">
                <Link href="/pricing" onClick={hide}
                  className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-indigo-500/30"
                >
                  <Zap size={15} /> See All Plans
                </Link>
                <button onClick={hide} className="w-full py-2 text-[10px] font-black uppercase tracking-widest text-white/25 hover:text-white/50 transition-colors">
                  Maybe Later
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </UpgradeModalContext.Provider>
  );
}
