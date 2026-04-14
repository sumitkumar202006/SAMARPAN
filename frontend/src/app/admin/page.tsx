'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  BookOpen, 
  Activity, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  Cell
} from 'recharts';
import api from '@/lib/axios';

const chartData = [
  { name: 'Mon', users: 400, attempts: 2400 },
  { name: 'Tue', users: 300, attempts: 1398 },
  { name: 'Wed', users: 200, attempts: 9800 },
  { name: 'Thu', users: 278, attempts: 3908 },
  { name: 'Fri', users: 189, attempts: 4800 },
  { name: 'Sat', users: 239, attempts: 3800 },
  { name: 'Sun', users: 349, attempts: 4300 },
];

export default function AdminOverview() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await api.get('/api/admin/stats');
        setData(res.data);
      } catch (err) {
        console.error("Failed to load admin stats", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-96 gap-4">
      <div className="w-12 h-12 rounded-full border-4 border-accent border-t-transparent animate-spin" />
      <p className="text-text-soft font-black uppercase tracking-widest text-xs">Synchronizing Metrics...</p>
    </div>
  );

  const metrics = [
    { title: 'Total Users', value: data?.metrics.totalUsers, icon: Users, trend: '+12%', color: 'from-blue-500 to-indigo-600' },
    { title: 'Quizzes Run', value: data?.metrics.totalQuizzes, icon: BookOpen, trend: '+5%', color: 'from-purple-500 to-pink-600' },
    { title: 'Active Today', value: data?.metrics.activeToday, icon: Activity, trend: '+24%', color: 'from-emerald-500 to-teal-600' },
    { title: 'Total Battles', value: data?.metrics.totalSessions, icon: Zap, trend: '+18%', color: 'from-orange-500 to-red-600' },
  ];

  return (
    <div className="space-y-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-2">Omni-Vault Status</h1>
          <p className="text-text-soft font-medium">Real-time oversight of the Samarpan Arena Ecosystem.</p>
        </div>
        <div className="flex items-center gap-3 bg-white/5 border border-white/5 p-4 rounded-3xl">
          <Clock size={16} className="text-accent" />
          <span className="text-xs font-black uppercase tracking-widest text-text-soft">Last updated: Just now</span>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((m, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass p-6 rounded-[32px] border-white/5 relative overflow-hidden group"
          >
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${m.color} opacity-5 blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:opacity-10 transition-all`} />
            
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-accent shadow-inner">
                 <m.icon size={20} />
              </div>
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black tracking-widest">
                <ArrowUpRight size={12} />
                {m.trend}
              </div>
            </div>
            
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-soft mb-1">{m.title}</h4>
            <p className="text-3xl font-black tracking-tighter">{m.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Growth Analytics (2/3 width) */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-2 glass p-8 rounded-[40px] border-white/5 space-y-8"
        >
          <div className="flex justify-between items-center">
             <h3 className="text-xl font-black tracking-tight flex items-center gap-3">
               <TrendingUp className="text-accent" size={20} />
               Platform Pulse
             </h3>
             <div className="flex gap-2">
                <span className="px-3 py-1 rounded-full bg-white/5 text-[10px] font-black uppercase tracking-widest opacity-50">7 Days</span>
             </div>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis 
                   dataKey="name" 
                   stroke="#64748b" 
                   fontSize={10} 
                   tickLine={false} 
                   axisLine={false}
                />
                <YAxis 
                   stroke="#64748b" 
                   fontSize={10} 
                   tickLine={false} 
                   axisLine={false}
                   tickFormatter={(v) => `${v}`}
                />
                <Tooltip 
                   contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '16px', fontSize: '10px' }}
                   cursor={{ stroke: '#6366f1', strokeWidth: 2 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="users" 
                  stroke="#6366f1" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorUsers)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Activity Feed (1/3 width) */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-1 glass p-8 rounded-[40px] border-white/5 space-y-6 flex flex-col"
        >
          <h3 className="text-xl font-black tracking-tight flex items-center gap-3">
            <Zap className="text-emerald-400" size={20} />
            Live Feed
          </h3>

          <div className="flex-1 space-y-6 overflow-y-auto pr-2 max-h-[350px]">
             {data?.recentActivity?.users.map((user: any, i: number) => (
                <div key={i} className="flex items-start gap-4 group">
                   <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-black text-xs group-hover:bg-accent/20 transition-all">
                      {user.name.charAt(0).toUpperCase()}
                   </div>
                   <div className="flex flex-col">
                      <p className="text-xs font-black tracking-tight">{user.name}</p>
                      <p className="text-[10px] text-text-soft">Joined the arena</p>
                      <p className="text-[9px] text-accent font-bold mt-1 uppercase tracking-widest">{new Date(user.createdAt).toLocaleTimeString()}</p>
                   </div>
                </div>
             ))}

             {data?.recentActivity?.quizzes.map((quiz: any, i: number) => (
                <div key={i} className="flex items-start gap-4 group border-t border-white/5 pt-6">
                   <div className="w-10 h-10 rounded-xl bg-accent-alt/10 flex items-center justify-center text-accent-alt group-hover:bg-accent-alt/20 transition-all">
                      <BookOpen size={16} />
                   </div>
                   <div className="flex flex-col">
                      <p className="text-xs font-black tracking-tight truncate w-32">{quiz.title}</p>
                      <p className="text-[10px] text-text-soft">New mission uploaded</p>
                      <p className="text-[9px] text-accent font-bold mt-1 uppercase tracking-widest">{new Date(quiz.createdAt).toLocaleTimeString()}</p>
                   </div>
                </div>
             ))}
          </div>

          <button className="w-full py-3 rounded-2xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
             View Audit Log
          </button>
        </motion.div>

      </div>
    </div>
  );
}
