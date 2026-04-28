'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, ChevronDown, ChevronUp,
  Globe, Zap, BookOpen, Cpu, FlaskConical, Map, RefreshCw,
  Flame, Sword, Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';
import { AvatarFrame } from '@/components/ui/AvatarFrame';
import { AuthGuard } from '@/components/auth/AuthGuard';

const PERIODS = ['Weekly', 'Monthly', 'All-time'] as const;
type Period = typeof PERIODS[number];

const CATEGORIES = [
  { id: 'all', label: 'All Arenas', icon: Globe },
  { id: 'Computer Science', label: 'CS & Tech', icon: Cpu },
  { id: 'Mathematics', label: 'Maths', icon: Zap },
  { id: 'Science', label: 'Science', icon: FlaskConical },
  { id: 'History', label: 'History', icon: BookOpen },
  { id: 'Geography', label: 'Geography', icon: Map },
] as const;

type CategoryId = typeof CATEGORIES[number]['id'];

function getRankFromRating(r: number): string {
  if (r >= 2200) return 'Grandmaster';
  if (r >= 2000) return 'Master';
  if (r >= 1800) return 'Diamond';
  if (r >= 1600) return 'Platinum';
  if (r >= 1400) return 'Gold';
  if (r >= 1200) return 'Silver II';
  if (r >= 1100) return 'Silver I';
  if (r >= 1000) return 'Bronze II';
  return 'Bronze I';
}

function RowSkeleton() {
  return (
    <tr className="animate-pulse">
      <td className="px-6 py-5"><div className="h-3 bg-white/5 rounded-full w-6" /></td>
      <td className="px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/5 shrink-0" />
          <div className="flex flex-col gap-1.5">
            <div className="h-3 bg-white/5 rounded-full w-24" />
            <div className="h-2 bg-white/5 rounded-full w-16" />
          </div>
        </div>
      </td>
      <td className="px-6 py-5"><div className="h-6 bg-white/5 rounded-xl w-16" /></td>
      <td className="px-6 py-5 hidden lg:table-cell"><div className="h-3 bg-white/5 rounded-full w-12" /></td>
    </tr>
  );
}

function PodiumCard({ player, rank }: { player: any; rank: number }) {
  const medals = ['🥇', '🥈', '🥉'];
  const colors = [
    'border-yellow-400/40 shadow-[0_0_30px_rgba(234,179,8,0.15)]',
    'border-slate-400/40 shadow-[0_0_20px_rgba(148,163,184,0.1)]',
    'border-amber-700/40 shadow-[0_0_20px_rgba(180,83,9,0.1)]',
  ];
  const textColors = ['text-yellow-400', 'text-slate-300', 'text-amber-600'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: rank === 1 ? -8 : 0 }}
      transition={{ delay: (rank - 1) * 0.1 }}
      className={cn('glass rounded-[24px] border p-5 flex flex-col items-center gap-3 text-center', colors[rank - 1])}
    >
      <span className="text-2xl">{medals[rank - 1]}</span>
      <AvatarFrame src={player.avatar} name={player.name} size="lg" frame={player.avatarFrame} plan={player.plan} />
      <div>
        <p className="font-black text-sm uppercase italic tracking-tight">{player.name}</p>
        {player.username && <p className="text-[9px] text-text-soft">@{player.username}</p>}
        <p className={cn('text-[10px] font-black mt-1', textColors[rank - 1])}>{getRankFromRating(player.score || 1200)}</p>
      </div>
      <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
        <span className={cn('font-black text-base', textColors[rank - 1])}>{player.score || 0}</span>
        <span className="text-[9px] text-text-soft ml-1">ELO</span>
      </div>
    </motion.div>
  );
}

