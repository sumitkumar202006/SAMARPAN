'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, BookOpen, Trophy, Users, Check } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

const STORAGE_KEY = 'samarpan_onboarding_dismissed';

const STEPS = [
  {
    icon: Zap,
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
    title: 'Create Your First Quiz',
    desc: 'Generate 10 AI questions on any topic in under 2 seconds.',
    href: '/create',
    cta: 'Create Quiz',
  },
  {
    icon: Users,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    title: 'Host a Live Battle',
    desc: 'Share a 6-digit PIN — players can join without an account.',
    href: '/host',
    cta: 'Host Now',
  },
  {
    icon: Trophy,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    title: 'Play Ranked Matches',
    desc: 'Compete in 1v1 battles and climb the global ELO leaderboard.',
    href: '/battles',
    cta: 'Find Match',
  },
  {
    icon: BookOpen,
    color: 'text-sky-400',
    bg: 'bg-sky-500/10',
    title: 'Browse the Marketplace',
    desc: 'Explore community-made quizzes across every subject.',
    href: '/marketplace',
    cta: 'Explore',
  },
];

export function OnboardingBanner() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(true); // start hidden until we check storage
  const [completed, setCompleted] = useState<number[]>([]);

  useEffect(() => {
    if (!user) return;
    const isDismissed = localStorage.getItem(`${STORAGE_KEY}_${user.email}`) === 'true';
    if (!isDismissed) setDismissed(false);
    // Mark steps as completed based on user data
    const done: number[] = [];
    if (user.totalWins > 0 || user.xp > 0) done.push(0); // has created/played
    if (user.totalWins > 0) done.push(1, 2);
    setCompleted(done);
  }, [user]);

  const handleDismiss = () => {
    if (!user) return;
    localStorage.setItem(`${STORAGE_KEY}_${user.email}`, 'true');
    setDismissed(true);
  };

  if (dismissed || !user) return null;

  const allDone = completed.length >= STEPS.length;

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.3 }}
          className="glass rounded-[32px] border border-indigo-500/20 p-6 relative overflow-hidden"
        >
          {/* Ambient glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[150px] bg-indigo-500/5 blur-[60px] rounded-full pointer-events-none" />

          <div className="relative z-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-0.5">
                  Getting Started
                </p>
                <h2 className="text-lg font-black tracking-tight">
                  {allDone ? '🎉 You\'re all set!' : `Welcome, ${user.name?.split(' ')[0] || 'Pilot'}!`}
                </h2>
                {!allDone && (
                  <p className="text-xs text-text-soft mt-0.5">
                    Complete these steps to get the most out of Samarpan Arena.
                  </p>
                )}
              </div>
              <button
                onClick={handleDismiss}
                aria-label="Dismiss onboarding"
                className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-text-soft hover:text-white hover:bg-white/10 transition-all flex-shrink-0"
              >
                <X size={14} />
              </button>
            </div>

            {/* Progress bar */}
            <div className="mb-5">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[10px] text-text-soft font-black uppercase tracking-widest">
                  Progress
                </span>
                <span className="text-[10px] font-black text-indigo-400">
                  {completed.length}/{STEPS.length} complete
                </span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(completed.length / STEPS.length) * 100}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500"
                />
              </div>
            </div>

            {/* Steps grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {STEPS.map((step, i) => {
                const Icon = step.icon;
                const isDone = completed.includes(i);
                return (
                  <div
                    key={i}
                    className={`relative p-4 rounded-2xl border transition-all ${
                      isDone
                        ? 'bg-emerald-500/5 border-emerald-500/20 opacity-60'
                        : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                    }`}
                  >
                    {isDone && (
                      <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <Check size={10} className="text-emerald-400" />
                      </div>
                    )}
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-3 ${step.bg}`}>
                      <Icon size={16} className={step.color} />
                    </div>
                    <p className="text-xs font-black mb-1">{step.title}</p>
                    <p className="text-[10px] text-text-soft leading-relaxed mb-3">{step.desc}</p>
                    {!isDone && (
                      <Link
                        href={step.href}
                        className="inline-flex items-center text-[10px] font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-widest transition-colors"
                      >
                        {step.cta} →
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>

            {allDone && (
              <div className="mt-4 text-center">
                <button
                  onClick={handleDismiss}
                  className="px-6 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black uppercase tracking-widest hover:bg-emerald-500/20 transition-all"
                >
                  Dismiss — I'm ready to compete 🚀
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
