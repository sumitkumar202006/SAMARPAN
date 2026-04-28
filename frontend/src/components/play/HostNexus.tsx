'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Users, BarChart3, Settings, Play, ChevronRight, XCircle, Ban, Edit3, MessageSquare, Pause, Crown, Trophy, Medal } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { HostQuestionEditor } from './HostQuestionEditor';
import { useAudio } from '@/context/AudioContext';

interface HostNexusProps {
  quiz: any;
  socket: any;
  pin: string;
  user?: any; // host user data for proper name/avatar display
}

export const HostNexus: React.FC<HostNexusProps> = ({ quiz, socket, pin, user }) => {
  const [players, setPlayers] = useState<any>({});
  const [isPaused, setIsPaused] = useState(false);
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [stats, setStats] = useState<number[]>([0, 0, 0, 0]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [status, setStatus] = useState<'waiting' | 'running' | 'set_finished' | 'finished'>('waiting');
  const [timeLeft, setTimeLeft] = useState(30);
  const [timerMode, setTimerMode] = useState<'per-question' | 'total'>('per-question');
  const [sessionTimeLeft, setSessionTimeLeft] = useState<number | null>(null);
  const [tournamentInfo, setTournamentInfo] = useState<{ currentSetIndex: number, setsRemaining: number } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [localQuestions, setLocalQuestions] = useState(quiz.questions);
  const [isMounted, setIsMounted] = useState(false);
  const [liveLeaderboard, setLiveLeaderboard] = useState<any[]>([]);
  // HOST CONTROL: Track revealAnswers state for the toggle UI
  const [revealAnswers, setRevealAnswers] = useState(false);

  const hasEmittedHostJoin = useRef(false); // Prevent duplicate host_join on re-render

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Emit host_join exactly ONCE per pin+socket combo
  // Guards against duplicate joins from component re-mounts
  useEffect(() => {
    if (!socket || !isMounted || !pin || hasEmittedHostJoin.current) return;
    hasEmittedHostJoin.current = true;
    socket.emit('host_join', {
      pin,
      name: user?.name || 'Host',
      userId: user?.id || user?.userId || null,
      avatar: user?.avatar || null,
    });
  }, [socket, isMounted, pin, user]);

  const { playNavigate, playClick } = useAudio();

  useEffect(() => {
    if (!socket || !isMounted) return;

    socket.on('host_player_list_update', (data: any) => {
      setPlayers(data.players);
    });

    socket.on('stats_update', (data: any) => {
      if (data.stats) setStats(data.stats);
      if (data.leaderboard) setLiveLeaderboard(data.leaderboard);
    });

    socket.on('quiz_finished', (data: any) => {
      setStatus('finished');
      if (data.leaderboard) setLiveLeaderboard(data.leaderboard);
    });

    socket.on('timer_tick', (data: any) => {
      setTimeLeft(data.timeLeft);
    });

    socket.on('game_paused', () => setIsPaused(true));
    socket.on('game_resumed', () => setIsPaused(false));

    socket.on('game_started', (data: any) => {
      setStatus('running');
      if (data.timerMode) setTimerMode(data.timerMode);
    });

    socket.on('global_timer_tick', (data: { timeLeft: number }) => {
      setSessionTimeLeft(data.timeLeft);
    });

    socket.on('set_finished', (data: any) => {
      setStatus('set_finished');
      setTournamentInfo({ currentSetIndex: data.currentSetIndex, setsRemaining: data.setsRemaining });
    });

    socket.on('next_set_started', (data: any) => {
      setStatus('running');
      setLocalQuestions(data.quiz.questions);
      setCurrentQIndex(0);
      setTournamentInfo(prev => prev ? { ...prev, setsRemaining: prev.setsRemaining - 1 } : null);
    });

    socket.on('next_question', (data: any) => {
      setCurrentQIndex(data.index);
      setTimeLeft(data.timerSeconds);
      if (data.timerMode) setTimerMode(data.timerMode);
    });

    // HOST CONTROL: Sync revealAnswers from settings_updated (e.g. on reconnect)
    socket.on('settings_updated', (data: any) => {
      if (data.examSettings?.revealAnswers !== undefined) {
        setRevealAnswers(data.examSettings.revealAnswers);
      }
    });
    
    // Oversight: Live choice tracking
    socket.on('player_choice', (data: any) => {
      setPlayers((prev: any) => {
        if (!prev[data.playerId]) return prev;
        return {
          ...prev,
          [data.playerId]: {
            ...prev[data.playerId],
            optionIdx: data.optionIdx,
            answeredThisQ: true
          }
        };
      });
    });

    // Live leaderboard: update scores by name
    socket.on('leaderboard_update', (data: any) => {
      const lb: Array<{ name: string; score: number }> = data.leaderboard || [];
      setPlayers((prev: any) => {
        const updated = { ...prev };
        Object.entries(updated).forEach(([id, p]: any) => {
          const entry = lb.find(e => e.name === p.name);
          if (entry) updated[id] = { ...p, score: entry.score };
        });
        return updated;
      });
    });

    return () => {
      socket.off('host_player_list_update');
      socket.off('stats_update');
      socket.off('timer_tick');
      socket.off('game_paused');
      socket.off('game_resumed');
      socket.off('game_started');
      socket.off('next_question');
      socket.off('player_choice');
      socket.off('leaderboard_update');
      socket.off('quiz_finished');
      socket.off('settings_updated');
    };
  }, [socket, isMounted]);

  if (!isMounted) return null;

  const handleStart = () => {
    socket.emit('start_game', pin);
  };

  const handleNext = () => {
    socket.emit('host_next', pin);
  };

  const handlePause = () => {
    socket.emit(isPaused ? 'host_resume' : 'host_pause', pin);
  };

  const handleBroadcast = () => {
    if (!broadcastMsg.trim()) return;
    socket.emit('host_broadcast', { pin, message: broadcastMsg, type: 'info' });
    setBroadcastMsg('');
  };

  const handleKick = (playerId: string) => {
    socket.emit('host_kick', { pin, playerId });
  };

  const handleBan = (playerId: string, name: string) => {
    socket.emit('host_ban', { pin, playerId, name });
  };

  const handleManualPenalty = (playerId: string) => {
    socket.emit('host_reduce_score', { pin, playerId, amount: 100 });
  };

  const handleIssueWarning = (playerId: string) => {
    socket.emit('host_broadcast_to_player', { pin, playerId, message: "⚠️ ADMIN WARNING: Suspicious activity detected on your uplink.", type: 'warning' });
  };

  const handlePatch = (updatedQuestions: any[]) => {
    setLocalQuestions(updatedQuestions);
    socket.emit('host_patch_quiz', { pin, questions: updatedQuestions });
    setIsEditing(false);
  };

  // Prepare chart data
  const chartData = stats.map((val, i) => ({
    name: String.fromCharCode(65 + i),
    value: val
  }));

  const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444'];

  const playerList = Object.values(players).filter((p: any) => !p.isHost) as any[];
  const answeredCount = playerList.filter((p: any) => p.answeredThisQ).length;
  const leaderId = playerList.length > 0
    ? Object.entries(players)
        .filter(([, p]: any) => !p.isHost)
        .sort(([, a]: any, [, b]: any) => b.score - a.score)[0]?.[0]
    : null;

  return (
    <div className="flex flex-col gap-8 min-h-[80vh]">
      {/* Top Banner: Status & Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-6 glass p-8 rounded-[32px] border-accent/20">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-accent/20 flex items-center justify-center text-accent">
            <Shield size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight">Nexus Terminal</h1>
            <p className="text-text-soft text-sm font-medium">Uplink Active • <span className="text-white font-bold tracking-widest">{pin}</span></p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4 flex-1 lg:max-w-2xl">
          {status === 'running' && (
            <div className="flex items-center gap-2 w-full md:flex-1">
              <input 
                value={broadcastMsg}
                onChange={(e) => setBroadcastMsg(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleBroadcast()}
                placeholder="Send tactical broadcast..."
                className="flex-1 bg-background/50 border border-white/10 rounded-2xl px-6 py-3 text-sm focus:border-accent outline-none"
              />
              <Button onClick={handleBroadcast} className="px-6 h-[46px] rounded-2xl">
                <MessageSquare size={18} />
              </Button>
            </div>
          )}

          <div className="flex items-center gap-2 w-full md:w-auto">
            {status === 'waiting' ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(true)} className="flex-1 py-3 px-6 gap-2 border-white/10 rounded-2xl">
                  <Edit3 size={18} /> Edit
                </Button>
                <Button onClick={handleStart} className="flex-1 py-3 px-10 gap-2 shadow-lg rounded-2xl">
                  <Play size={18} /> Deploy
                </Button>
              </>
            ) : (
              <div className="flex items-center gap-2 w-full">
                <div className={cn(
                  "flex-1 glass px-6 py-3 rounded-2xl flex items-center justify-between min-w-[120px]",
                  isPaused && "border-accent/40"
                )}>
                  <span className="text-[10px] font-black uppercase tracking-widest text-text-soft">
                    {isPaused ? 'Halted' : (timerMode === 'per-question' ? 'Q-Timer' : 'Global')}
                  </span>
                  <span className={cn("text-xl font-black tabular-nums", (timeLeft < 10 || (sessionTimeLeft && sessionTimeLeft < 60)) && !isPaused ? "text-red-500 animate-pulse" : "text-white")}>
                    {isPaused ? '||' : (timerMode === 'per-question' ? `${timeLeft}s` : (sessionTimeLeft !== null ? `${Math.floor(sessionTimeLeft / 60)}:${(sessionTimeLeft % 60).toString().padStart(2, '0')}` : '--'))}
                  </span>
                </div>
                <Button onClick={handlePause} variant="outline" className="px-4 h-[48px] rounded-2xl border-white/10">
                  {isPaused ? <Play size={18} /> : <Pause size={18} />}
                </Button>
                {status === 'set_finished' ? (
                  <Button onClick={() => socket.emit('host_start_next_set', pin)} className="flex-1 py-3 px-6 gap-2 bg-accent-alt shadow-lg rounded-2xl animate-pulse">
                    <Play size={18} /> Start Next Set ({tournamentInfo?.setsRemaining} Left)
                  </Button>
                ) : (
                  <Button onClick={handleNext} variant="outline" className="px-6 h-[48px] rounded-2xl border-accent/30 gap-2">
                    Next <ChevronRight size={18} />
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left: Player Surveillance */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="glass p-8 rounded-[32px] flex-1">
            <div className="flex items-center justify-between mb-8">
              <h3 className="flex items-center gap-3 font-bold text-lg italic">
                <Users size={20} className="text-accent" />
                Player Monitoring ({playerList.length})
              </h3>
              <div className="flex items-center gap-3">
                {/* Answered counter */}
                {status === 'running' && (
                  <span className={cn(
                    'text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border',
                    answeredCount === playerList.length && playerList.length > 0
                      ? 'text-accent-alt border-accent-alt/30 bg-accent-alt/10'
                      : 'text-text-soft border-white/10 bg-white/5'
                  )}>
                    {answeredCount}/{playerList.length} answered
                  </span>
                )}
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-soft">
                  <span className="w-2 h-2 rounded-full bg-accent-alt animate-pulse" /> Live Data Stream
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {Object.entries(players).filter(([, p]: any) => !p.isHost).map(([id, player]: any) => {
                const isLeader = id === leaderId && status === 'running' && player.score > 0;
                return (
                <motion.div 
                  layout
                  key={id}
                  className={cn(
                    "bg-background/40 border p-4 rounded-2xl flex items-center justify-between group transition-all",
                    isLeader ? "border-yellow-400/40 bg-yellow-400/5 shadow-[0_0_16px_rgba(250,204,21,0.15)]" :
                    player.ipMatch ? "border-amber-500/30 bg-amber-500/5 shadow-[0_0_15px_rgba(251,191,36,0.1)]" : "border-white/5 hover:border-accent/30"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center font-black relative",
                      isLeader ? "bg-yellow-400/20 text-yellow-400" :
                      player.answeredThisQ ? "bg-accent-alt/20 text-accent-alt" : "bg-white/5 text-text-soft"
                    )}>
                      {isLeader ? <Crown size={16} /> : player.name.charAt(0).toUpperCase()}
                      {player.strikeCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-[8px] flex items-center justify-center text-white border-2 border-background animate-pulse">
                          {player.strikeCount}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm">{player.name}</p>
                        {isLeader && <span className="text-[7px] px-1 bg-yellow-400/20 text-yellow-400 border border-yellow-400/20 rounded font-black tracking-tighter">LEADER</span>}
                        {player.ipMatch && <span className="text-[7px] px-1 bg-amber-500/20 text-amber-500 border border-amber-500/20 rounded font-black tracking-tighter">SAME IP</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <motion.span
                          key={player.score}
                          initial={{ scale: 1.3, color: '#22c55e' }}
                          animate={{ scale: 1, color: '#6366f1' }}
                          transition={{ duration: 0.4 }}
                          className="text-[10px] font-bold"
                        >
                          {player.score} PTS
                        </motion.span>
                        {player.answeredThisQ && (
                          <motion.span 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-white/60 font-black"
                          >
                            SELECT: {String.fromCharCode(65 + player.optionIdx)}
                          </motion.span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleIssueWarning(id)}
                      className="p-1.5 rounded-lg hover:bg-amber-500/10 text-amber-400/60 hover:text-amber-400"
                      title="Issue Direct Warning"
                    >
                      <Shield size={14} />
                    </button>
                    <button 
                      onClick={() => handleManualPenalty(id)}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400/60 hover:text-red-400 font-black text-[10px]"
                      title="Deduct 100 Points"
                    >
                      -100
                    </button>
                    <button 
                      onClick={() => handleKick(id)}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500/60 hover:text-red-500"
                      title="Kick Player"
                    >
                      <XCircle size={14} />
                    </button>
                    <button 
                      onClick={() => handleBan(id, player.name)}
                      className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-500 transition-all font-bold"
                      title="Ban Permanently"
                    >
                      <Ban size={14} />
                    </button>
                  </div>
                </motion.div>
                );
              })}
              {playerList.length === 0 && (
                <div className="sm:col-span-2 py-12 text-center text-text-soft border-2 border-dashed border-white/5 rounded-[32px]">
                  <p className="text-sm italic font-medium">Waiting for players to enter the terminal...</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="glass p-8 rounded-[32px] border-white/5 bg-accent/5">
             <div className="flex items-center justify-between mb-4">
               <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">Security Feed logs</h4>
               <span className="text-[10px] text-text-soft font-mono uppercase italic">Privileged Access Level: HOST</span>
             </div>
             <div className="space-y-2 max-h-[150px] overflow-y-auto custom-scrollbar">
                {Object.values(players).filter((p:any)=>!p.isHost && (p.strikeCount > 0 || p.ipMatch)).map((p:any, i) => (
                  <div key={i} className="flex items-center justify-between text-[11px] font-medium py-1.5 border-b border-white/5 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white">{p.name}</span>
                      <span className="text-text-soft opacity-50 px-1.5 py-0.5 rounded bg-white/5 font-mono text-[9px]">{p.ip || '0.0.0.0'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {p.strikeCount > 0 && <span className="text-red-500 font-bold uppercase tracking-tighter">{p.strikeCount} STRIKES</span>}
                      {p.ipMatch && <span className="text-amber-500 font-bold uppercase tracking-tighter">DUPLICATE UPLINK</span>}
                    </div>
                  </div>
                ))}
                {Object.values(players).filter((p:any)=>!p.isHost && (p.strikeCount > 0 || p.ipMatch)).length === 0 && (
                  <p className="text-[10px] text-text-soft italic">No active integrity violations detected.</p>
                )}
             </div>
          </div>

          {/* Question Preview & Stats */}
          {status === 'running' && (
            <div className="glass p-8 rounded-[32px] border-white/5">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-accent mb-2">Current Activity</h4>
              <h3 className="text-xl font-bold mb-6 italic">“{quiz.questions[currentQIndex].question}”</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {quiz.questions[currentQIndex].options.map((opt: string, i: number) => (
                  <div key={i} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-[10px] font-black opacity-50 uppercase">
                      <span>Option {String.fromCharCode(65 + i)}</span>
                      <span>{stats[i] || 0}</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(stats[i] / (Object.values(players).filter((p:any)=>!p.isHost).length || 1)) * 100}%` }}
                        className="h-full bg-accent"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Real-time Analytics Dashboard */}
        <div className="flex flex-col gap-8">
          <div className="glass p-8 rounded-[32px] border-white/5 overflow-hidden relative">
            <h3 className="flex items-center gap-3 font-bold text-lg mb-8">
              <BarChart3 size={20} className="text-accent-alt" />
              Live Distribution
            </h3>
            
            <div className="h-[250px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                    <Tooltip 
                      cursor={{fill: 'rgba(255,255,255,0.05)'}}
                      contentStyle={{backgroundColor: '#0b1120', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px'}}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
               </ResponsiveContainer>
            </div>
          </div>

          <div className="glass p-8 rounded-[32px] border-white/5 flex-1">
             <div className="flex items-center justify-between mb-8">
                <h3 className="flex items-center gap-3 font-bold text-lg">
                  <Settings size={20} className="text-text-soft" />
                  Arena Config
                </h3>
             </div>
             
             <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                   <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase text-text-soft">Mode</span>
                      <span className="font-bold text-sm">Rapid Fire</span>
                   </div>
                   <Edit3 size={16} className="text-text-soft cursor-not-allowed opacity-50" />
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                   <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase text-text-soft">Rated</span>
                      <span className="font-bold text-sm text-accent-alt font-mono">ENFORCED</span>
                   </div>
                </div>

                {/* HOST CONTROL: Reveal Answers Toggle */}
                <div className={cn(
                  "p-4 rounded-2xl border flex items-center justify-between transition-all cursor-pointer",
                  revealAnswers
                    ? "bg-[#00D4B4]/10 border-[#00D4B4]/30"
                    : "bg-white/5 border-white/5 hover:border-white/10"
                )} onClick={() => {
                  const next = !revealAnswers;
                  setRevealAnswers(next);
                  socket.emit('host_toggle_reveal', { pin, revealAnswers: next });
                  playClick();
                }}>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase text-text-soft">Reveal Answers</span>
                    <span className={cn("font-bold text-sm", revealAnswers ? "text-[#00D4B4]" : "text-text-soft")}>
                      {revealAnswers ? 'After Each Question' : 'End of Quiz Only'}
                    </span>
                  </div>
                  {/* Toggle pill */}
                  <div className={cn(
                    "w-12 h-6 rounded-full transition-all relative flex items-center",
                    revealAnswers ? "bg-[#00D4B4]" : "bg-white/10"
                  )}>
                    <motion.div
                      animate={{ x: revealAnswers ? 24 : 2 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className="w-5 h-5 bg-white rounded-full shadow absolute"
                    />
                  </div>
                </div>

                {status === 'waiting' && (
                  <Button variant="ghost" className="w-full text-accent font-bold gap-2 hover:bg-accent/10" onClick={() => setIsEditing(true)}>
                    <Edit3 size={16} /> Open Content Forge
                  </Button>
                )}
                <div className="pt-4 mt-4 border-t border-white/5">
                   <p className="text-[10px] text-text-soft leading-relaxed italic">
                     Host oversight is active. Player identity verified via cryptographic terminal tokens. Standard arena protocols are in effect.
                   </p>
                </div>
             </div>
          </div>

          {/* Live Leaderboard Panel */}
          {(status === 'running' || status === 'finished') && liveLeaderboard.length > 0 && (
            <div className="glass p-6 rounded-[32px] border-white/5">
              <h3 className="flex items-center gap-3 font-bold text-base mb-5">
                <Trophy size={18} className="text-yellow-400" />
                Live Rankings
              </h3>
              <div className="space-y-2">
                {liveLeaderboard.slice(0, 6).map((p: any, i: number) => (
                  <motion.div
                    key={p.name}
                    layout
                    className={cn(
                      "flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm",
                      i === 0 ? "border-yellow-400/30 bg-yellow-400/5" : "border-white/5 bg-white/[0.02]"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "w-6 h-6 rounded-lg flex items-center justify-center font-black text-[10px]",
                        i === 0 ? "bg-yellow-400 text-black" : "bg-white/5 text-text-soft"
                      )}>
                        {i === 0 ? '👑' : `#${i+1}`}
                      </span>
                      <span className="font-bold truncate max-w-[100px]">{p.name}</span>
                    </div>
                    <motion.span
                      key={p.score}
                      initial={{ scale: 1.4, color: '#22c55e' }}
                      animate={{ scale: 1, color: '#6366f1' }}
                      className="font-black tabular-nums text-accent"
                    >
                      {p.score}
                    </motion.span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Finished State Banner */}
          {status === 'finished' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass p-6 rounded-[32px] border-[#00D4B4]/30 bg-[#00D4B4]/5 text-center"
            >
              <Medal className="mx-auto text-yellow-400 mb-3" size={32} />
              <p className="font-black text-base uppercase tracking-widest text-white">Arena Complete</p>
              <p className="text-xs text-text-soft mt-1">Results have been broadcast to all players.</p>
            </motion.div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isEditing && (
          <HostQuestionEditor 
            questions={localQuestions} 
            onSave={handlePatch} 
            onClose={() => setIsEditing(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};
