'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ScorePopToastProps {
  /** Unique key — change this to trigger a new pop */
  popKey: number;
  /** Points gained (e.g. 1 or 100) */
  points: number;
  /** extra tailwind classes */
  className?: string;
}

/**
 * Floating "+N" score particle.
 * Mount via AnimatePresence by changing `popKey`.
 * Self-destructs after 900ms — no cleanup needed.
 */
export const ScorePopToast: React.FC<ScorePopToastProps> = ({ popKey, points, className }) => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={popKey}
        initial={{ opacity: 0, y: 0, scale: 0.5 }}
        animate={{ opacity: [0, 1, 1, 0], y: -64, scale: [0.5, 1.3, 1, 0.8] }}
        transition={{ duration: 0.9, times: [0, 0.2, 0.7, 1], ease: 'easeOut' }}
        className={cn(
          'pointer-events-none select-none',
          'absolute left-1/2 -translate-x-1/2 -top-4 z-50',
          'font-black text-2xl tracking-tight',
          'text-emerald-400 drop-shadow-[0_0_12px_rgba(34,197,94,0.8)]',
          className
        )}
        aria-hidden
      >
        +{points}
      </motion.div>
    </AnimatePresence>
  );
};

/**
 * Full-screen micro-flash overlay for correct/wrong answer feedback.
 * Mount inside a `position: fixed` parent.
 */
export const AnswerFlash: React.FC<{ flashKey: number; isCorrect: boolean }> = ({
  flashKey,
  isCorrect,
}) => (
  <AnimatePresence>
    <motion.div
      key={flashKey}
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, isCorrect ? 0.07 : 0.12, 0] }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={cn(
        'fixed inset-0 pointer-events-none z-[300]',
        isCorrect ? 'bg-emerald-500' : 'bg-red-500'
      )}
      aria-hidden
    />
  </AnimatePresence>
);
