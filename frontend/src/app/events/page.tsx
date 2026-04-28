'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Users, Plus, Check, X, Bell, RefreshCw, AlertCircle, Flame, ChevronRight, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';
import { AvatarFrame } from '@/components/ui/AvatarFrame';
import { AuthGuard } from '@/components/auth/AuthGuard';
import Link from 'next/link';

const STATUS = {
  upcoming: { label: 'Upcoming', color: 'text-blue-400',    bg: 'bg-blue-400/10',    dot: 'bg-blue-400'             },
  live:     { label: '🔴 Live',   color: 'text-red-400',     bg: 'bg-red-400/10',     dot: 'bg-red-400 animate-pulse' },
  ended:    { label: 'Ended',     color: 'text-text-soft',   bg: 'bg-white/5',        dot: 'bg-text-soft'             },
};

function timeUntil(d: string) {
  const diff = new Date(d).getTime() - Date.now();
  if (diff < 0) return 'Started';
  const days  = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins  = Math.floor((diff % 3600000) / 60000);
  if (days > 0)  return `in ${days}d ${hours}h`;
  if (hours > 0) return `in ${hours}h ${mins}m`;
  return `in ${mins}m`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function EventCard({ event, myId, onRsvp }: { event: any; myId?: string; onRsvp: (id: string) => void }) {
  const st   = STATUS[event.status as keyof typeof STATUS] || STATUS.upcoming;
  const rsvpd = event.rsvps?.some((r: any) => r.userId === myId);
  const count = event._count?.rsvps || 0;
  const pct   = Math.min((count / event.maxPlayers) * 100, 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className={cn(
        'glass rounded-[24px] border p-5 flex flex-col gap-4 group transition-all',
        event.status === 'live' ? 'border-red-400/30 shadow-[0_0_20px_rgba(239,68,68,0.1)]' : 'border-white/5 hover:border-white/10'
      )}
    >
      {/* Live banner */}
      {event.status === 'live' && (
        <div className="flex items-center gap-2 p-2 rounded-xl bg-red-500/10 border border-red-500/20">
          <Radio size={12} className="text-red-400 animate-pulse" />
          <span className="text-[10px] font-black uppercase text-red-400 tracking-widest">Live Now</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest mb-1', st.bg, st.color)}>
            <span className={cn('w-1.5 h-1.5 rounded-full', st.dot)} />{st.label}
          </span>
          <h3 className="font-black text-sm uppercase italic tracking-tight group-hover:text-accent transition-colors line-clamp-2">{event.title}</h3>
          {event.description && <p className="text-[10px] text-text-soft mt-1 line-clamp-2">{event.description}</p>}
        </div>
        {event.recurrence && (
          <span className="px-2 py-1 rounded-xl bg-accent/10 border border-accent/20 text-accent text-[9px] font-black uppercase shrink-0">
            🔄 {event.recurrence}
          </span>
        )}
      </div>

      {/* Meta */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5 text-center">
          <Clock size={10} className="text-text-soft mx-auto mb-1" />
          <p className="text-[8px] text-text-soft uppercase font-black">Time</p>
          <p className="text-[10px] font-black">{timeUntil(event.scheduledAt)}</p>
        </div>
        <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5 text-center">
          <Calendar size={10} className="text-text-soft mx-auto mb-1" />
          <p className="text-[8px] text-text-soft uppercase font-black">Date</p>
          <p className="text-[9px] font-black leading-tight">{formatDate(event.scheduledAt)}</p>
        </div>
        <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5 text-center">
          <Users size={10} className="text-text-soft mx-auto mb-1" />
          <p className="text-[8px] text-text-soft uppercase font-black">RSVPs</p>
          <p className="text-[10px] font-black">{count}<span className="text-text-soft text-[8px]">/{event.maxPlayers}</span></p>
        </div>
      </div>

      {/* Capacity bar */}
      <div>
        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }} animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8 }}
            className={cn('h-full rounded-full', pct >= 90 ? 'bg-red-400' : pct >= 60 ? 'bg-amber-400' : 'bg-[#00D4B4]')}
          />
        </div>
      </div>

      {/* RSVP Avatars */}
      {event.rsvps?.length > 0 && (
        <div className="flex items-center gap-1">
          {event.rsvps.slice(0, 5).map((r: any, i: number) => (
            <div key={i} className="w-6 h-6 rounded-full ring-2 ring-background overflow-hidden" style={{ marginLeft: i > 0 ? -8 : 0 }}>
              {r.user?.avatar ? <img src={r.user.avatar} alt="" className="w-full h-full object-cover" /> :
               <div className="w-full h-full bg-accent/30 flex items-center justify-center text-[8px] font-black">{r.user?.name?.[0]}</div>}
            </div>
          ))}
          {count > 5 && <span className="text-[9px] text-text-soft ml-2">+{count - 5} more</span>}
        </div>
      )}

      {/* RSVP Button */}
      {event.status !== 'ended' && (
        <button
          onClick={() => onRsvp(event.id)}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all',
            rsvpd
              ? 'bg-[#00D4B4]/10 text-[#00D4B4] border border-[#00D4B4]/30 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30'
              : 'bg-accent/10 text-accent border border-accent/20 hover:bg-accent hover:text-white'
          )}
        >
          {rsvpd ? <><Check size={12} /> RSVP'd — Click to Cancel</> : <><Bell size={12} /> RSVP & Get Notified</>}
        </button>
      )}
    </motion.div>
  );
}

