'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Users, Clock, Calendar, ArrowLeft, Crown, CheckCircle2, AlertCircle, RefreshCw, Shield, Target, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';
import { AvatarFrame } from '@/components/ui/AvatarFrame';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

const STATUS = {
  upcoming:     { label: 'Upcoming',     color: 'text-blue-400',    bg: 'bg-blue-400/10'    },
  registration: { label: 'Open',         color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  running:      { label: '🔴 Live',      color: 'text-red-400',     bg: 'bg-red-400/10'     },
  completed:    { label: 'Ended',        color: 'text-text-soft',   bg: 'bg-white/5'        },
};

function BracketMatch({ match, round }: { match: any; round: number }) {
  if (!match) return null;
  const winner = match.winner;
  return (
    <div className="flex flex-col gap-1">
      {[match.player1, match.player2].map((player: any, i: number) => (
        <div key={i} className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-xl border text-[11px] font-black transition-all',
          !player ? 'border-dashed border-white/10 text-text-soft/30 italic' :
          winner && player?.id === winner ? 'bg-accent/10 border-accent/30 text-accent' :
          winner ? 'border-white/5 text-text-soft opacity-50' :
          'border-white/10 bg-white/[0.03]'
        )}>
          {player ? (
            <>
              <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center text-[8px]">
                {player.name?.[0]?.toUpperCase() || '?'}
              </div>
              <span className="truncate">{player.name || 'TBD'}</span>
              {winner && player?.id === winner && <Trophy size={10} className="ml-auto text-yellow-400 shrink-0" />}
            </>
          ) : <span>TBD</span>}
        </div>
      ))}
    </div>
  );
}

