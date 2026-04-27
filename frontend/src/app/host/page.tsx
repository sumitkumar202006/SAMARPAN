'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Input, Select } from '@/components/ui/Input';
import { Target, Shield, Clock, TrendingUp, X, Search, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';
import { useAudio } from '@/context/AudioContext';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Button } from '@/components/ui/Button';
import { toast } from '@/lib/toast';

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
  const [isCompetition, setIsCompetition] = useState(true);
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

  // Active Tactics (Room Hub)
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [activeLoading, setActiveLoading] = useState(false);

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
    const searchTimer = setTimeout(searchCommunity, 500);

    // Handle Mode Logic
    if (!isCompetition) {
      setMode('battle');
      setBattleType('1v1');
      setPlayAsHost(true);
    } else {
      setPlayAsHost(false);
    }

    const fetchActiveSessions = async () => {
      if (!user?.email) return;
      setActiveLoading(true);
      try {
        const res = await api.get(`/api/host/active-sessions/${user.email}`);
        setActiveSessions(res.data.sessions || []);
      } catch (err) {
        console.error("Failed to fetch active sessions", err);
      } finally {
        setActiveLoading(false);
      }
    };
    if (!authLoading) fetchActiveSessions();

    return () => clearTimeout(searchTimer);
  }, [user, authLoading, searchParams, isCompetition, searchQuery, repoTab]);

  const handleHost = async () => {
    // Validation: Require either a selected quiz OR a topic OR a queue
    if (!selectedQuiz && !topic && quizQueue.length === 0) {
      toast.warn("Please select a quiz, enter a topic, or add quizzes to your tournament queue!");
      return;
    }
    
    try {
      if (playEnter) {
        try { playEnter(); } catch (e) { console.warn("Audio failed", e); }
      }
      
      setStatus(selectedQuiz || quizQueue.length > 0 ? "Initializing Operations..." : "Synthesizing Nexus via AI...");
      
      const res = await api.post('/api/host/start', {
        quizId: quizQueue.length > 0 ? (quizQueue[0]._id || quizQueue[0].id) : (selectedQuiz || null),
        quizQueue: quizQueue.length > 1 ? quizQueue.slice(1).map(q => q._id || q.id) : [],
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
        rated: false, // Force unrated per user request
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
      toast.error(err.response?.data?.error || "Error initializing session. Please check your connection.");
    }
  };

  const handleTerminateSession = async (pin: string) => {
    if (!confirm(`Terminate session ${pin}? All tactical data for this live arena will be purged.`)) return;
    try {
      await api.delete(`/api/host/session/${pin}`);
      setActiveSessions(prev => prev.filter(s => s.pin !== pin));
    } catch (err) {
      console.error("Termination failed", err);
      toast.error("Failed to terminate session. It may have already expired.");
    }
  };


  return (
    <AuthGuard>
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10 space-y-10">
         {/* High-Fidelity Mode Switcher - Top Center */}
         <div className="flex justify-center mb-12">
            <div className="flex bg-white/5 p-1.5 rounded-[24px] border border-white/10 backdrop-blur-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] relative group">
               <div className="absolute inset-0 bg-accent/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
               <button 
                 onClick={() => setIsCompetition(false)}
                 className={cn(
                   "px-10 py-4 rounded-[20px] text-xs font-black uppercase tracking-[0.2em] transition-all relative z-10",
                   !isCompetition 
                    ? "bg-gradient-to-tr from-emerald-500 to-emerald-400 text-white shadow-[0_0_30px_rgba(16,185,129,0.3)] scale-105" 
                    : "text-text-soft hover:text-white"
                 )}
               >
                 Casual Play
               </button>
               <button 
                 onClick={() => setIsCompetition(true)}
                 className={cn(
                   "px-10 py-4 rounded-[20px] text-xs font-black uppercase tracking-[0.2em] transition-all relative z-10",
                   isCompetition 
                    ? "bg-gradient-to-tr from-accent to-accent-alt text-white shadow-[0_0_30px_rgba(99,102,241,0.3)] scale-105" 
                    : "text-text-soft hover:text-white"
                 )}
               >
                 Competition
               </button>
            </div>
         </div>

         <div className="flex flex-col gap-6 px-2">
            <div className="flex items-center gap-3">
               <h2 className="text-3xl lg:text-4xl font-black tracking-tight uppercase italic text-white flex items-center gap-4">
                 <Target className="text-accent" />
                 Operation Hub
               </h2>
            </div>
            <p className="text-text-soft text-xs lg:text-sm">
              {isCompetition 
                ? "Conduct high-stakes examinations and competitive tournaments." 
                : "Initialize a casual play session for friendly practice."}
            </p>
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
                        { id: 'rapid', label: 'Global Nexus', d: 'Standard multiplayer sync' },
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
                           {tab === 'personal' ? 'Library' : 'Community'}
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
                   <div className="grid grid-cols-1 gap-4">
                      <Select label="Difficulty" value={difficulty} onChange={(e: any) => setDifficulty(e.target.value)}>
                         <option value="easy">RECRUIT</option>
                         <option value="medium">VETERAN</option>
                         <option value="hard">ELITE</option>
                      </Select>
                      <div className="space-y-2">
                         <label className="text-[9px] font-black uppercase tracking-widest text-text-soft italic ml-1">Module Count</label>
                         <div className="flex gap-2">
                            {[10, 15, 20].map(n => (
                              <button 
                                key={n}
                                onClick={() => setNumQuestions(n)}
                                className={cn(
                                  "flex-1 py-2 rounded-xl text-[10px] font-black border transition-all",
                                  numQuestions === n ? "bg-accent/20 border-accent/40 text-accent" : "bg-white/5 border-white/5 text-text-soft"
                                )}
                              >
                                {n}
                              </button>
                            ))}
                            <div className="flex-[2]">
                              <Input 
                                placeholder="Custom..." 
                                type="number" 
                                value={numQuestions} 
                                onChange={(e: any) => setNumQuestions(parseInt(e.target.value) || 0)}
                                className="h-full bg-background/20"
                              />
                            </div>
                         </div>
                      </div>
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


                 <button 
                   onClick={handleHost}
                   disabled={(!selectedQuiz && !topic && quizQueue.length === 0) || !!status}
                   className={cn(
                     "w-full py-5 rounded-[24px] text-white font-black text-xs uppercase tracking-[0.3em] transition-all hover:scale-[1.02] active:scale-95 shadow-2xl relative overflow-hidden group",
                     !isCompetition ? "bg-emerald-500 shadow-emerald-500/20" : "bg-accent shadow-accent/20"
                   )}
                >
                   <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-all pointer-events-none" />
                   {status || (isCompetition ? "Launch Competition PIN" : "Initialize Casual Session")}
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

        {/* Active Tactics (Room Hub) Section */}
        {activeSessions.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 pt-10"
          >
            <div className="flex items-center justify-between px-2">
               <div className="flex items-center gap-3">
                  <Activity className="text-emerald-400" size={20} />
                  <h2 className="text-xl font-black tracking-widest uppercase italic text-white flex items-center gap-4">
                    Active tactics <span className="text-emerald-400 opacity-50">•</span> <span className="text-[10px] font-bold text-text-soft">Mission Control</span>
                  </h2>
               </div>
               <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[8px] font-black text-emerald-400 uppercase tracking-widest animate-pulse">
                  Surveillance Active
               </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
               {activeSessions.map((session) => (
                 <div key={session.pin} className="glass p-6 rounded-[32px] border-white/5 flex flex-col gap-6 relative group overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 blur-[40px] rounded-full pointer-events-none" />
                    
                    <div className="flex items-start justify-between">
                       <div className="space-y-1">
                          <p className="text-[10px] font-black text-accent uppercase tracking-widest italic">PIN: {session.pin}</p>
                          <h4 className="text-sm font-black text-white uppercase italic truncate pr-4">{session.quiz?.title || 'Nexus Session'}</h4>
                       </div>
                       <div className="shrink-0 px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[8px] font-black text-text-soft uppercase">
                          {session.mode === 'rapid' ? 'Nexus' : (session.mode === 'battle' ? 'Battle' : 'Blitz')}
                       </div>
                    </div>

                    <div className="flex items-center gap-6">
                       <div className="flex flex-col">
                          <span className="text-[8px] font-black text-text-soft uppercase tracking-tighter">Status</span>
                          <span className="text-[10px] font-black text-emerald-400 uppercase italic animate-pulse">{session.status}</span>
                       </div>
                       <div className="flex flex-col">
                          <span className="text-[8px] font-black text-text-soft uppercase tracking-tighter">Deployed</span>
                          <span className="text-[10px] font-black text-white italic">{new Date(session.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/5">
                       <button 
                         onClick={() => router.push(`/lobby/${session.pin}?role=host`)}
                         className="py-3 rounded-xl bg-accent text-white font-black text-[9px] uppercase tracking-widest shadow-lg hover:scale-[1.05] active:scale-95 transition-all"
                       >
                         Reconnect
                       </button>
                       <button 
                         onClick={() => handleTerminateSession(session.pin)}
                         className="py-3 rounded-xl bg-white/5 border border-white/10 text-red-500 font-black text-[9px] uppercase tracking-widest hover:bg-red-500/10 hover:border-red-500/30 transition-all"
                       >
                         Terminate
                       </button>
                    </div>
                 </div>
               ))}
            </div>
          </motion.div>
        )}
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
