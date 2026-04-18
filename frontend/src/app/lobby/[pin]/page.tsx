'use client';

import React, { useEffect, useState, Suspense, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Shield, Zap, X, Play, Edit3, Check, MoveRight, Trash2, Ban, Crown, Cpu } from 'lucide-react';
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
  ip?: string; // only present in privileged data
}

interface ChatMessage {
  id: string;
  sender: string;
  message: string;
  isHost: boolean;
  avatar?: string;
}

interface TeamNames {
  'Team A': string;
  'Team B': string;
}

const LobbySlot = React.memo(({
  index,
  occupant,
  isHost,
  socket,
  pin,
  team,
  onClick,
  occupantId,
  isPressable
}: any) => {
  const hasDuplicateIp = occupant && isHost && occupant.ipMatch;

  return (
    <div
      className={cn(
        "relative group flex flex-col items-center gap-1.5",
        isPressable && !occupant && "cursor-pointer"
      )}
      onClick={isPressable ? onClick : undefined}
    >
      <div className={cn(
        "w-10 h-10 rounded-full border-2 transition-all duration-300 flex items-center justify-center overflow-hidden",
        hasDuplicateIp && "ring-2 ring-red-500 animate-pulse border-red-500/50 bg-red-500/10 shadow-[0_0_20px_rgba(239,68,68,0.5)]",
        occupant && !hasDuplicateIp
          ? (occupant.isHost ? "border-amber-400 bg-amber-400/10" : "border-accent/40 bg-accent/5 shadow-[0_0_15px_rgba(99,102,241,0.15)]")
          : !hasDuplicateIp && "border-dashed border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10"
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
        <div className="absolute -top-1 -right-1 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-all scale-[0.6]">
          <button
            onClick={(e) => { e.stopPropagation(); socket.emit('host_kick', { pin, playerId: occupantId }); }}
            className="p-1 rounded-full bg-orange-500 text-white" title="Kick Player"
          >
            <X size={10} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); socket.emit('host_ban', { pin, playerId: occupantId, name: occupant.name, ip: occupant.ip }); }}
            className="p-1 rounded-full bg-red-500 text-white" title="Ban Player (IP & Name)"
          >
            <Ban size={10} />
          </button>
        </div>
      )}
    </div>
  );
});

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

  const [pendingSlot, setPendingSlot] = useState<{ team: 'Team A' | 'Team B', index: number } | null>(null);
  const [editingTeam, setEditingTeam] = useState<'Team A' | 'Team B' | null>(null);
  const [editValue, setEditValue] = useState('');

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [examSettings, setExamSettings] = useState({
    strictFocus: true,
    allowBacktrack: false,
    lockdownMode: false,
    randomizeOrder: false,
    randomizeOptions: false,
    ipLock: false,
    escalationMode: true,
    pointsPerQ: 100,
    penaltyPoints: 50,
    maxPlayers: 200
  });
  const [playAsHost, setPlayAsHost] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [lobbyCountdown, setLobbyCountdown] = useState<number | null>(null);
  const lobbyCountdownRef = React.useRef<number | null>(null);

  // Bot management (host only)
  const [botCount, setBotCount] = useState(0);
  const [botDifficulty, setBotDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [botIds, setBotIds] = useState<{id: string; name: string}[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const slotMap = useMemo(() => {
    const map: Record<string, { id: string, player: Player }> = {};
    Object.entries(players).forEach(([id, p]) => {
      if (p.team && typeof p.slotIndex === 'number') {
        map[`${p.team}_${p.slotIndex}`] = { id, player: p };
      }
    });
    return map;
  }, [players]);

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
        if (res.data.playAsHost !== undefined) setPlayAsHost(res.data.playAsHost);
        
        // Auto-reclaim host logic: If user is the owner but entering as a player
        if (res.data.hostId === user?.id && role !== 'host') {
          const params = new URLSearchParams(searchParams.toString());
          params.set('role', 'host');
          router.replace(`${window.location.pathname}?${params.toString()}`);
        }
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
        userId: user?.id || user?.userId
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

    socket.on('host_player_list_update', (data) => {
      setPlayers(data.players);
    });

    socket.on('new_lobby_chat_message', (msg: ChatMessage) => {
      setChatMessages(prev => [...prev, msg].slice(-50));
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

    socket.on('game_starting', (data: any) => {
      // Pre-load — game is about to begin. Show countdown overlay.
      setLobbyCountdown(5);
    });

    socket.on('game_countdown', (data: { secondsLeft: number }) => {
      setLobbyCountdown(data.secondsLeft);
    });

    socket.on('game_countdown_aborted', (data: { message: string }) => {
      setLobbyCountdown(null); // Dismiss countdown overlay
    });

    socket.on('game_started', (data) => {
      const playAsHost = searchParams.get('playAsHost') === 'true';
      // Navigate after a brief moment to show "GO!" state
      setTimeout(() => {
        if (role === 'host' && data.rated !== false && !playAsHost) {
          router.push(`/host/live/${pin}`);
        } else {
          const roleParam = role === 'host' ? '&role=host' : '';
          const playParam = playAsHost ? '&playAsHost=true' : '';
          router.push(`/play/live?pin=${pin}${roleParam}${playParam}`);
        }
      }, 600);
    });

    socket.on('error_msg', (data) => {
      alert(data.message);
    });

    socket.on('join_success', (data) => {
      if (data.playAsHost !== undefined) setPlayAsHost(data.playAsHost);
    });

    socket.on('host_ready', (data) => {
      if (data.playAsHost !== undefined) setPlayAsHost(data.playAsHost);
    });

    socket.on('bot_added', (data: { botId: string; botName: string; total: number }) => {
      setBotCount(data.total);
      setBotIds(prev => [...prev, { id: data.botId, name: data.botName }]);
    });

    socket.on('bot_removed', (data: { botId: string; total: number }) => {
      setBotCount(data.total);
      setBotIds(prev => prev.filter(b => b.id !== data.botId));
    });

    return () => {
      socket.off('player_list_update');
      socket.off('host_player_list_update');
      socket.off('new_lobby_chat_message');
      socket.off('join_error');
      socket.off('kicked');
      socket.off('host_left');
      socket.off('game_starting');
      socket.off('game_countdown');
      socket.off('game_countdown_aborted');
      socket.off('game_started');
      socket.off('error_msg');
      socket.off('join_success');
      socket.off('host_ready');
      socket.off('bot_added');
      socket.off('bot_removed');
      joinedRef.current = false;
    };
  }, [isConnected, pin, socket, user?.userId, user?.name, router, searchParams]);

  const sendChatMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || !socket || !isConnected) return;
    socket.emit('lobby_chat_message', { pin, message: chatInput.trim() });
    setChatInput('');
  };

  const saveHostSettings = () => {
    socket.emit('host_update_settings', { pin, settings: examSettings });
    setIsSettingsOpen(false);
  };

  const handleJoinSlot = (team: 'Team A' | 'Team B', index: number) => {
    setPendingSlot({ team, index });
  };

  const confirmJoin = () => {
    if (!pendingSlot || !socket || !isConnected) return;
    socket.emit('join_team_slot', {
      pin,
      team: pendingSlot.team,
      slotIndex: pendingSlot.index
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
    return 200;
  };

  const slotCount = getSlotCount(battleType);
  const playerCount = Object.values(players).filter(p => !p.isHost || (p.slotIndex !== null && p.slotIndex !== undefined)).length;

  const renderSlot = (team: 'Team A' | 'Team B', index: number) => {
    const data = slotMap[`${team}_${index}`];
    const occupant = data?.player || null;
    const occupantId = data?.id || null;

    return (
      <LobbySlot
        key={`${team}-${index}`}
        index={index}
        occupant={occupant}
        occupantId={occupantId}
        isHost={isHost}
        socket={socket}
        pin={pin}
        team={team}
        isPressable={!occupant && (!isHost || playAsHost)}
        onClick={() => handleJoinSlot(team, index)}
      />
    );
  };

  const renderChatWidget = () => (
    <div className="flex flex-col h-80 glass rounded-[24px] border border-white/10 bg-bg-soft/50 shadow-2xl overflow-hidden mt-6">
      <div className="p-4 border-b border-white/5 bg-black/20 flex justify-between items-center">
        <span className="text-[10px] font-black uppercase tracking-widest text-accent">Lobby Intel</span>
        <div className="flex items-center gap-2 text-text-soft text-[10px]">
          <Zap size={10} className="text-accent-alt animate-pulse" /> Live
        </div>
      </div>
      <div className="flex-1 p-4 overflow-y-auto space-y-3 flex flex-col">
        {chatMessages.length === 0 ? (
          <p className="text-[9px] text-white/20 uppercase text-center italic m-auto">No tactical comms recorded.</p>
        ) : (
          chatMessages.map(m => (
            <div key={m.id} className={cn("text-[10px] leading-relaxed p-2.5 rounded-lg border w-fit max-w-[90%]", m.isHost ? "bg-amber-500/10 border-amber-500/20 text-text-soft" : "bg-white/5 border-white/5 text-text-soft")}>
              <span className={cn("font-black mb-1 block", m.isHost ? "text-amber-400" : "text-accent")}>{m.sender} {m.isHost && '👑'}</span>
              {m.message}
            </div>
          ))
        )}
      </div>
      <form onSubmit={sendChatMessage} className="p-3 bg-black/20 border-t border-white/5 relative">
        <input
          value={chatInput} onChange={e => setChatInput(e.target.value)}
          placeholder="Transmit comms..."
          className="w-full bg-transparent text-[10px] uppercase font-bold tracking-widest text-white outline-none pl-2 pr-8 placeholder:text-white/20"
        />
        <button type="submit" disabled={!chatInput.trim()} className="absolute right-3 top-1/2 -translate-y-1/2 text-accent hover:scale-110 transition-transform active:scale-95 disabled:opacity-50">
          <MoveRight size={14} />
        </button>
      </form>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 lg:py-16">
      {/* Pre-game countdown overlay — synchronized with server game_countdown events */}
      <AnimatePresence>
        {lobbyCountdown !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex flex-col items-center justify-center bg-background/98 backdrop-blur-3xl"
          >
            <div className="text-center space-y-8">
              <p className="text-[11px] font-black uppercase tracking-[0.5em] text-accent-alt animate-pulse">Arena Deploying</p>
              <motion.div
                key={lobbyCountdown}
                initial={{ scale: 1.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                className="text-[120px] font-black text-white leading-none tabular-nums"
                style={{ textShadow: '0 0 80px rgba(99,102,241,0.9)' }}
              >
                {lobbyCountdown === 0 ? 'GO!' : lobbyCountdown}
              </motion.div>
              <p className="text-xs font-bold text-text-soft uppercase tracking-widest">Entering Arena...</p>
              <div className="flex gap-2 justify-center">
                {[5,4,3,2,1,0].map(n => (
                  <div key={n} className={cn(
                    "w-2 h-2 rounded-full transition-all duration-300",
                    n >= (lobbyCountdown ?? 6) ? 'bg-accent scale-125' : 'bg-white/10'
                  )} />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
                {mounted ? (
                  Array.from({ length: 200 }).map((_, i) => renderSlot('Team A', i))
                ) : (
                  <div className="text-[10px] uppercase font-black text-white/10 p-20">Initializing Arena Grid...</div>
                )}
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
                    disabled={playerCount < 2}
                    className="w-full h-14 bg-gradient-to-tr from-accent to-accent-alt text-lg font-black italic shadow-2xl hover:scale-[1.02] transition-transform"
                  >
                    <Play size={20} fill="currentColor" className="mr-1" />
                    INITIATE ARENA
                  </Button>
                )}
                <div className="flex gap-2">
                  {isHost && (
                    <Button
                      variant="outline"
                      onClick={() => setIsSettingsOpen(true)}
                      className="h-14 aspect-square border-amber-400/30 hover:bg-amber-400/10 text-amber-400 p-0"
                      title="Advanced Settings"
                    >
                      <Zap size={20} />
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    className="flex-1 h-14 border-white/10 hover:bg-white/5 text-xs font-black uppercase tracking-[0.2em]"
                  >
                    {isHost ? 'Cancel Session' : 'Abort Arena'}
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <hr className="border-white/5" />
                <div className="flex items-center gap-3 text-white/30">
                  <Shield size={16} />
                  <span className="text-[10px] uppercase font-black tracking-widest">Anti-Cheat Matrix Active</span>
                </div>
              </div>

              {/* Bot Control Panel — Host Only */}
              {isHost && (
                <div className="space-y-3 pt-2">
                  <hr className="border-white/5" />
                  <div className="flex items-center gap-2">
                    <Cpu size={14} className="text-accent-alt" />
                    <span className="text-[10px] uppercase font-black tracking-widest text-accent-alt">AI Opponents</span>
                    {botCount > 0 && (
                      <span className="ml-auto px-2 py-0.5 rounded-full bg-accent-alt/20 text-accent-alt text-[9px] font-black border border-accent-alt/30">{botCount} Active</span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
                    {(['easy', 'medium', 'hard'] as const).map(d => (
                      <button
                        key={d}
                        onClick={() => setBotDifficulty(d)}
                        className={cn(
                          'py-1.5 text-[8px] font-black rounded-lg uppercase tracking-widest transition-all',
                          botDifficulty === d
                            ? d === 'easy' ? 'bg-emerald-500 text-white' : d === 'medium' ? 'bg-amber-400 text-black' : 'bg-red-500 text-white'
                            : 'text-text-soft hover:bg-white/5'
                        )}
                      >{d}</button>
                    ))}
                  </div>
                  <button
                    id="add-bot-btn"
                    onClick={() => socket?.emit('add_bot', { pin, difficulty: botDifficulty })}
                    disabled={botCount >= 8}
                    className="w-full py-2.5 rounded-xl bg-accent-alt/20 border border-accent-alt/30 text-accent-alt text-[9px] font-black uppercase tracking-widest hover:bg-accent-alt/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Cpu size={12} />
                    Add Bot {botCount >= 8 ? '(Max 8)' : `(${8 - botCount} left)`}
                  </button>
                  {botIds.length > 0 && (
                    <div className="space-y-1 max-h-24 overflow-y-auto scrollbar-none">
                      {botIds.map(b => (
                        <div key={b.id} className="flex items-center justify-between px-2 py-1 rounded-lg bg-white/5 border border-white/5 group">
                          <span className="text-[9px] font-black uppercase text-accent-alt flex items-center gap-1">
                            <Cpu size={9} /> {b.name}
                          </span>
                          <button
                            onClick={() => socket?.emit('remove_bot', { pin, botId: b.id })}
                            className="text-red-400 opacity-30 group-hover:opacity-100 transition-all"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Massive Lobby Chat Widget */}
            {renderChatWidget()}
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
                    disabled={playerCount < 2}
                    className="w-full bg-gradient-to-tr from-accent to-accent-alt shadow-[0_0_20px_rgba(99,102,241,0.2)]"
                  >
                    <Play size={18} fill="currentColor" />
                    Start Game
                  </Button>
                )}
                <div className="flex gap-2">
                  {isHost && (
                    <Button
                      variant="outline"
                      onClick={() => setIsSettingsOpen(true)}
                      className="aspect-square border-amber-400/30 hover:bg-amber-400/10 text-amber-400 p-0 px-3"
                      title="Advanced Settings"
                    >
                      <Zap size={16} />
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    className="flex-1 border-white/10 hover:bg-white/5"
                  >
                    {isHost ? 'Cancel Session' : 'Leave Lobby'}
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-accent/20 bg-accent/5 text-[9px] text-text-soft leading-relaxed italic">
              <strong>Tip:</strong> Choose your squad carefully. Balanced teams lead to more intense competition and higher XP gains.
            </div>

            {/* Battle Mode Lobby Chat Widget */}
            {renderChatWidget()}
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

      {/* Advanced Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && isHost && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg glass p-8 rounded-[32px] border-amber-400/30 overflow-y-auto max-h-[90vh] custom-scrollbar"
            >
              <h3 className="text-xl font-black mb-6 uppercase italic text-amber-400">Tactical Arena Parameters</h3>

              <div className="space-y-3 mb-8">
                {/* Integrity Layer */}
                <p className="text-[9px] text-text-soft uppercase font-black tracking-[0.3em] mb-2 border-b border-white/5 pb-1">Integrity & Surveillance</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => setExamSettings(s => ({ ...s, strictFocus: !s.strictFocus }))}
                    className={cn("flex items-center justify-between p-3 rounded-xl border transition-all", examSettings.strictFocus ? "bg-red-500/10 border-red-500/30 text-red-500" : "bg-white/5 border-white/5 text-text-soft")}
                  >
                    <span className="text-[9px] font-black uppercase tracking-wider">Strict Focus</span>
                    <div className={cn("w-3 h-3 rounded-full transition-all", examSettings.strictFocus ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" : "bg-white/10")} />
                  </button>

                  <button
                    onClick={() => setExamSettings(s => ({ ...s, escalationMode: !s.escalationMode }))}
                    className={cn("flex items-center justify-between p-3 rounded-xl border transition-all", examSettings.escalationMode ? "bg-amber-500/10 border-amber-500/30 text-amber-500" : "bg-white/5 border-white/5 text-text-soft")}
                  >
                    <span className="text-[9px] font-black uppercase tracking-wider">Strike System</span>
                    <div className={cn("w-3 h-3 rounded-full transition-all", examSettings.escalationMode ? "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]" : "bg-white/10")} />
                  </button>

                  <button
                    onClick={() => setExamSettings(s => ({ ...s, lockdownMode: !s.lockdownMode }))}
                    className={cn("flex items-center justify-between p-3 rounded-xl border transition-all", examSettings.lockdownMode ? "bg-accent/10 border-accent/30 text-accent" : "bg-white/5 border-white/5 text-text-soft")}
                  >
                    <span className="text-[9px] font-black uppercase tracking-wider">Lockdown Mode</span>
                    <div className={cn("w-3 h-3 rounded-full transition-all", examSettings.lockdownMode ? "bg-accent shadow-[0_0_10px_rgba(99,102,241,0.5)]" : "bg-white/10")} />
                  </button>

                  <button
                    onClick={() => setExamSettings(s => ({ ...s, ipLock: !s.ipLock }))}
                    className={cn("flex items-center justify-between p-3 rounded-xl border transition-all", examSettings.ipLock ? "bg-white/10 border-white/30 text-white" : "bg-white/5 border-white/5 text-text-soft")}
                  >
                    <span className="text-[9px] font-black uppercase tracking-wider">Flag Same IP</span>
                    <div className={cn("w-3 h-3 rounded-full transition-all", examSettings.ipLock ? "bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]" : "bg-white/10")} />
                  </button>
                </div>

                {/* Gameplay Layer */}
                <p className="text-[9px] text-text-soft uppercase font-black tracking-[0.3em] mt-6 mb-2 border-b border-white/5 pb-1">Arena Mechanics</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => setExamSettings(s => ({ ...s, allowBacktrack: !s.allowBacktrack }))}
                    className={cn("flex items-center justify-between p-3 rounded-xl border transition-all", examSettings.allowBacktrack ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-white/5 border-white/5 text-text-soft")}
                  >
                    <span className="text-[9px] font-black uppercase tracking-wider">Nav-Previous</span>
                    <div className={cn("w-3 h-3 rounded-full transition-all", examSettings.allowBacktrack ? "bg-emerald-500" : "bg-white/10")} />
                  </button>

                  <button
                    onClick={() => setExamSettings(s => ({ ...s, randomizeOrder: !s.randomizeOrder }))}
                    className={cn("flex items-center justify-between p-3 rounded-xl border transition-all", examSettings.randomizeOrder ? "bg-accent-alt/10 border-accent-alt/30 text-accent-alt" : "bg-white/5 border-white/5 text-text-soft")}
                  >
                    <span className="text-[9px] font-black uppercase tracking-wider">Shuffle Questions</span>
                    <div className={cn("w-3 h-3 rounded-full transition-all", examSettings.randomizeOrder ? "bg-accent-alt" : "bg-white/10")} />
                  </button>

                  <button
                    onClick={() => setExamSettings(s => ({ ...s, randomizeOptions: !s.randomizeOptions }))}
                    className={cn("flex items-center justify-between p-3 rounded-xl border transition-all", examSettings.randomizeOptions ? "bg-accent-alt/10 border-accent-alt/30 text-accent-alt" : "bg-white/5 border-white/5 text-text-soft")}
                  >
                    <span className="text-[9px] font-black uppercase tracking-wider">Shuffle Options</span>
                    <div className={cn("w-3 h-3 rounded-full transition-all", examSettings.randomizeOptions ? "bg-accent-alt" : "bg-white/10")} />
                  </button>
                </div>

                <div className="pt-4 mt-4 border-t border-white/5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-white/50 mb-1 block">Points/Q</label>
                      <input
                        type="number" value={examSettings.pointsPerQ} onChange={e => setExamSettings(s => ({ ...s, pointsPerQ: Number(e.target.value) }))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-white/50 mb-1 block">Penalty</label>
                      <input
                        type="number" value={examSettings.penaltyPoints} onChange={e => setExamSettings(s => ({ ...s, penaltyPoints: Number(e.target.value) }))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-red-400 outline-none focus:border-red-400"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-white/50 mb-1 block">Max Pool</label>
                      <input
                        type="number" value={examSettings.maxPlayers} onChange={e => setExamSettings(s => ({ ...s, maxPlayers: Number(e.target.value) }))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-accent-alt outline-none focus:border-accent-alt"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button variant="outline" className="flex-1 border-white/10" onClick={() => setIsSettingsOpen(false)}>Discard</Button>
                <Button className="flex-1 bg-amber-500 text-black shadow-lg shadow-amber-500/20" onClick={saveHostSettings}>Update Engine</Button>
              </div>
            </motion.div>
          </div>
        )}
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
