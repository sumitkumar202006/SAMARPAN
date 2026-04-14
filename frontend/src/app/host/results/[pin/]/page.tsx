'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Trophy, Users, Target, Clock, AlertCircle, 
  ChevronRight, TrendingUp, BarChart3, Download, Home
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import api from '@/lib/axios';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, Cell, LineChart, Line 
} from 'recharts';
import { cn } from '@/lib/utils';

function ResultsPageContent() {
  const { pin } = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get(`/api/host/analytics/${pin}`);
        setData(res.data);
      } catch (err) {
        console.error("Failed to fetch analytics", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [pin]);

  const topPlayers = useMemo(() => {
    if (!data?.playerPerformance) return [];
    return [...data.playerPerformance].sort((a: any, b: any) => b.correct - a.correct).slice(0, 3);
  }, [data]);

  const worstQuestion = useMemo(() => {
    if (!data?.questionPerformance) return null;
    return [...data.questionPerformance].sort((a: any, b: any) => a.accuracy - b.accuracy)[0];
  }, [data]);

  if (loading) return (
    <div className="min-h-screen bg-[#05060f] flex flex-col items-center justify-center gap-6">
      <div className="w-16 h-16 rounded-full border-4 border-accent border-t-transparent animate-spin" />
      <p className="font-bold uppercase tracking-widest text-text-soft">Compiling Final Analytics...</p>
    </div>
  );

  if (!data) return (
    <div className="min-h-screen bg-[#05060f] flex flex-col items-center justify-center p-8 text-center">
      <AlertCircle className="text-red-500 mb-6" size={64} />
      <h1 className="text-3xl font-black mb-4">No Session Data Found</h1>
      <p className="text-text-soft mb-8">This session may have been cancelled or the PIN is incorrect.</p>
      <Button onClick={() => router.push('/dashboard')}>Return to Dashboard</Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#05060f] text-white p-4 lg:p-12 font-sans selection:bg-accent selection:text-white pb-32">
      {/* Victory Header */}
      <header className="max-w-6xl mx-auto mb-16 text-center">
        <motion.div 
          initial={{ scale: 0 }} 
          animate={{ scale: 1 }} 
          className="inline-flex w-24 h-24 rounded-full bg-gradient-to-tr from-accent to-accent-alt mb-8 items-center justify-center shadow-[0_0_50px_rgba(99,102,241,0.4)]"
        >
          <Trophy size={48} className="text-white drop-shadow-md" />
        </motion.div>
        
        <h1 className="text-4xl lg:text-6xl font-black tracking-tight mb-4 italic uppercase">Match Declassified</h1>
        <p className="text-text-soft text-lg font-medium max-w-2xl mx-auto">
          Insights from <span className="text-white font-bold">"{data.session.title}"</span> — Room <span className="text-accent">{pin}</span>
        </p>
      </header>

      <main className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-8">
        
        {/* Top 3 Podium */}
        <section className="lg:col-span-2 space-y-8">
          <div className="glass rounded-[40px] p-10 border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent">
            <h3 className="flex items-center gap-3 font-bold text-xl mb-10 italic">
              <Trophy size={24} className="text-gold" />
              Podium Finishers
            </h3>
            
            <div className="flex flex-col gap-6">
              {topPlayers.map((player: any, i: number) => (
                <motion.div 
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                  key={player.name}
                  className="flex items-center justify-between p-6 rounded-[28px] bg-white/[0.02] border border-white/5 hover:border-accent/30 transition-all hover:bg-white/[0.05]"
                >
                  <div className="flex items-center gap-6">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl",
                      i === 0 ? "bg-yellow-500 text-yellow-950" : 
                      i === 1 ? "bg-slate-300 text-slate-900" : 
                      "bg-amber-700 text-white"
                    )}>
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-xl font-bold tracking-tight">{player.name}</p>
                      <p className="text-sm text-text-soft font-medium uppercase tracking-widest">{player.correct} Correct in {(player.totalTime).toFixed(1)}s</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-accent">{((player.correct / player.total) * 100).toFixed(0)}%</p>
                    <p className="text-[10px] font-black uppercase text-text-soft">Accuracy</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Question Breakdown */}
          <div className="glass rounded-[40px] p-10 border-white/5">
            <h3 className="flex items-center gap-3 font-bold text-xl mb-10 italic">
              <BarChart3 size={24} className="text-accent" />
              Content Performance
            </h3>
            
            <div className="space-y-6">
              {data.questionPerformance.map((q: any, i: number) => (
                <div key={i} className="space-y-4">
                  <div className="flex justify-between items-start gap-4">
                    <p className="font-bold text-sm leading-relaxed max-w-md">
                      <span className="text-text-soft mr-2">Q{i+1}:</span>
                      {q.question}
                    </p>
                    <div className="text-right shrink-0">
                       <p className={cn("font-black", q.accuracy > 70 ? "text-accent-alt" : q.accuracy > 40 ? "text-orange-400" : "text-red-500")}>
                         {q.accuracy.toFixed(0)}%
                       </p>
                    </div>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${q.accuracy}%` }}
                      className={cn("h-full", q.accuracy > 70 ? "bg-accent-alt" : q.accuracy > 40 ? "bg-orange-400" : "bg-red-500")}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Sidebar Insights */}
        <aside className="space-y-8">
          {/* Quick Metrics */}
          <div className="glass p-8 rounded-[40px] border-white/5 bg-white/[0.01]">
             <div className="grid grid-cols-2 gap-8">
                <div>
                   <span className="text-[10px] font-black uppercase tracking-widest text-text-soft">Avg Accuracy</span>
                   <p className="text-3xl font-black tabular-nums">
                     {(data.questionPerformance.reduce((acc: any, q: any) => acc + q.accuracy, 0) / data.questionPerformance.length).toFixed(0)}%
                   </p>
                </div>
                <div>
                   <span className="text-[10px] font-black uppercase tracking-widest text-text-soft">Completion</span>
                   <p className="text-3xl font-black tabular-nums">100%</p>
                </div>
             </div>
          </div>

          {/* The "Killer" Question */}
          {worstQuestion && (
            <div className="glass p-8 rounded-[40px] border-red-500/20 bg-red-500/[0.02]">
               <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-xl bg-red-500/10 text-red-500"><AlertCircle size={20} /></div>
                  <h4 className="font-bold text-sm uppercase tracking-tighter">Most Tricky Question</h4>
               </div>
               <p className="font-medium text-sm mb-4">“{worstQuestion.question}”</p>
               <div className="flex items-center justify-between p-4 rounded-2xl bg-black/20 border border-white/5">
                  <p className="text-[10px] font-black uppercase text-red-400">Survival Rate</p>
                  <p className="font-black text-red-500">{worstQuestion.accuracy.toFixed(0)}%</p>
               </div>
            </div>
          )}

          {/* Action Hub */}
          <div className="glass p-8 rounded-[40px] border-white/5 space-y-4">
             <Button className="w-full h-14 rounded-2xl gap-3" onClick={() => window.print()}>
                <Download size={20} /> Export PDF Report
             </Button>
             <Button variant="outline" className="w-full h-14 rounded-2xl border-white/10 gap-3" onClick={() => router.push('/dashboard')}>
                <Home size={20} /> Back to Hub
             </Button>
          </div>

          {/* Fun Fact Card */}
          <div className="glass p-8 rounded-[40px] border-accent/20 bg-gradient-to-br from-accent/10 to-transparent">
             <TrendingUp className="text-accent mb-4" size={24} />
             <h4 className="font-bold mb-2">Growth Spotted!</h4>
             <p className="text-xs text-text-soft leading-relaxed italic">
               This quiz had a {(data.questionPerformance.reduce((acc: any, q: any) => acc + q.accuracy, 0) / data.questionPerformance.length) > 50 ? 'solid' : 'challenging'} success rate. Consider adjusting timers for the trickier questions in future sessions.
             </p>
          </div>
        </aside>
      </main>

      {/* Floating Bottom Bar */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 px-8 py-4 glass rounded-full border-white/10 bg-black/60 backdrop-blur-3xl shadow-2xl flex items-center gap-6 z-50">
        <div className="flex flex-col">
          <span className="text-[9px] font-black uppercase text-text-soft">Session Decrypted</span>
          <span className="font-bold text-sm">{new Date(data.session.createdAt).toLocaleDateString()}</span>
        </div>
        <div className="w-[1px] h-8 bg-white/10" />
        <Button variant="accent" size="sm" onClick={() => router.push('/battles')}>Host Again</Button>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense>
      <ResultsPageContent />
    </Suspense>
  );
}
