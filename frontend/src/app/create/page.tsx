'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Zap, 
  FileText, 
  Mic, 
  Trash2, 
  Save, 
  ChevronDown, 
  ChevronUp, 
  HelpCircle,
  Trophy,
  Wand2,
  ListPlus,
  Users,
  Check,
  Activity
} from 'lucide-react';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useAudio } from '@/context/AudioContext';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';

interface Question {
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

export default function CreatePage() {
  const { user, profileCompletion } = useAuth();
  const { playSuccess } = useAudio();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'manual' | 'ai'>('manual');
  
  // AI Form State
  const [aiData, setAiData] = useState({ topic: '', title: '', difficulty: 'medium', count: 5 });
  const [aiStatus, setAiStatus] = useState<string | null>(null);
  const [createdQuiz, setCreatedQuiz] = useState<any | null>(null);

  // Manual Editor State
  const [manualTitle, setManualTitle] = useState('');
  const [manualTopic, setManualTopic] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQ, setCurrentQ] = useState<Question>({
    question: '',
    options: ['', '', '', ''],
    correctIndex: 0,
    explanation: ''
  });

  const handleAddQuestion = () => {
    if (!currentQ.question || currentQ.options.some(opt => !opt)) {
      alert('Please fill in the question and all 4 options.');
      return;
    }
    setQuestions([...questions, currentQ]);
    setCurrentQ({
      question: '',
      options: ['', '', '', ''],
      correctIndex: 0,
      explanation: ''
    });
  };

  const handleSaveQuiz = async () => {
    if (!manualTitle || questions.length === 0) {
      alert('Please provide a title and at least one question.');
      return;
    }
    
    try {
      setAiStatus('Syncing to Cloud Cloud...');
      const res = await api.post('/api/quizzes', {
        title: manualTitle.toUpperCase(),
        topic: manualTopic,
        authorId: user?.email || user?.userId,
        questions,
        aiGenerated: false
      });
      
      if (res.data.quiz) {
        setCreatedQuiz(res.data.quiz);
        playSuccess();
      }
      setAiStatus('Deployment sequence complete.');
    } catch (err) {
      console.error("Save error:", err);
      alert('Failed to save quiz. Please ensure you are logged in.');
    }
  };

  const handleAiGenerate = async () => {
    if (!aiData.topic || !aiData.title) {
      alert('Please provide a topic and title.');
      return;
    }
    setAiStatus('Initializing Neural Forge...');
    try {
      const res = await api.post('/api/ai/generate-quiz', {
        ...aiData,
        title: aiData.title.toUpperCase(),
        userId: user?.email || user?.userId
      });
      
      if (res.data.quiz) {
        setCreatedQuiz(res.data.quiz);
        playSuccess();
      }
      setAiStatus('Synthesis successful.');
    } catch (err: any) {
      console.error("AI Gen error:", err);
      const errorMsg = err.response?.data?.details || err.message || 'Unknown error';
      setAiStatus(`Neural Failure: ${errorMsg}`);
    }
  };

