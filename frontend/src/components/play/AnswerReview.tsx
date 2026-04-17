'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, ChevronDown, ChevronRight, Zap, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ReviewAnswer {
  questionIndex: number;
  question: string;
  options: string[];
  selectedIdx: number | null; // -1 or null = no answer
  correctIdx: number;
  explanation?: string;
}

interface AnswerReviewProps {
  answers: ReviewAnswer[];
  onClose?: () => void;
}

export const AnswerReview: React.FC<AnswerReviewProps> = ({ answers, onClose }) => {
  const [expanded, setExpanded] = useState<number | null>(null);

  const correct = answers.filter(a => a.selectedIdx === a.correctIdx).length;
  const skipped = answers.filter(a => a.selectedIdx === null || a.selectedIdx === -1).length;
  const incorrect = answers.length - correct - skipped;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto px-4 pb-20"
    >
      {/* Summary row */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: 'Correct', value: correct, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', Icon: CheckCircle2 },
          { label: 'Incorrect', value: incorrect, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', Icon: XCircle },
          { label: 'Skipped', value: skipped, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', Icon: AlertTriangle },
        ].map(({ label, value, color, bg, Icon }) => (
          <div key={label} className={cn("flex flex-col items-center gap-2 p-4 rounded-2xl border", bg)}>
            <Icon size={18} className={color} />
            <span className={cn("text-2xl font-black", color)}>{value}</span>
            <span className="text-[9px] font-black uppercase tracking-widest text-text-soft">{label}</span>
          </div>
        ))}
      </div>

      <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-text-soft mb-4">
        Question-by-Question Review
      </h3>

      {/* Questions list */}
      <div className="space-y-3">
        {answers.map((a, i) => {
          const isCorrect = a.selectedIdx === a.correctIdx;
          const isSkipped = a.selectedIdx === null || a.selectedIdx === -1;
          const isOpen = expanded === i;

          return (
            <motion.div
              key={i}
              layout
              className={cn(
                "border rounded-2xl overflow-hidden transition-colors",
                isCorrect ? "border-emerald-500/20 bg-emerald-500/5"
                  : isSkipped ? "border-amber-500/20 bg-amber-500/5"
                  : "border-red-500/20 bg-red-500/5"
              )}
            >
              {/* Question header */}
              <button
                onClick={() => setExpanded(isOpen ? null : i)}
                className="w-full flex items-center gap-4 p-4 text-left hover:bg-white/5 transition-colors"
              >
                <div className={cn(
                  "w-7 h-7 rounded-xl flex items-center justify-center shrink-0 font-black text-[11px]",
                  isCorrect ? "bg-emerald-500 text-black"
                    : isSkipped ? "bg-amber-500 text-black"
                    : "bg-red-500 text-white"
                )}>
                  {isCorrect ? '✓' : isSkipped ? '—' : '✗'}
                </div>
                <p className="text-sm font-bold text-white flex-1 line-clamp-1">{a.question}</p>
                <div className="shrink-0 text-text-soft/50">
                  {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
              </button>

              {/* Expanded answers */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-2 border-t border-white/5 pt-4">
                      {a.options.map((opt, idx) => {
                        const isUserChoice = a.selectedIdx === idx;
                        const isCorrectOption = a.correctIdx === idx;
                        return (
                          <div
                            key={idx}
                            className={cn(
                              "flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-semibold transition-all",
                              isCorrectOption ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                                : isUserChoice && !isCorrectOption ? "border-red-500/40 bg-red-500/10 text-red-300"
                                : "border-white/5 bg-white/[0.02] text-text-soft"
                            )}
                          >
                            <span className={cn(
                              "w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0",
                              isCorrectOption ? "bg-emerald-500 text-black"
                                : isUserChoice ? "bg-red-500 text-white"
                                : "bg-white/5 text-text-soft"
                            )}>
                              {String.fromCharCode(65 + idx)}
                            </span>
                            {opt}
                            {isUserChoice && !isCorrectOption && (
                              <XCircle size={14} className="text-red-400 ml-auto shrink-0" />
                            )}
                            {isCorrectOption && (
                              <CheckCircle2 size={14} className="text-emerald-400 ml-auto shrink-0" />
                            )}
                          </div>
                        );
                      })}

                      {/* Explanation */}
                      {a.explanation && (
                        <div className="flex gap-2 mt-3 p-3 rounded-xl bg-white/5 border border-white/5">
                          <Zap className="text-accent shrink-0 mt-0.5" size={14} />
                          <p className="text-xs text-text-soft italic leading-relaxed">{a.explanation}</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {onClose && (
        <button
          onClick={onClose}
          className="mt-8 w-full h-12 rounded-2xl bg-white/5 border border-white/10 text-sm font-bold uppercase tracking-widest text-text-soft hover:bg-white/10 transition-all"
        >
          Close Review
        </button>
      )}
    </motion.div>
  );
};
