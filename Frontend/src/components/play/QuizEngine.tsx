'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle2, XCircle, ChevronRight, Trophy, ArrowLeft } from 'lucide-react';
import { useAudio } from '@/context/AudioContext';
import { BikeArrow } from '@/components/ui/BikeArrow';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface Question {
  question: string;
  options: string[];
  correctAnswer?: number;
  explanation?: string;
}

interface Quiz {
  title: string;
  questions: Question[];
}

interface QuizEngineProps {
  quiz: Quiz;
  isLive?: boolean;
  onFinish: (score: number, total: number, leaderboard?: any) => void;
  socket?: any;
  pin?: string;
}

export const QuizEngine: React.FC<QuizEngineProps> = ({ 
  quiz, 
  isLive = false, 
  onFinish, 
  socket, 
  pin 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [score, setScore] = useState(0);
  const [correctIdx, setCorrectIdx] = useState<number | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const { playAccelerate } = useAudio();

  const currentQuestion = quiz.questions[currentIndex];

  // Socket event listeners for live mode
  useEffect(() => {
    if (!isLive || !socket) return;

    socket.on('timer_tick', (data: { timeLeft: number }) => {
      setTimeLeft(data.timeLeft);
    });

    socket.on('question_result', (data: { correctIndex: number, explanation?: string }) => {
      setCorrectIdx(data.correctIndex);
      setExplanation(data.explanation || null);
      setIsLocked(true);
    });

    socket.on('next_question', (data: { index: number, timeLeft: number }) => {
      setCurrentIndex(data.index);
      setTimeLeft(data.timeLeft);
      setSelectedIdx(null);
      setIsLocked(false);
      setCorrectIdx(null);
      setExplanation(null);
    });

    socket.on('quiz_finished', (data: { leaderboard: any }) => {
      setIsFinished(true);
      onFinish(score, quiz.questions.length, data.leaderboard);
    });

    return () => {
      socket.off('timer_tick');
      socket.off('question_result');
      socket.off('next_question');
      socket.off('quiz_finished');
    };
  }, [isLive, socket, onFinish, quiz.questions.length, score]);

  // Local timer for solo mode
  useEffect(() => {
    if (isLive || isFinished) return;

    if (timeLeft <= 0) {
      handleNext();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isLive, isFinished]);

  const handleSelect = (idx: number) => {
    if (isLocked) return;
    setSelectedIdx(idx);
    
    if (isLive) {
      // Backend expects 'optionIdx' and 'timeTaken'
      const timeTaken = 30 - timeLeft; 
      socket.emit('submit_answer', { pin, optionIdx: idx, timeTaken });
      // In live mode, we don't lock immediately - server reveals result for everyone at once
    } else {
      setIsLocked(true);
      const isCorrect = idx === currentQuestion.correctAnswer;
      if (isCorrect) setScore(s => s + 1);
      setCorrectIdx(currentQuestion.correctAnswer!);
      setExplanation(currentQuestion.explanation || null);
    }
  };

  const handleNext = () => {
    playAccelerate();
    if (currentIndex < quiz.questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setTimeLeft(30);
      setSelectedIdx(null);
      setIsLocked(false);
      setCorrectIdx(null);
      setExplanation(null);
    } else {
      setIsFinished(true);
      onFinish(score, quiz.questions.length);
    }
  };

  if (isFinished) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-4xl mx-auto w-full"
    >
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-accent">Question {currentIndex + 1} of {quiz.questions.length}</span>
          <h2 className="text-xl font-bold truncate max-w-full sm:max-w-md">{quiz.title}</h2>
        </div>

        <div className={cn(
          "flex items-center gap-3 px-6 py-3 rounded-2xl glass transition-all",
          timeLeft < 10 && "bg-red-500/10 border-red-500/30 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
        )}>
          <Clock size={20} className={timeLeft < 10 ? "animate-pulse" : ""} />
          <span className="text-2xl font-black tabular-nums">{timeLeft}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-bg-soft rounded-full overflow-hidden mb-12">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${((currentIndex + 1) / quiz.questions.length) * 100}%` }}
          className="h-full bg-gradient-to-r from-accent to-accent-alt"
        />
      </div>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="glass p-8 md:p-12 rounded-[32px] mb-8"
        >
          <h3 className="text-xl md:text-3xl font-bold mb-10 leading-relaxed">
            {currentQuestion.question}
          </h3>

          <div className="grid md:grid-cols-2 gap-4">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = selectedIdx === idx;
              const isCorrect = correctIdx === idx;
              const isWrong = isLocked && isSelected && !isCorrect;
              
              return (
                <button
                  key={idx}
                  disabled={isLocked && !isLive} // Host controls locking in live
                  onClick={() => handleSelect(idx)}
                  className={cn(
                    "relative p-6 rounded-2xl border-2 text-left transition-all group overflow-hidden",
                    !isLocked && !isSelected && "bg-background/40 border-border-soft hover:border-accent/50 hover:bg-background/60",
                    isSelected && !isLocked && "bg-accent/10 border-accent shadow-lg",
                    isLocked && isCorrect && "bg-accent-alt/10 border-accent-alt shadow-[0_0_20px_rgba(34,197,94,0.3)]",
                    isLocked && isWrong && "bg-red-500/10 border-red-500",
                    isLocked && !isCorrect && !isWrong && "opacity-40 border-border-soft"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-8 h-8 rounded-xl flex items-center justify-center font-bold transition-all",
                      !isSelected && !isLocked && "bg-bg-soft group-hover:bg-accent group-hover:text-white",
                      isSelected && !isLocked && "bg-accent text-white",
                      isLocked && isCorrect && "bg-accent-alt text-white",
                      isLocked && isWrong && "bg-red-500 text-white"
                    )}>
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <span className="font-medium">{option}</span>
                  </div>

                  {/* Icon overlays for results */}
                  <AnimatePresence>
                    {isLocked && (isCorrect || isWrong) && (
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute right-4 top-1/2 -translate-y-1/2"
                      >
                        {isCorrect ? <CheckCircle2 className="text-accent-alt" /> : <XCircle className="text-red-500" />}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Footer / Status */}
      <div className="min-h-[100px] flex flex-col items-center gap-4">
        {isLocked && explanation && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full p-4 rounded-2xl bg-bg-soft/50 border border-white/5 text-sm italic text-text-soft text-center"
          >
            <strong>Explanation:</strong> {explanation}
          </motion.div>
        )}

        {!isLive && isLocked && (
          <Button onClick={handleNext} className="group">
            {currentIndex < quiz.questions.length - 1 ? 'Next Question' : 'View Results'}
            <BikeArrow className="group-hover:translate-x-1 transition-all" />
          </Button>
        )}

        {isLive && isLocked && (
          <p className="text-sm font-bold uppercase tracking-widest text-accent-alt animate-pulse">
            Waiting for next question...
          </p>
        )}
      </div>
    </motion.div>
  );
};