export default function LeaderboardPage() {
  const { user, profileCompletion } = useAuth();

  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activePeriod, setActivePeriod] = useState<Period>('All-time');
  const [activeCategory, setActiveCategory] = useState<CategoryId>('all');
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ period: activePeriod.toLowerCase() });
      if (activeCategory !== 'all') params.set('category', activeCategory);
      const res = await api.get(`/api/explore/leaderboard?${params}`);
      setData(res.data.scores || []);
    } catch (err) {
      setError('Failed to load rankings.');
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [activePeriod, activeCategory]);

  useEffect(() => { fetchLeaderboard(); }, [fetchLeaderboard]);

  const myRank = data.findIndex(p => p.name === user?.name || p.username === user?.username) + 1;
  const top3   = data.slice(0, 3);
  const rest   = data.slice(3);

  return (
    <AuthGuard>
      <div className="py-2 lg:py-10 space-y-10">

        <div className="flex flex-col gap-1 px-2">
          <h1 className="text-3xl lg:text-4xl font-black tracking-tight uppercase italic">Global Rankings</h1>
          <p className="text-text-soft text-xs lg:text-sm">Real-time neural standings of elite pilots in the Qyro Arena.</p>
        </div>

        {/* My Standing Banner */}
        <div className="glass rounded-[32px] border border-white/5 p-6 flex flex-col sm:flex-row items-center gap-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-accent/5 to-transparent pointer-events-none" />
          <AvatarFrame src={user?.avatar} name={user?.name} size="xl" frame={user?.avatarFrame} plan={user?.plan} />
          <div className="flex-1 relative z-10 text-center sm:text-left">
            <h3 className="text-xl font-black uppercase italic">{user?.name}</h3>
            {myRank > 0 ? (
              <p className="text-accent font-black text-sm">Global Rank #{myRank}</p>
            ) : (
              <p className="text-text-soft text-sm">Play matches to appear on the leaderboard</p>
            )}
            <p className="text-text-soft text-[11px]">{getRankFromRating(user?.globalRating || 1200)} · {user?.globalRating || 1200} ELO</p>
          </div>
          <div className="grid grid-cols-3 gap-3 relative z-10">
            {[
              { label: 'Streak',   val: `${user?.dailyStreak   || 0}🔥`, icon: Flame  },
              { label: 'Wins',     val:   user?.totalWins       || 0,    icon: Trophy  },
              { label: 'Best',     val: `${user?.bestWinStreak  || 0}W`,  icon: Sword  },
            ].map((s, i) => (
              <div key={i} className="p-3 rounded-2xl bg-white/5 border border-white/5 text-center">
                <s.icon size={12} className="text-text-soft mx-auto mb-1" />
                <p className="text-[8px] text-text-soft uppercase font-black">{s.label}</p>
                <p className="font-black text-sm">{s.val}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 items-start">

          {/* ── Podium ─────────────────────────── */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 px-2">
              <div className="w-5 h-5 rounded-full bg-yellow-400/20 flex items-center justify-center text-yellow-400 text-[10px]">🏆</div>
              <h2 className="text-xs font-black uppercase tracking-widest text-text-soft italic">Podium</h2>
            </div>
            {isLoading ? (
              <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="glass rounded-[24px] border border-white/5 h-40 animate-pulse" />)}</div>
            ) : top3.length > 0 ? (
              <div className="grid gap-3">
                {top3.map((p, idx) => <PodiumCard key={p.name} player={p} rank={idx + 1} />)}
              </div>
            ) : (
              <div className="glass rounded-[24px] border border-white/5 p-12 text-center text-text-soft text-[11px]">No rankings yet</div>
            )}

            {/* ELO Info */}
            <div className="glass p-6 rounded-[28px] border border-white/5 space-y-4">
              <div className="flex items-center gap-3">
                <Shield size={14} className="text-accent" />
                <h4 className="text-[10px] font-black uppercase tracking-widest">ELO Methodology</h4>
              </div>
              <p className="text-[10px] text-text-soft leading-relaxed border-l-2 border-accent/30 pl-3 italic">
                A neural ELO formula adjusts your rating based on opponent strength, quiz difficulty, and speed accuracy.
              </p>
              {[
                { l: 'vs Elite Pilot', d: '+30~50 pts' },
                { l: 'vs Recruit',     d: '+5~10 pts'  },
                { l: 'Defeat penalty', d: '−20 pts'    },
                { l: 'Base rating',    d: '1200'        },
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center p-2 rounded-lg bg-white/5 border border-white/5">
                  <span className="text-[9px] font-black uppercase text-white">{item.l}</span>
                  <span className="text-[8px] text-accent uppercase font-black">{item.d}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Rankings Table ─────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-2">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[#00D4B4]/20 flex items-center justify-center text-[#00D4B4] text-[10px]">2</div>
                <h2 className="text-xs font-black uppercase tracking-widest text-text-soft italic">Hall of Fame</h2>
              </div>
              <div className="flex gap-2 ml-auto">
                {PERIODS.map(p => (
                  <button
                    key={p}
                    onClick={() => setActivePeriod(p)}
                    className={cn(
                      'px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap',
                      activePeriod === p ? 'bg-accent text-white shadow-[0_0_12px_rgba(99,102,241,0.3)]' : 'glass text-text-soft hover:text-white'
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-1">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id as CategoryId)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap border',
                    activeCategory === cat.id
                      ? 'border-accent-alt/50 bg-accent-alt/10 text-accent-alt'
                      : 'border-white/5 bg-white/[0.02] text-text-soft hover:border-white/20'
                  )}
                >
                  <cat.icon size={9} />
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="glass rounded-[32px] overflow-hidden border-white/5 pb-2">
              <div className={cn('overflow-x-auto transition-all duration-700 relative', isExpanded ? 'max-h-[2000px]' : 'max-h-[600px]')}>
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-white/5 text-[9px] uppercase tracking-[0.2em] text-text-soft font-black">
                      <th className="px-6 py-4">Pos</th>
                      <th className="px-6 py-4">Pilot</th>
                      <th className="px-6 py-4">ELO</th>
                      <th className="px-6 py-4 hidden lg:table-cell">Tier</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    <AnimatePresence mode="wait">
                      {isLoading ? (
                        <>{Array.from({ length: 8 }).map((_, i) => <RowSkeleton key={i} />)}</>
                      ) : error ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-12 text-center">
                            <p className="text-red-400 text-[10px] font-black uppercase">{error}</p>
                            <button onClick={fetchLeaderboard} className="flex items-center gap-2 mx-auto mt-3 text-accent text-[10px] font-black uppercase hover:underline">
                              <RefreshCw size={12} /> Retry
                            </button>
                          </td>
                        </tr>
                      ) : data.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-10 text-center text-text-soft italic text-[10px]">
                            No pilots ranked yet. Play a match to appear here.
                          </td>
                        </tr>
                      ) : (
                        rest.map((player, i) => {
                          const absRank = i + 4;
                          const isMe = player.name === user?.name || player.username === user?.username;
                          return (
                            <motion.tr
                              key={absRank}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: Math.min(i * 0.03, 0.3) }}
                              className={cn('hover:bg-white/[0.03] transition-colors group cursor-pointer', isMe && 'bg-accent/5 border-l-2 border-accent')}
                            >
                              <td className="px-6 py-4 font-black text-xs text-text-soft">#{absRank}</td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <AvatarFrame src={player.avatar} name={player.name} size="xs" frame={player.avatarFrame} showFrame={!!player.avatarFrame && player.avatarFrame !== 'none'} />
                                  <div className="flex flex-col">
                                    <span className={cn('font-black text-sm uppercase italic group-hover:text-accent transition-colors', isMe && 'text-accent')}>
                                      {player.name} {isMe && <span className="text-[9px] normal-case not-italic">(you)</span>}
                                    </span>
                                    {player.username && <span className="text-[8px] text-text-soft">@{player.username}</span>}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={cn('px-3 py-1.5 rounded-xl font-black text-xs border', isMe ? 'bg-accent/20 text-accent border-accent/40' : 'bg-accent/10 text-accent border-accent/20')}>
                                  {player.score || 0}
                                </span>
                              </td>
                              <td className="px-6 py-4 hidden lg:table-cell">
                                <span className="text-[9px] text-text-soft font-black uppercase">{getRankFromRating(player.score || 1200)}</span>
                              </td>
                            </motion.tr>
                          );
                        })
                      )}
                    </AnimatePresence>
                  </tbody>
                </table>

                {!isExpanded && rest.length > 10 && (
                  <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background/90 via-background/40 to-transparent pointer-events-none z-10" />
                )}
              </div>

              {rest.length > 10 && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="w-full py-4 text-[10px] font-black uppercase tracking-[0.3em] text-accent hover:text-accent-alt transition-all flex items-center justify-center gap-3 border-t border-white/5 bg-white/[0.01]"
                >
                  {isExpanded ? <><ChevronUp size={14} /> Condense</> : <><ChevronDown size={14} /> View All {data.length} Pilots</>}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
