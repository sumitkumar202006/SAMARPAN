'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  Zap, 
  Target, 
  ChevronRight, 
  TrendingUp, 
  ShieldCheck,
  Award,
  BarChart3
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';
import { StatCard } from '@/components/ui/StatCard';
import { cn } from '@/lib/utils';

export default function UserStatsPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      if (!user?.email) return;
      try {
        const res = await api.get(`/api/user/profile/${user.email}`);
        setProfile(res.data);
      } catch (err) {
        console.error("Failed to fetch stats", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [user]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-12 h-12 rounded-full border-4 border-accent border-t-transparent animate-spin" />
    </div>
  );

  const stats = [
    { title: 'Global ELO', value: profile?.globalRating || 1200, icon: Trophy, color: 'text-accent', desc: 'Baseline Rating' },
    { title: 'Total XP', value: profile?.xp || 0, icon: Zap, color: 'text-accent-alt', desc: 'Experience Accumulation' },
    { title: 'Quizzes Run', value: profile?.quizzesCount || 0, icon: Target, color: 'text-emerald-400', desc: 'Manual & AI Forge' },
  ];

  const modes = [
    { name: 'Rapid', rating: profile?.ratings?.rapid || 1200, trend: '+45' },
    { name: 'Blitz', rating: profile?.ratings?.blitz || 1200, trend: '-12' },
    { name: 'Casual', rating: profile?.ratings?.casual || 1200, trend: '+0' },
  ];

  return (
    <div className="max-w-6xl mx-auto p-4 lg:p-10 space-y-8">
      
      {/* Header Profile Section */}
      <div className="flex flex-col md:flex-row items-center gap-8 mb-12">
        <div className="relative">
          <div className="w-32 h-32 rounded-[40px] bg-gradient-to-tr from-accent to-accent-alt p-1">
            <div className="w-full h-full rounded-[38px] bg-background flex items-center justify-center overflow-hidden">
              {profile?.avatar ? (
                <img src={profile.avatar} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-black">{profile?.name?.charAt(0)}</span>
              )}
            </div>
          </div>
          <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-accent-alt flex items-center justify-center text-white border-4 border-background shadow-lg">
            <ShieldCheck size={20} />
          </div>
        </div>

        <div className="text-center md:text-left space-y-2">
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
            <h1 className="text-4xl font-black tracking-tighter">{profile?.name}</h1>
            <span className="px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-[10px] font-black uppercase tracking-widest self-center md:self-auto">
              Pro Elite
            </span>
          </div>
          <p className="text-text-soft text-sm font-medium italic">{profile?.course} | {profile?.college}</p>
          <div className="flex items-center justify-center md:justify-start gap-6 pt-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-accent-alt animate-pulse" />
              <span className="text-accent-alt font-black text-xs uppercase tracking-widest">Level 12 Scout</span>
            </div>
            <div className="flex items-center gap-2 text-text-soft">
              <Zap size={14} />
              <span className="text-xs font-bold uppercase tracking-widest">Streak: 5 Days</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((s, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass p-8 rounded-[32px] border-white/5 relative overflow-hidden group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={cn("p-3 rounded-2xl bg-white/5 border border-white/5", s.color)}>
                <s.icon size={24} />
              </div>
              <TrendingUp size={16} className="text-accent-alt opacity-40" />
            </div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-soft mb-1">{s.title}</h4>
            <p className="text-4xl font-black tracking-tighter mb-2">{s.value}</p>
            <p className="text-[10px] font-bold text-text-soft opacity-60 italic">{s.desc}</p>
            
            <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-transparent via-accent/30 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700" />
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8 pt-4">
        
        {/* Rating Breakdown */}
        <div className="glass rounded-[40px] p-8 border-white/5 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-black tracking-tight flex items-center gap-3">
              <BarChart3 className="text-accent" size={20} />
              Performance Tiers
            </h3>
            <span className="text-[10px] font-black uppercase text-accent tracking-[0.2em]">Live Data</span>
          </div>

          <div className="space-y-4">
            {modes.map((m, i) => (
              <div key={i} className="flex items-center justify-between p-5 rounded-3xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-all">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-background flex items-center justify-center text-sm font-black group-hover:scale-110 transition-transform">
                    {m.name.charAt(0)}
                  </div>
                  <div>
                    <h5 className="font-black text-sm">{m.name} Arena</h5>
                    <p className="text-[10px] text-text-soft uppercase tracking-widest">Base Rating 1200</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black">{m.rating}</p>
                  <p className={cn(
                    "text-[10px] font-black",
                    m.trend.startsWith('+') ? "text-accent-alt" : "text-red-400"
                  )}>{m.trend}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Career & Achievements */}
        <div className="glass rounded-[40px] p-8 border-white/5 space-y-6">
           <h3 className="text-xl font-black tracking-tight flex items-center gap-3">
             <Award className="text-accent-alt" size={20} />
             Specialization Track
           </h3>

           <div className="space-y-6">
             <div className="p-6 rounded-3xl bg-accent/5 border border-accent/20 relative overflow-hidden">
               <div className="relative z-10 flex justify-between items-center mb-4">
                 <p className="text-[10px] font-black uppercase tracking-widest text-accent">Preferred Focus</p>
                 <span className="text-[10px] font-black uppercase p-1 px-3 rounded-full bg-accent text-white">{profile?.preferredField || 'General'}</span>
               </div>
               <p className="relative z-10 text-sm font-medium text-text-soft leading-relaxed italic">
                 "Questions generated by AI Forge will automatically adapt to <span className="text-white font-bold">{profile?.preferredField}</span> context unless overridden."
               </p>
               <div className="absolute top-0 right-0 p-2 opacity-[0.05] -translate-y-1/4 translate-x-1/4">
                 <Zap size={120} />
               </div>
             </div>

             <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4 text-sm font-bold opacity-60">
                   <ChevronRight size={16} />
                   <span>Completed 1st Recruitment Drive</span>
                </div>
                <div className="flex items-center gap-4 text-sm font-bold opacity-60">
                   <ChevronRight size={16} />
                   <span>Generated 5+ AI Simulations</span>
                </div>
                <div className="flex items-center gap-4 text-sm font-bold opacity-60">
                   <ChevronRight size={16} />
                   <span>Achieved 1300+ Rapid ELO</span>
                </div>
             </div>
           </div>
        </div>

      </div>

    </div>
  );
}
