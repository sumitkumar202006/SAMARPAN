'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { 
  Trophy, Users, Target, Clock, AlertCircle, 
  ChevronRight, TrendingUp, BarChart3, Download, Home, Search, Filter
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
  const { user, logout, profileCompletion } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get(`/api/host/analytics/${pin}`);
        setData(res.data);
      } catch (err: any) {
        console.error("Failed to fetch analytics", err);
        setError(err.response?.data?.error || "Failed to load match analytics. The session might not exist yet.");
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

  const filteredPerformance = useMemo(() => {
    if (!data?.playerPerformance) return [];
    const sorted = [...data.playerPerformance].sort((a: any, b: any) => b.correct - a.correct);
    if (!searchQuery) return sorted;
    return sorted.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [data, searchQuery]);

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

  if (error || !data) return (
    <div className="min-h-screen bg-[#05060f] flex flex-col items-center justify-center p-8 text-center">
      <AlertCircle className="text-red-500 mb-6" size={64} />
      <h1 className="text-3xl font-black mb-4">{error ? "Analytics Error" : "No Session Data Found"}</h1>
      <p className="text-text-soft mb-8">{error || "This session may have been cancelled or the PIN is incorrect."}</p>
      <div className="flex gap-4">
        <Button variant="outline" onClick={() => window.location.reload()}>Retry Fetch</Button>
        <Button onClick={() => router.push('/dashboard')}>Return to Dashboard</Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#05060f] via-[#0a0c1f] to-[#05060f] text-white p-4 lg:p-12 font-sans selection:bg-accent selection:text-white pb-32 relative overflow-hidden">
      {/* Dynamic Background Accents */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-accent/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-accent-alt/5 blur-[150px] rounded-full pointer-events-none" />

      <div className="relative z-10">
      {/* Victory Header */}
      <header className="max-w-7xl mx-auto mb-16 text-center">
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

      <main className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-8">
        
        {/* Main Content: Podium & Roster */}
        <section className="lg:col-span-2 space-y-8">
          {/* Top 3 Podium */}
          <div className="glass rounded-[40px] p-10 border-white/5 bg-white/[0.03] backdrop-blur-md">
            <h3 className="flex items-center gap-3 font-bold text-xl mb-10 italic">
              <Trophy size={24} className="text-yellow-500" />
              Podium Finishers
            </h3>
            
            <div className="flex flex-col gap-6">
              {topPlayers.map((player: any, i: number) => (
                <motion.div 
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                  key={player.name}
                  className="flex items-center justify-between p-7 rounded-[32px] bg-white/[0.02] border border-white/5 hover:border-accent/30 transition-all hover:bg-white/[0.05] relative overflow-hidden group"
                >
                  <div className="flex items-center gap-6 relative z-10">
                    <div className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl shadow-2xl",
                      i === 0 ? "bg-gradient-to-br from-yellow-400 to-amber-600 text-yellow-950" : 
                      i === 1 ? "bg-gradient-to-br from-slate-200 to-slate-400 text-slate-900" : 
                      "bg-gradient-to-br from-orange-600 to-red-800 text-white"
                    )}>
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-2xl font-black tracking-tight mb-1">{player.name}</p>
                      <div className="flex items-center gap-4">
                         <div className="flex flex-col">
                            <span className="text-[8px] font-black uppercase text-text-soft tracking-widest">Efficiency</span>
                            <span className="text-xs font-bold text-accent-alt">{player.correct} / {player.total}</span>
                         </div>
                         <div className="w-px h-6 bg-white/10" />
                         <div className="flex flex-col">
                            <span className="text-[8px] font-black uppercase text-text-soft tracking-widest">Total Time</span>
                            <span className="text-xs font-bold">{(player.totalTime).toFixed(1)}s</span>
                         </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-8 relative z-10">
                    <div className="text-center">
                       <p className="text-xs font-black text-accent-alt">-{player.correct}</p>
                       <p className="text-[8px] font-black uppercase text-text-soft">Hits</p>
                    </div>
                    <div className="text-center">
                       <p className="text-xs font-black text-red-500">-{player.incorrect || (player.total - player.correct)}</p>
                       <p className="text-[8px] font-black uppercase text-text-soft">Misses</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-black text-accent">{((player.correct / player.total) * 100).toFixed(0)}%</p>
                      <p className="text-[9px] font-black uppercase text-text-soft tracking-widest">Accuracy</p>
                    </div>
                  </div>

                  {i === 0 && <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 blur-[80px] rounded-full" />}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Full Participant Roster */}
          <div className="glass rounded-[40px] p-10 border-white/10 bg-white/[0.02] backdrop-blur-md">
             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
                <h3 className="flex items-center gap-3 font-bold text-xl italic">
                  <Users size={24} className="text-text-soft" />
                  Arena Command Log
                </h3>
                
                <div className="relative w-full sm:w-64">
                   <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-soft"><Search size={16} /></div>
                   <input 
                      type="text"
                      placeholder="Search participant..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full h-11 bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 text-xs font-bold outline-none focus:border-accent transition-all"
                   />
                </div>
             </div>

             <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-separate border-spacing-y-3">
                   <thead>
                      <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-text-soft">
                         <th className="pb-4 pl-6">Rank</th>
                         <th className="pb-4">Participant</th>
                         <th className="pb-4 text-center">Correct</th>
                         <th className="pb-4 text-center">Incorrect</th>
                         <th className="pb-4 text-center">Attempted</th>
                         <th className="pb-4 text-right pr-6">Accuracy</th>
                      </tr>
                   </thead>
                   <tbody>
                      {filteredPerformance.map((p: any, idx: number) => (
                        <tr key={p.name} className="group bg-white/[0.02] hover:bg-white/[0.05] transition-colors">
                           <td className="py-4 pl-6 rounded-l-2xl font-black text-text-soft italic">#{idx + 1}</td>
                           <td className="py-4">
                              <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center font-bold text-xs text-accent">
                                    {p.name.charAt(0).toUpperCase()}
                                 </div>
                                 <span className="font-bold text-sm tracking-tight">{p.name}</span>
                              </div>
                           </td>
                           <td className="py-4 text-center font-black text-accent-alt text-sm">{p.correct}</td>
                           <td className="py-4 text-center font-black text-red-500/70 text-sm">{p.incorrect || (p.total - p.correct)}</td>
                           <td className="py-4 text-center font-black text-text-soft text-sm">{p.total}</td>
                           <td className="py-4 text-right pr-6 rounded-r-2xl">
                              <span className={cn(
                                "text-sm font-black italic",
                                (p.correct / p.total) > 0.7 ? "text-emerald-400" : "text-white"
                              )}>
                                {((p.correct / (p.total || 1)) * 100).toFixed(0)}%
                              </span>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>

          {/* Content Breakdown */}
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
        <Button variant="primary" size="sm" onClick={() => router.push('/battles')}>Host Again</Button>
      </div>
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
