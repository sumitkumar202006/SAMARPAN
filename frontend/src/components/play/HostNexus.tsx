'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Users, BarChart3, Settings, Play, ChevronRight, XCircle, Ban, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { HostQuestionEditor } from './HostQuestionEditor';

interface HostNexusProps {
  quiz: any;
  socket: any;
  pin: string;
}

export const HostNexus: React.FC<HostNexusProps> = ({ quiz, socket, pin }) => {
  const [players, setPlayers] = useState<any>({});
  const [stats, setStats] = useState<number[]>([0, 0, 0, 0]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [status, setStatus] = useState<'waiting' | 'running' | 'finished'>('waiting');
  const [timeLeft, setTimeLeft] = useState(30);
  const [isEditing, setIsEditing] = useState(false);
  const [localQuestions, setLocalQuestions] = useState(quiz.questions);

  useEffect(() => {
    if (!socket) return;

    socket.on('player_list_update', (data: any) => {
      setPlayers(data.players);
    });

    socket.on('stats_update', (data: any) => {
      if (data.stats) setStats(data.stats);
    });

    socket.on('timer_tick', (data: any) => {
      setTimeLeft(data.timeLeft);
    });

    socket.on('game_started', () => {
      setStatus('running');
    });

    socket.on('next_question', (data: any) => {
      setCurrentQIndex(data.index);
      setTimeLeft(data.timerSeconds);
    });
    
    // Oversight: Live choice tracking
    socket.on('player_choice', (data: any) => {
      setPlayers((prev: any) => ({
        ...prev,
        [data.playerId]: {
          ...prev[data.playerId],
          optionIdx: data.optionIdx,
          answeredThisQ: true
        }
      }));
    });

    return () => {
      socket.off('player_list_update');
      socket.off('stats_update');
      socket.off('timer_tick');
      socket.off('game_started');
      socket.off('next_question');
      socket.off('player_choice');
    };
  }, [socket]);

  const handleStart = () => {
    socket.emit('start_game', pin);
  };

  const handleNext = () => {
    socket.emit('host_next', pin);
  };

  const handleKick = (playerId: string) => {
    socket.emit('host_kick', { pin, playerId });
  };

  const handleBan = (playerId: string, name: string) => {
    socket.emit('host_ban', { pin, playerId, name });
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

  return (
    <div className="flex flex-col gap-8 min-h-[80vh]">
      {/* Top Banner: Status & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 glass p-8 rounded-[32px] border-accent/20">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-accent/20 flex items-center justify-center text-accent">
            <Shield size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight">Host Nexus</h1>
            <p className="text-text-soft text-sm font-medium">Session Room: <span className="text-white font-bold tracking-widest">{pin}</span></p>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          {status === 'waiting' && (
            <Button variant="outline" onClick={() => setIsEditing(true)} className="flex-1 md:flex-none py-4 px-6 gap-2 border-white/10">
              <Edit3 size={18} />
              Edit Content
            </Button>
          )}

          {status === 'waiting' ? (
            <Button onClick={handleStart} className="flex-1 md:flex-none py-4 px-10 gap-2 shadow-[0_0_20px_rgba(99,102,241,0.3)]">
              <Play size={18} />
              Deploy Arena
            </Button>
          ) : (
            <div className="flex items-center gap-4 w-full">
              <div className="flex-1 glass px-6 py-3 rounded-2xl flex items-center justify-between min-w-[150px]">
                <span className="text-[10px] font-black uppercase tracking-widest text-text-soft">Timer</span>
                <span className={cn("text-2xl font-black tabular-nums", timeLeft < 10 ? "text-red-500 animate-pulse" : "text-white")}>
                  {timeLeft}s
                </span>
              </div>
              <Button onClick={handleNext} variant="outline" className="flex-1 md:flex-none py-4 px-8 gap-2 border-accent/30">
                Next <ChevronRight size={18} />
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left: Player Surveillance */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="glass p-8 rounded-[32px] flex-1">
            <div className="flex items-center justify-between mb-8">
              <h3 className="flex items-center gap-3 font-bold text-lg italic">
                <Users size={20} className="text-accent" />
                Player Monitoring ({(Object.values(players).filter((p:any) => !p.isHost)).length})
              </h3>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-soft">
                <span className="w-2 h-2 rounded-full bg-accent-alt animate-pulse" /> Live Data Stream
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {Object.entries(players).filter(([, p]: any) => !p.isHost).map(([id, player]: any) => (
                <motion.div 
                  layout
                  key={id}
                  className="bg-background/40 border border-white/5 p-4 rounded-2xl flex items-center justify-between group hover:border-accent/30 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center font-black",
                      player.answeredThisQ ? "bg-accent-alt/20 text-accent-alt" : "bg-white/5 text-text-soft"
                    )}>
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{player.name}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-accent">{player.score} PTS</span>
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
                      onClick={() => handleKick(id)}
                      className="p-2 rounded-lg hover:bg-red-500/10 text-red-400/60 hover:text-red-400 transition-all"
                      title="Kick Player"
                    >
                      <XCircle size={16} />
                    </button>
                    <button 
                      onClick={() => handleBan(id, player.name)}
                      className="p-2 rounded-lg hover:bg-red-500/20 text-red-500 transition-all font-bold"
                      title="Ban Permanently"
                    >
                      <Ban size={16} />
                    </button>
                  </div>
                </motion.div>
              ))}
              {Object.values(players).filter((p:any)=>!p.isHost).length === 0 && (
                <div className="sm:col-span-2 py-12 text-center text-text-soft border-2 border-dashed border-white/5 rounded-[32px]">
                  <p className="text-sm italic font-medium">Waiting for players to enter the terminal...</p>
                </div>
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
