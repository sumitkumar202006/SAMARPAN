'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, Users, Zap, Play, Pause, FastForward, 
  MessageSquare, Ban, UserMinus, AlertTriangle, 
  Activity, BarChart3, Clock, Trophy 
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useSocket } from '@/context/SocketContext';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

function LiveDashboardContent() {
  const { pin } = useParams();
  const router = useRouter();
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();
  
  const [session, setSession] = useState<any>(null);
  const [players, setPlayers] = useState<any>({});
  const [stats, setStats] = useState<number[]>([0, 0, 0, 0]);
  const [status, setStatus] = useState<'waiting' | 'running' | 'paused' | 'finished'>('running');
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [broadcastText, setBroadcastText] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  // Socket Listeners
  useEffect(() => {
    if (!isConnected || !socket) return;

    socket.emit('host_join', { pin });

    socket.on('game_started', (data: any) => {
      setSession(data.quiz);
      setStatus('running');
    });

    socket.on('player_list_update', (data: any) => {
      setPlayers(data.players);
    });

    socket.on('stats_update', (data: any) => {
      if (data.stats) setStats(data.stats);
    });

    socket.on('timer_tick', (data: any) => {
      setTimeLeft(data.timeLeft);
    });

    socket.on('next_question', (data: any) => {
      setCurrentQ(data.index);
      setTimeLeft(data.timerSeconds);
    });

    socket.on('game_paused', () => setStatus('paused'));
    socket.on('game_resumed', () => setStatus('running'));

    socket.on('quiz_finished', () => {
      setStatus('finished');
      router.push(`/host/results/${pin}`);
    });

    // Real-time Oversight: Choice Tracking
    socket.on('player_choice', (data: any) => {
      setPlayers((prev: any) => {
        const existing = prev[data.playerId] || {};
        return {
          ...prev,
          [data.playerId]: {
            ...existing,
            ...data,
            name: data.name || existing.name,
            optionIdx: data.optionIdx,
            answeredThisQ: true,
            lastResponseTime: data.timeTaken
          }
        };
      });
    });

    return () => {
      socket.off('game_started');
      socket.off('player_list_update');
      socket.off('stats_update');
      socket.off('timer_tick');
      socket.off('next_question');
      socket.off('game_paused');
      socket.off('game_resumed');
      socket.off('quiz_finished');
      socket.off('player_choice');
    };
  }, [isConnected, socket, pin, router]);

  const activePlayers = useMemo(() => 
    Object.values(players).filter((p: any) => !p.isHost), 
  [players]);

  const suspiciousPlayers = useMemo(() => 
    activePlayers.filter((p: any) => p.isSuspicious), 
  [activePlayers]);

  const avgSpeed = useMemo(() => {
    const answered = activePlayers.filter((p: any) => p.answeredThisQ);
    if (!answered.length) return 0;
    return (answered.reduce((acc: number, p: any) => acc + (p.lastResponseTime || 0), 0) / answered.length).toFixed(1);
  }, [activePlayers]);

  // Actions
  const handlePause = () => socket.emit('host_pause', pin);
  const handleResume = () => socket.emit('host_resume', pin);
  const handleSkip = () => socket.emit('host_next', pin);
  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastText.trim()) return;
    socket.emit('host_broadcast', { pin, message: broadcastText, type: 'info' });
    setBroadcastText('');
  };

  if (!isMounted) return null;

  const chartData = stats.map((val, i) => ({
    name: String.fromCharCode(65 + i),
    value: val
  }));

  const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444'];

  return (
    <div className="min-h-screen bg-[#05060f] text-white p-4 lg:p-8 font-sans selection:bg-accent selection:text-white">
      {/* Header Section */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-[22px] bg-gradient-to-br from-accent to-accent-alt p-[1px]">
            <div className="w-full h-full rounded-[21px] bg-[#05060f] flex items-center justify-center text-accent">
              <Shield size={32} strokeWidth={2.5} />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight italic">Host Command Center</h1>
            <div className="flex items-center gap-3">
              <span className="text-accent font-mono font-bold tracking-[0.2em]">{pin}</span>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <span className={cn(
                "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md",
                status === 'running' ? "bg-accent-alt/10 text-accent-alt" : "bg-orange-500/10 text-orange-400"
              )}>
                {status}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex-1 md:w-48 glass px-6 py-4 rounded-2xl flex items-center justify-between border-white/5 bg-white/[0.02]">
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-widest text-text-soft">Timer</span>
              <span className={cn("text-2xl font-black tabular-nums leading-none", timeLeft < 10 ? "text-red-500 animate-pulse" : "text-white")}>
                {timeLeft}s
              </span>
            </div>
            <Clock size={20} className={cn(timeLeft < 10 ? "text-red-500" : "text-text-soft")} />
          </div>

          <div className="flex gap-2">
            {status === 'paused' ? (
              <Button onClick={handleResume} className="h-14 px-8 bg-accent-alt hover:bg-emerald-600 shadow-lg shadow-accent-alt/20">
                <Play size={20} fill="currentColor" />
              </Button>
            ) : (
              <Button onClick={handlePause} variant="outline" className="h-14 px-8 border-white/10 hover:bg-white/5">
                <Pause size={20} fill="currentColor" />
              </Button>
            )}
            <Button onClick={handleSkip} variant="outline" className="h-14 px-8 border-white/10 hover:bg-white/5" title="Skip Question">
              <FastForward size={20} fill="currentColor" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid lg:grid-cols-[1fr_420px] gap-8">
        {/* Left Column: Live Traffic & Metrics */}
        <div className="space-y-8">
          {/* Real-time Cards */}
          <section className="grid sm:grid-cols-3 gap-4">
            <div className="glass p-6 rounded-[28px] border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 rounded-xl bg-accent/10 text-accent"><Users size={20} /></div>
                <span className="text-[10px] font-bold text-text-soft uppercase tracking-widest">Players</span>
              </div>
              <p className="text-3xl font-black tabular-nums">{activePlayers.length}</p>
              <div className="mt-2 flex items-center gap-1 text-[10px] text-accent-alt font-bold">
                <Zap size={10} fill="currentColor" /> {activePlayers.filter((p: any) => p.answeredThisQ).length} Answering Live
              </div>
            </div>

            <div className="glass p-6 rounded-[28px] border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400"><Activity size={20} /></div>
                <span className="text-[10px] font-bold text-text-soft uppercase tracking-widest">Avg Speed</span>
              </div>
              <p className="text-3xl font-black tabular-nums">{avgSpeed}s</p>
              <p className="mt-2 text-[10px] text-text-soft font-medium uppercase tracking-tighter">Response Latency</p>
            </div>

            <div className="glass p-6 rounded-[28px] border-red-500/10 bg-gradient-to-br from-red-500/[0.03] to-transparent relative overflow-hidden">
               <div className="flex justify-between items-start mb-4">
                <div className="p-2 rounded-xl bg-red-500/10 text-red-500"><AlertTriangle size={20} /></div>
                <span className="text-[10px] font-bold text-text-soft uppercase tracking-widest">Threats</span>
              </div>
              <p className={cn("text-3xl font-black tabular-nums", suspiciousPlayers.length > 0 ? "text-red-500" : "text-white")}>
                {suspiciousPlayers.length}
              </p>
              <p className="mt-2 text-[10px] text-text-soft font-medium uppercase">Active Flags</p>
              {suspiciousPlayers.length > 0 && <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/20 blur-2xl rounded-full translate-x-1/2 -translate-y-1/2" />}
            </div>
          </section>

          {/* Player surveillance grid */}
          <section className="glass rounded-[40px] border-white/5 overflow-hidden">
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
              <h3 className="flex items-center gap-3 font-bold text-lg italic">
                <Activity size={20} className="text-accent" />
                Live Feed
              </h3>
              <div className="flex items-center gap-3 font-black text-[10px] uppercase tracking-widest text-text-soft">
                <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 2, repeat: Infinity }} className="w-1.5 h-1.5 rounded-full bg-accent-alt" />
                Encrypted Data Stream
              </div>
            </div>

            <div className="p-8 max-h-[500px] overflow-y-auto custom-scrollbar bg-[#05060f]/50">
              <div className="grid sm:grid-cols-2 gap-4">
                <AnimatePresence mode="popLayout">
                  {activePlayers.sort((a: any, b: any) => b.score - a.score).map((player: any, i) => (
                    <motion.div
                      layout
                      key={player.name}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "group p-4 rounded-[22px] border border-white/5 transition-all hover:bg-white/[0.03]",
                        player.isSuspicious && "border-red-500/30 bg-red-500/[0.02]"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-12 h-12 rounded-[18px] flex items-center justify-center font-black text-lg",
                            player.answeredThisQ ? "bg-accent-alt/20 text-accent-alt" : "bg-white/5 text-text-soft"
                          )}>
                            {player.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm tracking-tight">{player.name}</span>
                              {player.isSuspicious && <AlertTriangle size={12} className="text-red-500 animate-bounce" />}
                            </div>
                            <div className="flex items-center gap-3 text-[10px] font-black uppercase text-text-soft">
                              <span className="text-accent">{player.score} PTS</span>
                              {player.answeredThisQ && <span className="text-accent-alt">ANS: {String.fromCharCode(65 + player.optionIdx)}</span>}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button className="p-2 rounded-lg hover:bg-red-500/10 text-red-400 transition-all shadow-sm" title="Kick Player">
                              <UserMinus size={16} />
                           </button>
                           <button className="p-2 rounded-lg hover:bg-red-500/20 text-red-500 transition-all shadow-sm" title="Ban ID">
                              <Ban size={16} />
                           </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {activePlayers.length === 0 && (
                  <div className="col-span-full py-20 text-center text-text-soft border-2 border-dashed border-white/5 rounded-[40px] italic font-medium opacity-30">
                    Host oversight active. Awaiting player decryption...
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Dynamic Analysis & Controls */}
        <div className="space-y-8">
          {/* Distribution Chart */}
          <section className="glass rounded-[40px] border-white/5 overflow-hidden bg-white/[0.01]">
             <div className="p-8 border-b border-white/5 bg-white/[0.01]">
                <h3 className="flex items-center gap-3 font-bold text-lg italic uppercase tracking-tighter">
                  <BarChart3 size={20} className="text-accent-alt font-black" />
                  Live Choice Delta
                </h3>
             </div>
             <div className="p-8">
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12, fontWeight: 'bold'}} />
                      <Tooltip 
                        cursor={{fill: 'rgba(255,255,255,0.03)'}}
                        contentStyle={{backgroundColor: '#0a0a0f', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', fontWeight: 'bold'}}
                      />
                      <Bar dataKey="value" radius={[8, 8, 2, 2]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="mt-6 grid grid-cols-4 gap-2">
                   {stats.map((val, i) => (
                     <div key={i} className="text-center">
                        <p className="text-[10px] font-black text-text-soft opacity-50 mb-1">{String.fromCharCode(65+i)}</p>
                        <p className="font-bold text-lg">{val}</p>
                     </div>
                   ))}
                </div>
             </div>
          </section>

          {/* Broadcast Panel */}
          <section className="glass p-8 rounded-[40px] border-white/5 bg-gradient-to-tr from-accent/5 to-transparent">
             <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-accent/20 text-accent"><MessageSquare size={18} /></div>
                <h3 className="font-bold text-lg">Broadcast Node</h3>
             </div>
             
             <form onSubmit={handleBroadcast} className="space-y-4">
                <div className="relative">
                  <Input 
                    placeholder="Blast message to players..." 
                    value={broadcastText}
                    onChange={(e) => setBroadcastText(e.target.value)}
                    className="bg-black/20 border-white/10 h-14 pl-5 rounded-2xl focus:border-accent"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Button type="submit" size="sm" className="rounded-xl h-10 px-4">Transmit</Button>
                  </div>
                </div>
                <p className="text-[10px] text-text-soft italic text-center">Standard global broadcast protocols apply. Visual overlays will trigger immediately.</p>
             </form>
          </section>
        </div>
      </main>
    </div>
  );
}

export default function LiveDashboardPage() {
  return (
    <Suspense fallback={
       <div className="min-h-screen bg-[#05060f] flex flex-col items-center justify-center gap-6">
          <div className="w-16 h-16 rounded-full border-4 border-accent border-t-transparent animate-spin" />
          <p className="font-bold uppercase tracking-widest text-text-soft animate-pulse">Syncing Host Terminal...</p>
       </div>
    }>
      <LiveDashboardContent />
    </Suspense>
  );
}
