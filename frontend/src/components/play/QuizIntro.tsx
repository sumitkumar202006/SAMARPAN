'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Clock, Target, Shield, Zap, Play, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuizIntroProps {
  quiz: {
    title: string;
    category?: string;
    questions: any[];
    description?: string;
  };
  timerSeconds?: number;
  timerMode?: 'per-question' | 'total';
  isLive?: boolean;
  examSettings?: {
    strictFocus?: boolean;
    lockdownMode?: boolean;
    allowBacktrack?: boolean;
    penaltyPoints?: number;
    escalationMode?: boolean;
  };
  onStart: () => void;
}

const RULE_ITEMS = [
  { icon: Clock, color: 'text-accent', label: 'Timer', getValue: (props: QuizIntroProps) =>
    props.timerMode === 'total' ? 'Self-paced (total session time)' : `${props.timerSeconds || 30}s per question`
  },
  { icon: Target, color: 'text-emerald-400', label: 'Scoring', getValue: (props: QuizIntroProps) =>
    props.examSettings?.penaltyPoints
      ? `+100 correct / -${props.examSettings.penaltyPoints} wrong`
      : '+100 per correct answer + speed bonus'
  },
  { icon: Shield, color: 'text-amber-400', label: 'Focus', getValue: (props: QuizIntroProps) =>
    props.examSettings?.strictFocus
      ? props.examSettings.escalationMode
        ? 'Tab switch: Warning → Penalty → Disqualify'
        : `Tab switch: -${props.examSettings.penaltyPoints || 50}pts each`
      : 'Standard — no focus enforcement'
  },
  { icon: BookOpen, color: 'text-purple-400', label: 'Backtrack', getValue: (props: QuizIntroProps) =>
    props.examSettings?.allowBacktrack ? 'Allowed — you can revisit previous questions' : 'Disabled — answers are final'
  },
];

export const QuizIntro: React.FC<QuizIntroProps> = (props) => {
  const { quiz, isLive, onStart } = props;
  const qCount = quiz.questions?.length || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-2xl mx-auto px-4 py-12"
    >
      {/* Header */}
      <div className="text-center mb-10 space-y-4">
        {quiz.category && (
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-[10px] font-black uppercase tracking-widest">
            <Zap size={10} /> {quiz.category}
          </div>
        )}
        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-white leading-tight">
          {quiz.title}
        </h1>
        {quiz.description && (
          <p className="text-text-soft text-sm leading-relaxed max-w-md mx-auto">{quiz.description}</p>
        )}

        {/* Question count badge */}
        <div className="flex items-center justify-center gap-6 mt-6">
          <div className="flex flex-col items-center gap-1">
            <span className="text-4xl font-black text-white">{qCount}</span>
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-text-soft">Questions</span>
          </div>
          <div className="h-10 w-px bg-white/10" />
          <div className="flex flex-col items-center gap-1">
            <span className="text-4xl font-black text-accent">
              {props.timerMode === 'total' ? '∞' : `${(props.timerSeconds || 30)}s`}
            </span>
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-text-soft">
              {props.timerMode === 'total' ? 'Self-Paced' : 'Per Question'}
            </span>
          </div>
          {isLive && (
            <>
              <div className="h-10 w-px bg-white/10" />
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-sm font-black text-red-400">LIVE</span>
                </div>
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-text-soft">Multiplayer</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Rules Card */}
      <div className="bg-[#080d20] border border-white/5 rounded-[32px] p-8 mb-8 space-y-4">
        <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-text-soft mb-6">Arena Rules</h2>
        {RULE_ITEMS.map(({ icon: Icon, color, label, getValue }) => (
          <div key={label} className="flex items-start gap-4 py-3 border-b border-white/5 last:border-0">
            <div className={cn("w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center shrink-0 mt-0.5", color)}>
              <Icon size={14} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-text-soft">{label}</p>
              <p className="text-sm font-bold text-white mt-0.5">{getValue(props)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Lockdown warning */}
      {props.examSettings?.lockdownMode && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-4 p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-6"
        >
          <Shield className="text-amber-400 shrink-0" size={20} />
          <p className="text-sm font-bold text-amber-200">
            This quiz runs in <span className="text-amber-400">Secure Exam Mode</span>.
            Right-click, copy, paste, and developer tools are restricted.
          </p>
        </motion.div>
      )}

      {/* Start Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onStart}
        className="w-full h-16 rounded-2xl bg-gradient-to-r from-accent to-accent-alt text-white font-black text-lg uppercase tracking-widest flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(99,102,241,0.4)] hover:shadow-[0_0_50px_rgba(99,102,241,0.6)] transition-all"
      >
        <Play size={20} fill="currentColor" />
        Enter Arena
        <ChevronRight size={20} />
      </motion.button>

      <p className="text-center text-[9px] text-text-soft/50 uppercase tracking-widest mt-4 font-bold">
        {isLive ? 'All players will start simultaneously' : 'Solo practice — results not ranked'}
      </p>
    </motion.div>
  );
};
