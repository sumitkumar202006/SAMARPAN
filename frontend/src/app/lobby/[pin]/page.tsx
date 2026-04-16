'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Shield, Zap, X, Play, Edit3, Check, MoveRight, Trash2, Ban, Crown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useSocket } from '@/context/SocketContext';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import api from '@/lib/axios';

interface Player {
  name: string;
  isHost: boolean;
  avatar?: string | null;
  team?: string;
  slotIndex?: number;
}

interface TeamNames {
  'Team A': string;
  'Team B': string;
}

function LobbyContent() {
  const { pin } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();
  
  const [players, setPlayers] = useState<Record<string, Player>>({});
  const [teamNames, setTeamNames] = useState<TeamNames>({ 'Team A': 'Team A', 'Team B': 'Team B' });
  const [isHost, setIsHost] = useState(false);
  const [battleType, setBattleType] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Slot state
  const [pendingSlot, setPendingSlot] = useState<{ team: 'Team A' | 'Team B', index: number } | null>(null);
  const [editingTeam, setEditingTeam] = useState<'Team A' | 'Team B' | null>(null);
  const [editValue, setEditValue] = useState('');

  const joinedRef = React.useRef(false);
  useEffect(() => {
    if (!isConnected || !socket || joinedRef.current) return;

    const name = searchParams.get('name') || user?.name || 'Guest';
    const password = searchParams.get('password');
    const role = searchParams.get('role');

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
      socket.emit('host_join', { 
        pin, 
        password,
        name: user?.name,
        avatar: user?.avatar,
        userId: user?.userId
      });
    } else {
      socket.emit('join_room', { 
        pin, 
        name, 
        password, 
        userId: user?.userId || user?.email, 
        email: user?.email,
        avatar: user?.avatar
      });
    }
    
    joinedRef.current = true;

    socket.on('player_list_update', (data) => {
      setPlayers(data.players);
      if (data.teamNames) setTeamNames(data.teamNames);
    });

    socket.on('join_error', (data) => {
      setError(data.message);
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
      const playAsHost = searchParams.get('playAsHost') === 'true';
      // If host chooses to play, route them to the player interface
      if (role === 'host' && data.rated !== false && !playAsHost) {
        router.push(`/host/live/${pin}`);
      } else {
        const roleParam = role === 'host' ? '&role=host' : '';
        const playParam = playAsHost ? '&playAsHost=true' : '';
        router.push(`/play/live?pin=${pin}${roleParam}${playParam}`);
      }
    });

    socket.on('error_msg', (data) => {
      alert(data.message);
    });

    return () => {
      socket.off('player_list_update');
      socket.off('join_error');
      socket.off('kicked');
      socket.off('host_left');
      socket.off('game_started');
      socket.off('error_msg');
      joinedRef.current = false;
    };
  }, [isConnected, pin, socket, user?.userId, user?.name, router, searchParams]);

  const handleJoinSlot = (team: 'Team A' | 'Team B', index: number) => {
    setPendingSlot({ team, index });
  };

  const confirmJoin = () => {
    if (!pendingSlot) return;
    socket.emit('join_team_slot', { 
      pin, 
      team: pendingSlot.team, 
      slotIndex: Number(pendingSlot.index) 
    });
    setPendingSlot(null);
  };

  const handleEditTeam = (team: 'Team A' | 'Team B') => {
    if (!isHost) return;
    setEditingTeam(team);
    setEditValue(teamNames[team]);
  };

  const saveTeamName = () => {
    if (!editingTeam) return;
    socket.emit('host_edit_team_name', { pin, teamKey: editingTeam, newName: editValue });
    setEditingTeam(null);
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

  const getSlotCount = (type: string | null) => {
    if (type === '1v1') return 1;
    if (type === '2v2') return 2;
    if (type === '3v3') return 3;
    if (type === '4v4') return 4;
    return 200; // Standard / Massive view
  };

  const slotCount = getSlotCount(battleType);
  const playerCount = Object.values(players).filter(p => !p.isHost).length;

  const renderSlot = (team: 'Team A' | 'Team B', index: number) => {
    const isMassive = !battleType || battleType === 'Standard' || battleType === 'rapid';
    const occupantId = Object.keys(players).find(id => {
      const p = players[id];
      return p.team === team && Number(p.slotIndex) === index;
    });
    const occupant = occupantId ? players[occupantId] : null;

    if (isMassive) {
      return (
        <div 
          key={`${team}-${index}`}
          className={cn(
            "relative group flex flex-col items-center gap-1.5",
            !occupant && "cursor-pointer"
          )}
          onClick={() => !occupant && handleJoinSlot(team, index)}
        >
          <div className={cn(
            "w-10 h-10 rounded-full border-2 transition-all duration-300 flex items-center justify-center overflow-hidden",
            occupant 
              ? (occupant.isHost ? "border-amber-400 bg-amber-400/10" : "border-accent/40 bg-accent/5 shadow-[0_0_15px_rgba(99,102,241,0.15)]")
              : "border-dashed border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10"
          )}>
            {occupant ? (
              <>
                {occupant.avatar ? (
                  <img src={occupant.avatar} alt={occupant.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-black uppercase text-accent-alt">
                    {occupant.name.charAt(0)}
                  </span>
                )}
                {occupant.isHost && (
                  <div className="absolute -top-0.5 -right-0.5 bg-amber-400 text-black rounded-full p-0.5 border border-black/20 shadow-lg">
                    <Crown size={8} fill="currentColor" />
                  </div>
                )}
              </>
            ) : (
              <span className="text-[8px] font-black text-white/10 group-hover:text-white/30 tracking-tighter">
                {index + 1}
              </span>
            )}
          </div>
          <span className={cn(
            "text-[8px] font-bold truncate w-10 text-center uppercase tracking-tighter h-3",
            occupant ? (occupant.isHost ? "text-amber-400" : "text-text-soft") : "text-white/5"
          )}>
            {occupant ? occupant.name : ""}
          </span>
          
          {occupant && isHost && !occupant.isHost && (
            <button 
              onClick={(e) => { e.stopPropagation(); socket.emit('host_kick', { pin, playerId: occupantId }); }}
              className="absolute -top-1 -right-1 p-0.5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-all scale-75"
            >
              <X size={8} />
            </button>
          )}
        </div>
      );
    }

    return (
      <div 
        key={`${team}-${index}`}
        className={cn(
          "relative h-24 rounded-2xl border-2 transition-all group overflow-hidden flex items-center justify-center",
          occupant 
            ? (team === 'Team A' ? "bg-indigo-500/10 border-indigo-500/50" : "bg-rose-500/10 border-rose-500/50")
            : "border-dashed border-white/10 hover:border-white/20 bg-white/5 cursor-pointer"
        )}
        onClick={() => !occupant && handleJoinSlot(team, index)}
      >
        {occupant ? (
          <div className="flex flex-col items-center gap-1 animate-in zoom-in duration-300">
            <div className="relative">
              {occupant.avatar ? (
                <img src={occupant.avatar} alt={occupant.name} className={cn(
                  "w-10 h-10 rounded-full border-2 object-cover shadow-lg",
                  occupant.isHost ? "border-amber-400" : "border-white/10"
                )} />
              ) : (
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-lg border-2",
                  occupant.isHost ? "border-amber-400" : "border-transparent",
                  team === 'Team A' ? "bg-indigo-500" : "bg-rose-500"
                )}>
                  {occupant.name.charAt(0).toUpperCase()}
                </div>
              )}
              {occupant.isHost && (
                <div className="absolute -top-1 -right-1 bg-amber-400 text-black rounded-full p-0.5 shadow-lg border border-black/20">
                  <Crown size={8} fill="currentColor" />
                </div>
              )}
            </div>
            <span className={cn(
              "text-[10px] font-bold truncate max-w-[80px]",
              occupant.isHost ? "text-amber-400" : "text-white"
            )}>
              {occupant.name}
            </span>
            
            {isHost && (
              <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <button 
                  onClick={(e) => { e.stopPropagation(); socket.emit('host_kick', { pin, playerId: occupantId }); }}
                  className="p-1 rounded-md bg-black/50 text-red-400 hover:text-red-300"
                  title="Kick Player"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-[10px] font-black uppercase tracking-widest text-white/20 group-hover:text-white/40 transition-colors">
            Empty Slot
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 lg:py-16">
      {/* Header */}
      <div className="flex flex-col items-center text-center gap-4 mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-soft border border-accent/30 text-accent font-bold text-[10px] uppercase tracking-widest animate-pulse">
           Live Arena • {battleType || 'Grand Arena'}
        </div>
        
        <div className="flex flex-col items-center gap-2">
          <p className="text-text-soft text-[10px] uppercase font-black tracking-[0.4em]">Arena PIN</p>
          <div className="text-6xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-tr from-accent to-accent-alt drop-shadow-[0_0_30px_rgba(99,102,241,0.5)] leading-none">
            {pin}
          </div>
        </div>
      </div>

      {!battleType || battleType === 'Standard' || battleType === 'rapid' ? (
        /* MASSIVE POOL GRID (200 SLOTS) */
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_350px] gap-10">
          <div className="space-y-10">
            <div className="glass p-8 rounded-[40px] border-white/5 bg-bg-soft/10">
              <div className="flex items-center justify-between mb-8">
                <div className="space-y-1">
                  <h3 className="text-2xl font-black italic uppercase tracking-tight text-white/90">Grand Arena Sync</h3>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 border border-accent/20">
                      <Users size={12} className="text-accent" />
                      <span className="text-[10px] font-black tracking-widest uppercase text-accent-alt">{playerCount} Active</span>
                    </div>
                    <span className="text-[10px] font-black tracking-widest uppercase text-white/20 italic">200 Slots Capacity</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-x-3 gap-y-6 justify-center max-h-[600px] overflow-y-auto scrollbar-hide pr-2">
                {Array.from({ length: 200 }).map((_, i) => renderSlot('Team A', i))}
              </div>
            </div>
          </div>

          {/* Massive Action Sidebar */}
          <div className="space-y-6">
            <div className="glass p-8 rounded-[32px] bg-bg-soft/20 space-y-8 sticky top-24">
              <div className="space-y-3">
                <p className="text-[10px] uppercase font-black text-text-soft tracking-widest">Global Status</p>
                <div className={cn(
                  "flex items-center gap-3 p-4 rounded-2xl border transition-all",
                  isConnected ? "bg-emerald-500/5 border-emerald-500/20" : "bg-red-500/5 border-red-500/20"
                )}>
                  <div className={cn("w-3 h-3 rounded-full", isConnected ? "bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-red-500")} />
                  <span className={cn("text-xs font-black uppercase tracking-widest", isConnected ? "text-emerald-400" : "text-red-400")}>
                    {isConnected ? 'Sync Established' : 'Offline'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                 <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center">
                    <p className="text-[9px] font-black uppercase text-white/40 mb-1">Players</p>
                    <p className="text-xl font-black text-accent">{playerCount}</p>
                 </div>
                 <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center">
                    <p className="text-[9px] font-black uppercase text-white/40 mb-1">Slots Left</p>
                    <p className="text-xl font-black text-accent-alt">{200 - playerCount}</p>
                 </div>
              </div>

              <div className="space-y-3">
                {isHost && (
                  <Button 
                    onClick={handleStartGame}
                    disabled={playerCount === 0}
                    className="w-full h-14 bg-gradient-to-tr from-accent to-accent-alt text-lg font-black italic shadow-2xl hover:scale-[1.02] transition-transform"
                  >
                    <Play size={20} fill="currentColor" className="mr-1" />
                    INITIATE ARENA
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  onClick={handleCancel}
                  className="w-full h-14 border-white/10 hover:bg-white/5 text-xs font-black uppercase tracking-[0.2em]"
                >
                  {isHost ? 'Cancel Session' : 'Abort Arena'}
                </Button>
              </div>

              <div className="space-y-4">
                 <hr className="border-white/5" />
                 <div className="flex items-center gap-3 text-white/30">
                    <Shield size={16} />
                    <span className="text-[10px] uppercase font-black tracking-widest">Anti-Cheat Matrix Active</span>
                 </div>
                 <div className="flex items-center gap-3 text-white/30">
                    <Zap size={16} />
                    <span className="text-[10px] uppercase font-black tracking-widest">Hyper-Sync Enabled</span>
                 </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* BATTLE MODE (Team A vs Team B) */
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10">
          {/* Main Stage */}
          <div className="space-y-10">
            {slotCount > 0 ? (
              <div className="grid md:grid-cols-2 gap-8 relative">
                {/* VS Badge */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 hidden md:flex items-center justify-center w-12 h-12 rounded-full bg-background border-4 border-bg-soft font-black italic text-accent shadow-2xl">
                  VS
                </div>

                {/* Team A */}
                <div className="glass p-6 rounded-[32px] border-indigo-500/20 bg-indigo-500/5">
                  <div className="flex items-center justify-between mb-6">
                    {editingTeam === 'Team A' ? (
                      <div className="flex items-center gap-2 flex-1 mr-4">
                        <input 
                          autoFocus
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && saveTeamName()}
                          className="bg-background border border-accent rounded-lg px-3 py-1 text-sm font-bold w-full outline-none"
                        />
                        <button onClick={saveTeamName} className="text-accent hover:text-accent-alt"><Check size={18} /></button>
                      </div>
                    ) : (
                      <h4 className="flex items-center gap-2 font-black text-indigo-400 tracking-tight text-xl uppercase italic">
                        {teamNames['Team A']}
                        {isHost && <Edit3 size={14} className="cursor-pointer opacity-50 hover:opacity-100" onClick={() => handleEditTeam('Team A')} />}
                      </h4>
                    )}
                    <span className="text-[10px] font-black text-indigo-500/50 uppercase tracking-widest">Team A</span>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {Array.from({ length: slotCount }).map((_, i) => renderSlot('Team A', i))}
                  </div>
                </div>

                {/* Team B */}
                <div className="glass p-6 rounded-[32px] border-rose-500/20 bg-rose-500/5">
                  <div className="flex items-center justify-between mb-6">
                    {editingTeam === 'Team B' ? (
                      <div className="flex items-center gap-2 flex-1 mr-4">
                        <input 
                          autoFocus
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && saveTeamName()}
                          className="bg-background border border-accent rounded-lg px-3 py-1 text-sm font-bold w-full outline-none"
                        />
                        <button onClick={saveTeamName} className="text-accent hover:text-accent-alt"><Check size={18} /></button>
                      </div>
                    ) : (
                      <h4 className="flex items-center gap-2 font-black text-rose-400 tracking-tight text-xl uppercase italic">
                        {teamNames['Team B']}
                        {isHost && <Edit3 size={14} className="cursor-pointer opacity-50 hover:opacity-100" onClick={() => handleEditTeam('Team B')} />}
                      </h4>
                    )}
                    <span className="text-[10px] font-black text-rose-500/50 uppercase tracking-widest">Team B</span>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {Array.from({ length: slotCount }).map((_, i) => renderSlot('Team B', i))}
                  </div>
                </div>
              </div>
            ) : (
              // Legacy Standard View (Non-Team) fallback
              <div className="glass p-8 rounded-[32px] min-h-[400px]">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="flex items-center gap-3 font-bold text-lg">
                    <Users className="text-accent" size={20} />
                    Players Joined
                  </h3>
                  <span className="px-3 py-1 rounded-full bg-bg-soft font-bold text-sm">{playerCount}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {Object.entries(players).map(([id, p]) => {
                    if (p.isHost) return null;
                    return (
                      <div key={id} className="glass p-4 rounded-2xl flex flex-col items-center gap-2 relative group uppercase italic">
                        {p.avatar ? (
                          <img src={p.avatar} alt={p.name} className="w-12 h-12 rounded-full border-2 border-white/10 object-cover shadow-lg" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center font-bold text-lg">{p.name.charAt(0)}</div>
                        )}
                        <span className="text-[10px] font-bold truncate w-full text-center">{p.name}</span>
                        {isHost && (
                           <button onClick={() => socket.emit('host_kick', { pin, playerId: id })} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-red-500 hover:scale-110 transition-all">
                             <X size={14} />
                           </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Waiting / Unassigned Section */}
            {slotCount > 0 && !battleType && (
              <div className="glass p-6 rounded-3xl bg-white/[0.02]">
                <div className="flex items-center gap-2 mb-4 text-[10px] font-black uppercase tracking-widest text-text-soft">
                  <Users size={12} />
                  Waiting to join ({Object.values(players).filter(p => !p.isHost && !p.team).length})
                </div>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(players).map(([id, p]) => {
                    if (p.isHost || p.team) return null;
                    return (
                      <motion.div 
                        key={id} 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5"
                      >
                        {p.avatar ? (
                          <img src={p.avatar} alt={p.name} className="w-5 h-5 rounded-full border border-white/10 object-cover" />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center text-[8px] font-bold">
                            {p.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="text-[10px] font-bold">{p.name}</span>
                        {isHost && (
                           <button onClick={() => socket.emit('host_kick', { pin, playerId: id })} className="text-red-500 hover:text-red-400">
                             <X size={12} />
                           </button>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Action Sidebar */}
          <div className="space-y-6">
            <div className="glass p-6 rounded-[24px] bg-bg-soft/20 space-y-6">
              <div className="space-y-2">
                <p className="text-[10px] uppercase font-black text-text-soft tracking-widest">Status</p>
                <div className="flex items-center gap-2">
                  <div className={cn("w-2 h-2 rounded-full", isConnected ? "bg-accent-alt animate-pulse" : "bg-red-500")} />
                  <span className="text-xs font-bold">{isConnected ? 'CONNECTED TO ARENA' : 'CONNECTING...'}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-text-soft">
                  <Shield size={14} className="text-accent" />
                  <span className="text-[9px] font-black uppercase tracking-widest italic opacity-60">Anti-Cheat Active</span>
                </div>
                <div className="flex items-center gap-2 text-text-soft">
                  <Zap size={14} className="text-accent-alt" />
                  <span className="text-[9px] font-black uppercase tracking-widest italic opacity-60">Low Latency Sync</span>
                </div>
              </div>

              <hr className="border-white/5" />

              <div className="space-y-3">
                {isHost && (
                  <Button 
                    onClick={handleStartGame}
                    disabled={playerCount === 0}
                    className="w-full bg-gradient-to-tr from-accent to-accent-alt shadow-[0_0_20px_rgba(99,102,241,0.2)]"
                  >
                    <Play size={18} fill="currentColor" />
                    Start Game
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  onClick={handleCancel}
                  className="w-full border-white/10 hover:bg-white/5"
                >
                  {isHost ? 'Cancel Session' : 'Leave Lobby'}
                </Button>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-accent/20 bg-accent/5 text-[9px] text-text-soft leading-relaxed italic">
              <strong>Tip:</strong> Choose your squad carefully. Balanced teams lead to more intense competition and higher XP gains.
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <AnimatePresence>
        {pendingSlot && (() => {
          const isMassive = !battleType || battleType === 'Standard' || battleType === 'rapid';
          return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setPendingSlot(null)}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative w-full max-w-sm glass p-8 rounded-[32px] text-center border-accent/20"
              >
                <div className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl rotate-3",
                  isMassive ? "bg-accent shadow-[0_0_20px_rgba(99,102,241,0.4)]" : 
                  (pendingSlot.team === 'Team A' ? "bg-indigo-500" : "bg-rose-500")
                )}>
                  <MoveRight size={32} />
                </div>
                <h3 className="text-2xl font-black mb-2 uppercase italic">
                  {isMassive ? "Sync Position?" : `Join ${teamNames[pendingSlot.team]}?`}
                </h3>
                <p className="text-text-soft text-sm mb-8 leading-relaxed">
                  {isMassive 
                    ? `Synchronize your identity to slot ${pendingSlot.index + 1} of the arena grid.` 
                    : `You will be assigned to slot ${pendingSlot.index + 1}. Are you ready to represent this squad?`}
                </p>
                <div className="flex gap-4">
                  <Button variant="outline" className="flex-1" onClick={() => setPendingSlot(null)}>Wait</Button>
                  <Button className="flex-1" onClick={confirmJoin}>
                    {isMassive ? "Establish Sync" : "Join Squad"}
                  </Button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
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
