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
  ListPlus
} from 'lucide-react';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
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
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'manual' | 'ai'>('manual');
  
  // AI Form State
  const [aiData, setAiData] = useState({ topic: '', title: '', difficulty: 'medium', count: 5 });
  const [aiStatus, setAiStatus] = useState<string | null>(null);

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
      await api.post('/api/quizzes', {
        title: manualTitle,
        topic: manualTopic,
        authorId: user?.email,
        questions,
        aiGenerated: false
      });
      alert('Quiz saved successfully!');
      router.push('/dashboard');
    } catch (err) {
      console.error("Save error:", err);
      alert('Failed to save quiz.');
    }
  };

  const handleAiGenerate = async () => {
    if (!aiData.topic || !aiData.title) {
      alert('Please provide a topic and title.');
      return;
    }
    setAiStatus('Generating questions using AI...');
    try {
      await api.post('/api/ai/generate-quiz', {
        ...aiData,
        userId: user?.email
      });
      setAiStatus('Quiz generated successfully! Saving to your account...');
      router.push('/dashboard');
    } catch (err) {
      console.error("AI Gen error:", err);
      setAiStatus('AI generation failed.');
    }
  };

  return (
    <AuthGuard>
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10">
      <div className="flex flex-col gap-1 mb-12 text-center lg:text-left">
        <h2 className="text-3xl font-bold tracking-tight">Create Quiz</h2>
        <p className="text-text-soft">Choose how you want to build your next arena experience.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[400px_1fr] gap-8">
        {/* Selection Sidebar */}
        <div className="space-y-4">
          <button 
            onClick={() => setActiveTab('manual')}
            className={cn(
              "w-full p-6 rounded-[32px] text-left transition-all group flex items-start gap-4",
              activeTab === 'manual' ? "glass border-accent bg-accent/5" : "hover:bg-white/5 opacity-60 hover:opacity-100"
            )}
          >
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-all", activeTab === 'manual' ? "bg-accent text-white" : "bg-bg-soft text-text-soft group-hover:bg-accent group-hover:text-white")}>
              <ListPlus size={24} />
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-bold text-lg">Manual Editor</span>
              <span className="text-[10px] uppercase font-black tracking-widest text-text-soft">Start from scratch</span>
            </div>
          </button>

          <button 
            onClick={() => setActiveTab('ai')}
            className={cn(
              "w-full p-6 rounded-[32px] text-left transition-all group flex items-start gap-4",
              activeTab === 'ai' ? "glass border-accent-alt bg-accent-alt/5" : "hover:bg-white/5 opacity-60 hover:opacity-100"
            )}
          >
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-all", activeTab === 'ai' ? "bg-accent-alt text-white" : "bg-bg-soft text-text-soft group-hover:bg-accent-alt group-hover:text-white")}>
              <Wand2 size={24} />
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-bold text-lg">AI Generator</span>
              <span className="text-[10px] uppercase font-black tracking-widest text-text-soft">Magic automation</span>
            </div>
          </button>
          
          <div className="glass p-8 rounded-[32px] hidden xl:block bg-gradient-to-br from-bg-soft to-transparent">
             <h4 className="font-bold text-sm mb-4 flex items-center gap-2">
               <HelpCircle size={16} className="text-accent" />
               Tips for better quizzes
             </h4>
             <ul className="space-y-3 text-[11px] text-text-soft italic leading-relaxed">
               <li>• Keep options short and clear.</li>
               <li>• Mix easy, medium and hard questions.</li>
               <li>• Use AI for drafts, then tweak manually.</li>
               <li>• Add explanations for learning impact.</li>
             </ul>
          </div>
        </div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          {activeTab === 'manual' ? (
            <motion.div 
              key="manual"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass p-8 md:p-12 rounded-[40px] space-y-10"
            >
              <div className="grid md:grid-cols-2 gap-6">
                <Input 
                  label="Quiz Title" 
                  placeholder="Eg. DBMS Basics - Set 1" 
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                />
                <Input 
                  label="Topic / Tags" 
                  placeholder="Eg. DBMS, Normalization" 
                  value={manualTopic}
                  onChange={(e) => setManualTopic(e.target.value)}
                />
              </div>

              <div className="border-t border-white/5 pt-8">
                <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-accent/20 text-accent flex items-center justify-center text-sm">
                    {questions.length + 1}
                  </div>
                  Add Question
                </h3>
                
                <div className="space-y-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-text-soft ml-1">Question Text</label>
                    <textarea 
                      className="bg-bg-soft/50 border border-border-soft rounded-2xl p-4 text-sm focus:outline-none focus:border-accent transition-all min-h-[100px]"
                      placeholder="Type your question here..."
                      value={currentQ.question}
                      onChange={(e) => setCurrentQ({...currentQ, question: e.target.value})}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {currentQ.options.map((opt, i) => (
                      <div key={i} className="relative">
                        <Input 
                          label={`Option ${i+1}`} 
                          placeholder={`Enter option ${i+1}`} 
                          className={cn(currentQ.correctIndex === i && "border-accent-alt bg-accent-alt/5")}
                          value={opt}
                          onChange={(e) => {
                            const newOpts = [...currentQ.options];
                            newOpts[i] = e.target.value;
                            setCurrentQ({...currentQ, options: newOpts});
                          }}
                        />
                        <button 
                          onClick={() => setCurrentQ({...currentQ, correctIndex: i})}
                          className={cn(
                            "absolute right-3 bottom-3 w-6 h-6 rounded-lg transition-all flex items-center justify-center",
                            currentQ.correctIndex === i ? "bg-accent-alt text-white" : "bg-bg-soft text-text-soft hover:text-white"
                          )}
                        >
                          {currentQ.correctIndex === i ? <Save size={14} /> : i + 1}
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-text-soft ml-1">Explanation (Optional)</label>
                    <textarea 
                      className="bg-bg-soft/50 border border-border-soft rounded-2xl p-4 text-sm focus:outline-none focus:border-accent transition-all"
                      placeholder="Why is this the correct answer?"
                      value={currentQ.explanation}
                      onChange={(e) => setCurrentQ({...currentQ, explanation: e.target.value})}
                    />
                  </div>

                  <Button variant="outline" onClick={handleAddQuestion} className="w-full border-dashed">
                    <Plus size={18} /> Add Question to List
                  </Button>
                </div>
              </div>

              {questions.length > 0 && (
                <div className="border-t border-white/5 pt-8">
                  <h3 className="font-bold mb-6">Quiz Preview ({questions.length} questions)</h3>
                  <div className="space-y-3">
                    {questions.map((q, i) => (
                      <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 group">
                        <div className="flex items-center gap-4">
                          <span className="text-xs font-black text-text-soft">#{i+1}</span>
                          <span className="text-sm font-medium truncate max-w-[400px]">{q.question}</span>
                        </div>
                        <button 
                          onClick={() => setQuestions(questions.filter((_, idx) => idx !== i))}
                          className="text-text-soft hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-2"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <Button onClick={handleSaveQuiz} className="w-full mt-8 py-5 text-lg">
                    <Save size={20} /> Save Quiz to Samarpan
                  </Button>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="ai"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass p-8 md:p-12 rounded-[40px] space-y-8"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-alt/10 border border-accent-alt/30 text-accent-alt font-black text-[10px] uppercase tracking-widest mb-2">
                AI Quiz Engine
              </div>
              <h1 className="text-3xl font-black">Generate with Magic</h1>
              <p className="text-text-soft leading-relaxed max-w-xl">
                Type a topic or upload your syllabus, and Samarpan will create 
                a balanced set of questions using our proprietary logic.
              </p>

              <div className="space-y-6 max-w-2xl">
                <div className="relative">
                  <Input 
                    label="Topic or Concept" 
                    placeholder="Eg. DBMS Normalization" 
                    className="pl-12"
                    value={aiData.topic}
                    onChange={(e) => setAiData({...aiData, topic: e.target.value})}
                  />
                  <FileText className="absolute left-4 bottom-4 text-text-soft" size={18} />
                  <div className="absolute right-4 bottom-4 flex gap-2">
                    <button className="p-1 text-text-soft hover:text-accent transition-colors"><Mic size={18} /></button>
                    <button className="p-1 text-text-soft hover:text-accent transition-colors"><Plus size={18} /></button>
                  </div>
                </div>

                <Input 
                  label="Quiz Title (Optional)" 
                  placeholder="Eg. Custom AI Session" 
                  value={aiData.title}
                  onChange={(e) => setAiData({...aiData, title: e.target.value})}
                />

                <div className="grid sm:grid-cols-2 gap-6">
                  <Select 
                    label="Difficulty"
                    value={aiData.difficulty}
                    onChange={(e) => setAiData({...aiData, difficulty: e.target.value})}
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </Select>
                  <Input 
                    label="No. of Questions" 
                    type="number" 
                    min={1} max={50}
                    value={aiData.count}
                    onChange={(e) => setAiData({...aiData, count: parseInt(e.target.value)})}
                  />
                </div>

                <Button onClick={handleAiGenerate} className="w-full py-5 text-lg flex items-center gap-3">
                  <Wand2 size={20} />
                  Magic Generate
                </Button>
                
                {aiStatus && <p className="text-center text-xs font-bold text-accent-alt animate-pulse">{aiStatus}</p>}
              </div>

              {/* Templates Row */}
              <div className="pt-8 space-y-6">
                <h4 className="text-xs font-bold uppercase tracking-widest text-text-soft px-1">Quick Templates</h4>
                <div className="grid sm:grid-cols-3 gap-4">
                  {[
                    { name: 'Warmup', sub: '5 Questions', icon: Zap },
                    { name: 'Mock Test', sub: '20 Questions', icon: FileText },
                    { name: 'Blitz', sub: '15 Questions', icon: Trophy },
                  ].map((temp, i) => (
                    <div key={i} className="glass p-5 rounded-2xl hover:border-accent-alt/50 cursor-pointer group transition-all">
                      <temp.icon className="text-text-soft group-hover:text-accent-alt mb-3 transition-colors" size={20} />
                      <p className="font-bold text-sm tracking-tight">{temp.name}</p>
                      <p className="text-[10px] text-text-soft uppercase tracking-widest">{temp.sub}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
    </AuthGuard>
  );
}