  return (
    <AuthGuard>
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10 space-y-10">
        
        {/* Header Block */}
        <div className="flex flex-col gap-1 px-2">
           <div className="flex items-center gap-3">
             <h2 className="text-3xl lg:text-4xl font-black tracking-tight uppercase italic text-white flex items-center gap-4">
               <ListPlus className="text-accent" />
               Forge Commission
             </h2>
             <span className="px-3 py-1 bg-accent/10 border border-accent/20 text-accent text-[10px] font-black tracking-widest uppercase rounded-full">
               CONTENT SYNTHESIS
             </span>
           </div>
           <p className="text-text-soft text-xs lg:text-sm">Engineer custom arena challenges via manual logic or neural synthesis.</p>
        </div>

        <AnimatePresence mode="wait">
          {createdQuiz ? (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass p-12 rounded-[40px] border-white/5 text-center space-y-8 flex flex-col items-center justify-center min-h-[500px]"
            >
              <div className="w-24 h-24 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4 shadow-[0_0_40px_rgba(16,185,129,0.2)]">
                <Trophy size={48} />
              </div>
              <div className="space-y-3">
                <h2 className="text-4xl lg:text-5xl font-black italic tracking-tighter uppercase underline decoration-emerald-500/50 decoration-4 underline-offset-8">Synthesis Success</h2>
                <p className="text-text-soft text-sm uppercase tracking-widest font-black">Asset: {createdQuiz.title}</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 w-full max-w-xl">
                <button 
                   onClick={() => router.push(`/play/solo?quiz=${createdQuiz._id}`)}
                   className="py-5 bg-gradient-to-tr from-accent to-accent-alt text-white font-black text-xs uppercase tracking-[0.3em] rounded-3xl hover:scale-105 transition-all shadow-xl flex items-center justify-center gap-3"
                >
                   <Zap size={18} fill="currentColor" /> Solo Training
                </button>
                <button 
                   onClick={() => router.push(`/host?quiz=${createdQuiz._id}`)}
                   className="py-5 bg-white/5 border-2 border-dashed border-white/10 text-white font-black text-xs uppercase tracking-[0.3em] rounded-3xl hover:bg-white/10 transition-all flex items-center justify-center gap-3"
                >
                   <Users size={18} /> Launch Session
                </button>
              </div>

              <button 
                onClick={() => setCreatedQuiz(null)}
                className="text-[10px] font-black uppercase tracking-[0.4em] text-text-soft hover:text-white transition-all underline underline-offset-4"
              >
                Return to Forge
              </button>
            </motion.div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8 items-start">
              
              {/* Track 1: Deployment Method */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 px-2">
                  <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center text-accent text-[10px]">1</div>
                  <h2 className="text-xs font-black uppercase tracking-widest text-text-soft italic">Forge Method</h2>
                </div>

                <div className="glass p-8 rounded-[40px] border-white/5 space-y-3">
                   {[
                     { id: 'manual', label: 'Manual Logic', icon: ListPlus, d: 'Precision engineering' },
                     { id: 'ai', label: 'Neural Forge', icon: Wand2, d: 'AI-assisted generation' }
                   ].map((t) => (
                     <button 
                       key={t.id}
                       onClick={() => setActiveTab(t.id as any)}
                       className={cn(
                         "w-full p-6 rounded-3xl border transition-all text-left flex items-start gap-4 group",
                         activeTab === t.id ? "bg-accent/10 border-accent/40 shadow-inner scale-[1.02]" : "bg-white/5 border-white/5 hover:bg-white/10"
                       )}
                     >
                       <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-all", activeTab === t.id ? "bg-accent text-white" : "bg-white/5 text-text-soft group-hover:bg-accent/20 group-hover:text-white")}>
                         <t.icon size={20} />
                       </div>
                       <div>
                         <p className={cn("text-xs font-black uppercase italic transition-all", activeTab === t.id ? "text-accent" : "text-white")}>{t.label}</p>
                         <p className="text-[9px] text-text-soft uppercase tracking-tighter">{t.d}</p>
                       </div>
                     </button>
                   ))}
                </div>

                <div className="p-8 rounded-[40px] bg-white/5 border border-white/5 space-y-4">
                   <div className="flex items-center gap-3">
                      <HelpCircle className="text-accent" size={18} />
                      <h4 className="text-[10px] font-black uppercase tracking-widest italic">Forge Protocol</h4>
                   </div>
                   <ul className="space-y-3 text-[9px] text-text-soft italic leading-relaxed border-l-2 border-white/10 pl-4">
                      <li>• Mix Easy, Medium and Hard nodes for balance.</li>
                      <li>• Precise explanations boost neural accuracy.</li>
                      <li>• AI results can be patched after synthesis.</li>
                   </ul>
                </div>
              </div>

              {/* Track 2: Content Synthesis */}
              <div className="lg:col-span-1 space-y-6">
                 <div className="flex items-center gap-3 px-2">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 text-[10px]">2</div>
                    <h2 className="text-xs font-black uppercase tracking-widest text-text-soft italic">Synthesis Area</h2>
                 </div>

                 <div className="glass p-8 rounded-[40px] border-white/5 min-h-[500px]">
                    <AnimatePresence mode="wait">
                      {activeTab === 'manual' ? (
                        <motion.div 
                          key="manual"
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                          className="space-y-8"
                        >
                           <div className="space-y-4">
                              <label className="text-[9px] font-black uppercase tracking-widest text-text-soft italic ml-1">Universal ID</label>
                              <Input placeholder="Eg. DBMS SQUAD EXAM" value={manualTitle} onChange={(e: any) => setManualTitle(e.target.value)} className="bg-background/20" />
                              <Input placeholder="Eg. DATABASE, SQL" value={manualTopic} onChange={(e: any) => setManualTopic(e.target.value)} className="bg-background/20" />
                           </div>

                           <div className="pt-6 border-t border-white/5 space-y-6">
                              <div className="flex items-center justify-between px-1">
                                 <h3 className="text-xs font-black uppercase italic flex items-center gap-2">
                                    <span className="text-accent"># {questions.length + 1}</span> Module Input
                                 </h3>
                                 <div className="text-[8px] font-black text-text-soft uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-lg border border-white/5">Question Matrix</div>
                              </div>

                              <div className="space-y-4">
                                 <textarea 
                                    className="w-full bg-white/5 border border-white/5 rounded-3xl p-6 text-xs font-bold outline-none focus:border-accent/40 transition-all min-h-[120px] shadow-inner"
                                    placeholder="Enter nucleus question..."
                                    value={currentQ.question}
                                    onChange={(e) => setCurrentQ({...currentQ, question: e.target.value})}
                                 />
                                 <div className="grid grid-cols-1 gap-3">
                                    {currentQ.options.map((opt, i) => (
                                       <div key={i} className="flex gap-2">
                                          <input 
                                             placeholder={`Choice ${i+1}`}
                                             value={opt}
                                             onChange={(e) => {
                                                const n = [...currentQ.options]; n[i] = e.target.value;
                                                setCurrentQ({...currentQ, options: n});
                                             }}
                                             className={cn(
                                               "flex-1 bg-white/5 border rounded-2xl px-4 py-3 text-[10px] font-black outline-none transition-all",
                                               currentQ.correctIndex === i ? "border-emerald-500/40 bg-emerald-500/5" : "border-white/5 focus:border-white/20"
                                             )}
                                          />
                                          <button 
                                             onClick={() => setCurrentQ({...currentQ, correctIndex: i})}
                                             className={cn(
                                               "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                                               currentQ.correctIndex === i ? "bg-emerald-500 text-white shadow-lg" : "bg-white/5 text-text-soft border border-white/5 hover:bg-white/10"
                                             )}
                                          >
                                             <Check size={16} />
                                          </button>
                                       </div>
                                    ))}
                                 </div>
                              </div>
                              
                              <button 
                                onClick={handleAddQuestion}
                                className="w-full py-4 border-2 border-dashed border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-text-soft hover:bg-white/5 hover:text-white transition-all flex items-center justify-center gap-3"
                              >
                                 <Plus size={16} /> Enlist Module
                              </button>
                           </div>
                        </motion.div>
                      ) : (
                        <motion.div 
                          key="ai"
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                          className="space-y-8"
                        >
                           <div className="space-y-2">
                             <div className="px-3 py-1 bg-accent-alt/10 border border-accent-alt/30 rounded-lg inline-block">
                                <span className="text-[9px] font-black uppercase text-accent-alt tracking-widest">Neural Forge Active</span>
                             </div>
                             <h3 className="text-xl font-black uppercase italic tracking-tighter">AI Synthesis</h3>
                             <p className="text-[10px] text-text-soft leading-relaxed pr-4">Personalization context detected from your <span className="text-white">Profile Node</span>. AI will prioritize relevant challenges.</p>
                           </div>

                           <div className="space-y-6 pt-4">
                              <Input label="Neural Topic" placeholder="Eg. Quantum Mechanics" value={aiData.topic} onChange={(e: any) => setAiData({...aiData, topic: e.target.value})} className="bg-background/20" />
                              <Input label="Asset Title" placeholder="Eg. Custom AI Session" value={aiData.title} onChange={(e: any) => setAiData({...aiData, title: e.target.value})} className="bg-background/20" />
                              
                              <div className="grid grid-cols-2 gap-4">
                                 <Select label="Complexity" value={aiData.difficulty} onChange={(e: any) => setAiData({...aiData, difficulty: e.target.value})}>
                                    <option value="easy">RECRUIT</option>
                                    <option value="medium">VETERAN</option>
                                    <option value="hard">ELITE</option>
                                 </Select>
                                 <Input label="Module Count" type="number" value={aiData.count} onChange={(e: any) => setAiData({...aiData, count: parseInt(e.target.value)})} />
                              </div>

                              <button 
                                onClick={handleAiGenerate}
                                className="w-full py-5 bg-accent-alt font-black text-white text-xs uppercase tracking-[0.3em] rounded-3xl transition-all hover:scale-[1.02] shadow-xl flex items-center justify-center gap-3 group"
                              >
                                 <Wand2 size={18} className="group-hover:rotate-12 transition-transform" /> Start Synthesis
                              </button>
                           </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                 </div>
              </div>

              {/* Track 3: Asset Overview */}
              <div className="space-y-6">
                 <div className="flex items-center gap-3 px-2">
                    <div className="w-5 h-5 rounded-full bg-accent-alt/20 flex items-center justify-center text-accent-alt text-[10px]">3</div>
                    <h2 className="text-xs font-black uppercase tracking-widest text-text-soft italic">Asset Overview</h2>
                 </div>

                 <div className="glass p-8 rounded-[40px] border-white/5 space-y-6">
                    <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-text-soft border-b border-white/5 pb-4">
                       <span>Forge Stats</span>
                       <span className="text-accent">{questions.length} Modules</span>
                    </div>

                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 scrollbar-none">
                       {questions.length === 0 ? (
                         <div className="py-12 text-center space-y-3 opacity-20 bg-black/20 rounded-3xl border border-dashed border-white/20">
                            <FileText className="mx-auto" size={32} />
                            <p className="text-[9px] font-black uppercase tracking-widest">No modules enlisted</p>
                         </div>
                       ) : (
                         questions.map((q, i) => (
                           <motion.div 
                             key={i} 
                             initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                             className="p-4 rounded-2xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-all flex items-start justify-between gap-3"
                           >
                              <div className="space-y-1">
                                 <p className="text-[9px] font-black uppercase text-accent italic">Module {i+1}</p>
                                 <p className="text-[10px] text-white font-bold leading-tight">{q.question}</p>
                              </div>
                              <button onClick={() => setQuestions(questions.filter((_, idx) => idx !== i))} className="text-red-400 opacity-20 group-hover:opacity-100 transition-all p-1">
                                 <Trash2 size={14} />
                              </button>
                           </motion.div>
                         ))
                       )}
                    </div>

                    {questions.length > 0 && activeTab === 'manual' && (
                       <div className="pt-6 border-t border-white/5 space-y-4">
                          <button 
                            onClick={handleSaveQuiz}
                            disabled={!manualTitle}
                            className={cn(
                              "w-full py-5 rounded-[24px] text-white font-black text-xs uppercase tracking-[0.3em] transition-all hover:scale-[1.02] active:scale-95 shadow-2xl relative overflow-hidden group",
                              manualTitle ? "bg-accent shadow-accent/20" : "bg-white/10 opacity-50 cursor-not-allowed"
                            )}
                          >
                             <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-all pointer-events-none" />
                             Save to Library
                          </button>
                          {aiStatus && <p className="text-center text-[9px] font-black uppercase italic text-accent-alt animate-pulse">{aiStatus}</p>}
                       </div>
                    )}
                 </div>

                 <div className="p-8 rounded-[40px] bg-white/5 border border-white/5 space-y-4">
                    <div className="flex items-center gap-3">
                       <Zap className="text-accent-alt" size={18} />
                       <h4 className="text-[10px] font-black uppercase tracking-widest italic">User Calibration</h4>
                    </div>
                    <p className="text-[9px] text-text-soft leading-relaxed italic border-l-2 border-white/10 pl-4">
                       Your profile is <span className="text-accent-alt font-black">{profileCompletion}% synchronized</span>. Increase synchronization for even more accurate neural synthesis results.
                    </p>
                 </div>
              </div>

            </div>
          )}
        </AnimatePresence>
      </div>
    </AuthGuard>
  );
}
