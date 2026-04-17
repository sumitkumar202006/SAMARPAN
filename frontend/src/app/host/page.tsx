'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Input, Select } from '@/components/ui/Input';
import { Target, Shield, Clock, TrendingUp, X, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';
import { useAudio } from '@/context/AudioContext';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Button } from '@/components/ui/Button';

function HostContent() {
  const { user, isLoading: authLoading } = useAuth();
  const { playEnter } = useAudio();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuiz, setSelectedQuiz] = useState(searchParams.get('quiz') || '');
  const [mode, setMode] = useState('rapid');
  const [battleType, setBattleType] = useState('2v2');
  const [timer, setTimer] = useState(30);
  const [totalTime, setTotalTime] = useState(10); // Default 10 mins
  const [timerMode, setTimerMode] = useState<'per-question' | 'total'>('per-question');
  const [isRated, setIsRated] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  
  // Rapid Gen State
  const [topic, setTopic] = useState('');
  const [numQuestions, setNumQuestions] = useState(10);
  const [difficulty, setDifficulty] = useState('medium');
  const [isGenerating, setIsGenerating] = useState(false);

  // Search/Community
  const [searchQuery, setSearchQuery] = useState('');
  const [communityQuizzes, setCommunityQuizzes] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [repoTab, setRepoTab] = useState<'personal' | 'community'>('personal');

  // Tournament Queue
  const [quizQueue, setQuizQueue] = useState<any[]>([]);

  // Exam Settings & Casual Roles
  const [playAsHost, setPlayAsHost] = useState(false);
  const [pointsPerQ, setPointsPerQ] = useState(100);
  const [penaltyPoints, setPenaltyPoints] = useState(50);
  const [strictFocus, setStrictFocus] = useState(false);
  const [allowBacktrack, setAllowBacktrack] = useState(true);

  const isFriendly = searchParams.get('friendly') === 'true';

  useEffect(() => {
    const fetchQuizzes = async () => {
      if (!user?.email) return;
      setLoading(true);
      try {
        const res = await api.get(`/api/quizzes/user/${user.email}`);
        setQuizzes(res.data.quizzes || []);
      } catch (err) {
        console.error("Failed to fetch quizzes", err);
      } finally {
        setLoading(false);
      }
    };
    if (!authLoading) fetchQuizzes();

    // Community Search Debounce? For now just an effect
    const searchCommunity = async () => {
      if (!searchQuery.trim() || repoTab !== 'community') return;
      setSearchLoading(true);
      try {
        const res = await api.get(`/api/quizzes/search?q=${searchQuery}`);
        setCommunityQuizzes(res.data.quizzes || []);
      } catch (err) {
        console.error("Community search failed", err);
      } finally {
        setSearchLoading(false);
      }
    };
    const timer = setTimeout(searchCommunity, 500);

    // Handle Friendly Preset
    if (isFriendly) {
      setMode('battle');
      setIsRated(false);
      setBattleType('1v1'); // Default to 1v1 for friendly battles
      setPlayAsHost(true);
    } else {
      setIsRated(true);
    }
    return () => clearTimeout(timer);
  }, [user, authLoading, searchParams, isFriendly, searchQuery, repoTab]);

  const handleHost = async () => {
    // Validation: Require either a selected quiz OR a topic OR a queue
    if (!selectedQuiz && !topic && quizQueue.length === 0) {
      alert("Please select a quiz, enter a topic, or add quizzes to your tournament queue!");
      return;
    }
    
    try {
      if (playEnter) {
        try { playEnter(); } catch (e) { console.warn("Audio failed", e); }
      }
      
      setStatus(selectedQuiz || quizQueue.length > 0 ? "Initializing Arena..." : "Synthesizing Arena via AI...");
      
      const res = await api.post('/api/host/start', {
        quizId: quizQueue.length > 0 ? quizQueue[0]._id : (selectedQuiz || null),
        quizQueue: quizQueue.length > 1 ? quizQueue.slice(1).map(q => q._id) : [],
        // New Rapid Gen Params
        topic: (selectedQuiz || quizQueue.length > 0) ? null : topic, 
        numQuestions: selectedQuiz ? null : numQuestions,
        difficulty: selectedQuiz ? null : difficulty,

        hostEmail: user?.email,
        mode,
        battleType: mode === 'battle' ? battleType : null,
        timerSeconds: timer,
        timerMode,
        totalSessionTime: totalTime,
        rated: isRated,
        playAsHost,
        pointsPerQ,
        penaltyPoints,
        strictFocus,
        allowBacktrack
      });
      
      setStatus('Success! Opening Lobby...');
      router.push(`/lobby/${res.data.pin}?role=host${playAsHost ? '&playAsHost=true' : ''}`);
    } catch (err: any) {
      console.error("Failed to host quiz", err);
      setStatus(null); // Clear status so button is clickable again
      alert(err.response?.data?.error || "Error initializing session. Please check your connection.");
    }
  };


  return (
    <AuthGuard>
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10 space-y-10">
        <div className="flex flex-col gap-1 px-2">
           <div className="flex items-center gap-3">
             <h2 className="text-3xl lg:text-4xl font-black tracking-tight uppercase italic text-white flex items-center gap-4">
               <Target className="text-accent" />
               Arena Commission
             </h2>
             {isFriendly && (
               <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black tracking-widest uppercase rounded-full animate-pulse">
                 CASUAL MODE
               </span>
             )}
           </div>
           <p className="text-text-soft text-xs lg:text-sm">Configure and initialize a high-fidelity quiz theater for your squad.</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 items-start">
          
          {/* Track 1: Tactical Configuration */}
          <div className="space-y-6">
             <div className="flex items-center gap-3 px-2">
                <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center text-accent text-[10px]">1</div>
                <h2 className="text-xs font-black uppercase tracking-widest text-text-soft italic">Theater Config</h2>
             </div>

             <div className="glass p-8 rounded-[40px] border-white/5 space-y-8">
                <div className="space-y-4">
                   <label className="text-[9px] font-black uppercase tracking-widest text-text-soft italic">Primary Mode</label>
                   <div className="grid grid-cols-1 gap-2">
                      {[
                        { id: 'rapid', label: 'Grand Arena', d: 'Standard multiplayer sync' },
                        { id: 'blitz', label: 'Tournament', d: 'Multi-set competitive queue' },
                        { id: 'battle', label: 'Squad Battle', d: 'Team vs Team operations' }
                      ].map((m) => (
                        <button 
                           key={m.id}
                           onClick={() => setMode(m.id)}
                           className={cn(
                             "p-4 rounded-3xl border transition-all text-left group",
                             mode === m.id ? "bg-accent/10 border-accent/40 shadow-inner" : "bg-white/5 border-white/5 hover:bg-white/10"
                           )}
                        >
                           <p className={cn("text-xs font-black uppercase italic group-hover:text-accent transition-all", mode === m.id ? "text-accent" : "text-white")}>{m.label}</p>
                           <p className="text-[9px] text-text-soft uppercase tracking-tighter">{m.d}</p>
                        </button>
                      ))}
                   </div>
                </div>

                {mode === 'battle' && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                     <label className="text-[9px] font-black uppercase tracking-widest text-text-soft italic">Format Matrix</label>
                     <Select label="" value={battleType} onChange={(e: any) => setBattleType(e.target.value)}>
                        <option value="1v1">1v1 DUEL</option>
                        <option value="2v2">2v2 SQUAD</option>
                        <option value="3v3">3v3 TEAM</option>
                        <option value="4v4">4v4 MEGA</option>
                     </Select>
                  </div>
                )}

                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3">
                   <div className="flex justify-between text-[8px] font-black uppercase text-text-soft">
                      <span>Deployment Readiness</span>
                      <span>{selectedQuiz || topic || quizQueue.length > 0 ? '100%' : '0%'}</span>
                   </div>
                   <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: (selectedQuiz || topic || quizQueue.length > 0 ? '100%' : '0%') }}
                        className="h-full bg-accent rounded-full" 
                      />
                   </div>
                </div>
             </div>
          </div>

          {/* Track 2: Asset Selection */}
          <div className="space-y-6">
             <div className="flex items-center gap-3 px-2">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 text-[10px]">2</div>
                <h2 className="text-xs font-black uppercase tracking-widest text-text-soft italic">Asset Selection</h2>
             </div>

             <div className="glass p-8 rounded-[40px] border-white/5 space-y-6">
                <div className="space-y-4">
                   <div className="grid grid-cols-2 gap-2 bg-white/5 p-1 rounded-2xl border border-white/5">
                      {['personal', 'community'].map((tab) => (
                        <button 
                           key={tab}
                           onClick={() => setRepoTab(tab as any)}
                           className={cn(
                             "py-2.5 text-[9px] font-black rounded-xl transition-all uppercase tracking-widest",
                             repoTab === tab ? "bg-accent text-white shadow-xl" : "text-text-soft hover:bg-white/5"
                           )}
                        >
                           {tab === 'personal' ? 'Vault' : 'Arena'}
                        </button>
                      ))}
                   </div>

                   <div className="relative group">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-soft group-focus-within:text-accent transition-colors" size={14} />
                      <input 
                         type="text"
                         placeholder="Filter core assets..."
                         value={searchQuery}
                         onChange={(e) => setSearchQuery(e.target.value)}
                         className="w-full bg-background/50 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-xs font-bold outline-none focus:border-accent/40 transition-all shadow-inner"
                      />
                   </div>

                   <Select 
                      label=""
                      value={selectedQuiz} 
                      onChange={(e: any) => { setSelectedQuiz(e.target.value); if(e.target.value) setTopic(''); }}
                   >
                      <option value="">-- CHOOSE FROM RESULTS --</option>
                      {repoTab === 'personal' ? (
                        quizzes.filter(q => q.title.toLowerCase().includes(searchQuery.toLowerCase())).map((q) => (
                          <option key={q._id || q.id} value={q._id || q.id}>{q.title.toUpperCase()}</option>
                        ))
                      ) : (
                        communityQuizzes.map((q) => (
                          <option key={q._id || q.id} value={q._id || q.id}>{q.title.toUpperCase()}</option>
                        ))
                      )}
                   </Select>

                   {selectedQuiz && mode === 'blitz' && (
                     <button 
                       onClick={() => {
                         const qObj = repoTab === 'personal' ? quizzes.find(q => (q._id || q.id) === selectedQuiz) : communityQuizzes.find(q => (q._id || q.id) === selectedQuiz);
                         if (qObj && !quizQueue.find(q => q._id === (qObj._id || qObj.id))) setQuizQueue([...quizQueue, { ...qObj, _id: qObj._id || qObj.id }]);
                         setSelectedQuiz('');
                       }}
                       className="w-full py-3 bg-accent/20 text-accent font-black text-[9px] rounded-xl border border-accent/20 hover:bg-accent/30 transition-all uppercase tracking-widest italic"
                     >
                       Enlist in Queue
                     </button>
                   )}
                </div>

                {quizQueue.length > 0 && (
                   <div className="space-y-3 p-4 rounded-3xl bg-white/5 border border-white/5">
                      <p className="text-[9px] font-black uppercase text-accent tracking-[0.2em] px-1">Active Playlist ({quizQueue.length} Sets)</p>
                      <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1 scrollbar-none">
                         {quizQueue.map((q, i) => (
                            <div key={i} className="flex items-center justify-between bg-black/20 p-3 rounded-xl border border-white/5 group">
                               <span className="text-[10px] font-black uppercase italic truncate pr-4">{i+1}. {q.title}</span>
                               <button onClick={() => setQuizQueue(quizQueue.filter((_, idx) => idx !== i))} className="text-red-400 opacity-20 group-hover:opacity-100 transition-all">
                                  <X size={12} />
                               </button>
                            </div>
                         ))}
                      </div>
                   </div>
                )}

                <div className="p-6 rounded-[32px] bg-accent-alt/5 border border-accent-alt/20 space-y-4">
                   <p className="text-[10px] font-black uppercase tracking-widest text-accent-alt italic">AI Synthesis Override</p>
                   <Input 
                      label="Neural Topic" 
                      placeholder="Ex: Quantum Physics, React Hooks..."
                      value={topic}
                      onChange={(e: any) => { setTopic(e.target.value); if(e.target.value) setSelectedQuiz(''); }}
                      className="bg-background/20"
                   />
                   <div className="grid grid-cols-2 gap-4">
                      <Select label="Difficulty" value={difficulty} onChange={(e: any) => setDifficulty(e.target.value)}>
                         <option value="easy">RECRUIT</option>
                         <option value="medium">VETERAN</option>
                         <option value="hard">ELITE</option>
                      </Select>
                      <Select label="Quantity" value={numQuestions} onChange={(e: any) => setNumQuestions(parseInt(e.target.value))}>
                         <option value={10}>10 Qs</option>
                         <option value={15}>15 Qs</option>
                         <option value={20}>20 Qs</option>
                      </Select>
                   </div>
                </div>
             </div>
          </div>

          {/* Track 3: Engagement Parameters */}
          <div className="space-y-6">
             <div className="flex items-center gap-3 px-2">
                <div className="w-5 h-5 rounded-full bg-accent-alt/20 flex items-center justify-center text-accent-alt text-[10px]">3</div>
                <h2 className="text-xs font-black uppercase tracking-widest text-text-soft italic">Engage Parameters</h2>
             </div>

             <div className="glass p-8 rounded-[40px] border-white/5 space-y-8">
                <div className="space-y-4">
                   <label className="text-[9px] font-black uppercase tracking-widest text-text-soft italic">Timer Logic</label>
                   <div className="grid grid-cols-2 gap-2 bg-white/5 p-1 rounded-2xl border border-white/5">
                      {[
                        { id: 'per-question', l: 'PER MODULE' },
                        { id: 'total', l: 'TOTAL WINDOW' }
                      ].map((tm) => (
                        <button 
                           key={tm.id}
                           onClick={() => setTimerMode(tm.id as any)}
                           className={cn(
                             "py-2 text-[9px] font-black rounded-xl transition-all uppercase tracking-widest",
                             timerMode === tm.id ? "bg-accent/20 text-accent" : "text-text-soft hover:bg-white/5"
                           )}
                        >
                           {tm.l}
                        </button>
                      ))}
                   </div>
                   <Input 
                      label={timerMode === 'per-question' ? "Seconds per Module" : "Total Minutes"} 
                      type="number" 
                      value={timerMode === 'per-question' ? timer : totalTime} 
                      onChange={(e: any) => timerMode === 'per-question' ? setTimer(parseInt(e.target.value)) : setTotalTime(parseInt(e.target.value))} 
                   />
                </div>

                <div className="space-y-4">
                   <label className="text-[9px] font-black uppercase tracking-widest text-text-soft italic">Engagement Type</label>
                   <Select 
                      label=""
                      value={isRated ? "true" : "false"}
                      onChange={(e: any) => setIsRated(e.target.value === "true")}
                      disabled={isFriendly}
                   >
                      <option value="true">RATED (COMPETITIVE)</option>
                      <option value="false">UNRATED (PRACTICE)</option>
                   </Select>
                   <p className="text-[8px] text-text-soft italic uppercase bg-white/5 p-3 rounded-xl border border-white/5">
                      {isRated ? "Affects global pilot rating and XP scaling." : "Social mode. Zero rating weight applied."}
                   </p>
                </div>

                 {/* EXAM PARAMETERS - Moved to Lobby Settings */}
                 <div className="space-y-4 pt-4 border-t border-white/5 pb-4">
                    <div className="flex flex-col gap-3">
                       <button 
                         onClick={() => setPlayAsHost(!playAsHost)}
                         className={cn("flex items-center justify-between p-4 rounded-2xl border transition-all", playAsHost ? "bg-accent/10 border-accent/30 text-accent" : "bg-white/5 border-white/5 text-text-soft")}
                       >
                         <span className="text-[10px] font-black uppercase tracking-widest">Participate as Player</span>
                         <div className={cn("w-4 h-4 rounded-full", playAsHost ? "bg-accent" : "bg-white/10")} />
                       </button>
                    </div>
                 </div>
                 <button 
                   onClick={handleHost}
                   disabled={(!selectedQuiz && !topic && quizQueue.length === 0) || !!status}
                   className={cn(
                     "w-full py-5 rounded-[24px] text-white font-black text-xs uppercase tracking-[0.3em] transition-all hover:scale-[1.02] active:scale-95 shadow-2xl relative overflow-hidden group",
                     isFriendly ? "bg-emerald-500 shadow-emerald-500/20" : "bg-accent shadow-accent/20"
                   )}
                >
                   <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-all pointer-events-none" />
                   {status || (isFriendly ? "Initialize Casual" : "Launch Arena PIN")}
                </button>
             </div>

             <div className="p-8 rounded-[40px] bg-white/5 border border-white/5 space-y-4">
                <div className="flex items-center gap-3">
                   <Shield className="text-accent" size={18} />
                   <h4 className="text-[10px] font-black uppercase tracking-widest italic">Host Privileges</h4>
                </div>
                <p className="text-[9px] text-text-soft leading-relaxed italic border-l-2 border-white/10 pl-4">
                   As host, you maintain supreme authority over the lobby. Use the "Neural Command" terminal post-launch to monitor and manage participants.
                </p>
             </div>
          </div>

        </div>
      </div>
    </AuthGuard>
  );
}

function HostPageWrapper() {
  const searchParams = useSearchParams();
  const key = searchParams.get('friendly') || 'standard';
  return <HostContent key={key} />;
}

export default function HostPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 rounded-full border-4 border-accent border-t-transparent animate-spin" />
      </div>
    }>
      <HostPageWrapper />
    </Suspense>
  );
}
