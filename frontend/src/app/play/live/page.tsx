'use client';

import React, { useEffect, useState, useCallback, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { QuizEngine } from '@/components/play/QuizEngine';
import { useSocket } from '@/context/SocketContext';
import { Trophy, ArrowLeft, BarChart3, Medal, Target, CheckCircle2, XCircle, ShieldAlert, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import api from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';
import { useAudio } from '@/context/AudioContext';
import { HostNexus } from '@/components/play/HostNexus';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { ShareResultCard } from '@/components/ui/ShareResultCard';

function LivePlayContent() {
  const { user } = useAuth();
  const { playEnter } = useAudio();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pin = searchParams.get('pin');
  const { socket, isConnected, connectionStatus, reconnect } = useSocket();

  const [quiz, setQuiz] = useState<any>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [teamScores, setTeamScores] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isHost, setIsHost] = useState(false);
  const [examSettings, setExamSettings] = useState<any>(null);
  const [answersLog, setAnswersLog] = useState<any[]>([]);

  // join_ack unblocks this — prevents rendering with stale/null state
  const [hasJoinedRoom, setHasJoinedRoom] = useState(false);
  const joinedSocketRef = useRef<string | null>(null); // tracks socket.id to detect reconnects

  // -----------------------------------------------------------------------
  // Helper: returns true if this session was created by matchmaking
  // Checks both the socket path (matchmade: true) and the REST path (metadata.matchmaking: true)
  // This is the SINGLE source of truth for "should this player see host dashboard?"
  // -----------------------------------------------------------------------
  const isMatchmadeSession = (data: any): boolean => {
    return !!(
      data?.matchmade ||
      data?.metadata?.matchmaking ||
      data?.metadata?.matchmade
    );
  };

  // -----------------------------------------------------------------------
  // Fetch session via REST (fallback — used if socket join_ack times out)
  // -----------------------------------------------------------------------
  const fetchSession = useCallback(async () => {
    if (!pin) return;
    try {
      const res = await api.get(`/api/host/session/${pin}`);
      if (res.data.quiz) {
        setQuiz(res.data.quiz);
        const playAsHost = searchParams.get('playAsHost') === 'true';
        const userId = user?.id || user?.userId;
        // GUARD: Never show host dashboard for matchmade sessions
        if (!isMatchmadeSession(res.data) && user && res.data.hostId === userId && !playAsHost) {
          setIsHost(true);
        }
      }
    } catch (err) {
      console.error("Failed to fetch session state", err);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin, user, searchParams]);

  // -----------------------------------------------------------------------
  // Core socket lifecycle: join room + listen for authoritative state
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (!isConnected || !socket || !pin || !user) return;

    // --- Emit join_room once per unique socket connection ---
    if (joinedSocketRef.current !== socket.id) {
      joinedSocketRef.current = socket.id ?? null;
      const playAsHost = searchParams.get('playAsHost') === 'true';
      const doJoin = () => {
        socket.emit('join_room', {
          pin,
          name: user.name || 'Player',
          userId: user.id || user.userId,
          email: user.email,
          avatar: user.avatar || null,
          team: searchParams.get('team') || null,
          slotIndex: searchParams.get('slot') ? Number(searchParams.get('slot')) : undefined,
        });
      };
      // If navigated from battles page (no playAsHost, no team param), the server
      // session was just created — add a small delay so liveSessions.set() completes
      // before our join_room arrives. Regular sessions (lobby-based) need no delay.
      const isFromMatchmaking = !playAsHost && !searchParams.get('team') && !searchParams.get('slot');
      if (isFromMatchmaking) {
        setTimeout(doJoin, 800);
      } else {
        doJoin();
      }
    }

    // ---- join_ack: THE primary sync mechanism ----
    // Server sends this immediately after join_room with full current state.
    // This is what unblocks isSyncing in QuizEngine — fixes the "Synchronizing Arena" freeze.
    const onJoinAck = (data: any) => {
      if (data.quiz) setQuiz(data.quiz);
      if (data.examSettings) setExamSettings(data.examSettings);
      setLoading(false);
      setHasJoinedRoom(true);
      // TRIPLE GUARD: Never show host dashboard for matchmade sessions.
      // Checks: (1) socket matchmade flag, (2) metadata flags, (3) playAsHost override
      const playAsHost = searchParams.get('playAsHost') === 'true';
      if (!isMatchmadeSession(data) && user && data.hostId === (user.id || user.userId) && !playAsHost) {
        setIsHost(true);
      }
    };

    // ---- game_starting: quiz data arrives before countdown ----
    const onGameStarting = (data: any) => {
      if (data.quiz) setQuiz(data.quiz);
      if (data.examSettings) setExamSettings(data.examSettings);
      setLoading(false);
      setHasJoinedRoom(true);
    };

    // ---- game_started: authoritative start, always has full state ----
    const onGameStarted = (data: any) => {
      playEnter();
      if (data.quiz) setQuiz(data.quiz);
      if (data.examSettings) setExamSettings(data.examSettings);
      setLoading(false);
      setHasJoinedRoom(true);
    };

    // ---- game_state_sync: reconnection to a mid-game session ----
    const onGameStateSync = (data: any) => {
      if (data.quiz) setQuiz(data.quiz);
      if (data.examSettings) setExamSettings(data.examSettings);
      setLoading(false);
      setHasJoinedRoom(true);
    };

    const onSettingsUpdated = (data: any) => {
      if (data.examSettings) setExamSettings(data.examSettings);
    };

    const onQuizFinished = (data: any) => {
      setIsFinished(true);
      if (data.leaderboard) setLeaderboard(data.leaderboard);
      if (data.teamScores) setTeamScores(data.teamScores);
    };

    const onJoinError = (data: any) => {
      console.error('[LivePlay] join_error:', data.message);
      setLoading(false);
    };

    socket.on('join_ack', onJoinAck);
    socket.on('game_starting', onGameStarting);
    socket.on('game_started', onGameStarted);
    socket.on('game_state_sync', onGameStateSync);
    socket.on('settings_updated', onSettingsUpdated);
    socket.on('quiz_finished', onQuizFinished);
    socket.on('join_error', onJoinError);

    // Safety timeout: if join_ack never arrives (cold server, slow DB),
    // fall back to REST after 8s so the player is never permanently blocked.
    const syncTimeout = setTimeout(() => {
      if (!hasJoinedRoom) {
        console.warn('[LivePlay] join_ack timeout — falling back to REST fetch');
        fetchSession();
        setHasJoinedRoom(true); // unblock rendering with whatever REST returns
      }
    }, 8000);

    return () => {
      socket.off('join_ack', onJoinAck);
      socket.off('game_starting', onGameStarting);
      socket.off('game_started', onGameStarted);
      socket.off('game_state_sync', onGameStateSync);
      socket.off('settings_updated', onSettingsUpdated);
      socket.off('quiz_finished', onQuizFinished);
      socket.off('join_error', onJoinError);
      clearTimeout(syncTimeout);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, socket, pin, user]);

  // Reset join guard when socket reconnects with a new socket ID
  useEffect(() => {
    if (!isConnected) {
      joinedSocketRef.current = null;
    }
  }, [isConnected]);

  // -----------------------------------------------------------------------
  // Loading / disconnected states
  // -----------------------------------------------------------------------
  if (connectionStatus === 'connecting') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-2 border-accent/20" />
          <div className="absolute inset-0 w-16 h-16 rounded-full border-2 border-accent border-t-transparent animate-spin" />
        </div>
        <div className="text-center space-y-1">
          <p className="font-bold uppercase tracking-widest text-sm text-white">Connecting to Arena...</p>
          <p className="text-[10px] text-text-soft uppercase tracking-widest">Establishing secure uplink</p>
        </div>
      </div>
    );
  }

  if (connectionStatus === 'disconnected') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <WifiOff className="text-red-400" size={48} />
        <div className="text-center space-y-2">
          <p className="font-bold uppercase tracking-widest text-sm text-white">Connection Lost</p>
          <p className="text-xs text-text-soft">Arena uplink severed. Attempting recovery...</p>
        </div>
        <Button onClick={reconnect} className="px-8 h-12 rounded-2xl">
          <Wifi className="mr-2" size={16} /> Reconnect
        </Button>
      </div>
    );
  }

  if (loading && !quiz) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <Loader2 className="text-accent animate-spin" size={40} />
        <p className="font-bold uppercase tracking-widest text-text-soft">Joining Arena...</p>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="max-w-md mx-auto mt-20 p-8 glass rounded-3xl text-center space-y-6">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
          <BarChart3 className="text-red-400" size={40} />
        </div>
        <h2 className="text-2xl font-bold">No active quiz found</h2>
        <p className="text-text-soft">We couldn't find a live session for PIN {pin}. It may have ended or been closed.</p>
        <Button onClick={() => router.push('/dashboard')} className="w-full">Back to Dashboard</Button>
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Finished state — final leaderboard + social share
  // -----------------------------------------------------------------------
  if (isFinished) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto px-4 py-20 text-center"
      >
        <Trophy className="mx-auto text-accent mb-6" size={80} />
        <h1 className="text-4xl font-black mb-2 uppercase tracking-tight">Quiz Finished!</h1>
        <p className="text-text-soft mb-8 text-lg">The battle is over. Are you on the podium?</p>

        {teamScores && (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="grid grid-cols-2 gap-4 mb-8"
          >
            <div className={cn(
              "glass p-6 rounded-3xl border-2 flex flex-col items-center justify-center gap-2",
              teamScores['Team A'] > teamScores['Team B'] ? "border-blue-500 bg-blue-500/10" : "border-white/5 opacity-60"
            )}>
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Team A</span>
              <span className="text-3xl font-black text-white">{teamScores['Team A'] || 0}</span>
              {teamScores['Team A'] > teamScores['Team B'] && <span className="text-[10px] font-black bg-blue-500 text-white px-2 py-1 rounded-full">VICTORY</span>}
            </div>
            <div className={cn(
              "glass p-6 rounded-3xl border-2 flex flex-col items-center justify-center gap-2",
              teamScores['Team B'] > teamScores['Team A'] ? "border-red-500 bg-red-500/10" : "border-white/5 opacity-60"
            )}>
              <span className="text-[10px] font-black uppercase tracking-widest text-red-400">Team B</span>
              <span className="text-3xl font-black text-white">{teamScores['Team B'] || 0}</span>
              {teamScores['Team B'] > teamScores['Team A'] && <span className="text-[10px] font-black bg-red-500 text-white px-2 py-1 rounded-full">VICTORY</span>}
            </div>
          </motion.div>
        )}

        <div className="glass p-8 rounded-[32px] mb-12 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
          
          <h3 className="flex items-center justify-center gap-3 font-bold text-xl mb-8">
            <Medal className="text-yellow-400" />
            Final Arena Ranking
          </h3>
          <div className="space-y-3">
            {leaderboard.length > 0 ? leaderboard.map((player, i) => (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                key={i} 
                className={cn(
                  "flex items-center justify-between p-5 rounded-2xl border transition-all",
                  i === 0 ? "bg-accent/10 border-accent/30 shadow-lg" : "bg-background/50 border-white/5"
                )}
              >
                <div className="flex items-center gap-5">
                  <span className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center font-black",
                    i === 0 ? "bg-yellow-400 text-background" : "bg-white/5 text-text-soft"
                  )}>
                    {i === 0 ? '🏆' : `#${i + 1}`}
                  </span>
                  <span className={cn("font-bold text-lg", i === 0 && "text-accent")}>{player.name}</span>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-3">
                    <span className="font-black text-xl text-white">{player.score}</span>
                    <div className="h-4 w-[1px] bg-white/10" />
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] uppercase font-black tracking-tighter text-accent-alt">
                        {player.attemptedCount > 0 ? Math.round((player.correctCount / player.attemptedCount) * 100) : 0}% ACCURACY
                      </span>
                      <span className="text-[8px] uppercase font-bold tracking-widest text-text-soft">{player.streak} STREAK</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 px-3 py-1 bg-white/5 rounded-full border border-white/5 mt-1 scale-90 origin-right">
                    <div className="flex items-center gap-1.5" title="Correct Answers">
                      <CheckCircle2 size={10} className="text-emerald-400" />
                      <span className="text-[10px] font-bold text-white">{player.correctCount}</span>
                    </div>
                    <div className="flex items-center gap-1.5" title="Incorrect Answers">
                      <XCircle size={10} className="text-rose-400" />
                      <span className="text-[10px] font-bold text-white">{player.incorrectCount}</span>
                    </div>
                    <div className="flex items-center gap-1.5" title="Total Attempted">
                      <Target size={10} className="text-accent" />
                      <span className="text-[10px] font-bold text-white">{player.attemptedCount}</span>
                    </div>
                    {player.penalties > 0 && (
                      <div className="flex items-center gap-1.5 pl-2 border-l border-white/10" title="Tab Switch Penalties">
                        <ShieldAlert size={10} className="text-red-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-red-500">-{player.penaltyScore} pts ({player.penalties})</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )) : (
              <p className="py-10 text-text-soft italic text-xs">Waiting for host to broadcast rankings...</p>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button onClick={() => router.push('/dashboard')} className="w-full sm:w-auto px-10 h-14 bg-accent/20 border border-accent/40 text-accent hover:bg-accent hover:text-white transition-all">
            <ArrowLeft className="mr-2" size={20} />
            Back to Command Terminal
          </Button>
          <Button onClick={() => router.push(`/analytics/${pin}`)} variant="outline" className="w-full sm:w-auto px-10 h-14 border-accent-alt/30 text-accent-alt hover:bg-accent-alt/10 transition-all">
            <BarChart3 className="mr-2" size={20} />
            Deep Analytics
          </Button>
        </div>

        {quiz && (
          <div className="mt-6 max-w-sm mx-auto">
            <ShareResultCard
              quizTitle={quiz.title}
              score={leaderboard.find((p: any) => p.name === user?.name)?.score || 0}
              totalQuestions={quiz.questions?.length || 0}
              accuracy={quiz.questions?.length
                ? Math.round(((leaderboard.find((p: any) => p.name === user?.name)?.score || 0) / quiz.questions.length) * 100)
                : 0
              }
              mode="Live Arena"
            />
          </div>
        )}
      </motion.div>
    );
  }

  // -----------------------------------------------------------------------
  // Main match view
  // -----------------------------------------------------------------------
  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10">
      {isHost ? (
        <HostNexus 
          quiz={quiz} 
          socket={socket} 
          pin={pin || ''} 
          user={user}
        />
      ) : (
        <ErrorBoundary>
          <QuizEngine 
            quiz={quiz} 
            isLive={true} 
            socket={socket} 
            pin={pin || ''}
            examSettings={examSettings}
            isHostOverride={isHost}
            onFinish={(score, total, lb, log) => {
              setIsFinished(true);
              if (lb) setLeaderboard(lb);
              if (log) setAnswersLog(log);
            }}
          />
        </ErrorBoundary>
      )}
    </div>
  );
}

export default function LivePlayPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="w-16 h-16 rounded-full border-4 border-accent border-t-transparent animate-spin" />
        <p className="font-bold uppercase tracking-widest text-text-soft">Loading Battle Terminal...</p>
      </div>
    }>
      <LivePlayContent />
    </Suspense>
  );
}