export default function EventsPage() {
  const { user } = useAuth();
  const [events,  setEvents]  = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [filter,  setFilter]  = useState('upcoming');
  const [toast,   setToast]   = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3200);
  };

  const fetchEvents = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await api.get(`/api/events?status=${filter}`);
      setEvents(res.data.events || []);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const handleRsvp = async (id: string) => {
    if (!user?.token) return showToast('Log in to RSVP', false);
    try {
      const res = await api.post(`/api/events/${id}/rsvp`, {}, { headers: { Authorization: `Bearer ${user.token}` } });
      showToast(res.data.rsvped ? '🔔 RSVP confirmed!' : 'RSVP cancelled');
      fetchEvents();
    } catch (err: any) {
      showToast(err?.response?.data?.error || 'Failed', false);
    }
  };

  const liveCount     = events.filter(e => e.status === 'live').length;
  const upcomingCount = events.filter(e => e.status === 'upcoming').length;

  return (
    <AuthGuard>
      <div className="py-2 lg:py-10 space-y-8">
        <AnimatePresence>
          {toast && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className={cn('fixed top-24 left-1/2 -translate-x-1/2 z-[500] px-5 py-3 rounded-2xl border backdrop-blur-xl text-[11px] font-black uppercase tracking-widest',
                toast.ok ? 'bg-[#00D4B4]/10 border-[#00D4B4]/30 text-[#00D4B4]' : 'bg-red-500/10 border-red-500/30 text-red-400'
              )}>{toast.msg}</motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Calendar size={20} className="text-accent-alt" />
              <h1 className="text-3xl lg:text-4xl font-black tracking-tight uppercase italic">Events</h1>
              {liveCount > 0 && (
                <span className="flex items-center gap-1 px-2 py-1 bg-red-500/20 border border-red-500/30 rounded-full text-[9px] font-black text-red-400 uppercase animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />{liveCount} Live
                </span>
              )}
            </div>
            <p className="text-text-soft text-sm">{upcomingCount} upcoming · RSVP to get notified when it starts.</p>
          </div>
          {user && (
            <Link href="/events/create"
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-accent to-accent-alt text-white font-black text-[11px] uppercase tracking-widest hover:opacity-90 transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)]">
              <Plus size={14} /> Schedule Event
            </Link>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Live Now',  val: liveCount,     icon: Radio,    color: 'bg-red-500/20'     },
            { label: 'Upcoming',  val: upcomingCount, icon: Calendar, color: 'bg-blue-500/20'    },
            { label: 'Total',     val: events.length, icon: Flame,    color: 'bg-accent/20'      },
          ].map((s, i) => (
            <div key={i} className="glass p-4 rounded-2xl border border-white/5 flex items-center gap-3">
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', s.color)}>
                <s.icon size={16} className="text-white" />
              </div>
              <div>
                <p className="text-[8px] text-text-soft uppercase font-black">{s.label}</p>
                <p className="text-xl font-black">{s.val}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {['upcoming', 'live', 'ended', 'all'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn('px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all capitalize',
                filter === f ? 'bg-accent text-white border-accent/50 scale-105' : 'glass border-white/5 text-text-soft hover:text-white'
              )}>{f === 'live' ? '🔴 Live' : f}</button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1,2,3,4].map(i => <div key={i} className="glass rounded-[24px] border border-white/5 h-64 animate-pulse" />)}
          </div>
        ) : error ? (
          <div className="glass rounded-[32px] border border-red-500/20 p-12 text-center space-y-4">
            <AlertCircle size={32} className="text-red-400 mx-auto" />
            <p className="text-red-400 font-black">{error}</p>
            <button onClick={fetchEvents} className="flex items-center gap-2 mx-auto px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-black text-xs uppercase">
              <RefreshCw size={12} /> Retry
            </button>
          </div>
        ) : events.length === 0 ? (
          <div className="glass rounded-[40px] border border-white/5 p-20 text-center space-y-4">
            <Calendar size={36} className="text-text-soft/30 mx-auto" />
            <h3 className="font-black text-lg uppercase italic">No Events Yet</h3>
            <p className="text-text-soft text-sm">Be the first to schedule a community quiz event.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {events.map((e, i) => (
              <EventCard key={e.id} event={e} myId={user?.id} onRsvp={handleRsvp} />
            ))}
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
