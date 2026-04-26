'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, Trophy, Flame, Sword, Users, CreditCard,
  AlertCircle, CheckCircle2, X, ExternalLink, RefreshCw,
  Sparkles, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import api from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';

interface Notification {
  id: string;
  type: 'friend_request' | 'challenge' | 'subscription' | 'streak' | 'match_result' | 'system';
  title: string;
  message: string;
  link?: string | null;
  metadata?: any;
  isRead: boolean;
  createdAt: string;
}

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  match_result:   { icon: Trophy,       color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  streak:         { icon: Flame,        color: 'text-orange-400', bg: 'bg-orange-400/10' },
  challenge:      { icon: Sword,        color: 'text-red-400',    bg: 'bg-red-400/10'    },
  friend_request: { icon: Users,        color: 'text-accent',     bg: 'bg-accent/10'     },
  subscription:   { icon: CreditCard,   color: 'text-emerald-400',bg: 'bg-emerald-400/10'},
  system:         { icon: Sparkles,     color: 'text-accent-alt', bg: 'bg-accent-alt/10' },
};

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

interface NotificationBellProps {
  /** Called with count when it changes, so parent can show the badge elsewhere */
  onCountChange?: (count: number) => void;
}

export function NotificationBell({ onCountChange }: NotificationBellProps) {
  const { user } = useAuth();
  const [isOpen,    setIsOpen]    = useState(false);
  const [notifs,    setNotifs]    = useState<Notification[]>([]);
  const [unread,    setUnread]    = useState(0);
  const [loading,   setLoading]   = useState(false);
  const [hasNew,    setHasNew]    = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const pollRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Fetch notifications ────────────────────────────────────────────────────
  const fetchNotifs = useCallback(async (silent = false) => {
    if (!user?.token) return;
    if (!silent) setLoading(true);
    try {
      const [nRes, cRes] = await Promise.all([
        api.get('/api/notifications', {
          headers: { Authorization: `Bearer ${user.token}` }
        }),
        api.get('/api/notifications/unread-count', {
          headers: { Authorization: `Bearer ${user.token}` }
        }),
      ]);
      const list: Notification[] = nRes.data.notifications || [];
      const count: number        = cRes.data.count || 0;

      setNotifs(list);

      // Animate bell if new unread arrived
      if (count > unread && unread > 0) setHasNew(true);
      setUnread(count);
      onCountChange?.(count);
    } catch {} finally {
      setLoading(false);
    }
  }, [user?.token, unread, onCountChange]);

  // Initial load + poll every 30s
  useEffect(() => {
    if (!user?.token) return;
    fetchNotifs();
    pollRef.current = setInterval(() => fetchNotifs(true), 30_000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [user?.token]);

  // Close on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    if (isOpen) document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [isOpen]);

  // Mark all read when opened
  const handleOpen = async () => {
    setIsOpen(o => !o);
    setHasNew(false);
    if (!isOpen && unread > 0 && user?.token) {
      try {
        await api.post('/api/notifications/mark-read', {}, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setUnread(0);
        onCountChange?.(0);
        setNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
      } catch {}
    }
  };

  // Delete single
  const deleteNotif = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user?.token) return;
    setNotifs(prev => prev.filter(n => n.id !== id));
    try {
      await api.delete(`/api/notifications/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
    } catch {}
  };

  if (!user) return null;

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <motion.button
        onClick={handleOpen}
        animate={hasNew ? { rotate: [0, -15, 15, -10, 10, 0] } : {}}
        transition={{ duration: 0.5, type: 'spring' }}
        className={cn(
          'flex p-2 lg:p-2.5 rounded-lg lg:rounded-xl bg-white/5 hover:bg-white/10 text-text-soft hover:text-white transition-all relative outline-none',
          isOpen && 'bg-accent/10 text-accent'
        )}
        id="notification-bell"
        aria-label="Notifications"
      >
        <Bell size={18} />
        <AnimatePresence>
          {unread > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-gradient-to-r from-red-500 to-rose-600 rounded-full border-2 border-background flex items-center justify-center text-[9px] font-black text-white z-10"
            >
              {unread > 9 ? '9+' : unread}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Notification panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="absolute right-0 top-full mt-3 w-[360px] max-w-[calc(100vw-2rem)] glass rounded-[24px] border border-white/10 shadow-2xl z-[200] overflow-hidden"
            style={{ boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <Bell size={14} className="text-accent" />
                <h3 className="text-xs font-black uppercase tracking-widest">Notifications</h3>
                {unread > 0 && (
                  <span className="px-2 py-0.5 bg-accent/20 text-accent text-[9px] font-black rounded-full">
                    {unread} new
                  </span>
                )}
              </div>
              <button
                onClick={() => fetchNotifs()}
                className={cn(
                  'p-1.5 rounded-lg text-text-soft hover:text-white hover:bg-white/5 transition-all',
                  loading && 'animate-spin'
                )}
              >
                <RefreshCw size={12} />
              </button>
            </div>

            {/* List */}
            <div className="max-h-[400px] overflow-y-auto">
              {loading && notifs.length === 0 ? (
                <div className="p-6 space-y-3">
                  {[1,2,3].map(i => (
                    <div key={i} className="flex gap-3 animate-pulse">
                      <div className="w-9 h-9 rounded-xl bg-white/5 shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-white/5 rounded-full w-3/4" />
                        <div className="h-2 bg-white/5 rounded-full w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : notifs.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto">
                    <Bell size={20} className="text-text-soft opacity-40" />
                  </div>
                  <p className="text-[11px] text-text-soft">No notifications yet</p>
                  <p className="text-[10px] text-text-soft/60">Win matches, hit streaks, and connect with friends to get alerts here.</p>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  <AnimatePresence initial={false}>
                    {notifs.map((notif, idx) => {
                      const tc = TYPE_CONFIG[notif.type] || TYPE_CONFIG.system;
                      const Icon = tc.icon;
                      return (
                        <motion.div
                          key={notif.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10, height: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          className={cn(
                            'group flex items-start gap-3 p-3 rounded-2xl border transition-all cursor-pointer hover:bg-white/5',
                            !notif.isRead
                              ? 'border-accent/20 bg-accent/[0.03]'
                              : 'border-transparent'
                          )}
                          onClick={() => {
                            if (notif.link) window.location.href = notif.link;
                          }}
                        >
                          {/* Icon */}
                          <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', tc.bg)}>
                            <Icon size={15} className={tc.color} />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className={cn(
                                'text-[11px] font-black leading-tight',
                                !notif.isRead ? 'text-white' : 'text-white/80'
                              )}>
                                {notif.title}
                              </p>
                              <div className="flex items-center gap-1 shrink-0">
                                {!notif.isRead && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                                )}
                                <button
                                  onClick={(e) => deleteNotif(notif.id, e)}
                                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded-md text-text-soft hover:text-white transition-all"
                                >
                                  <X size={10} />
                                </button>
                              </div>
                            </div>
                            <p className="text-[10px] text-text-soft leading-relaxed mt-0.5 line-clamp-2">
                              {notif.message}
                            </p>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-[9px] text-text-soft/60">{timeAgo(notif.createdAt)}</span>
                              {notif.link && (
                                <ExternalLink size={9} className="text-text-soft/40 group-hover:text-accent transition-colors" />
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-white/5 p-3 flex items-center gap-2">
              <Link
                href="/friends"
                onClick={() => setIsOpen(false)}
                className="flex-1 py-2 text-center text-[10px] font-black uppercase tracking-widest text-text-soft hover:text-white hover:bg-white/5 transition-all rounded-xl"
              >
                Social Hub
              </Link>
              {notifs.length > 0 && (
                <button
                  onClick={async () => {
                    setNotifs([]);
                    if (user?.token) {
                      try {
                        await Promise.all(notifs.map(n =>
                          api.delete(`/api/notifications/${n.id}`, {
                            headers: { Authorization: `Bearer ${user.token}` }
                          })
                        ));
                      } catch {}
                    }
                  }}
                  className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-red-400/60 hover:text-red-400 hover:bg-red-400/5 transition-all rounded-xl"
                >
                  Clear All
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
