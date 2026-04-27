'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { Input } from '@/components/ui/Input';
import { 
  Zap, Users, Shield, Sword, Gamepad2, Trophy, Search, Radio,
  Crosshair, X, RefreshCw, ArrowRight, Wifi, Clock, 
  ChevronRight, Star, Lock, Globe, CheckCircle2, AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/axios';
import { CollapsibleCard } from '@/components/ui/CollapsibleCard';
import { ChallengeBanner } from '@/components/ui/ChallengeInvite';

// ─── Types ───────────────────────────────────────────────────
interface Room {
  pin: string;
  title: string;
  category: string;
  playerCount: number;
  maxPlayers: number;
  spotsLeft: number;
  status: string;
  createdAt: number;
}

type Tab = 'quickmatch' | 'arena' | 'pin';

const CATEGORIES = [
  { id: 'General Knowledge', label: 'General', icon: Globe, color: 'from-violet-500 to-purple-600' },
  { id: 'Computer Science', label: 'CS & Tech', icon: Zap, color: 'from-blue-500 to-cyan-600' },
  { id: 'Mathematics', label: 'Mathematics', icon: Star, color: 'from-amber-500 to-orange-600' },
  { id: 'Science', label: 'Science', icon: Radio, color: 'from-emerald-500 to-green-600' },
  { id: 'History', label: 'History', icon: Clock, color: 'from-rose-500 to-red-600' },
  { id: 'Geography', label: 'Geography', icon: Globe, color: 'from-teal-500 to-emerald-600' },
];

const DIFFICULTIES = [
  { id: 'easy', label: 'Easy', desc: 'For warm-ups', color: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10' },
  { id: 'medium', label: 'Medium', desc: 'Balanced', color: 'text-amber-400 border-amber-400/30 bg-amber-400/10' },
  { id: 'hard', label: 'Hard', desc: 'Expert tier', color: 'text-red-400 border-red-400/30 bg-red-400/10' },
];

// ─── Toast component ─────────────────────────────────────────
function Toast({ message, type, onClose }: { message: string; type: 'error' | 'success'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
      className={cn(
        'fixed top-24 left-1/2 -translate-x-1/2 z-[500] flex items-center gap-3 px-5 py-3 rounded-2xl border backdrop-blur-xl shadow-2xl',
        type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
      )}
    >
      {type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
      <span className="text-[11px] font-black uppercase tracking-widest">{message}</span>
      <button onClick={onClose} className="ml-2 opacity-50 hover:opacity-100"><X size={12} /></button>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function BattlesPage() {
  const router = useRouter();
  const { user, profileCompletion } = useAuth();
  const { socket } = useSocket();

  const [activeTab, setActiveTab] = useState<Tab>('quickmatch');
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  // Computed real stats from user profile
  const computedRank = (() => {
    const r = user?.globalRating || 1200;
    if (r >= 2200) return 'Grandmaster';
    if (r >= 2000) return 'Master';
    if (r >= 1800) return 'Diamond';
    if (r >= 1600) return 'Platinum';
    if (r >= 1400) return 'Gold';
    if (r >= 1200) return 'Silver II';
    if (r >= 1100) return 'Silver I';
    if (r >= 1000) return 'Bronze II';
    return 'Bronze I';
  })();

  const computedWinRate = (() => {
    const wins   = user?.totalWins   || 0;
    const losses = user?.totalLosses || 0;
    const total  = wins + losses;
    if (total === 0) return '--';
    return `${Math.round((wins / total) * 100)}%`;
  })();

  // PIN join state
  const [pin, setPin] = useState('');
  const [joinName, setJoinName] = useState(user?.name || '');
  const [password, setPassword] = useState('');

  // Quick match state
  type MatchState = 'idle' | 'searching' | 'found';
  const [matchState, setMatchState] = useState<MatchState>('idle');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('medium');
  const [queueInfo, setQueueInfo] = useState<{ position: number; estimatedWait: number; category: string; difficulty: string } | null>(null);
  const [matchResult, setMatchResult] = useState<any>(null);
  const [countdown, setCountdown] = useState(5);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Live arena state
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [joiningPin, setJoiningPin] = useState<string | null>(null);
  const [onlineCount, setOnlineCount] = useState<number>(0);

  // ── Challenge banner (from deep link) ───────────────────
  const challengerName = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('challenge') : null;
  const challengeQuizId = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('quizId') : null;
  const [showChallengeBanner, setShowChallengeBanner] = useState(!!challengerName);

  const showToast = useCallback((message: string, type: 'error' | 'success' = 'error') => {
    setToast({ message, type });
  }, []);

  // ── Socket events ─────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const onSearching = (data: typeof queueInfo) => {
      setQueueInfo(data);
      setMatchState('searching');
    };

    const onMatchFound = (data: any) => {
      setMatchResult(data);
      setMatchState('found');
      // DO NOT emit join_room here — the /play/live page emits it when it loads.
      // Emitting twice (once here + once on page load) causes race conditions where
      // the player list gets duplicate entries and the host check may fire incorrectly.

      // 3s countdown then redirect to play/live (matchmade sessions auto-start)
      let cd = 3;
      setCountdown(cd);
      countdownRef.current = setInterval(() => {
        cd--;
        setCountdown(cd);
        if (cd <= 0) {
          clearInterval(countdownRef.current!);
          router.push(`/play/live?pin=${data.pin}`);
        }
      }, 1000);
    };

    const onCancelled = () => {
      setMatchState('idle');
      setQueueInfo(null);
      showToast('Removed from queue.', 'success');
    };

    const onMatchError = (data: { message: string }) => {
      setMatchState('idle');
      showToast(data.message);
    };

    const onRoomListUpdate = (data: { rooms: Room[] }) => {
      setRooms(data.rooms || []);
    };

    const onOnlineCount = (data: { count: number }) => {
      setOnlineCount(data.count);
    };

    const onJoinSuccess = (data: { pin: string; name: string }) => {
      setJoiningPin(null);
      router.push(`/lobby/${data.pin}?role=player&name=${encodeURIComponent(data.name || user?.name || 'Player')}`);
    };

    const onJoinError = (data: { message: string }) => {
      setJoiningPin(null);
      showToast(data.message);
    };

    socket.on('matchmaking_searching', onSearching);
    socket.on('match_found', onMatchFound);
    socket.on('matchmaking_cancelled', onCancelled);
    socket.on('matchmaking_error', onMatchError);
    socket.on('matchmaking_no_quiz', onMatchError);
    socket.on('room_list_update', onRoomListUpdate);
    socket.on('quick_join_success', onJoinSuccess);
    socket.on('join_error', onJoinError);
    socket.on('online_count', onOnlineCount);

    return () => {
      socket.off('matchmaking_searching', onSearching);
      socket.off('match_found', onMatchFound);
      socket.off('matchmaking_cancelled', onCancelled);
      socket.off('matchmaking_error', onMatchError);
      socket.off('matchmaking_no_quiz', onMatchError);
      socket.off('room_list_update', onRoomListUpdate);
      socket.off('quick_join_success', onJoinSuccess);
      socket.off('join_error', onJoinError);
      socket.off('online_count', onOnlineCount);
    };
  }, [socket, router, user, showToast]);

  // ── Subscribe to rooms feed when on arena tab ─────────────
  useEffect(() => {
    if (activeTab !== 'arena' || !socket) return;
    socket.emit('subscribe_rooms');
    setRoomsLoading(true);
    api.get('/api/rooms/active').then(res => {
      setRooms(res.data.rooms || []);
      setRoomsLoading(false);
    }).catch(() => setRoomsLoading(false));
    return () => { socket.emit('unsubscribe_rooms'); };
  }, [activeTab, socket]);

  // Cleanup countdown on unmount
  useEffect(() => () => { if (countdownRef.current) clearInterval(countdownRef.current); }, []);

  // ── Handlers ──────────────────────────────────────────────
  const handleFindMatch = () => {
    if (!selectedCategory) return showToast('Select a category first.');
    if (!socket) return showToast('Not connected to server.');
    const name = user?.name || joinName || 'Player';
    socket.emit('quick_match', {
      name,
      category: selectedCategory,
      difficulty: selectedDifficulty,
      userId: user?.id || null
    });
  };

  const handleCancelMatch = () => {
    socket?.emit('cancel_matchmaking');
    if (countdownRef.current) clearInterval(countdownRef.current);
    setMatchState('idle');
    setQueueInfo(null);
    setMatchResult(null);
  };

  const handleRequeue = () => {
    setMatchState('idle');
    setMatchResult(null);
    setQueueInfo(null);
  };

  const handleJoinRoom = (roomPin: string) => {
    const name = user?.name || joinName || 'Player';
    setJoiningPin(roomPin);
    socket?.emit('quick_join_room', { pin: roomPin, name, userId: user?.id });
  };

  const handlePinJoin = () => {
    if (!pin || pin.length < 6) return showToast('Enter a valid 6-digit PIN');
    const name = joinName || user?.name || 'GUEST_PILOT';
    router.push(`/lobby/${pin}?role=player&name=${encodeURIComponent(name)}${password ? `&password=${password}` : ''}`);
  };

  // Group rooms by category
  const roomsByCategory = rooms.reduce((acc, r) => {
    if (!acc[r.category]) acc[r.category] = [];
    acc[r.category].push(r);
    return acc;
  }, {} as Record<string, Room[]>);

  // ─── Render ───────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10 space-y-10">
      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </AnimatePresence>

      {/* Challenge Banner */}
      <AnimatePresence>
        {showChallengeBanner && challengerName && (
          <ChallengeBanner
            challengerName={challengerName}
            quizId={challengeQuizId || ''}
            onDismiss={() => setShowChallengeBanner(false)}
            onAccept={() => {
              setShowChallengeBanner(false);
              if (challengeQuizId) router.push(`/play/solo?quiz=${challengeQuizId}`);
            }}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl lg:text-4xl font-black tracking-tight uppercase italic">Combat Theaters</h1>
          {/* Live online player count */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 font-black text-sm">
              {onlineCount.toLocaleString()}+
            </span>
            <span className="text-emerald-400/70 text-[10px] font-black uppercase tracking-widest">Online</span>
          </div>
        </div>
        <p className="text-text-soft text-xs lg:text-sm">
          Find real-time multiplayer matches, join live arenas, or connect with a PIN.
        </p>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-2 p-1 bg-white/[0.03] border border-white/5 rounded-2xl w-fit">
        {([
          { id: 'quickmatch', label: 'Quick Match', icon: Crosshair },
          { id: 'arena', label: 'Live Arena', icon: Radio },
          { id: 'pin', label: 'Join by PIN', icon: Zap },
        ] as { id: Tab; label: string; icon: any }[]).map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all',
              activeTab === t.id
                ? 'bg-accent text-white shadow-lg shadow-accent/20'
                : 'text-text-soft hover:text-white hover:bg-white/5'
            )}
          >
            <t.icon size={14} />{t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ══════════════════════════════════════════
            TAB 1: QUICK MATCH
        ══════════════════════════════════════════ */}
        {activeTab === 'quickmatch' && (
          <motion.div key="quickmatch" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="grid lg:grid-cols-3 gap-8 items-start">

            {/* Left: Pilot stand */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 px-2">
                <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center text-accent text-[10px]">1</div>
                <h2 className="text-xs font-black uppercase tracking-widest text-text-soft italic">Pilot Standing</h2>
              </div>
              <CollapsibleCard title="Combat Rating" icon={Shield} className="border-white/5">
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[9px] text-text-soft uppercase font-black">Global Rating</p>
                      <p className="text-3xl font-black text-accent-alt">{user?.globalRating || 1200}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-text-soft uppercase font-black">Rank</p>
                      <p className="text-xl font-black italic uppercase">{computedRank}</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                    <div className="flex justify-between text-[8px] font-black uppercase text-text-soft">
                      <span>Sync Strength</span><span>{profileCompletion}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-accent rounded-full" style={{ width: `${profileCompletion}%` }} />
                    </div>
                  </div>
                </div>
              </CollapsibleCard>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Sword,  label: 'Win Rate', val: computedWinRate },
                  { icon: Trophy, label: 'Best Streak', val: user?.bestWinStreak ? `${user.bestWinStreak}W` : '--' }
                ].map((s, i) => (
                  <div key={i} className="glass p-5 rounded-3xl border-white/5 text-center space-y-1">
                    <s.icon className="mx-auto text-text-soft opacity-40 mb-2" size={16} />
                    <p className="text-[8px] text-text-soft uppercase font-black">{s.label}</p>
                    <p className="text-sm font-black italic">{s.val}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Center: Matchmaking UI */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center gap-3 px-2">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 text-[10px]">2</div>
                <h2 className="text-xs font-black uppercase tracking-widest text-text-soft italic">Arena Matchmaking</h2>
              </div>

              <div className="glass p-8 rounded-[40px] border-white/10 space-y-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent pointer-events-none" />

                <AnimatePresence mode="wait">

                  {/* IDLE: Category + Difficulty picker */}
                  {matchState === 'idle' && (
                    <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8 relative z-10">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-soft mb-4">Select Category</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {CATEGORIES.map(cat => (
                            <motion.button
                              key={cat.id}
                              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                              onClick={() => setSelectedCategory(cat.id)}
                              className={cn(
                                'p-4 rounded-2xl border-2 transition-all text-left relative overflow-hidden group',
                                selectedCategory === cat.id
                                  ? 'border-accent bg-accent/10 shadow-[0_0_20px_rgba(99,102,241,0.2)]'
                                  : 'border-white/5 bg-white/[0.02] hover:border-white/20'
                              )}
                            >
                              <div className={cn('absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity', cat.color)} />
                              <cat.icon size={20} className={cn('mb-2', selectedCategory === cat.id ? 'text-accent' : 'text-text-soft')} />
                              <p className={cn('text-[10px] font-black uppercase tracking-widest', selectedCategory === cat.id ? 'text-white' : 'text-text-soft')}>
                                {cat.label}
                              </p>
                              {selectedCategory === cat.id && (
                                <CheckCircle2 size={14} className="absolute top-3 right-3 text-accent" />
                              )}
                            </motion.button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-soft mb-4">Select Difficulty</p>
                        <div className="grid grid-cols-3 gap-3">
                          {DIFFICULTIES.map(d => (
                            <button
                              key={d.id}
                              onClick={() => setSelectedDifficulty(d.id)}
                              className={cn(
                                'p-4 rounded-2xl border-2 transition-all text-center',
                                selectedDifficulty === d.id ? d.color : 'border-white/5 text-text-soft hover:border-white/20'
                              )}
                            >
                              <p className="font-black text-sm uppercase">{d.label}</p>
                              <p className="text-[9px] opacity-70 mt-0.5">{d.desc}</p>
                            </button>
                          ))}
                        </div>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                        onClick={handleFindMatch}
                        disabled={!selectedCategory}
                        className={cn(
                          'w-full py-5 rounded-[24px] font-black text-xs uppercase tracking-[0.3em] transition-all shadow-xl',
                          selectedCategory
                            ? 'bg-accent text-white shadow-accent/20 hover:shadow-accent/40'
                            : 'bg-white/5 text-text-soft cursor-not-allowed'
                        )}
                      >
                        <Crosshair size={16} className="inline-block mr-2 -mt-0.5" />
                        Find Match
                      </motion.button>
                    </motion.div>
                  )}

                  {/* SEARCHING: Animated queue screen */}
                  {matchState === 'searching' && (
                    <motion.div key="searching" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="relative z-10 text-center space-y-8 py-8">
                      {/* Radar animation */}
                      <div className="relative w-32 h-32 mx-auto">
                        <div className="absolute inset-0 rounded-full border-2 border-accent/20" />
                        <motion.div
                          className="absolute inset-0 rounded-full border-2 border-accent/60"
                          animate={{ scale: [1, 1.8, 1.8], opacity: [0.8, 0, 0] }}
                          transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
                        />
                        <motion.div
                          className="absolute inset-0 rounded-full border-2 border-accent/40"
                          animate={{ scale: [1, 1.5, 1.5], opacity: [0.6, 0, 0] }}
                          transition={{ duration: 2, repeat: Infinity, ease: 'easeOut', delay: 0.5 }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                          >
                            <Search size={32} className="text-accent" />
                          </motion.div>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.4em] text-accent animate-pulse">Scanning Battlefield...</p>
                        {queueInfo && (
                          <div className="mt-4 space-y-1">
                            <p className="text-2xl font-black">{queueInfo.category}</p>
                            <p className="text-text-soft text-[11px] uppercase tracking-widest">{queueInfo.difficulty} · Position #{queueInfo.position}</p>
                            <p className="text-text-soft text-[10px] mt-2 italic">Est. wait: ~{queueInfo.estimatedWait}s</p>
                            <div className="mt-3 px-4 py-2 rounded-xl bg-white/5 border border-white/5">
                              <p className="text-[10px] text-text-soft">
                                ⚡ No opponent found in <span className="text-accent font-black">10s</span>? You'll be matched with an <span className="text-yellow-400 font-black">AI opponent</span> automatically.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-3 justify-center">
                        <button
                          onClick={handleCancelMatch}
                          className="px-6 py-3 rounded-2xl border border-red-500/30 text-red-400 bg-red-500/5 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/10 transition-all"
                        >
                          <X size={14} className="inline-block mr-1.5 -mt-0.5" />Cancel
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* FOUND: Match found screen */}
                  {matchState === 'found' && matchResult && (
                    <motion.div key="found" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="relative z-10 text-center space-y-8 py-6">
                      <motion.div
                        animate={{ scale: [1, 1.1, 1], boxShadow: ['0 0 0px rgba(34,197,94,0)', '0 0 40px rgba(34,197,94,0.4)', '0 0 20px rgba(34,197,94,0.2)'] }}
                        transition={{ duration: 0.6 }}
                        className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-500/60 flex items-center justify-center"
                      >
                        <CheckCircle2 size={36} className="text-emerald-400" />
                      </motion.div>

                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400 mb-2">Match Found!</p>
                        <h2 className="text-xl font-black">{matchResult.quizTitle}</h2>
                        <p className="text-text-soft text-xs mt-1">{matchResult.category} · {matchResult.difficulty}</p>
                      </div>

                      {/* Players list */}
                      <div className="flex flex-wrap gap-2 justify-center">
                        {(matchResult.players || []).map((p: string, i: number) => (
                          <span key={i} className="px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-[11px] font-bold">
                            {p}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-center gap-3">
                        <div className="w-12 h-12 rounded-full border-4 border-accent/20 border-t-accent flex items-center justify-center text-2xl font-black animate-spin" style={{ animationDuration:'1s' }} />
                        <p className="text-text-soft text-sm">Entering arena in <span className="text-accent font-black">{countdown}s</span>...</p>
                      </div>

                      <div className="flex gap-3 justify-center">
                        <button onClick={() => router.push(`/play/live?pin=${matchResult.pin}`)}
                          className="px-8 py-3 rounded-2xl bg-accent text-white text-[10px] font-black uppercase tracking-widest hover:bg-accent/90 transition-all">
                          Enter Now <ArrowRight size={14} className="inline-block ml-1" />
                        </button>
                        <button onClick={handleRequeue}
                          className="px-5 py-3 rounded-2xl border border-white/10 text-text-soft text-[10px] font-black uppercase tracking-widest hover:border-white/20">
                          <RefreshCw size={14} className="inline-block mr-1" /> Requeue
                        </button>
                      </div>
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════
            TAB 2: LIVE ARENA
        ══════════════════════════════════════════ */}
        {activeTab === 'arena' && (
          <motion.div key="arena" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-8">
            {/* Header bar */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black uppercase italic">Live Arenas</h2>
                <p className="text-text-soft text-xs">{rooms.length} public rooms currently open</p>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Real-time
              </div>
            </div>

            {roomsLoading ? (
              /* Loading skeleton */
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="glass p-6 rounded-[28px] space-y-3 animate-pulse">
                    <div className="h-3 bg-white/5 rounded-full w-2/3" />
                    <div className="h-4 bg-white/5 rounded-full w-full" />
                    <div className="h-2 bg-white/5 rounded-full w-1/2" />
                  </div>
                ))}
              </div>
            ) : rooms.length === 0 ? (
              /* Empty state */
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <Radio size={48} className="text-text-soft opacity-20 mb-6" />
                <p className="font-black uppercase text-text-soft italic">No Active Arenas</p>
                <p className="text-xs text-text-soft mt-2 max-w-xs">No public rooms are currently open. Start a Quick Match to create one.</p>
                <button onClick={() => setActiveTab('quickmatch')}
                  className="mt-6 px-6 py-3 rounded-2xl bg-accent text-white text-[10px] font-black uppercase tracking-widest">
                  Find Quick Match
                </button>
              </div>
            ) : (
              /* Room list grouped by category */
              <div className="space-y-8">
                {Object.entries(roomsByCategory).map(([category, catRooms]) => (
                  <div key={category} className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black uppercase tracking-widest text-accent">{category}</span>
                      <div className="flex-1 h-px bg-white/5" />
                      <span className="text-[9px] text-text-soft">{catRooms.length} rooms</span>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {catRooms.map(room => {
                        const isFull = room.spotsLeft <= 0;
                        const fillPct = (room.playerCount / room.maxPlayers) * 100;
                        return (
                          <motion.div
                            key={room.pin}
                            layout
                            className={cn(
                              'glass p-6 rounded-[28px] border flex flex-col gap-4 transition-all',
                              isFull ? 'border-white/5 opacity-60' : 'border-white/5 hover:border-accent/30 hover:shadow-[0_0_20px_rgba(99,102,241,0.1)]'
                            )}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-black text-sm truncate">{room.title}</p>
                                <p className="text-[10px] text-text-soft mt-0.5">{room.category}</p>
                              </div>
                              <span className={cn(
                                'px-2 py-0.5 rounded-lg text-[8px] font-black uppercase border shrink-0',
                                isFull ? 'border-red-500/30 text-red-400 bg-red-500/5' : 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5'
                              )}>
                                {isFull ? 'FULL' : 'OPEN'}
                              </span>
                            </div>

                            {/* Player count bar */}
                            <div className="space-y-1.5">
                              <div className="flex justify-between text-[9px] font-black text-text-soft">
                                <span>{room.playerCount}/{room.maxPlayers} players</span>
                                <span>{room.spotsLeft} spots left</span>
                              </div>
                              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                  animate={{ width: `${fillPct}%` }}
                                  className={cn('h-full rounded-full', isFull ? 'bg-red-500' : 'bg-accent')}
                                />
                              </div>
                            </div>

                            <button
                              onClick={() => !isFull && handleJoinRoom(room.pin)}
                              disabled={isFull || joiningPin === room.pin}
                              className={cn(
                                'w-full py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2',
                                isFull ? 'bg-white/5 text-text-soft cursor-not-allowed' :
                                joiningPin === room.pin ? 'bg-accent/40 text-white animate-pulse' :
                                'bg-accent text-white hover:bg-accent/90 shadow-lg shadow-accent/20'
                              )}
                            >
                              {joiningPin === room.pin ? (
                                <><RefreshCw size={12} className="animate-spin" /> Joining...</>
                              ) : isFull ? (
                                <><Lock size={12} /> Room Full</>
                              ) : (
                                <>Join Arena <ChevronRight size={12} /></>
                              )}
                            </button>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ══════════════════════════════════════════
            TAB 3: PIN JOIN (preserved exactly)
        ══════════════════════════════════════════ */}
        {activeTab === 'pin' && (
          <motion.div key="pin" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="max-w-lg mx-auto space-y-6">
            <div className="glass p-8 rounded-[40px] border-white/10 space-y-8 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 hover:opacity-100 transition-all pointer-events-none" />

              <div className="flex flex-col items-center gap-2 text-center pb-2 border-b border-white/5">
                <Zap className="text-yellow-400" size={32} />
                <h3 className="text-xl font-black uppercase italic tracking-widest">Join by PIN</h3>
                <p className="text-[10px] text-text-soft font-black uppercase tracking-widest">Enter the 6-digit access code</p>
              </div>

              <div className="space-y-6 relative z-10">
                <input
                  type="text"
                  placeholder="000 000"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.toUpperCase())}
                  className="w-full bg-background/40 border-2 border-white/5 rounded-2xl py-6 text-center text-4xl font-black tracking-[0.3em] outline-none focus:border-accent/40 focus:bg-background transition-all placeholder:opacity-20 uppercase italic"
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Pilot Handle" placeholder="Gamer ID" value={joinName} onChange={(e) => setJoinName(e.target.value)} className="bg-background/20" />
                  <Input label="Theater Key" type="password" placeholder="Password (opt)" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-background/20" />
                </div>
                <button
                  onClick={handlePinJoin}
                  className="w-full py-5 rounded-[24px] bg-white text-black font-black text-xs uppercase tracking-[0.3em] hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-white/5"
                >
                  Infiltrate Arena
                </button>
              </div>
            </div>

            {/* Battle operations below */}
            <div className="space-y-4">
              <CollapsibleCard title="Ranked Arena" icon={Trophy} badge="Affects globalRating" className="border-accent-alt/30">
                <p className="text-[11px] text-text-soft mb-8 leading-relaxed italic border-l-2 border-accent-alt/20 pl-4">
                  High-stakes competitive mode. Strict anti-cheat and ELO scaling enabled.
                </p>
                <button onClick={() => router.push('/host')}
                  className="w-full py-4 rounded-2xl bg-accent-alt text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-accent-alt/20 hover:scale-[1.02] transition-all">
                  Initialize Ranked
                </button>
              </CollapsibleCard>
              <CollapsibleCard title="Friendly Skirmish" icon={Gamepad2} badge="Rating Protected" className="border-accent/30">
                <p className="text-[11px] text-text-soft mb-8 leading-relaxed italic border-l-2 border-accent/20 pl-4">
                  Low-stakes training. Perfect for testing new neural assets.
                </p>
                <button onClick={() => router.push('/host?friendly=true')}
                  className="w-full py-4 rounded-2xl bg-accent text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-accent/20 hover:scale-[1.02] transition-all">
                  Initialize Casual
                </button>
              </CollapsibleCard>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
