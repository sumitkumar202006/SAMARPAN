'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Users, Calendar, Clock, Crown, Zap, Shield,
  Star, Lock, CheckCircle2, ArrowRight, RefreshCw, Plus,
  Target, Sword, Globe, ChevronRight, AlertCircle, Timer,
  Flame
} from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AvatarFrame } from '@/components/ui/AvatarFrame';
import { PlanBadge } from '@/components/ui/PlanBadge';
import { AuthGuard } from '@/components/auth/AuthGuard';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Tournament {
  id: string;
  name: string;
  description?: string;
  hostId: string;
  status: 'upcoming' | 'registration' | 'running' | 'completed';
  maxPlayers: number;
  format: 'single_elimination' | 'round_robin';
  startTime?: string;
  prize?: string;
  requiredPlan?: string;
  createdAt: string;
  participants: any[];
  _count?: { participants: number };
}

// ─── Status config ─────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  upcoming:     { label: 'Upcoming',     color: 'text-blue-400',    bg: 'bg-blue-400/10',    dot: 'bg-blue-400'    },
  registration: { label: 'Open',         color: 'text-[#00D4B4]', bg: 'bg-[#00D4B4]/10', dot: 'bg-[#00D4B4] animate-pulse' },
  running:      { label: 'Live',         color: 'text-red-400',     bg: 'bg-red-400/10',     dot: 'bg-red-400 animate-pulse' },
  completed:    { label: 'Ended',        color: 'text-text-soft',   bg: 'bg-white/5',        dot: 'bg-text-soft'   },
};

