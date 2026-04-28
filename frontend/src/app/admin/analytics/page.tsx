'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Target, 
  Zap, 
  Award, 
  Flame,
  MousePointer2
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  Cell 
} from 'recharts';
import api from '@/lib/axios';

const quizStats = [
  { name: 'Comp Sci', attempts: 400, accuracy: 85 },
  { name: 'Aptitude', attempts: 300, accuracy: 72 },
  { name: 'Physics', attempts: 200, accuracy: 65 },
  { name: 'History', attempts: 278, accuracy: 90 },
  { name: 'General', attempts: 189, accuracy: 78 },
];

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AnalyticsPage() {
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await api.get('/api/admin/stats');
        setData(res.data);
      } catch (err) {
        console.error("Failed to load analytics", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-96 gap-4">
      <div className="w-12 h-12 rounded-full border-4 border-accent border-t-transparent animate-spin" />
      <p className="text-text-soft font-black uppercase tracking-widest text-xs">Decrypting Behavioral Data...</p>
    </div>
  );

  // Map activity over time to line chart
  const activityData = data?.activityOverTime?.map((item: any) => ({
    name: new Date(item.createdAt).toLocaleDateString(),
    attempts: item._count._all
  })) || [];

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-2">Deep Intelligence</h1>
          <p className="text-text-soft font-medium italic">Advanced behavioral insights and arena metrics.</p>
        </div>
        <div className="flex gap-2">
           <span className="px-4 py-2 rounded-2xl bg-accent/10 border border-accent/20 text-accent text-[10px] font-black uppercase tracking-widest">
             Export Report
           </span>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        
        {/* Most Attempted Categories */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass p-8 rounded-[40px] border-white/5 space-y-8"
        >
          <div className="flex justify-between items-center">
             <h3 className="text-xl font-black tracking-tight flex items-center gap-3">
               <TrendingUp className="text-accent" size={20} />
               Popularity Relay
             </h3>
             <span className="text-[10px] font-black text-text-soft opacity-50 uppercase tracking-widest">Global Volume</span>
          </div>

          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={quizStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                   contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '16px', fontSize: '10px' }}
                   cursor={{ fill: '#ffffff05' }}
                />
                <Bar dataKey="attempts" radius={[8, 8, 0, 0]}>
                   {quizStats.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                   ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Global Accuracy Rate */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass p-8 rounded-[40px] border-white/5 space-y-8"
        >
          <div className="flex justify-between items-center">
             <h3 className="text-xl font-black tracking-tight flex items-center gap-3">
               <Target className="text-[#00D4B4]" size={20} />
               Accuracy Matrix
             </h3>
             <span className="text-[10px] font-black text-text-soft opacity-50 uppercase tracking-widest">Avg. Score 72%</span>
          </div>

          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activityData.length > 0 ? activityData : quizStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                   contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '16px', fontSize: '10px' }}
                />
                <Line 
                   type="monotone" 
                   dataKey="attempts" 
                   stroke="#22c55e" 
                   strokeWidth={4} 
                   dot={{ fill: '#22c55e', strokeWidth: 2, r: 6 }}
                   activeDot={{ r: 8, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Deep Insights Cards */}
      <div className="grid md:grid-cols-3 gap-6">
         <div className="glass p-8 rounded-[32px] border-white/5 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500">
               <Flame size={24} />
            </div>
            <h4 className="text-xs font-black uppercase tracking-widest text-text-soft">Hardest Challenge</h4>
            <p className="text-xl font-black tracking-tight text-white italic">"The Quantum Paradox"</p>
            <div className="flex items-center gap-2">
               <span className="text-red-400 font-black text-xs">24% Accuracy</span>
            </div>
         </div>

         <div className="glass p-8 rounded-[32px] border-white/5 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-accent-alt/10 flex items-center justify-center text-accent-alt">
               <MousePointer2 size={24} />
            </div>
            <h4 className="text-xs font-black uppercase tracking-widest text-text-soft">Peak Engagement Time</h4>
            <p className="text-xl font-black tracking-tight text-white italic">7 PM — 10 PM IST</p>
            <div className="flex items-center gap-2">
               <span className="text-accent-alt font-black text-xs">4.2K Unique Hits</span>
            </div>
         </div>

         <div className="glass p-8 rounded-[32px] border-white/5 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#7B61FF]/10 flex items-center justify-center text-[#7B61FF]">
               <Award size={24} />
            </div>
            <h4 className="text-xs font-black uppercase tracking-widest text-text-soft">Avg. Session Duration</h4>
            <p className="text-xl font-black tracking-tight text-white italic">14 Minutes 22 Seconds</p>
            <div className="flex items-center gap-2">
               <span className="text-[#7B61FF] font-black text-xs">+12% Since Last Week</span>
            </div>
         </div>
      </div>
    </div>
  );
}
