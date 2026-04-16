'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Star, TrendingUp, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';
import { CollapsibleCard } from '@/components/ui/CollapsibleCard';

const dummyLeaderboard = [
  { rank: 1, name: "MindBreaker", rating: 1842, quizzes: 127, avgScore: "92%", bestRank: "#1" },
  { rank: 2, name: "QuizSniper", rating: 1765, quizzes: 119, avgScore: "89%", bestRank: "#1" },
  { rank: 3, name: "NightCrawler", rating: 1710, quizzes: 102, avgScore: "87%", bestRank: "#2" },
  { rank: 4, name: "RaptorX", rating: 1669, quizzes: 98, avgScore: "85%", bestRank: "#3" },
  { rank: 5, name: "ShadowWizard", rating: 1622, quizzes: 110, avgScore: "84%", bestRank: "#4" },
];

export default function LeaderboardPage() {
  const { user, profileCompletion } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const res = await api.get('/leaderboard');
        setData(res.data.scores || []);
      } catch (err) {
        console.error('Failed to fetch leaderboard', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchLeaderboard();
  }, []);

  return (
    <div className="py-2 lg:py-10 space-y-10">
      <div className="flex flex-col gap-1 px-2">
        <h2 className="text-3xl lg:text-4xl font-black tracking-tight uppercase italic">Global Rankings</h2>
        <p className="text-text-soft text-xs lg:text-sm">Real-time neural standing of the elite pilots in the Samarpan Arena.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        
        {/* Track 1: User Standings */}
        <div className="space-y-6">
           <div className="flex items-center gap-3 px-2">
            <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center text-accent text-[10px]">1</div>
            <h2 className="text-xs font-black uppercase tracking-widest text-text-soft italic">Your Standing</h2>
          </div>

          <div className="glass p-8 rounded-[40px] border-white/5 space-y-8 relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 blur-[60px] rounded-full group-hover:bg-accent/10 transition-all" />
             
             <div className="relative z-10 flex flex-col items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-accent to-accent-alt p-1">
                   <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden border-2 border-background">
                      <img src={user?.avatar || '/favicon.ico'} className="w-full h-full object-cover" />
                   </div>
                </div>
                <div className="text-center">
                   <h3 className="text-lg font-black uppercase italic tracking-tight">{user?.name || 'GUEST_PILOT'}</h3>
                   <span className="text-[10px] text-accent font-black tracking-widest uppercase mt-1">RANK: UNCALIBRATED</span>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                   <p className="text-[9px] text-text-soft uppercase font-black mb-1">Elo rating</p>
                   <p className="text-2xl font-black text-accent-alt">{user?.globalRating || 1200}</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                   <p className="text-[9px] text-text-soft uppercase font-black mb-1">XP level</p>
                   <p className="text-2xl font-black">L12</p>
                </div>
             </div>
             
             <div className="p-4 rounded-2xl bg-accent-soft/10 border border-accent/20">
                <div className="flex justify-between text-[8px] font-black uppercase text-text-soft mb-2">
                   <span>Neural Sync</span>
                   <span>{profileCompletion}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                   <div className="h-full bg-accent rounded-full" style={{ width: `${profileCompletion}%` }} />
                </div>
             </div>
          </div>

          <div className="glass p-6 rounded-3xl border-white/5 space-y-4">
             <div className="flex items-center gap-3">
                <Medal className="text-yellow-400" size={18} />
                <h4 className="text-[10px] font-black uppercase tracking-widest">Achieved Medals</h4>
             </div>
             <div className="flex flex-wrap gap-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center grayscale opacity-30 hover:grayscale-0 hover:opacity-100 transition-all cursor-help" title="Locked Achievement">
                    <Star size={14} />
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* Track 2: The Hall of Fame */}
        <div className="lg:col-span-1 space-y-6">
           <div className="flex items-center gap-3 px-2">
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 text-[10px]">2</div>
            <h2 className="text-xs font-black uppercase tracking-widest text-text-soft italic">Hall of Fame</h2>
          </div>

          <div className="flex gap-2 px-2 overflow-x-auto pb-2 scrollbar-none">
            {['Weekly', 'Monthly', 'Arena All-time'].map((filter, i) => (
              <button 
                key={i}
                className={cn(
                  "px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap",
                  i === 0 
                    ? "bg-accent text-white shadow-[0_0_15px_rgba(99,102,241,0.3)] ring-1 ring-white/10 scale-105" 
                    : "glass text-text-soft hover:text-white"
                )}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="glass rounded-[32px] overflow-hidden border-white/5 pb-2">
            <div className={cn(
              "overflow-x-auto transition-all duration-700 relative",
              isExpanded ? "max-h-[2000px]" : "max-h-[600px]"
            )}>
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white/5 text-[9px] uppercase tracking-[0.2em] text-text-soft font-black">
                    <th className="px-6 py-4">POS</th>
                    <th className="px-6 py-4">Pilot</th>
                    <th className="px-6 py-4">Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {isLoading ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-20 text-center animate-pulse text-text-soft uppercase text-[10px] font-black">Decrypting rankings...</td>
                    </tr>
                  ) : (
                    data.map((player, i) => (
                      <motion.tr 
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        key={i} 
                        className="hover:bg-white/[0.03] transition-colors group cursor-pointer"
                      >
                        <td className="px-6 py-5 font-black text-xs text-text-soft">
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${(i + 1)}`}
                        </td>
                        <td className="px-6 py-5">
                           <div className="flex flex-col">
                             <span className="font-black text-sm uppercase italic group-hover:text-accent transition-colors">{player.name}</span>
                             <span className="text-[8px] text-text-soft uppercase tracking-widest">Lvl {10 + i}</span>
                           </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className="bg-accent/10 text-accent px-3 py-1.5 rounded-xl font-black text-xs border border-accent/20">
                            {player.rating || player.score || player.pts || 0}
                          </span>
                        </td>
                      </motion.tr>
                    ))
                  )}
                  {data.length === 0 && !isLoading && (
                    <tr>
                      <td colSpan={3} className="px-6 py-10 text-center text-text-soft italic text-[10px]">No pilots discovered in this cycle.</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {!isExpanded && data.length > 10 && (
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background/90 via-background/40 to-transparent pointer-events-none z-10" />
              )}
            </div>

            {data.length > 10 && (
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full py-4 text-[10px] font-black uppercase tracking-[0.3em] text-accent hover:text-accent-alt transition-all flex items-center justify-center gap-3 border-t border-white/5 bg-white/[0.01]"
              >
                {isExpanded ? (
                  <><ChevronUp size={14} /> Condense Standings</>
                ) : (
                  <><ChevronDown size={14} /> Full Hub Rankings ({data.length})</>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Track 3: Strategic Intel */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="w-5 h-5 rounded-full bg-accent-alt/20 flex items-center justify-center text-accent-alt text-[10px]">3</div>
            <h2 className="text-xs font-black uppercase tracking-widest text-text-soft italic">System Logic</h2>
          </div>

          <CollapsibleCard title="Elo Methodology" icon={TrendingUp} isDefaultExpanded={true}>
             <div className="space-y-4 pt-2">
                <p className="text-[10px] text-text-soft leading-relaxed border-l-2 border-accent/30 pl-4 italic">
                  Behind the scenes, a custom neural Elo-formula updates your weight based on opponent strength and theater difficulty.
                </p>
                <div className="grid gap-3">
                   {[
                     { l: 'Victory vs Elite', d: 'Significant gain' },
                     { l: 'Defeat vs Recruit', d: 'Critical loss' },
                     { l: 'Global Seed', d: '1200 Rating base' }
                   ].map((item, i) => (
                      <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5">
                         <span className="text-[9px] font-black uppercase tracking-widest text-white">{item.l}</span>
                         <span className="text-[8px] text-accent uppercase font-black">{item.d}</span>
                      </div>
                   ))}
                </div>
             </div>
          </CollapsibleCard>

          <CollapsibleCard title="Arena Modes" icon={Filter} isDefaultExpanded={false}>
             <div className="space-y-3 pt-2">
                {[
                  { title: 'Blitz', sub: 'Single round burst' },
                  { title: 'Theater', sub: 'High stakes ranked' },
                  { title: 'Practice', sub: 'Zero neural weight' }
                ].map((m, i) => (
                   <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-all">
                      <p className="text-sm font-black uppercase italic group-hover:text-accent-alt transition-colors">{m.title}</p>
                      <p className="text-[9px] text-text-soft uppercase tracking-widest">{m.sub}</p>
                   </div>
                ))}
             </div>
          </CollapsibleCard>

          <div className="p-8 rounded-[40px] bg-gradient-to-tr from-accent-alt/10 to-transparent border border-accent-alt/20 text-center space-y-3">
             <Trophy className="text-accent-alt mx-auto" size={24} />
             <h4 className="font-black italic uppercase text-xs">Season Zero</h4>
             <p className="text-[10px] text-text-soft italic leading-relaxed">Top 100 pilots at the end of the semester will receive an EXCLUSIVE <span className="text-accent underline font-black">Neural Core</span> badge.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
