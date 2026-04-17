'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Trophy, Zap, Target, ChevronRight, TrendingUp, ShieldCheck,
  Award, BarChart3, Clock, Crosshair
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';
import { StatCard } from '@/components/ui/StatCard';
import { cn } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

// Simulated per-category accuracy data derived from profile stats if available
function buildAccuracyData(profile: any) {
  const base = [
    { cat: 'General', accuracy: 72 },
    { cat: 'CS', accuracy: 85 },
    { cat: 'Maths', accuracy: 60 },
    { cat: 'Science', accuracy: 78 },
    { cat: 'History', accuracy: 55 },
  ];
  // If server returns per-category stats, merge them in
  if (profile?.categoryStats) {
    return profile.categoryStats.map((c: any) => ({
      cat: c.category?.slice(0, 6) || 'Other',
      accuracy: Math.round(c.accuracy || 0),
    }));
  }
  return base;
}

const ACCENT_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4'];

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass px-3 py-2 rounded-xl border border-white/10 text-[10px] font-black uppercase">
      <p className="text-white">{payload[0].payload.cat}</p>
      <p className="text-accent">{payload[0].value}% accuracy</p>
    </div>
  );
}

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

  const accuracyData = buildAccuracyData(profile);
  const overallAccuracy = Math.round(
    accuracyData.reduce((sum: number, d: any) => sum + d.accuracy, 0) / accuracyData.length
  );

  const stats = [
    { title: 'Global ELO', value: profile?.globalRating || 1200, icon: Trophy, color: 'text-accent', desc: 'Baseline Rating' },
    { title: 'Total XP', value: profile?.xp || 0, icon: Zap, color: 'text-accent-alt', desc: 'Experience Accumulation' },
    { title: 'Quizzes Run', value: profile?.quizzesCount || 0, icon: Target, color: 'text-emerald-400', desc: 'Manual & AI Forge' },
    { title: 'Avg Accuracy', value: `${overallAccuracy}%`, icon: Crosshair, color: 'text-amber-400', desc: 'Cross-category average' },
  ];

  const modes = [
    { name: 'Rapid', rating: profile?.ratings?.rapid || 1200, trend: '+45' },
    { name: 'Blitz', rating: profile?.ratings?.blitz || 1200, trend: '-12' },
    { name: 'Casual', rating: profile?.ratings?.casual || 1200, trend: '+0' },
  ];

  return (
    <div className="max-w-6xl mx-auto p-4 lg:p-10 space-y-10">

      {/* Header Profile */}
      <div className="flex flex-col md:flex-row items-center gap-8 mb-4">
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
            <span className="px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-[10px] font-black uppercase tracking-widest self-center">
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

      {/* Stats Grid — 4 cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass p-6 rounded-[28px] border-white/5 relative overflow-hidden group"
          >
            <div className="flex justify-between items-start mb-3">
              <div className={cn('p-2.5 rounded-xl bg-white/5 border border-white/5', s.color)}>
                <s.icon size={20} />
              </div>
              <TrendingUp size={14} className="text-accent-alt opacity-30" />
            </div>
            <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-text-soft mb-1">{s.title}</h4>
            <p className="text-3xl font-black tracking-tighter mb-1">{s.value}</p>
            <p className="text-[9px] font-bold text-text-soft opacity-60 italic">{s.desc}</p>
            <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-accent/30 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700" />
          </motion.div>
        ))}
      </div>

      {/* Analytics + Ratings Row */}
      <div className="grid lg:grid-cols-2 gap-8">

        {/* Accuracy by Category — recharts bar chart */}
        <div className="glass rounded-[40px] p-8 border-white/5 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-black tracking-tight flex items-center gap-3">
              <BarChart3 className="text-accent" size={20} />
              Accuracy by Category
            </h3>
            <span className="text-[10px] font-black uppercase text-accent tracking-[0.2em]">{overallAccuracy}% avg</span>
          </div>

          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={accuracyData} barSize={28} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <XAxis
                dataKey="cat"
                tick={{ fill: '#64748b', fontSize: 9, fontWeight: 900 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: '#64748b', fontSize: 9 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
              <Bar dataKey="accuracy" radius={[8, 8, 0, 0]}>
                {accuracyData.map((_: any, index: number) => (
                  <Cell key={index} fill={ACCENT_COLORS[index % ACCENT_COLORS.length]} opacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Avg speed row */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Clock size={16} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-text-soft">Avg Response Speed</p>
                <p className="text-lg font-black">
                  {profile?.avgResponseTime ? `${profile.avgResponseTime.toFixed(1)}s` : '—'}
                </p>
              </div>
            </div>
            <span className="text-[9px] text-text-soft italic">per question</span>
          </div>
        </div>

        {/* Performance Tiers */}
        <div className="glass rounded-[40px] p-8 border-white/5 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-black tracking-tight flex items-center gap-3">
              <BarChart3 className="text-accent" size={20} />
              Performance Tiers
            </h3>
            <span className="text-[10px] font-black uppercase text-accent tracking-[0.2em]">Live Data</span>
          </div>

          <div className="space-y-4">
            {modes.map((m, i) => {
              const pct = Math.min(100, Math.round(((m.rating - 800) / 1200) * 100));
              return (
                <div key={i} className="flex items-center justify-between p-5 rounded-3xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-all">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-background flex items-center justify-center text-sm font-black group-hover:scale-110 transition-transform">
                      {m.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="font-black text-sm">{m.name} Arena</h5>
                      {/* Mini progress bar */}
                      <div className="h-1 w-24 bg-white/5 rounded-full overflow-hidden mt-1.5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ delay: i * 0.1 + 0.3, duration: 0.7 }}
                          className="h-full bg-accent rounded-full"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black">{m.rating}</p>
                    <p className={cn('text-[10px] font-black', m.trend.startsWith('+') ? 'text-accent-alt' : 'text-red-400')}>
                      {m.trend}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Specialization */}
          <div className="p-5 rounded-3xl bg-accent/5 border border-accent/20 relative overflow-hidden">
            <div className="flex justify-between items-center mb-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-accent">Preferred Focus</p>
              <span className="text-[10px] font-black uppercase p-1 px-3 rounded-full bg-accent text-white">
                {profile?.preferredField || 'General'}
              </span>
            </div>
            <div className="flex flex-col gap-2.5">
              {[
                'Completed 1st Recruitment Drive',
                'Generated 5+ AI Simulations',
                'Achieved 1300+ Rapid ELO'
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-xs font-bold opacity-60">
                  <ChevronRight size={14} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="absolute top-0 right-0 p-2 opacity-[0.04] -translate-y-1/4 translate-x-1/4">
              <Zap size={100} />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
