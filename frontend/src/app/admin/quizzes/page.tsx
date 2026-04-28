'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Search, 
  Trash2, 
  Eye, 
  MoreVertical, 
  ShieldCheck, 
  Zap, 
  Globe,
  Lock,
  MessageCircle,
  BarChart2,
  Trash
} from 'lucide-react';
import api from '@/lib/axios';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export default function QuizVaultPage() {
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchQuizzes();
  }, [search]);

  async function fetchQuizzes() {
    try {
      setLoading(true);
      const res = await api.get('/api/admin/quizzes');
      // Simple local filter for now
      const data = res.data.quizzes;
      setQuizzes(data.filter((q: any) => 
        q.title.toLowerCase().includes(search.toLowerCase()) || 
        q.topic.toLowerCase().includes(search.toLowerCase())
      ));
    } catch (err) {
      console.error("Failed to load quizzes", err);
    } finally {
      setLoading(false);
    }
  }

  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    try {
      await api.put(`/api/admin/quizzes/${id}/publish`, { isPublished: !currentStatus });
      setQuizzes(quizzes.map(q => q._id === id ? { ...q, isPublished: !currentStatus } : q));
    } catch (err) {
      alert("Failed to update publication status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Caution: This action will permanently delete this simulation from the vault. Proceed?")) return;
    try {
      await api.delete(`/api/admin/quizzes/${id}`);
      setQuizzes(quizzes.filter(q => q._id !== id));
    } catch (err) {
      alert("Failed to delete quiz");
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-1">Mission Vault</h1>
          <p className="text-text-soft text-sm">Overseeing {quizzes.length} live simulations in the cloud.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-soft group-focus-within:text-accent transition-colors" />
            <input 
              type="text" 
              placeholder="Search simulations (Topic/Title)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white/5 border border-white/5 rounded-2xl py-3 pl-12 pr-6 text-sm outline-none focus:ring-1 focus:ring-accent w-64 lg:w-96 transition-all font-medium"
            />
          </div>
        </div>
      </div>

      {/* Grid of Quizzes */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {quizzes.map((quiz, i) => (
            <motion.div 
              key={quiz._id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.05 }}
              className="glass p-6 rounded-[32px] border-white/5 flex flex-col group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-[0.03] -translate-y-1/4 translate-x-1/4 group-hover:scale-110 transition-transform">
                 <BookOpen size={120} />
              </div>

              <div className="flex justify-between items-start mb-6">
                <div className={cn(
                  "p-3 rounded-2xl bg-white/5 border border-white/5",
                  quiz.aiGenerated ? "text-accent" : "text-accent-alt"
                )}>
                   {quiz.aiGenerated ? <Zap size={20} /> : <Globe size={20} />}
                </div>
                <div className="flex gap-2">
                   <button className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-text-soft hover:text-white transition-all">
                      <Eye size={16} />
                   </button>
                   <button 
                     onClick={() => handleDelete(quiz._id)}
                     className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all border border-red-500/10"
                   >
                      <Trash size={16} />
                   </button>
                </div>
              </div>

              <div className="mb-4">
                 <button 
                  onClick={() => handleTogglePublish(quiz._id, quiz.isPublished)}
                  className={cn(
                    "w-full py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center justify-center gap-2",
                    quiz.isPublished 
                      ? "bg-[#00D4B4]/10 border-[#00D4B4]/20 text-[#00D4B4] hover:bg-[#00D4B4]/20" 
                      : "bg-white/5 border-white/5 text-text-soft hover:bg-white/10"
                  )}
                 >
                    <div className={cn("w-2 h-2 rounded-full", quiz.isPublished ? "bg-[#00D4B4] animate-pulse" : "bg-text-soft")} />
                    {quiz.isPublished ? 'Live in Arena' : 'Vaulted / Private'}
                 </button>
              </div>

              <div className="space-y-4 relative z-10 flex-1">
                <div>
                   <h3 className="text-lg font-black tracking-tight leading-none mb-2 group-hover:text-accent transition-colors truncate">
                     {quiz.title}
                   </h3>
                   <span className="text-[10px] font-black uppercase tracking-widest text-text-soft bg-white/5 px-2 py-1 rounded-md">
                     Topic: {quiz.topic}
                   </span>
                </div>

                <div className="flex flex-wrap gap-2">
                   <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[10px] font-bold text-text-soft">
                      <BarChart2 size={12} className="text-accent" />
                      {quiz.playCount || 0} Runs
                   </div>
                   <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[10px] font-bold text-text-soft">
                      <MessageCircle size={12} className="text-[#00D4B4]" />
                      {quiz.questions.length} Items
                   </div>
                </div>

                <div className="pt-4 mt-auto border-t border-white/5 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center font-black text-[10px] border border-white/5">
                         {quiz.author?.name?.charAt(0) || 'S'}
                      </div>
                      <div className="flex flex-col">
                         <p className="text-[10px] font-black tracking-tight leading-none">{quiz.author?.name || 'System'}</p>
                         <p className="text-[8px] text-text-soft uppercase tracking-widest mt-1">Authorized Host</p>
                      </div>
                   </div>
                   <p className="text-[9px] font-bold text-text-soft uppercase opacity-40">{new Date(quiz.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {quizzes.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-text-soft">
             <BookOpen size={40} className="opacity-10 mb-4" />
             <p className="text-sm font-bold uppercase tracking-widest opacity-30">No simulations found in active relay.</p>
          </div>
        )}
      </div>
    </div>
  );
}
