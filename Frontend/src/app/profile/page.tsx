'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { 
  Trophy, 
  Target, 
  Activity, 
  Award, 
  Zap, 
  Clock,
  TrendingUp,
  BarChart2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/axios';

export default function ProfilePage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.email) {
        setLoading(false);
        return;
      }
      try {
        const [profileRes, historyRes] = await Promise.all([
          api.get(`/api/profile/${user.email}`),
          api.get(`/ratings/${user.email}`)
        ]);
        setStats(profileRes.data);
        setHistory(historyRes.data.history || []);
      } catch (err) {
        console.error("Failed to fetch profile data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10">
      <div className="flex flex-col gap-1 mb-12">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">My Profile</h2>
        <p className="text-text-soft">Your rating, progress and recent performance across modes.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-8">
        {/* Profile Main Stats */}
        <div className="space-y-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass p-10 rounded-[32px] relative overflow-hidden group"
          >
            {/* Background Glow */}
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-accent/20 blur-[120px] rounded-full group-hover:bg-accent/30 transition-all pointer-events-none" />
            
            <div className="flex flex-col md:flex-row items-center gap-8 mb-12">
              <div className="w-32 h-32 rounded-[40px] bg-gradient-to-tr from-accent to-accent-alt flex items-center justify-center font-bold text-5xl shadow-2xl relative">
                {user?.avatar ? (
                  <img src={user.avatar} alt="profile" className="w-full h-full object-cover rounded-[40px]" />
                ) : user?.name?.charAt(0).toUpperCase() || 'U'}
                <div className="absolute -bottom-2 -right-2 bg-background p-2 rounded-2xl shadow-xl">
                  <Award className="text-yellow-400" size={24} />
                </div>
              </div>

              <div className="flex flex-col items-center md:items-start text-center md:text-left">
                <h1 className="text-4xl font-black mb-1">{user?.name || 'Guest Explorer'}</h1>
                <p className="text-accent font-bold uppercase tracking-widest text-xs mb-4">
                  {user ? 'Verified Competitor' : 'Unregistered Terminal'}
                </p>
                {!user && (
                  <button 
                    onClick={() => window.location.href = '/auth'}
                    className="px-6 py-2 rounded-xl bg-accent text-white text-xs font-bold uppercase tracking-widest hover:shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-all"
                  >
                    Login to Track Stats
                  </button>
                )}
                {user && (
                  <div className="flex gap-4">
                    <div className="px-4 py-2 rounded-full bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest">Lv. 24 Master</div>
                    <div className="px-4 py-2 rounded-full bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest">XP: {stats?.xp || 0}</div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12 relative z-10">
              {[
                { label: 'Global Rating', value: stats?.globalRating || 1200, change: 'Dynamic Elo', icon: Trophy, color: 'text-accent' },
                { label: 'Total XP', value: stats?.xp || 0, change: 'Level Progress', icon: Zap, color: 'text-accent-alt' },
                { label: 'Quizzes Saved', value: stats?.quizzesCount || 0, change: 'Hosted content', icon: Activity, color: 'text-purple-400' },
              ].map(({ label, value, change, icon: Icon, color }, i) => (
                <div key={i} className="flex flex-col p-6 rounded-3xl bg-background/50 border border-border-soft hover:border-accent/40 transition-all">
                  <Icon className={cn("mb-4", color)} size={24} />
                  <span className="text-[10px] text-text-soft uppercase font-black tracking-widest mb-1">{label}</span>
                  <span className="text-3xl font-black mb-1">{value}</span>
                  <span className={cn("text-[10px] font-bold", color)}>{change}</span>
                </div>
              ))}
            </div>

            <div className="space-y-4 relative z-10">
              <div className="flex justify-between items-end">
                <span className="text-[10px] text-text-soft font-black uppercase tracking-widest">Progress to next tier</span>
                <span className="text-xs font-bold text-accent-alt">65%</span>
              </div>
              <div className="h-4 w-full bg-bg-soft rounded-2xl p-1 border border-border-soft shadow-inner">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '65%' }}
                  className="h-full bg-gradient-to-r from-accent to-accent-alt rounded-xl shadow-[0_0_15px_rgba(34,197,94,0.5)]"
                />
              </div>
              <p className="text-[10px] text-text-soft italic text-center">Win more rated quizzes to reach the next tier.</p>
            </div>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Mode-wise Ratings */}
            <div className="glass p-8 rounded-[32px] space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <BarChart2 className="text-accent" />
                <h3 className="font-bold text-lg">Mode-wise Ratings</h3>
              </div>
              {[
                { name: 'Quiz (Rapid)', desc: 'Classroom & Lab games', rating: stats?.ratings?.rapid || 1200 },
                { name: 'Tournament (Blitz)', desc: 'Fast-paced events', rating: stats?.ratings?.blitz || 1200 },
                { name: 'Practice (Casual)', desc: 'Solo practice, unrated', rating: stats?.ratings?.casual || 1200 },
              ].map((mode, i) => (
                <div key={i} className="flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-accent/30 transition-all group">
                  <div className="flex flex-col">
                    <span className="font-bold text-sm mb-1 group-hover:text-accent transition-all">{mode.name}</span>
                    <span className="text-[10px] text-text-soft uppercase tracking-widest leading-none">{mode.desc}</span>
                  </div>
                  <span className="text-xl font-black group-hover:scale-110 transition-all">{mode.rating}</span>
                </div>
              ))}
            </div>

            {/* Recent History */}
            <div className="glass p-8 rounded-[32px] space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="text-accent-alt" />
                <h3 className="font-bold text-lg">Recent Rated Quizzes</h3>
              </div>
              {history.length > 0 ? history.slice(0, 4).map((h, i) => (
                <div key={i} className="flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/5">
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-sm truncate max-w-[120px]">{h.mode.toUpperCase()} Battle</span>
                    <span className={cn("text-[10px] font-black uppercase tracking-widest", h.change >= 0 ? "text-accent-alt" : "text-red-400")}>
                      {h.change >= 0 ? 'Win' : 'Loss'}
                    </span>
                  </div>
                  <span className="text-[10px] text-text-soft font-mono">
                    {h.change >= 0 ? `+${h.change}` : h.change} ({h.oldRating} → {h.newRating})
                  </span>
                </div>
              )) : (
                <div className="py-10 text-center text-text-soft text-xs italic border border-dashed border-white/5 rounded-2xl">
                  No rated matches played yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Achievements */}
        <div className="space-y-8">
          <div className="glass p-8 rounded-[32px]">
            <h3 className="font-bold text-lg mb-8 flex items-center gap-2">
              <Zap className="text-yellow-400" />
              Achievements
            </h3>
            <div className="flex flex-wrap gap-4">
              {[
                { icon: '🔥', label: '10 Day Streak' },
                { icon: '🧠', label: 'Master Mind' },
                { icon: '⚡', label: 'Quick Solver' },
                { icon: '🛡️', label: 'Unstoppable' },
                { icon: '🎯', label: 'Bullseye' },
              ].map((badge, i) => (
                <motion.div 
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  key={i} 
                  className="flex flex-col items-center gap-2"
                >
                  <div className="w-16 h-16 rounded-[22px] bg-white/5 border border-white/10 flex items-center justify-center text-3xl shadow-lg cursor-help group relative">
                    {badge.icon}
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-accent text-white px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap shadow-2xl">
                    {badge.label}
                  </div>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-text-soft">{badge.label.split(' ')[0]}</span>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="glass p-8 rounded-[32px] bg-gradient-to-br from-bg-soft/50 to-background/50">
            <h3 className="font-bold text-lg mb-6">Matchmaking History</h3>
            <div className="space-y-4">
              {history.length > 0 ? history.slice(0, 3).map((match, i) => (
                <div key={i} className="flex justify-between items-center text-sm p-4 rounded-2xl bg-white/5 border border-white/5">
                  <div className="flex flex-col">
                    <span className="font-bold text-xs">{match.mode.toUpperCase()} Arena</span>
                    <span className="text-[10px] text-text-soft">{new Date(match.createdAt).toLocaleDateString()}</span>
                  </div>
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                    match.change >= 0 ? 'bg-accent-alt/10 text-accent-alt' : 'bg-red-500/10 text-red-500'
                  )}>
                    {match.change >= 0 ? 'Victory' : 'Defeat'}
                  </span>
                </div>
              )) : (
                <p className="text-center text-[10px] text-text-soft italic">No games logged yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