export default function TournamentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router   = useRouter();
  const [tournament, setTournament] = useState<any>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);
  const [toast, setToast]           = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3200); };

  useEffect(() => {
    if (!id) return;
    api.get(`/api/tournaments/${id}`)
      .then(r => setTournament(r.data.tournament || r.data))
      .catch(e => setError(e?.response?.data?.error || 'Tournament not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleRegister = async () => {
    if (!user?.token) return router.push('/auth');
    setRegistering(true);
    try {
      await api.post(`/api/tournaments/${id}/register`, {}, { headers: { Authorization: `Bearer ${user.token}` } });
      showToast('🎉 Registered! Prepare for battle.');
      const r = await api.get(`/api/tournaments/${id}`);
      setTournament(r.data.tournament || r.data);
    } catch (err: any) { showToast(err?.response?.data?.error || 'Registration failed', false); }
    finally { setRegistering(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-12 h-12 rounded-full border-2 border-accent border-t-transparent animate-spin" />
    </div>
  );

  if (error || !tournament) return (
    <div className="max-w-md mx-auto mt-20 glass rounded-[32px] border border-red-500/20 p-12 text-center space-y-4">
      <AlertCircle size={32} className="text-red-400 mx-auto" />
      <p className="text-red-400 font-black">{error || 'Not found'}</p>
      <Link href="/tournaments" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 text-text-soft hover:text-white text-sm font-black uppercase">
        ← Back to Tournaments
      </Link>
    </div>
  );

  const st = STATUS[tournament.status as keyof typeof STATUS] || STATUS.upcoming;
  const count = tournament._count?.participants ?? tournament.participants?.length ?? 0;
  const pct = Math.min((count / tournament.maxPlayers) * 100, 100);
  const isRegistered = tournament.participants?.some((p: any) => p.userId === user?.id || p.user?.id === user?.id);
  const bracket = tournament.bracket as any;
  const rounds: any[][] = bracket?.rounds || [];
  const myPlan = user?.plan || 'free';
  const planOrder = ['free', 'pro', 'elite', 'institution'];
  const meetsReq = !tournament.requiredPlan || planOrder.indexOf(myPlan) >= planOrder.indexOf(tournament.requiredPlan);

  return (
    <AuthGuard>
      <div className="py-2 lg:py-10 max-w-5xl mx-auto space-y-8">
        <AnimatePresence>
          {toast && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className={cn('fixed top-24 left-1/2 -translate-x-1/2 z-[500] px-5 py-3 rounded-2xl border backdrop-blur-xl text-[11px] font-black uppercase tracking-widest',
                toast.ok ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'
              )}>{toast.msg}</motion.div>
          )}
        </AnimatePresence>

        <Link href="/tournaments" className="flex items-center gap-2 text-text-soft hover:text-white transition-colors text-[11px] font-black uppercase w-fit">
          <ArrowLeft size={14} /> Back to Tournaments
        </Link>

        <div className="grid lg:grid-cols-[1fr_300px] gap-8 items-start">
          {/* Left */}
          <div className="space-y-6">
            {/* Header card */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[32px] border border-white/5 p-8 space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn('flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border', st.bg, st.color)}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />{st.label}
                </span>
                {tournament.requiredPlan && tournament.requiredPlan !== 'free' && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 uppercase">
                    <Crown size={8} /> {tournament.requiredPlan}+
                  </span>
                )}
              </div>
              <h1 className="text-2xl lg:text-3xl font-black uppercase italic tracking-tight">{tournament.name}</h1>
              {tournament.description && <p className="text-text-soft text-sm leading-relaxed">{tournament.description}</p>}

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Players',  val: `${count}/${tournament.maxPlayers}`, icon: Users },
                  { label: 'Format',   val: tournament.format === 'single_elimination' ? 'Elimination' : 'Round Robin', icon: Target },
                  { label: 'Starts',   val: tournament.startTime ? new Date(tournament.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBA', icon: Calendar },
                ].map((s, i) => (
                  <div key={i} className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 text-center">
                    <s.icon size={11} className="text-text-soft mx-auto mb-1" />
                    <p className="text-[8px] text-text-soft uppercase font-black">{s.label}</p>
                    <p className="text-[10px] font-black leading-tight">{s.val}</p>
                  </div>
                ))}
              </div>

              {/* Capacity bar */}
              <div>
                <div className="flex justify-between text-[8px] font-black uppercase text-text-soft mb-1">
                  <span>Capacity</span><span>{Math.round(pct)}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }}
                    className={cn('h-full rounded-full', pct >= 90 ? 'bg-red-400' : pct >= 60 ? 'bg-amber-400' : 'bg-emerald-400')} />
                </div>
              </div>

              {tournament.prize && (
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-yellow-400/5 border border-yellow-400/20">
                  <Trophy size={16} className="text-yellow-400 shrink-0" />
                  <div>
                    <p className="text-[8px] text-yellow-400 uppercase font-black tracking-widest">Prize</p>
                    <p className="font-black text-sm">{tournament.prize}</p>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Bracket viewer */}
            {rounds.length > 0 && (
              <div className="glass rounded-[28px] border border-white/5 p-6 space-y-4">
                <h2 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <Shield size={12} className="text-accent" /> Bracket
                </h2>
                <div className="overflow-x-auto">
                  <div className="flex gap-6 min-w-max pb-4">
                    {rounds.map((round: any[], ri: number) => (
                      <div key={ri} className="space-y-4 min-w-[180px]">
                        <p className="text-[9px] font-black uppercase tracking-widest text-text-soft text-center">
                          {ri === rounds.length - 1 ? 'Final' : `Round ${ri + 1}`}
                        </p>
                        <div className="space-y-4">
                          {round.map((match: any, mi: number) => (
                            <BracketMatch key={mi} match={match} round={ri} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Participants */}
            {tournament.participants?.length > 0 && (
              <div className="glass rounded-[28px] border border-white/5 overflow-hidden">
                <div className="p-5 border-b border-white/5 flex items-center gap-2">
                  <Users size={14} className="text-accent" />
                  <h2 className="text-[10px] font-black uppercase tracking-widest">Registered Players ({count})</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-5">
                  {tournament.participants.slice(0, 12).map((p: any, i: number) => (
                    <div key={p.id || i} className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.03] border border-white/5">
                      <AvatarFrame src={p.user?.avatar} name={p.user?.name || 'Player'} size="xs" showFrame={false} />
                      <div className="min-w-0">
                        <p className="font-black text-[10px] uppercase italic truncate">{p.user?.name || 'Player'}</p>
                        {p.user?.globalRating && <p className="text-[8px] text-text-soft">{p.user.globalRating} ELO</p>}
                      </div>
                    </div>
                  ))}
                  {count > 12 && <div className="flex items-center justify-center p-2 rounded-xl bg-white/5 border border-white/5 text-[9px] text-text-soft font-black">+{count - 12} more</div>}
                </div>
              </div>
            )}
          </div>

          {/* Right — action sidebar */}
          <div className="space-y-4 lg:sticky lg:top-24">
            <div className="glass rounded-[28px] border border-white/5 p-6 space-y-3">
              <h3 className="text-[9px] font-black uppercase tracking-widest text-text-soft">Registration</h3>
              {!meetsReq ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-yellow-400/5 border border-yellow-400/20 text-center">
                    <Crown size={16} className="text-yellow-400 mx-auto mb-1" />
                    <p className="text-[10px] text-yellow-400 font-black uppercase">Requires {tournament.requiredPlan} Plan</p>
                  </div>
                  <Link href="/pricing" className="block w-full text-center py-3 rounded-xl bg-gradient-to-r from-accent to-accent-alt text-white font-black text-[11px] uppercase tracking-widest hover:opacity-90 transition-all">
                    Upgrade to Join
                  </Link>
                </div>
              ) : isRegistered ? (
                <div className="flex items-center gap-2 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                  <p className="text-emerald-400 font-black text-[10px] uppercase">You're registered!</p>
                </div>
              ) : tournament.status === 'registration' ? (
                <button onClick={handleRegister} disabled={registering || count >= tournament.maxPlayers}
                  className="w-full py-3 rounded-xl bg-accent text-white font-black text-[11px] uppercase tracking-widest hover:bg-accent/80 transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                  {registering ? 'Registering…' : count >= tournament.maxPlayers ? 'Full' : 'Join Tournament'}
                </button>
              ) : (
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-center">
                  <p className="text-text-soft text-[10px] font-black uppercase">
                    {tournament.status === 'upcoming' ? 'Registration opening soon' :
                     tournament.status === 'running'  ? '⚔️ Battle in progress' : 'Tournament ended'}
                  </p>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="glass rounded-[28px] border border-white/5 p-6 space-y-3">
              <h3 className="text-[9px] font-black uppercase tracking-widest text-text-soft">Details</h3>
              {[
                { label: 'Start Time', val: tournament.startTime ? new Date(tournament.startTime).toLocaleString() : 'TBA' },
                { label: 'Format',     val: tournament.format === 'single_elimination' ? 'Single Elimination' : 'Round Robin' },
                { label: 'Max Players', val: tournament.maxPlayers },
              ].map((row, i) => (
                <div key={i} className="flex justify-between items-start gap-2 py-2 border-b border-white/5 last:border-0">
                  <span className="text-[9px] text-text-soft uppercase font-black shrink-0">{row.label}</span>
                  <span className="text-[10px] font-black text-right">{row.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
