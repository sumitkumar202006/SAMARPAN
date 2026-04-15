'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle2, XCircle, ChevronRight, Trophy, ArrowLeft, MessageSquare, Pause, Play, SkipForward, X, ShieldAlert } from 'lucide-react';
import { useAudio } from '@/context/AudioContext';
import { BikeArrow } from '@/components/ui/BikeArrow';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface Question {
  question: string;
  options: string[];
  correctIndex?: number;
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
  initialTimerMode?: 'per-question' | 'total';
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
  const [isPaused, setIsPaused] = useState(false);
  const [timerMode, setTimerMode] = useState<'per-question' | 'total'>('per-question');
  const [sessionTimeLeft, setSessionTimeLeft] = useState<number | null>(null);
  
  // HUD Messaging State
  const [hudMessage, setHudMessage] = useState<{ text: string; type: string } | null>(null);
  
  // Host FAB State
  const [isHostToolsOpen, setIsHostToolsOpen] = useState(false);
  const [broadcastText, setBroadcastText] = useState('');

  const { playNavigate, playClick, playSuccess, playError } = useAudio();
  const currentQuestion = quiz.questions[currentIndex];

  // Socket event listeners for live mode
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

    socket.on('game_paused', () => {
      setIsPaused(true);
    });

    socket.on('game_resumed', () => {
      setIsPaused(false);
    });

    socket.on('broadcast_message', (data: { message: string, type: string }) => {
      setHudMessage({ text: data.message, type: data.type });
      setTimeout(() => setHudMessage(null), 5000); // Clear after 5s
    });

    socket.on('question_result', (data: { correctIndex: number, explanation?: string }) => {
      setCorrectIdx(data.correctIndex);
      setExplanation(data.explanation || null);
      setIsLocked(true);
      
      if (selectedIdx === data.correctIndex) playSuccess();
      else playError();
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

    socket.on('next_set_started', (data: any) => {
      // RESET ENGINE FOR NEXT ROUND
      setCurrentIndex(0);
      setTimeLeft(30);
      setSelectedIdx(null);
      setIsLocked(false);
      setCorrectIdx(null);
      setExplanation(null);
      setIsPaused(false);
      // We'd need to update the quiz prop too, but if it's passed from parent, 
      // the parent should re-render QuizEngine with the new quiz data.
    });

    socket.on('quiz_finished', (data: { leaderboard: any, reason?: string }) => {
      if (data.reason === 'SESSION_TIME_EXPIRED') {
        setHudMessage({ text: "TIME EXPIRED! SESSION TERMINATED", type: 'error' });
      }
      setIsFinished(true);
      onFinish(score, quiz.questions.length, data.leaderboard);
    });

    return () => {
      socket.off('timer_tick');
      socket.off('game_paused');
      socket.off('game_resumed');
      socket.off('broadcast_message');
      socket.off('question_result');
      socket.off('next_question');
      socket.off('quiz_finished');
    };
  }, [isLive, socket, onFinish, quiz.questions.length, score, selectedIdx, playSuccess, playError]);

  // Local timer for solo mode
  useEffect(() => {
    if (isLive || isFinished || isPaused) return;

    if (timeLeft <= 0) {
      handleNext();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isLive, isFinished, isPaused]);

  const handleSelect = (idx: number) => {
    if (isLocked || isPaused) return;
    setSelectedIdx(idx);
    
    if (isLive) {
      playClick();
      const timeTaken = 30 - timeLeft; 
      socket.emit('submit_answer', { pin, optionIdx: idx, timeTaken });
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

  const sendBroadcast = () => {
    if (!broadcastText.trim()) return;
    socket.emit('host_broadcast', { pin, message: broadcastText, type: 'alert' });
    setBroadcastText('');
  };

  if (isFinished) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-4xl mx-auto w-full relative"
    >
      {/* Emergency HUD Overlay */}
      <AnimatePresence>
        {hudMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none px-4"
          >
            <div className="absolute inset-0 bg-accent/20 backdrop-blur-md animate-pulse duration-[3000ms]" />
            <div className="relative glass p-8 rounded-[40px] border-accent/50 max-w-lg text-center shadow-[0_0_50px_rgba(99,102,241,0.4)]">
              <ShieldAlert size={48} className="text-accent-alt mx-auto mb-4 animate-bounce" />
              <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-accent mb-2">Host Broadcast</h4>
              <p className="text-2xl font-black italic text-white leading-tight">“{hudMessage.text}”</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Host Command Hub (FAB) */}
      <div className="fixed bottom-32 right-8 z-[60]">
        <motion.div layout className="flex flex-col items-end gap-3">
          <AnimatePresence>
            {isHostToolsOpen && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 10 }}
                className="glass p-6 rounded-[32px] border-accent/30 shadow-2xl w-72 mb-4"
              >
                <div className="flex items-center justify-between mb-4">
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-text-soft">Host Override</h5>
                  <button onClick={() => setIsHostToolsOpen(false)}><X size={14} /></button>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1 py-3 border-white/10" 
                      onClick={() => socket.emit(isPaused ? 'host_resume' : 'host_pause', pin)}
                    >
                      {isPaused ? <Play size={16} /> : <Pause size={16} />}
                      {isPaused ? 'Resume' : 'Pause'}
                    </Button>
                    <Button variant="outline" className="flex-1 py-3 border-white/10" onClick={() => socket.emit('host_next', pin)}>
                      <SkipForward size={16} /> Skip
                    </Button>
                  </div>
                  <div className="relative">
                    <input 
                      value={broadcastText}
                      onChange={(e) => setBroadcastText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendBroadcast()}
                      placeholder="Broadcast msg..."
                      className="w-full bg-background/50 border border-white/10 rounded-xl px-4 py-2 text-xs outline-none focus:border-accent"
                    />
                    <button onClick={sendBroadcast} className="absolute right-2 top-1/2 -translate-y-1/2 text-accent p-1">
                      <MessageSquare size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <button 
            onClick={() => setIsHostToolsOpen(!isHostToolsOpen)}
            className="w-14 h-14 rounded-full bg-accent text-white flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.5)] border-4 border-white/10 hover:scale-110 active:scale-95 transition-all"
          >
            {isHostToolsOpen ? <X /> : <ShieldAlert />}
          </button>
        </motion.div>
      </div>

      {/* Header Info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-accent">Question {currentIndex + 1} of {quiz.questions.length}</span>
          <h2 className="text-xl font-bold truncate max-w-full sm:max-w-md">{quiz.title}</h2>
        </div>

        <div className={cn(
          "flex items-center gap-3 px-6 py-3 rounded-2xl glass transition-all",
          isPaused ? "bg-accent/10 border-accent/30 text-accent" : (
            (timerMode === 'per-question' && timeLeft < 10) || 
            (timerMode === 'total' && sessionTimeLeft !== null && sessionTimeLeft < 60)
          ) ? "bg-red-500/10 border-red-500/30 text-red-500" : "text-white"
        )}>
          {isPaused ? <Pause size={20} className="animate-pulse" /> : <Clock size={20} className={
            ((timerMode === 'per-question' && timeLeft < 10) || 
            (timerMode === 'total' && sessionTimeLeft !== null && sessionTimeLeft < 60)) ? "animate-pulse" : ""
          } />}
          
          <span className="text-2xl font-black tabular-nums">
            {isPaused ? 'HALTED' : (
              timerMode === 'per-question' 
                ? `${timeLeft}s` 
                : (sessionTimeLeft !== null 
                    ? `${Math.floor(sessionTimeLeft / 60)}:${(sessionTimeLeft % 60).toString().padStart(2, '0')}` 
                    : '--:--')
            )}
          </span>
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
          className={cn(
            "glass p-8 md:p-12 rounded-[32px] mb-8 transition-opacity duration-300",
            isPaused && "opacity-50 pointer-events-none"
          )}
        >
          <h3 className="text-xl md:text-3xl font-bold mb-10 leading-relaxed uppercase italic tracking-tight">
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
                  disabled={isLocked && !isLive || isPaused}
                  onClick={() => handleSelect(idx)}
                  className={cn(
                    "relative p-6 rounded-2xl border-2 text-left transition-all group overflow-hidden uppercase italic",
                    !isLocked && !isSelected && "bg-background/40 border-border-soft hover:border-accent/50 hover:bg-background/60",
                    isSelected && !isLocked && "bg-accent/10 border-accent shadow-lg",
                    isLocked && isCorrect && "bg-accent-alt/10 border-accent-alt shadow-[0_0_20px_rgba(34,197,94,0.3)]",
                    isLocked && isWrong && "bg-red-500/10 border-red-500",
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
                    <span className="font-bold tracking-tight">{option}</span>
                  </div>

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
        {isPaused && (
           <motion.div 
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             className="flex items-center gap-3 px-8 py-3 rounded-full bg-accent/20 border border-accent/50 text-accent font-black uppercase tracking-widest italic"
           >
             <Pause size={20} className="animate-pulse" /> Arena Halted by Host
           </motion.div>
        )}

        {isLocked && explanation && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full p-6 rounded-2xl bg-bg-soft/50 border border-white/5 text-sm italic text-text-soft text-center"
          >
            <strong className="text-accent">Nexus Insight:</strong> {explanation}
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
            Waiting for next tactical data...
          </p>
        )}
      </div>
    </motion.div>
  );
};
