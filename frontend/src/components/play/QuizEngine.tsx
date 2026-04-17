'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { ScorePopToast, AnswerFlash } from './ScorePopToast';
import { LiveLeaderboard } from './LiveLeaderboard';
import { PlayerActivityFeed } from './PlayerActivityFeed';
import { NetworkStatusWidget } from '@/components/ui/NetworkStatusWidget';

import { ReviewAnswer } from './AnswerReview';

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
  onFinish: (score: number, total: number, leaderboard?: any, answersLog?: ReviewAnswer[]) => void;
  isHostOverride?: boolean;
  examSettings?: any;
}

export const QuizEngine: React.FC<QuizEngineProps> = ({ 
  quiz, 
  isLive = false, 
  socket, 
  pin, 
  onFinish,
  isHostOverride = false,
  examSettings: initialExamSettings
}) => {
  const router = useRouter();
  const [examSettings, setExamSettings] = useState<any>(initialExamSettings || null);
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
  const [isMatchActive, setIsMatchActive] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null); // Pre-game countdown overlay
  // isSyncing: blocks rendering until first server state arrives (prevents stale-UI flicker on reconnect)
  const [isSyncing, setIsSyncing] = useState(isLive); // true only for live sessions until first sync

  const { playNavigate, playClick, playSuccess, playError, playCountdown, playUrgent } = useAudio();

  // --- Score pop and answer flash states ---
  const [scorePopKey, setScorePopKey] = useState(0);
  const [flashKey, setFlashKey] = useState(0);
  const [lastFlashCorrect, setLastFlashCorrect] = useState(true);
  // Track urgent ticks to avoid playing the sound every re-render
  const urgentPlayedRef = useRef(false);

  // --- Refs for stable access inside event handlers (avoids stale closures) ---
  const selectedIdxRef = useRef<number | null>(null);
  const isLockedRef = useRef(false);
  const isPausedRef = useRef(false);
  const currentIndexRef = useRef(0);
  const isFinishedRef = useRef(false);
  const autoSubmittedRef = useRef(false); // Guards against double auto-submit
  const lastTimerRef = useRef<number>(999); // Monotonic timer: tracks highest seen value to prevent backward jumps
  // Tracks each answer for post-quiz review mode
  const answersLogRef = useRef<ReviewAnswer[]>([]);

  // Keep refs in sync with state
  useEffect(() => { selectedIdxRef.current = selectedIdx; }, [selectedIdx]);
  useEffect(() => { isLockedRef.current = isLocked; }, [isLocked]);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);
  useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);
  useEffect(() => { isFinishedRef.current = isFinished; }, [isFinished]);

  // Reset auto-submit guard when question changes
  useEffect(() => { autoSubmittedRef.current = false; }, [currentIndex]);

  // SAFETY GUARD: Prevent crash during rapid state transitions
  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin opacity-40" />
        <p className="text-[10px] uppercase font-black tracking-widest text-text-soft italic">Synchronizing Tactical Assets...</p>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentIndex];

  // --- Navigation Guard: prevent accidental exit during match ---
  useEffect(() => {
    if (!isLive || !isMatchActive) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isLive, isMatchActive]);

  // --- Stable answer submission handler (used by both click and auto-submit) ---
  const handleSelect = useCallback((idx: number) => {
    if (isLockedRef.current || isPausedRef.current) return;
    setSelectedIdx(idx);
    selectedIdxRef.current = idx;

    if (isLive) {
      playClick();
      socket?.emit('submit_answer', { 
        pin, 
        optionIdx: idx, 
        timeTaken: 30 - timeLeft, // Note: this captures current timeLeft at call time
        questionIndex: currentIndexRef.current 
      });
    } else {
      // Solo mode: resolve immediately
      setIsLocked(true);
      isLockedRef.current = true;
      const q = quiz.questions[currentIndexRef.current];
      const isCorrect = idx === q.correctIndex;
      if (isCorrect) {
        setScore(s => s + 1);
        setScorePopKey(k => k + 1);
        setLastFlashCorrect(true);
        setFlashKey(k => k + 1);
        playSuccess();
      } else {
        setLastFlashCorrect(false);
        setFlashKey(k => k + 1);
        playError();
      }
      setCorrectIdx(q.correctIndex!);
      setExplanation(q.explanation || null);
      // Record for review
      answersLogRef.current[currentIndexRef.current] = {
        questionIndex: currentIndexRef.current,
        question: q.question,
        options: q.options,
        selectedIdx: idx,
        correctIdx: q.correctIndex!,
        explanation: q.explanation
      };
    }
  }, [isLive, socket, pin, playClick, playSuccess, playError, quiz.questions, timeLeft]);

  // --- Timer urgency: shake animation + sound at < 5s ---
  useEffect(() => {
    if (timeLeft <= 5 && timeLeft > 0 && !isPaused) {
      if (!urgentPlayedRef.current) {
        urgentPlayedRef.current = true;
        playUrgent();
      }
    } else {
      urgentPlayedRef.current = false;
    }
  }, [timeLeft, isPaused, playUrgent]);

  // --- Auto-submit on timer expiry (server-driven for live, client for solo) ---
  useEffect(() => {
    if (!isLive || isFinished || isPaused || timeLeft > 0) return;
    if (isLockedRef.current || autoSubmittedRef.current) return;
    
    autoSubmittedRef.current = true;
    // Submit -1 (no answer) or current selection
    const answerIdx = selectedIdxRef.current !== null ? selectedIdxRef.current : -1;
    handleSelect(answerIdx);
  }, [timeLeft, isLive, isFinished, isPaused, handleSelect]);

  // --- Socket event handlers (stable, no stale closures) ---
  useEffect(() => {
    if (!isLive || !socket) return;

    const onTimerTick = (data: { timeLeft: number | null, mode?: string, serverTs?: number }) => {
      if (data.mode === 'total' || data.timeLeft === null) {
        setTimeLeft(0);
        lastTimerRef.current = 0;
      } else {
        // Drift correction: subtract transit latency from displayed time
        let corrected = data.timeLeft;
        if (data.serverTs) {
          const latencyMs = Math.max(0, Date.now() - data.serverTs);
          const latencySeconds = Math.round(latencyMs / 1000);
          corrected = Math.max(0, data.timeLeft - latencySeconds);
        }
        // Monotonic guard: timer must only decrease, never jump forward
        // This prevents visual jitter when packets arrive out of order
        const monotonic = Math.min(corrected, lastTimerRef.current);
        lastTimerRef.current = monotonic;
        setTimeLeft(monotonic);
      }
    };

    const onGlobalTimerTick = (data: { timeLeft: number }) => {
      setSessionTimeLeft(data.timeLeft);
    };

    const onGamePaused = () => {
      setIsPaused(true);
      isPausedRef.current = true;
    };

    const onGameResumed = () => {
      setIsPaused(false);
      isPausedRef.current = false;
    };

    const onBroadcastMessage = (data: { message: string, type: string }) => {
      setHudMessage({ text: data.message, type: data.type });
      setTimeout(() => setHudMessage(null), 5000);
    };

    const onQuestionResult = (data: { correctIndex: number, explanation?: string }) => {
      setCorrectIdx(data.correctIndex);
      setExplanation(data.explanation || null);
      setIsLocked(true);
      isLockedRef.current = true;
      const wasCorrect = selectedIdxRef.current === data.correctIndex;
      if (wasCorrect) {
        setScorePopKey(k => k + 1);
        setLastFlashCorrect(true);
        setFlashKey(k => k + 1);
        playSuccess();
      } else {
        setLastFlashCorrect(false);
        setFlashKey(k => k + 1);
        playError();
      }
    };

    const onGameStarted = (data: any) => {
      setHudMessage({ text: "ARENA DEPLOYED. GOOD LUCK.", type: 'info' });
      if (data.examSettings) setExamSettings(data.examSettings);
      setCountdown(null); // Clear countdown overlay
      setIsMatchActive(true);
      setIsSyncing(false); // First authoritative state received — unblock rendering
    };

    // Pre-game: server sends quiz data + triggers countdown UI
    const onGameStarting = (data: any) => {
      if (data.examSettings) setExamSettings(data.examSettings);
      setIsSyncing(false); // Starting phase is valid state — unblock
    };

    // Countdown tick: 5, 4, 3, 2, 1, 0
    const onGameCountdown = (data: { secondsLeft: number }) => {
      setCountdown(data.secondsLeft);
      // Play tick for each number except 0 ("GO!" is visual enough)
      if (data.secondsLeft > 0) playCountdown();
    };

    // Host aborted countdown during STARTING → return to lobby
    const onCountdownAborted = (data: { message: string }) => {
      setCountdown(null);
      setIsSyncing(false);
      setHudMessage({ text: data.message, type: 'warning' });
      setTimeout(() => setHudMessage(null), 4000);
    };

    const onNextQuestion = (data: { index: number, timerSeconds: number, timerMode?: 'per-question' | 'total' }) => {
      setCurrentIndex(data.index);
      currentIndexRef.current = data.index;
      if (data.timerMode) setTimerMode(data.timerMode);
      // Reset monotonic guard per new question — each question starts fresh
      lastTimerRef.current = data.timerSeconds;
      setTimeLeft(data.timerSeconds);
      setSelectedIdx(null);
      selectedIdxRef.current = null;
      setIsLocked(false);
      isLockedRef.current = false;
      setCorrectIdx(null);
      setExplanation(null);
      setIsPaused(false);
      isPausedRef.current = false;
    };

    // Server sends the leaderboard with authoritative scores — use that, not local score
    const onQuizFinished = (data: { leaderboard: any }) => {
      setIsFinished(true);
      isFinishedRef.current = true;
      setIsMatchActive(false);
      onFinish(0, quiz.questions.length, data.leaderboard, answersLogRef.current);
    };

    // Reconnection sync: server sends current state when a player rejoins a running game
    const onGameStateSync = (data: { 
      questionIndex: number, 
      timerSeconds: number,
      timerMode: 'per-question' | 'total',
      question: string,
      options: string[],
      examSettings: any ,
      quiz?: any
    }) => {
      // Note: quiz data update is handled by parent page via its own game_state_sync listener
      setCurrentIndex(data.questionIndex);
      currentIndexRef.current = data.questionIndex;
      // Reset monotonic guard when question changes via sync
      lastTimerRef.current = data.timerSeconds;
      setTimeLeft(data.timerSeconds);
      setTimerMode(data.timerMode || 'per-question');
      if (data.examSettings) setExamSettings(data.examSettings);
      setSelectedIdx(null);
      selectedIdxRef.current = null;
      setIsLocked(false);
      isLockedRef.current = false;
      setIsMatchActive(true);
      setIsSyncing(false); // Hydration complete — unblock rendering
    };

    // Periodic state snapshot: self-heal if questionIndex is out of sync
    const onStateSnapshot = (data: { questionIndex: number, timeLeft: number, status: string, serverTs: number }) => {
      if (data.status !== 'running') return;
      // Only force-sync if we're on the wrong question
      if (data.questionIndex !== currentIndexRef.current) {
        console.warn(`[QuizEngine] State mismatch detected. Server: Q${data.questionIndex}, Client: Q${currentIndexRef.current}. Force-syncing.`);
        setCurrentIndex(data.questionIndex);
        currentIndexRef.current = data.questionIndex;
        lastTimerRef.current = data.timeLeft;
        setTimeLeft(data.timeLeft);
        setSelectedIdx(null);
        selectedIdxRef.current = null;
        setIsLocked(false);
        isLockedRef.current = false;
        autoSubmittedRef.current = false;
      }
    };

    const onHostBroadcast = (data: { message: string, type: string }) => {
      setHudMessage({ text: data.message, type: data.type });
      setTimeout(() => setHudMessage(null), 5000);
    };

    socket.on('timer_tick', onTimerTick);
    socket.on('global_timer_tick', onGlobalTimerTick);
    socket.on('game_paused', onGamePaused);
    socket.on('game_resumed', onGameResumed);
    socket.on('broadcast_message', onBroadcastMessage);
    socket.on('question_result', onQuestionResult);
    socket.on('game_started', onGameStarted);
    socket.on('game_starting', onGameStarting);
    socket.on('game_countdown', onGameCountdown);
    socket.on('game_countdown_aborted', onCountdownAborted);
    socket.on('next_question', onNextQuestion);
    socket.on('quiz_finished', onQuizFinished);
    socket.on('game_state_sync', onGameStateSync);
    socket.on('state_snapshot', onStateSnapshot);
    socket.on('host_broadcast_to_player', onHostBroadcast);

    // Heartbeat: update lastSeen on server every 5s
    const heartbeatTimer = setInterval(() => {
      if (pin) socket.emit('client_heartbeat', { pin });
    }, 5000);

    return () => {
      socket.off('timer_tick', onTimerTick);
      socket.off('global_timer_tick', onGlobalTimerTick);
      socket.off('game_paused', onGamePaused);
      socket.off('game_resumed', onGameResumed);
      socket.off('broadcast_message', onBroadcastMessage);
      socket.off('question_result', onQuestionResult);
      socket.off('game_started', onGameStarted);
      socket.off('game_starting', onGameStarting);
      socket.off('game_countdown', onGameCountdown);
      socket.off('game_countdown_aborted', onCountdownAborted);
      socket.off('next_question', onNextQuestion);
      socket.off('quiz_finished', onQuizFinished);
      socket.off('game_state_sync', onGameStateSync);
      socket.off('state_snapshot', onStateSnapshot);
      socket.off('host_broadcast_to_player', onHostBroadcast);
      clearInterval(heartbeatTimer);
    };
  }, [isLive, socket, onFinish, quiz.questions.length, playSuccess, playError]);
  // NOTE: Removed score, selectedIdx from deps — they are now accessed via refs

  const handleAbort = () => {
    if (confirm("⚠️ CAUTION: Aborting the arena will forfeit all progress. Are you sure?")) {
      setIsMatchActive(false);
      router.push('/dashboard');
    }
  };

  const handleViolation = useCallback((type: string) => {
    if (isLive && socket) {
      socket.emit('anti_cheat_violation', { pin, type: type === 'right_click' || type === 'clipboard_usage' ? `lockdown_${type}` : type });
    }
  }, [isLive, socket, pin]);

  const handleNext = () => {
    // Skip confirmation: solo mode only — don't interrupt live server-driven flow
    if (!isLive && selectedIdx === null && currentIndex < quiz.questions.length - 1) {
      // Record as skipped before confirming
      const q = quiz.questions[currentIndexRef.current];
      if (!answersLogRef.current[currentIndexRef.current]) {
        answersLogRef.current[currentIndexRef.current] = {
          questionIndex: currentIndexRef.current,
          question: q.question,
          options: q.options,
          selectedIdx: null,
          correctIdx: q.correctIndex!,
          explanation: q.explanation
        };
      }
    }
    playNavigate();
    if (currentIndex < quiz.questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      // Reset monotonic guard for fresh question
      lastTimerRef.current = 30;
      if (timerMode === 'per-question') setTimeLeft(30);
      setSelectedIdx(null);
      selectedIdxRef.current = null;
      setIsLocked(false);
      isLockedRef.current = false;
      setCorrectIdx(null);
      setExplanation(null);
    } else {
      setIsFinished(true);
      setIsMatchActive(false);
      onFinish(score, quiz.questions.length, undefined, answersLogRef.current);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      playNavigate();
      setCurrentIndex(prev => prev - 1);
      setSelectedIdx(null);
      selectedIdxRef.current = null;
      setIsLocked(false);
      isLockedRef.current = false;
      setCorrectIdx(null);
      setExplanation(null);
    }
  };

  const sendBroadcast = () => {
    if (!broadcastText.trim()) return;
    socket?.emit('host_broadcast', { pin, message: broadcastText, type: 'alert' });
    setBroadcastText('');
  };

  if (isFinished) return null;

  // Reconnect loading gate: block rendering until server has sent current state
  // Prevents stale-UI flicker during the sync window
  if (isSyncing && isLive) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-2 border-accent/20" />
          <div className="absolute inset-0 w-16 h-16 rounded-full border-2 border-accent border-t-transparent animate-spin" />
        </div>
        <div className="text-center space-y-2">
          <p className="text-[11px] font-black uppercase tracking-[0.4em] text-accent-alt animate-pulse">Synchronizing Arena State</p>
          <p className="text-[9px] text-text-soft uppercase tracking-widest">Connecting to server...</p>
        </div>
      </div>
    );
  }

  // Pre-game countdown overlay — shown between game_starting and game_started
  if (countdown !== null) {
    return (
      <motion.div
        key="countdown-overlay"
        initial={{ opacity: 0, scale: 1.2 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background/95 backdrop-blur-3xl"
      >
        <div className="text-center space-y-8">
          <p className="text-[11px] font-black uppercase tracking-[0.5em] text-accent-alt animate-pulse">Arena Initializing</p>
          <motion.div
            key={countdown}
            initial={{ scale: 1.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="text-[120px] font-black text-white leading-none tabular-nums"
            style={{ textShadow: '0 0 60px rgba(99,102,241,0.8)' }}
          >
            {countdown === 0 ? 'GO!' : countdown}
          </motion.div>
          <p className="text-xs font-bold text-text-soft uppercase tracking-widest">{quiz?.title}</p>
          <div className="flex gap-2 justify-center">
            {[5,4,3,2,1,0].map(n => (
              <div key={n} className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                n >= countdown ? 'bg-accent scale-125' : 'bg-white/10'
              )} />
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <>
      {/* Full-screen answer feedback flash */}
      <AnswerFlash flashKey={flashKey} isCorrect={lastFlashCorrect} />

      {/* Network status corner badge */}
      <NetworkStatusWidget isSyncing={isSyncing} />

      {/* Live player activity feed (bottom-left) */}
      <PlayerActivityFeed socket={socket} isLive={isLive} />

      <div className="flex gap-6 items-start">
        {/* Main quiz content */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 max-w-4xl mx-auto w-full relative">
      <AnimatePresence>
        {hudMessage && (
          <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none px-4">
            <div className="bg-[#080d20] p-8 rounded-[40px] border border-accent/50 text-center shadow-[0_0_50px_rgba(99,102,241,0.4)]">
              <ShieldAlert size={48} className="text-accent-alt mx-auto mb-4" />
              <p className="text-2xl font-black italic text-white">"{hudMessage.text}"</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex sm:hidden mb-6">
        <Button variant="outline" onClick={handleAbort} className="w-full border-red-500/20 text-red-400 bg-red-400/5 hover:bg-red-400/10 rounded-xl">
          <X className="mr-2" size={16} /> Retreat from Arena
        </Button>
      </div>

      <SecurityLockdown enabled={!!examSettings?.lockdownMode} isMatchActive={isMatchActive} onViolation={handleViolation}>
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
                          <Button className={cn("w-full py-3 rounded-2xl gap-2", isPaused ? "bg-amber-500 text-black" : "bg-white/5")} onClick={() => socket?.emit(isPaused ? 'host_resume' : 'host_pause', pin)}>
                            {isPaused ? <Play size={14} /> : <Pause size={14} />} {isPaused ? 'Resume' : 'Pause'}
                          </Button>
                          <Button variant="outline" className="w-full py-3 border-white/10" onClick={() => socket?.emit('host_next', pin)}>
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

            <div className={cn(
              "flex items-center gap-3 px-6 py-3 rounded-2xl glass transition-all relative",
              isPaused ? "text-accent" : (timeLeft <= 5 && !isPaused) ? "text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]" : (timeLeft < 10) ? "text-red-500" : "text-white",
              timeLeft <= 5 && !isPaused && 'animate-[tremor_0.3s_ease-in-out_infinite]'
            )}>
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

        {/* Live leaderboard sidebar — visible on xl screens during live matches */}
        <LiveLeaderboard socket={socket} pin={pin} isLive={isLive} />
      </div>
    </>
  );
};
