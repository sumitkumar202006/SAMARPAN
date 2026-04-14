'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Shield, Zap, X, Play } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useSocket } from '@/context/SocketContext';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import api from '@/lib/axios';

interface Player {
  name: string;
  isHost: boolean;
  team?: string;
}

function LobbyContent() {
  const { pin } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();
  
  const [players, setPlayers] = useState<Record<string, Player>>({});
  const [isHost, setIsHost] = useState(false);
  const [battleType, setBattleType] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<'Team A' | 'Team B' | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isConnected) return;

    const name = searchParams.get('name') || user?.name || 'Guest';
    const password = searchParams.get('password');
    const role = searchParams.get('role'); // 'host' or 'player'

    const fetchSession = async () => {
      try {
        const res = await api.get(`/api/host/session/${pin}`);
        setBattleType(res.data.battleType || null);
      } catch (err) {
        console.warn("Failed to fetch session type");
      }
    };
    fetchSession();

    if (role === 'host') {
      setIsHost(true);
      socket.emit('host_join', { pin, password });
    } else {
      socket.emit('join_room', { 
        pin, 
        name, 
        password, 
        userId: user?.userId || user?.email, 
        email: user?.email,
        team: selectedTeam 
      });
    }

    socket.on('player_list_update', (data) => {
      setPlayers(data.players);
    });

    socket.on('join_error', (data) => {
      setError(data.message);
      // Redirect back after a delay
      setTimeout(() => router.push('/battles'), 3000);
    });

    socket.on('kicked', (data) => {
      alert(data.message || 'You were removed from the room.');
      router.push('/dashboard');
    });

    socket.on('host_left', () => {
      alert('Host ended the session.');
      router.push('/dashboard');
    });

    socket.on('game_started', (data) => {
      // Navigate to the correct destination
      if (role === 'host') {
        router.push(`/host/live/${pin}`);
      } else {
        router.push(`/play/live?pin=${pin}`);
      }
    });

    return () => {
      socket.off('player_list_update');
      socket.off('join_error');
      socket.off('kicked');
      socket.off('host_left');
      socket.off('game_started');
    };
  }, [isConnected, pin, socket, user, router, searchParams, selectedTeam]);

  const handlePickTeam = (team: 'Team A' | 'Team B') => {
    setSelectedTeam(team);
    // Real-time update for others to see
    socket.emit('join_room', { 
      pin, 
      name: searchParams.get('name') || user?.name || 'Guest', 
      userId: user?.userId || user?.email,
      email: user?.email,
      team 
    });
  };

  const handleStartGame = () => {
    socket.emit('start_game', pin);
  };

  const handleCancel = () => {
    if (isHost) {
      if (confirm('End this session for everyone?')) {
        socket.emit('host_cancel', pin);
        router.push('/dashboard');
      }
    } else {
      router.push('/dashboard');
    }
  };

  const playerCount = Object.values(players).filter(p => !p.isHost).length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 lg:py-20">
      <div className="flex flex-col items-center text-center gap-6 mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-soft border border-accent/30 text-accent font-bold text-xs uppercase tracking-widest animate-pulse">
          Live Session Arena
        </div>
        
        <h1 className="text-4xl lg:text-6xl font-black tracking-tight mb-2">
          {isHost ? 'Game Lobby' : 'Waiting Room'}
        </h1>
        
        <div className="flex flex-col items-center gap-2">
          <p className="text-text-soft text-sm uppercase font-bold tracking-[0.3em]">Game PIN</p>
          <div className="text-6xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-tr from-accent to-accent-alt drop-shadow-[0_0_30px_rgba(99,102,241,0.5)]">
            {pin}
          </div>
        </div>
      </div>

      {error ? (
        <div className="glass p-8 rounded-3xl text-center border-red-500/50 bg-red-500/10">
          <p className="text-red-400 font-bold mb-4">❌ {error}</p>
          <p className="text-sm text-text-soft">Redirecting you back...</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[1fr_300px] gap-8">
          {/* Player Grid */}
          <div className="glass p-8 rounded-[32px] min-h-[400px]">
            <div className="flex justify-between items-center mb-8">
              <h3 className="flex items-center gap-3 font-bold text-lg">
                <Users className="text-accent" size={20} />
                Players Joined
              </h3>
              <span className="px-3 py-1 rounded-full bg-bg-soft font-bold text-sm">{playerCount}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              <AnimatePresence>
                {Object.entries(players).map(([id, p]) => {
                  if (p.isHost) return null;
                  return (
                    <motion.div
                      key={id}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="glass p-4 rounded-2xl flex flex-col items-center justify-center gap-2 text-center group relative overflow-hidden"
                    >
                      <div className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-lg relative",
                        p.team === 'Team A' ? "bg-blue-500 shadow-blue-500/20" : 
                        p.team === 'Team B' ? "bg-red-500 shadow-red-500/20" :
                        "bg-gradient-to-tr from-accent to-accent-alt"
                      )}>
                        {p.name.charAt(0).toUpperCase()}
                        {p.team && (
                          <div className={cn(
                            "absolute -top-1 -right-1 w-4 h-4 rounded-full border border-white flex items-center justify-center text-[8px] font-black",
                            p.team === 'Team A' ? "bg-blue-600" : "bg-red-600"
                          )}>
                            {p.team === 'Team A' ? 'A' : 'B'}
                          </div>
                        )}
                      </div>
                      <span className="text-xs font-bold truncate w-full">{p.name}</span>
                      
                      {isHost && (
                        <button 
                          onClick={() => socket.emit('host_kick', { pin, playerId: id })}
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-300 transition-all"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              
              {playerCount === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center gap-4 py-12 opacity-30 text-center">
                  <div className="w-16 h-16 rounded-full border-4 border-dashed border-text-soft animate-spin-slow" />
                  <p className="text-sm font-bold uppercase tracking-widest text-text-soft">Waiting for players...</p>
                </div>
              )}
            </div>
          </div>

          {/* Action Panel */}
          <div className="glass p-8 rounded-[32px] flex flex-col gap-6">
            <div className="space-y-6 flex-1">
              <div className="p-4 rounded-2xl bg-bg-soft/50 border border-white/5">
                <p className="text-[10px] uppercase font-black text-text-soft tracking-widest mb-2">Status</p>
                <div className="flex items-center gap-2">
                  <div className={cn("w-2 h-2 rounded-full", isConnected ? "bg-accent-alt animate-pulse" : "bg-red-500")} />
                  <span className="text-sm font-bold">{isConnected ? 'Connected to Arena' : 'Connecting...'}</span>
                </div>
              </div>

              {battleType && battleType !== '1v1' && !isHost && (
                <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                  <p className="text-[10px] uppercase font-black text-accent tracking-widest">Select Your Squad</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => handlePickTeam('Team A')}
                      className={cn(
                        "py-3 rounded-xl font-bold text-xs transition-all border-2",
                        selectedTeam === 'Team A' ? "bg-blue-500/20 border-blue-500 text-blue-400" : "bg-white/5 border-transparent text-text-soft hover:bg-white/10"
                      )}
                    >
                      TEAM A
                    </button>
                    <button 
                      onClick={() => handlePickTeam('Team B')}
                      className={cn(
                        "py-3 rounded-xl font-bold text-xs transition-all border-2",
                        selectedTeam === 'Team B' ? "bg-red-500/20 border-red-500 text-red-400" : "bg-white/5 border-transparent text-text-soft hover:bg-white/10"
                      )}
                    >
                      TEAM B
                    </button>
                  </div>
                  <p className="text-[9px] text-text-soft italic leading-relaxed">
                    Balance the teams for a fair battle. Your score will contribute to your team's total.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-text-soft">
                  <Shield size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Fair Play On</span>
                </div>
                <div className="flex items-center gap-2 text-text-soft">
                  <Zap size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Real-time Sync</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {isHost && (
                <Button 
                  onClick={handleStartGame}
                  disabled={playerCount === 0}
                  className="w-full"
                >
                  <Play size={18} fill="currentColor" />
                  Start Game
                </Button>
              )}
              <Button 
                variant="danger" 
                onClick={handleCancel}
                className="w-full"
              >
                {isHost ? 'Cancel Session' : 'Leave Lobby'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LobbyPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="w-16 h-16 rounded-full border-4 border-accent border-t-transparent animate-spin" />
        <p className="font-bold uppercase tracking-widest text-text-soft">Accessing Lobby Data...</p>
      </div>
    }>
      <LobbyContent />
    </Suspense>
  );
}
