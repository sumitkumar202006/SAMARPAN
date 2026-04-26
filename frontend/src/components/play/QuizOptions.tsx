/**
 * QuizOptions — Extracted from QuizEngine
 * Pure display component for answer option buttons.
 */
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuizOptionsProps {
  options: string[];
  selectedIdx: number | null;
  correctIdx:  number | null;
  isLocked:    boolean;
  isPaused:    boolean;
  explanation: string | null;
  onSelect:    (idx: number) => void;
}

export const QuizOptions: React.FC<QuizOptionsProps> = ({
  options,
  selectedIdx,
  correctIdx,
  isLocked,
  isPaused,
  explanation,
  onSelect,
}) => {
  return (
    <>
      <div className="grid md:grid-cols-2 gap-4">
        {options.map((option, idx) => {
          const isSelected = selectedIdx === idx;
          const isCorrect  = correctIdx === idx;
          const isWrong    = isLocked && isSelected && !isCorrect;

          return (
            <motion.button
              key={idx}
              whileHover={!isLocked ? { scale: 1.01, x: 5 } : {}}
              onClick={() => onSelect(idx)}
              disabled={isLocked || isPaused}
              className={cn(
                'flex items-center gap-6 p-6 md:p-8 rounded-2xl md:rounded-3xl border-2 transition-all text-left group relative',
                isSelected && !isLocked && 'border-accent bg-accent/10 shadow-[0_0_20px_rgba(99,102,241,0.2)]',
                isCorrect  && 'border-green-500 bg-green-500/10 text-green-400',
                isWrong    && 'border-red-500 bg-red-500/10 text-red-400',
                !isSelected && !isCorrect && !isWrong && 'border-white/5 bg-white/[0.02] hover:border-white/20',
              )}
            >
              <div className={cn(
                'w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center font-black text-lg md:text-2xl transition-all',
                (isSelected || isCorrect || isWrong) ? 'bg-current text-white' : 'bg-white/5 text-text-soft group-hover:bg-white/10',
              )}>
                {String.fromCharCode(65 + idx)}
              </div>

              <span className="text-base md:text-xl font-bold">{option}</span>

              {isLocked && (isCorrect || isWrong) && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  {isCorrect
                    ? <CheckCircle2 className="text-green-500" />
                    : <XCircle className="text-red-500" />
                  }
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {explanation && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-10 p-6 rounded-2xl bg-white/5 border border-white/5 italic text-text-soft text-sm md:text-base flex gap-2"
        >
          <Zap className="text-accent shrink-0" size={20} />
          {explanation}
        </motion.div>
      )}
    </>
  );
};
