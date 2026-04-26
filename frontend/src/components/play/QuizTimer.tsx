/**
 * QuizTimer — Extracted from QuizEngine
 * Pure display component. No side effects, no state.
 */
'use client';

import React from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuizTimerProps {
  timeLeft: number;
  isPaused: boolean;
  timerMode: 'per-question' | 'total';
  sessionTimeLeft: number | null;
}

export const QuizTimer: React.FC<QuizTimerProps> = ({
  timeLeft,
  isPaused,
  timerMode,
  sessionTimeLeft,
}) => {
  const isUrgent  = timeLeft <= 5 && !isPaused && timerMode !== 'total';
  const isWarning = timeLeft < 10 && !isPaused && timerMode !== 'total';
  const isTotal   = timerMode === 'total';

  const display = isPaused
    ? 'HALTED'
    : isTotal
      ? (sessionTimeLeft !== null ? `${sessionTimeLeft}s` : '∞')
      : `${timeLeft}s`;

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-6 py-3 rounded-2xl glass transition-all relative',
        isPaused     && 'text-accent',
        isTotal      && !isPaused && 'text-accent-alt',
        isUrgent     && 'text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)] animate-[tremor_0.3s_ease-in-out_infinite]',
        isWarning    && !isUrgent && 'text-red-500',
        !isPaused && !isTotal && !isWarning && 'text-white',
      )}
    >
      <Clock
        size={20}
        className={isWarning && !isPaused && !isTotal ? 'animate-pulse' : ''}
      />
      <span className="text-2xl font-black tabular-nums">{display}</span>
    </div>
  );
};
