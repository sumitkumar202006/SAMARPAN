'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  Clock, CheckCircle2, XCircle, ChevronRight, 
  ArrowLeft, MessageSquare, Pause, Play, 
  SkipForward, X, ShieldAlert, LogOut, 
  ChevronLeft, Shield, Zap 
} from 'lucide-react';
import { useAudio } from '@/context/AudioContext';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { SecurityLockdown } from './SecurityLockdown';

interface Question {
  question: string;
  options: string[];
  correctIndex?: number;
  explanation?: string;
}

interface QuizEngineProps {
  quiz: {
    title: string;
    questions: Question[];
  };
  isLive?: boolean;
  socket?: any;
  pin?: string;
  onFinish: (score: number, total: number, leaderboard?: any) => void;
  isHostOverride?: boolean;
}

export const QuizEngine: React.FC<QuizEngineProps> = ({ 
  quiz, 
  isLive = false, 
  socket, 
  pin, 
  onFinish,
  isHostOverride = false
}) => {
  const router = useRouter();
  const [examSettings, setExamSettings] = useState<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [score, setScore] = useState(0);
  const [correctIdx, setCorrectIdx] = useState<number | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timerMode, setTimerMode] = useState<'per-question' | 'total'>('per-question');
  const [sessionTimeLeft, setSessionTimeLeft] = useState<number | null>(null);
  
  const [hudMessage, setHudMessage] = useState<{ text: string; type: string } | null>(null);
  const [isHostToolsOpen, setIsHostToolsOpen] = useState(false);
  const [broadcastText, setBroadcastText] = useState('');

  const { playNavigate, playClick, playSuccess, playError } = useAudio();
  const currentQuestion = quiz.questions[currentIndex];

  useEffect(() => {
    if (!isLive || !socket) return;

    socket.on('timer_tick', (data: { timeLeft: number | null, mode?: string }) => {
      if (data.mode === 'total' || data.timeLeft === null) {
        setTimeLeft(0);
      } else {
        setTimeLeft(data.timeLeft);
      }
    });

    socket.on('global_timer_tick', (data: { timeLeft: number }) => {
      setSessionTimeLeft(data.timeLeft);
    });

    socket.on('game_paused', () => setIsPaused(true));
    socket.on('game_resumed', () => setIsPaused(false));

    socket.on('broadcast_message', (data: { message: string, type: string }) => {
      setHudMessage({ text: data.message, type: data.type });
      setTimeout(() => setHudMessage(null), 5000);
    });

    socket.on('question_result', (data: { correctIndex: number, explanation?: string }) => {
      setCorrectIdx(data.correctIndex);
      setExplanation(data.explanation || null);
      setIsLocked(true);
      if (selectedIdx === data.correctIndex) playSuccess();
      else playError();
    });

    socket.on('game_started', (data: any) => {
      setHudMessage({ text: "ARENA DEPLOYED. GOOD LUCK.", type: 'info' });
      if (data.examSettings) setExamSettings(data.examSettings);
    });

    socket.on('next_question', (data: { index: number, timerSeconds: number, timerMode?: 'per-question' | 'total' }) => {
      setCurrentIndex(data.index);
      setTimeLeft(data.timerSeconds);
      if (data.timerMode) setTimerMode(data.timerMode);
      setSelectedIdx(null);
      setIsLocked(false);
      setCorrectIdx(null);
      setExplanation(null);
      setIsPaused(false);
    });

    socket.on('quiz_finished', (data: { leaderboard: any }) => {
      setIsFinished(true);
      onFinish(score, quiz.questions.length, data.leaderboard);
    });

    socket.on('host_broadcast_to_player', (data: { message: string, type: string }) => {
       setHudMessage({ text: data.message, type: data.type });
       setTimeout(() => setHudMessage(null), 5000);
    });

    return () => {
      socket.off('timer_tick');
      socket.off('game_paused');
      socket.off('game_resumed');
      socket.off('broadcast_message');
      socket.off('question_result');
      socket.off('next_question');
      socket.off('quiz_finished');
      socket.off('host_broadcast_to_player');
    };
  }, [isLive, socket, onFinish, quiz.questions.length, score, selectedIdx, playSuccess, playError]);

  const handleAbort = () => {
    if (confirm("⚠️ CAUTION: Aborting the arena will forfeit all progress. Are you sure?")) {
      router.push('/dashboard');
    }
  };

  const handleViolation = (type: string) => {
    if (isLive && socket) {
      socket.emit('anti_cheat_violation', { pin, type: `lockdown_${type}` });
    }
  };

  useEffect(() => {
    if (!isLive || isFinished || isPaused || timeLeft > 0) return;
    if (selectedIdx !== null && !isLocked) {
       handleSelect(selectedIdx);
    } else if (selectedIdx === null && !isLocked) {
       handleSelect(-1);
    }
  }, [timeLeft, isLive, isFinished, isPaused, selectedIdx, isLocked]);

  const handleSelect = (idx: number) => {
    if (isLocked || isPaused) return;
    setSelectedIdx(idx);
    
    if (isLive) {
      playClick();
      const timeTaken = 30 - timeLeft; 
      socket.emit('submit_answer', { pin, optionIdx: idx, timeTaken, questionIndex: currentIndex });
    } else {
      setIsLocked(true);
      const isCorrect = idx === currentQuestion.correctIndex;
      if (isCorrect) {
        setScore(s => s + 1);
        playSuccess();
      } else {
        playError();
      }
      setCorrectIdx(currentQuestion.correctIndex!);
      setExplanation(currentQuestion.explanation || null);
    }
  };

  const handleNext = () => {
    playNavigate();
    if (currentIndex < quiz.questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      if (timerMode === 'per-question') setTimeLeft(30);
      setSelectedIdx(null);
      setIsLocked(false);
      setCorrectIdx(null);
      setExplanation(null);
    } else {
      setIsFinished(true);
      onFinish(score, quiz.questions.length);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      playNavigate();
      setCurrentIndex(prev => prev - 1);
      setSelectedIdx(null);
      setIsLocked(false);
      setCorrectIdx(null);
      setExplanation(null);
    }
  };

  const sendBroadcast = () => {
    if (!broadcastText.trim()) return;
    socket.emit('host_broadcast', { pin, message: broadcastText, type: 'alert' });
    setBroadcastText('');
  };

  if (isFinished) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto w-full relative">
      <AnimatePresence>
        {hudMessage && (
          <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none px-4">
            <div className="bg-[#080d20] p-8 rounded-[40px] border border-accent/50 text-center shadow-[0_0_50px_rgba(99,102,241,0.4)]">
              <ShieldAlert size={48} className="text-accent-alt mx-auto mb-4" />
              <p className="text-2xl font-black italic text-white">“{hudMessage.text}”</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex sm:hidden mb-6">
        <Button variant="outline" onClick={handleAbort} className="w-full border-red-500/20 text-red-400 bg-red-400/5 hover:bg-red-400/10 rounded-xl">
          <X className="mr-2" size={16} /> Retreat from Arena
        </Button>
      </div>

      <SecurityLockdown enabled={examSettings?.lockdownMode} onViolation={handleViolation}>
        <div className="relative">
          {isHostOverride && (
            <div className="fixed bottom-8 right-8 z-[120]">
              <div className="relative">
                <AnimatePresence>
                  {isHostToolsOpen && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="absolute bottom-full right-0 mb-6 w-72 glass p-6 rounded-[32px] border-amber-400/30 shadow-2xl">
                      <div className="space-y-6">
                        <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                          <Shield size={20} className="text-amber-400" />
                          <span className="font-black text-xs uppercase tracking-widest text-white/50">Host Overdrive</span>
                        </div>
                        <div className="flex flex-col gap-3">
                          <Button className={cn("w-full py-3 rounded-2xl gap-2", isPaused ? "bg-amber-500 text-black" : "bg-white/5")} onClick={() => socket.emit(isPaused ? 'host_resume' : 'host_pause', pin)}>
                            {isPaused ? <Play size={14} /> : <Pause size={14} />} {isPaused ? 'Resume' : 'Pause'}
                          </Button>
                          <Button variant="outline" className="w-full py-3 border-white/10" onClick={() => socket.emit('host_next', pin)}>
                            <SkipForward size={14} /> Skip
                          </Button>
                        </div>
                        <div className="relative">
                          <input value={broadcastText} onChange={(e) => setBroadcastText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendBroadcast()} placeholder="Tactical msg..." className="w-full bg-background/50 border border-white/10 rounded-xl px-4 py-2 text-[10px] outline-none focus:border-amber-400 transition-all" />
                          <button onClick={sendBroadcast} className="absolute right-2 top-1/2 -translate-y-1/2 text-amber-400 p-1 hover:scale-110 transition-transform"><MessageSquare size={14} /></button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <motion.button onClick={() => setIsHostToolsOpen(!isHostToolsOpen)} className={cn("w-14 h-14 rounded-full flex items-center justify-center shadow-2xl border-4 border-white/10 transition-all text-black", isHostToolsOpen ? "bg-bg-soft text-text-soft" : "bg-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.4)]")}>
                  {isHostToolsOpen ? <X /> : <ShieldAlert />}
                </motion.button>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div className="flex items-center gap-4">
              {!isHostOverride && (
                <Button variant="outline" onClick={handleAbort} className="hidden sm:flex border-white/10 hover:border-red-500/30">
                  <ArrowLeft size={16} />
                </Button>
              )}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-accent">Question {currentIndex + 1} of {quiz.questions.length}</span>
                <h2 className="text-xl font-bold truncate max-w-full sm:max-w-md">{quiz.title}</h2>
              </div>
            </div>

            <div className={cn("flex items-center gap-3 px-6 py-3 rounded-2xl glass transition-all", isPaused ? "text-accent" : (timeLeft < 10) ? "text-red-500" : "text-white")}>
              <Clock size={20} className={timeLeft < 10 && !isPaused ? "animate-pulse" : ""} />
              <span className="text-2xl font-black tabular-nums">
                {isPaused ? 'HALTED' : `${timeLeft}s`}
              </span>
            </div>
          </div>

          <div className="w-full h-1.5 bg-bg-soft rounded-full overflow-hidden mb-12">
            <motion.div animate={{ width: `${((currentIndex + 1) / quiz.questions.length) * 100}%` }} className="h-full bg-gradient-to-r from-accent to-accent-alt" />
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={currentIndex} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className={cn("bg-[#080d20] border border-white/5 p-8 md:p-12 rounded-[32px] mb-8 transition-opacity duration-300", isPaused && "opacity-50 pointer-events-none")}>
              <h3 className="text-xl md:text-3xl font-bold mb-10 leading-relaxed uppercase italic tracking-tight">{currentQuestion.question}</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {currentQuestion.options.map((option, idx) => {
                  const isSelected = selectedIdx === idx;
                  const isCorrect = correctIdx === idx;
                  const isWrong = isLocked && isSelected && !isCorrect;
                  return (
                    <motion.button key={idx} whileHover={!isLocked ? { scale: 1.01, x: 5 } : {}} onClick={() => handleSelect(idx)} disabled={isLocked || isPaused} className={cn("flex items-center gap-6 p-6 md:p-8 rounded-2xl md:rounded-3xl border-2 transition-all text-left group relative", isSelected && !isLocked && "border-accent bg-accent/10 shadow-[0_0_20px_rgba(99,102,241,0.2)]", isCorrect && "border-green-500 bg-green-500/10 text-green-400", isWrong && "border-red-500 bg-red-500/10 text-red-400", !isSelected && !isCorrect && !isWrong && "border-white/5 bg-white/[0.02] hover:border-white/20")}>
                      <div className={cn("w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center font-black text-lg md:text-2xl transition-all", isSelected || isCorrect || isWrong ? "bg-current text-white" : "bg-white/5 text-text-soft group-hover:bg-white/10")}>{String.fromCharCode(65 + idx)}</div>
                      <span className="text-base md:text-xl font-bold">{option}</span>
                      {isLocked && (isCorrect || isWrong) && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                          {isCorrect ? <CheckCircle2 className="text-green-500" /> : isWrong ? <XCircle className="text-red-500" /> : null}
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
              {explanation && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-10 p-6 rounded-2xl bg-white/5 border border-white/5 italic text-text-soft text-sm md:text-base flex gap-2">
                  <Zap className="text-accent shrink-0" size={20} /> {explanation}
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              {(!isLive && isLocked) || (isLive && (timerMode === 'total' || examSettings?.allowBacktrack)) ? (
                <>
                  <Button variant="outline" onClick={handlePrev} disabled={currentIndex === 0 || (isLive && !examSettings?.allowBacktrack)} className="flex-1 py-4 px-8 border-white/10 rounded-2xl">
                    <ChevronLeft className="mr-2" /> Previous
                  </Button>
                  <Button onClick={handleNext} className={cn("flex-1 py-4 px-10 rounded-2xl", currentIndex === quiz.questions.length - 1 ? "bg-emerald-500" : "bg-accent")}>
                    {currentIndex === quiz.questions.length - 1 ? 'Final Submit' : 'Next Question'} <ChevronRight className="ml-2" />
                  </Button>
                </>
              ) : (
                isLive && isLocked && <p className="text-sm font-bold uppercase tracking-widest text-accent-alt animate-pulse">Waiting for tactical sync...</p>
              )}
            </div>
            <div className="flex flex-col items-center sm:items-end opacity-50">
              <span className="text-[10px] font-black uppercase tracking-widest text-text-soft">Session Integrity</span>
              <div className="flex items-center gap-2">
                 <div className="w-24 h-1 bg-bg-soft rounded-full overflow-hidden"><div className="h-full bg-accent-alt w-[98%]" /></div>
                 <span className="text-[10px] font-mono text-accent-alt">98.4ms</span>
              </div>
            </div>
          </div>
        </div>
      </SecurityLockdown>
    </motion.div>
  );
};