function formatDate(d?: string) {
  if (!d) return 'TBA';
  const dt = new Date(d);
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function timeUntil(d?: string) {
  if (!d) return '';
  const diff = new Date(d).getTime() - Date.now();
  if (diff < 0) return 'Started';
  const days  = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  if (days > 0) return `in ${days}d ${hours}h`;
  const mins = Math.floor((diff % 3600000) / 60000);
  if (hours > 0) return `in ${hours}h ${mins}m`;
  return `in ${mins}m`;
}

// ─── Tournament Card ──────────────────────────────────────────────────────────
function TournamentCard({ t, onRegister, isRegistering, myPlan }: {
  t: Tournament;
  onRegister: (id: string) => void;
  isRegistering: string | null;
  myPlan: string;
}) {
  const statusCfg = STATUS_CONFIG[t.status];
  const count     = t._count?.participants ?? t.participants?.length ?? 0;
  const isFull    = count >= t.maxPlayers;
  const planOrder = ['free', 'pro', 'elite', 'institution'];
  const meetsReq  = !t.requiredPlan || planOrder.indexOf(myPlan) >= planOrder.indexOf(t.requiredPlan);
  const canReg    = t.status === 'registration' && !isFull && meetsReq;
  const pct       = Math.min((count / t.maxPlayers) * 100, 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className={cn(
        'glass rounded-[28px] border overflow-hidden group transition-all duration-300',
        t.status === 'running'
          ? 'border-red-400/30 shadow-[0_0_30px_rgba(239,68,68,0.12)]'
          : t.status === 'registration'
          ? 'border-[#00D4B4]/20 shadow-[0_0_20px_rgba(34,197,94,0.08)]'
          : 'border-white/5'
      )}
    >
      {/* Live banner */}
      {t.status === 'running' && (
        <div className="bg-gradient-to-r from-red-500/20 to-orange-500/10 border-b border-red-500/20 px-5 py-2 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-400">⚔️ Battle In Progress</span>
        </div>
      )}

      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={cn('flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest', statusCfg.bg, statusCfg.color)}>
                <span className={cn('w-1.5 h-1.5 rounded-full', statusCfg.dot)} />
                {statusCfg.label}
              </span>
              {t.requiredPlan && t.requiredPlan !== 'free' && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-yellow-400/10 text-yellow-400 border border-yellow-400/20">
                  <Crown size={8} /> {t.requiredPlan}+
                </span>
              )}
            </div>
            <h3 className="font-black text-base uppercase italic tracking-tight leading-tight group-hover:text-accent transition-colors">
              {t.name}
            </h3>
            {t.description && (
              <p className="text-[11px] text-text-soft mt-1 line-clamp-2">{t.description}</p>
            )}
          </div>
          {t.prize && (
            <div className="shrink-0 px-3 py-2 rounded-2xl bg-yellow-400/10 border border-yellow-400/20 text-center">
              <Trophy size={12} className="text-yellow-400 mx-auto mb-0.5" />
              <p className="text-[9px] font-black text-yellow-400 uppercase tracking-widest">Prize</p>
              <p className="text-[10px] font-black text-white">{t.prize}</p>
            </div>
          )}
        </div>

        {/* Meta grid */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-center">
            <Users size={12} className="text-text-soft mx-auto mb-1" />
            <p className="text-[9px] text-text-soft uppercase font-black">Players</p>
            <p className="text-sm font-black">{count}<span className="text-text-soft text-[10px]">/{t.maxPlayers}</span></p>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-center">
            <Target size={12} className="text-text-soft mx-auto mb-1" />
            <p className="text-[9px] text-text-soft uppercase font-black">Format</p>
            <p className="text-[10px] font-black leading-tight">
              {t.format === 'single_elimination' ? 'Elimination' : 'Round Robin'}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-center">
            <Clock size={12} className="text-text-soft mx-auto mb-1" />
            <p className="text-[9px] text-text-soft uppercase font-black">Starts</p>
            <p className="text-[10px] font-black leading-tight">{timeUntil(t.startTime) || formatDate(t.startTime).split(',')[0]}</p>
          </div>
        </div>

        {/* Capacity bar */}
        <div>
          <div className="flex justify-between text-[8px] font-black uppercase text-text-soft mb-1">
            <span>Capacity</span>
            <span>{Math.round(pct)}%</span>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={cn(
                'h-full rounded-full',
                pct >= 90 ? 'bg-red-400' : pct >= 60 ? 'bg-amber-400' : 'bg-[#00D4B4]'
              )}
            />
          </div>
          {isFull && (
            <p className="text-[9px] text-red-400 font-black uppercase mt-1 flex items-center gap-1">
              <AlertCircle size={9} /> Tournament Full
            </p>
          )}
        </div>

        {/* Action */}
        <div className="flex gap-2">
          {!meetsReq ? (
            <div className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-text-soft text-[10px] font-black uppercase tracking-widest">
              <Lock size={11} />
              Requires {t.requiredPlan} Plan
            </div>
          ) : canReg ? (
            <button
              onClick={() => onRegister(t.id)}
              disabled={!!isRegistering}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all',
                isRegistering === t.id
                  ? 'bg-accent/20 text-accent cursor-wait'
                  : 'bg-accent text-white hover:bg-accent/80 shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)]'
              )}
            >
              {isRegistering === t.id ? (
                <><RefreshCw size={12} className="animate-spin" /> Registering…</>
              ) : (
                <><CheckCircle2 size={12} /> Join Tournament</>
              )}
            </button>
          ) : t.status === 'running' ? (
            <div className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-400/10 border border-red-400/20 text-red-400 text-[10px] font-black uppercase tracking-widest">
              <Flame size={11} /> In Progress
            </div>
          ) : t.status === 'completed' ? (
            <div className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 text-text-soft text-[10px] font-black uppercase tracking-widest">
              <Trophy size={11} /> Ended
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-400/10 border border-blue-400/20 text-blue-400 text-[10px] font-black uppercase tracking-widest">
              <Calendar size={11} /> Registration Opening Soon
            </div>
          )}
          <Link
            href={`/tournaments/${t.id}`}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-text-soft hover:text-white transition-all border border-white/5 hover:border-white/10"
          >
            <ChevronRight size={14} />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Stats Banner ─────────────────────────────────────────────────────────────
function StatBanner({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string; color: string }) {
  return (
    <div className="glass p-5 rounded-2xl border border-white/5 flex items-center gap-4">
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', color)}>
        <Icon size={18} className="text-white" />
      </div>
      <div>
        <p className="text-[9px] text-text-soft uppercase font-black tracking-widest">{label}</p>
        <p className="text-xl font-black">{value}</p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function TournamentsPage() {
  const { user } = useAuth();
  const router   = useRouter();

  const [tournaments,  setTournaments]  = useState<Tournament[]>([]);
  const [isLoading,    setIsLoading]    = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [filter,       setFilter]       = useState<string>('all');
  const [isRegistering, setIsRegistering] = useState<string | null>(null);
  const [toast,        setToast]        = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchTournaments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = filter !== 'all' ? `?status=${filter}` : '';
      const res = await api.get(`/api/tournaments${params}`);
      setTournaments(res.data.tournaments || []);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to load tournaments');
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchTournaments(); }, [fetchTournaments]);

  const handleRegister = async (id: string) => {
    if (!user?.token) { router.push('/auth'); return; }
    setIsRegistering(id);
    try {
      await api.post(`/api/tournaments/${id}/register`, {}, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      showToast('🎉 Registered successfully! Prepare for battle.');
      fetchTournaments();
    } catch (err: any) {
      showToast(err?.response?.data?.error || 'Registration failed', false);
    } finally {
      setIsRegistering(null);
    }
  };

  const FILTERS = [
    { id: 'all',          label: 'All',           icon: Globe  },
    { id: 'registration', label: 'Open',          icon: CheckCircle2 },
    { id: 'running',      label: '🔴 Live',        icon: Flame  },
    { id: 'upcoming',     label: 'Upcoming',      icon: Calendar },
    { id: 'completed',    label: 'Completed',     icon: Trophy },
  ];

  const liveCount = tournaments.filter(t => t.status === 'running').length;
  const openCount = tournaments.filter(t => t.status === 'registration').length;
  const myPlan = user?.plan || 'free';

  return (
    <AuthGuard>
      <div className="py-2 lg:py-10 space-y-10">

        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={cn(
                'fixed top-24 left-1/2 -translate-x-1/2 z-[500] px-5 py-3 rounded-2xl border backdrop-blur-xl text-[11px] font-black uppercase tracking-widest',
                toast.ok
                  ? 'bg-[#00D4B4]/10 border-[#00D4B4]/30 text-[#00D4B4]'
                  : 'bg-red-500/10 border-red-500/30 text-red-400'
              )}
            >
              {toast.msg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 px-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Trophy size={20} className="text-yellow-400" />
              <h1 className="text-3xl lg:text-4xl font-black tracking-tight uppercase italic">
                Tournaments
              </h1>
              {liveCount > 0 && (
                <span className="flex items-center gap-1 px-2 py-1 bg-red-500/20 border border-red-500/30 rounded-full text-[9px] font-black text-red-400 uppercase tracking-widest animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  {liveCount} Live
                </span>
              )}
            </div>
            <p className="text-text-soft text-sm">
              Compete in structured bracket tournaments. Only on Blaze Pro+.
            </p>
          </div>

          {/* Host button — Pro+ only */}
          {(myPlan === 'pro' || myPlan === 'elite' || myPlan === 'institution') ? (
            <Link
              href="/tournaments/create"
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-accent to-accent-alt text-white font-black text-[11px] uppercase tracking-widest hover:opacity-90 transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)]"
            >
              <Plus size={14} /> Host Tournament
            </Link>
          ) : (
            <Link
              href="/pricing"
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-text-soft font-black text-[11px] uppercase tracking-widest hover:bg-white/10 transition-all"
            >
              <Crown size={14} className="text-yellow-400" /> Upgrade to Host
            </Link>
          )}
        </div>

        {/* Stats banner */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatBanner icon={Flame}   label="Live Now"    value={String(liveCount)}  color="bg-red-500/20"     />
          <StatBanner icon={Users}   label="Open Reg"    value={String(openCount)}  color="bg-[#00D4B4]/20" />
          <StatBanner icon={Target}  label="Total"       value={String(tournaments.length)} color="bg-accent/20" />
          <StatBanner icon={Crown}   label="Your Plan"   value={myPlan.toUpperCase()} color="bg-yellow-500/20" />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-1">
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border',
                filter === f.id
                  ? 'bg-accent text-white border-accent/50 shadow-[0_0_15px_rgba(99,102,241,0.3)] scale-105'
                  : 'glass border-white/5 text-text-soft hover:text-white hover:border-white/20'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Tournament grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="glass rounded-[28px] border border-white/5 p-6 space-y-4 animate-pulse">
                <div className="h-4 bg-white/5 rounded-full w-2/3" />
                <div className="h-3 bg-white/5 rounded-full w-1/2" />
                <div className="grid grid-cols-3 gap-2">
                  {[1,2,3].map(j => <div key={j} className="h-16 bg-white/5 rounded-xl" />)}
                </div>
                <div className="h-10 bg-white/5 rounded-xl" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="glass rounded-[32px] border border-red-500/20 p-16 text-center space-y-4">
            <AlertCircle size={32} className="text-red-400 mx-auto" />
            <p className="text-red-400 font-black uppercase text-xs">{error}</p>
            <button
              onClick={fetchTournaments}
              className="flex items-center gap-2 mx-auto px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-black text-xs uppercase hover:bg-red-500/20 transition-all"
            >
              <RefreshCw size={12} /> Retry
            </button>
          </div>
        ) : tournaments.length === 0 ? (
          <div className="glass rounded-[40px] border border-white/5 p-20 text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto">
              <Trophy size={32} className="text-accent/40" />
            </div>
            <div className="space-y-2">
              <h3 className="font-black text-lg uppercase italic">No Tournaments Yet</h3>
              <p className="text-text-soft text-sm max-w-xs mx-auto">
                Be the first to host a tournament and rally the arena.
              </p>
            </div>
            {(myPlan === 'pro' || myPlan === 'elite' || myPlan === 'institution') && (
              <Link
                href="/tournaments/create"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-accent text-white font-black text-sm uppercase tracking-widest hover:bg-accent/80 transition-all"
              >
                <Plus size={16} /> Create First Tournament
              </Link>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {tournaments.map((t, i) => (
                <motion.div key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
                  <TournamentCard
                    t={t}
                    onRegister={handleRegister}
                    isRegistering={isRegistering}
                    myPlan={myPlan}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Upgrade CTA */}
        {myPlan === 'free' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-[40px] border border-accent/20 p-8 lg:p-12 text-center space-y-6 relative overflow-hidden"
            style={{ background: 'radial-gradient(ellipse at top, rgba(99,102,241,0.08) 0%, transparent 70%)' }}
          >
            <div className="absolute inset-0 pointer-events-none opacity-30"
              style={{ background: 'conic-gradient(from 180deg at 50% 50%, transparent 30%, rgba(99,102,241,0.1) 50%, transparent 70%)' }} />
            <div className="relative z-10 space-y-4">
              <Crown size={28} className="text-yellow-400 mx-auto" />
              <h3 className="text-2xl font-black uppercase italic">Unlock Tournaments</h3>
              <p className="text-text-soft max-w-md mx-auto text-sm leading-relaxed">
                Tournament hosting and priority registration is available on <strong className="text-white">Blaze Pro</strong> and above. 
                Join the elite tier and command the bracket.
              </p>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 px-8 py-3 rounded-2xl bg-gradient-to-r from-accent to-accent-alt text-white font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-[0_0_30px_rgba(99,102,241,0.3)]"
              >
                <Zap size={16} /> Upgrade to Pro — ₹99/mo
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </AuthGuard>
  );
}
