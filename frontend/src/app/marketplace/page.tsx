'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Store, Star, Play, GitFork, Search, Filter,
  BookOpen, Cpu, Zap, FlaskConical, Map, Globe,
  ChevronRight, RefreshCw, Sparkles, AlertCircle, Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';
import { AvatarFrame } from '@/components/ui/AvatarFrame';
import { AuthGuard } from '@/components/auth/AuthGuard';
import Link from 'next/link';

const TOPICS = [
  { id: 'all', label: 'All', icon: Globe },
  { id: 'Computer Science', label: 'CS', icon: Cpu },
  { id: 'Mathematics', label: 'Math', icon: Zap },
  { id: 'Science', label: 'Science', icon: FlaskConical },
  { id: 'History', label: 'History', icon: BookOpen },
  { id: 'Geography', label: 'Geography', icon: Map },
];
const DIFFICULTIES = ['all', 'easy', 'medium', 'hard'] as const;
const SORTS = [{ id: 'popular', label: '🔥 Popular' }, { id: 'rating', label: '⭐ Top Rated' }, { id: 'newest', label: '✨ Newest' }];

function StarRating({ rating, count, interactive = false, onRate }: { rating: number; count?: number; interactive?: boolean; onRate?: (r: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map(i => (
        <button key={i} onClick={() => interactive && onRate?.(i)} onMouseEnter={() => interactive && setHover(i)} onMouseLeave={() => interactive && setHover(0)} disabled={!interactive} className={cn('transition-all', interactive && 'hover:scale-110 cursor-pointer', !interactive && 'cursor-default')}>
          <Star size={interactive ? 16 : 11} className={cn('transition-colors', i <= (hover || rating) ? 'text-yellow-400 fill-yellow-400' : 'text-white/20 fill-transparent')} />
        </button>
      ))}
      {count !== undefined && <span className="text-[9px] text-text-soft ml-1">({count})</span>}
    </div>
  );
}

function QuizCard({ quiz, onRemix, onRate }: { quiz: any; onRemix: (id: string) => void; onRate: (id: string, r: number) => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -2 }} className="glass rounded-[24px] border border-white/5 p-5 flex flex-col gap-3 group hover:border-white/10 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            <span className={cn('px-2 py-0.5 rounded-full text-[9px] font-black uppercase border', quiz.difficulty === 'hard' ? 'bg-red-500/10 text-red-400 border-red-500/20' : quiz.difficulty === 'medium' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20')}>{quiz.difficulty}</span>
            {quiz.aiGenerated && <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-accent/10 text-accent border border-accent/20 uppercase"><Sparkles size={8} /> AI</span>}
          </div>
          <h3 className="font-black text-sm uppercase italic tracking-tight leading-tight group-hover:text-accent transition-colors line-clamp-2">{quiz.title}</h3>
        </div>
        <div className="text-center shrink-0">
          <p className="text-[9px] text-text-soft uppercase font-black">Plays</p>
          <p className="font-black text-sm">{quiz.playCount || 0}</p>
        </div>
      </div>

      {quiz.author && (
        <div className="flex items-center gap-2">
          <AvatarFrame src={quiz.author.avatar} name={quiz.author.name} size="xs" frame={quiz.author.avatarFrame} showFrame />
          <div>
            <p className="text-[10px] font-black">{quiz.author.name}</p>
            {quiz.author.username && <p className="text-[8px] text-text-soft">@{quiz.author.username}</p>}
          </div>
        </div>
      )}

      {quiz.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {quiz.tags.slice(0, 4).map((t: string) => (
            <span key={t} className="px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-[8px] text-text-soft">#{t}</span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <StarRating rating={Math.round(quiz.averageRating || 0)} count={quiz.reviewCount} />
        <p className="text-[10px] font-black text-yellow-400">{(quiz.averageRating || 0).toFixed(1)}<span className="text-text-soft text-[9px]">/5</span></p>
      </div>

      <div className="border-t border-white/5 pt-2">
        <p className="text-[9px] text-text-soft uppercase font-black mb-1.5">Rate it</p>
        <StarRating rating={0} interactive onRate={(r) => onRate(quiz.id, r)} />
      </div>

      <div className="flex gap-2 pt-1">
        <Link href={`/host?quizId=${quiz.id}`} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-accent/10 border border-accent/20 text-accent text-[10px] font-black uppercase hover:bg-accent hover:text-white transition-all">
          <Play size={10} /> Play
        </Link>
        <button onClick={() => onRemix(quiz.id)} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/5 text-text-soft text-[10px] font-black uppercase hover:bg-accent-alt/10 hover:text-accent-alt hover:border-accent-alt/20 transition-all">
          <GitFork size={10} /> Remix
        </button>
        <Link href={`/marketplace/${quiz.id}`} className="px-3 py-2 rounded-xl bg-white/5 border border-white/5 text-text-soft hover:text-white transition-all">
          <ChevronRight size={14} />
        </Link>
      </div>
    </motion.div>
  );
}

export default function MarketplacePage() {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [search, setSearch]   = useState('');
  const [topic, setTopic]     = useState('all');
  const [diff, setDiff]       = useState('all');
  const [sort, setSort]       = useState('popular');
  const [total, setTotal]     = useState(0);
  const [toast, setToast]     = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3500); };

  const fetchQuizzes = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams({ sort });
      if (topic !== 'all') params.set('topic', topic);
      if (diff !== 'all')  params.set('difficulty', diff);
      const res = await api.get(`/api/marketplace?${params}`);
      setQuizzes(res.data.quizzes || []);
      setTotal(res.data.total || 0);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to load marketplace');
    } finally { setLoading(false); }
  }, [topic, diff, sort]);

  useEffect(() => { fetchQuizzes(); }, [fetchQuizzes]);

  const handleRemix = async (id: string) => {
    if (!user?.token) return showToast('Log in to remix quizzes', false);
    try {
      await api.post(`/api/marketplace/${id}/remix`, {}, { headers: { Authorization: `Bearer ${user.token}` } });
      showToast('🎉 Quiz remixed! Check your library.');
    } catch (err: any) { showToast(err?.response?.data?.error || 'Remix failed', false); }
  };

  const handleRate = async (id: string, rating: number) => {
    if (!user?.token) return showToast('Log in to rate', false);
    try {
      await api.post(`/api/marketplace/${id}/review`, { rating }, { headers: { Authorization: `Bearer ${user.token}` } });
      showToast(`⭐ Rated ${rating}/5!`);
      fetchQuizzes();
    } catch (err: any) { showToast(err?.response?.data?.error || 'Rating failed', false); }
  };

  const filtered = quizzes.filter(q => !search || q.title.toLowerCase().includes(search.toLowerCase()) || q.tags?.some((t: string) => t.includes(search.toLowerCase())));

  return (
    <div className="py-2 lg:py-10 space-y-8">
        <AnimatePresence>
          {toast && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className={cn('fixed top-24 left-1/2 -translate-x-1/2 z-[500] px-5 py-3 rounded-2xl border backdrop-blur-xl text-[11px] font-black uppercase tracking-widest',
                toast.ok ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'
              )}>{toast.msg}</motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Store size={20} className="text-accent" />
              <h1 className="text-3xl lg:text-4xl font-black tracking-tight uppercase italic">Marketplace</h1>
            </div>
            <p className="text-text-soft text-sm">Community quizzes — play, rate, and remix. <span className="text-white font-black">{total.toLocaleString()}</span> available.</p>
          </div>
          {user && (
            <Link href="/create" className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-accent to-accent-alt text-white font-black text-[11px] uppercase tracking-widest hover:opacity-90 transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)]">
              <Sparkles size={14} /> Publish Your Quiz
            </Link>
          )}
        </div>

        <div className="space-y-3">
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-soft" />
            <input type="text" placeholder="Search quizzes, tags…" value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm placeholder:text-text-soft focus:outline-none focus:border-accent/40 transition-all" />
          </div>
          <div className="flex flex-wrap gap-2">
            {TOPICS.map(t => (
              <button key={t.id} onClick={() => setTopic(t.id)} className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all', topic === t.id ? 'bg-accent text-white border-accent/50' : 'glass border-white/5 text-text-soft hover:text-white')}>
                <t.icon size={9} />{t.label}
              </button>
            ))}
            <div className="h-5 w-px bg-white/10 mx-1" />
            {DIFFICULTIES.map(d => (
              <button key={d} onClick={() => setDiff(d)} className={cn('px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all capitalize', diff === d ? 'bg-accent-alt text-white border-accent-alt/50' : 'glass border-white/5 text-text-soft hover:text-white')}>{d}</button>
            ))}
            <div className="h-5 w-px bg-white/10 mx-1" />
            {SORTS.map(s => (
              <button key={s.id} onClick={() => setSort(s.id)} className={cn('px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all', sort === s.id ? 'bg-white/15 text-white border-white/20' : 'glass border-white/5 text-text-soft hover:text-white')}>{s.label}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => <div key={i} className="glass rounded-[24px] border border-white/5 h-64 animate-pulse" />)}
          </div>
        ) : error ? (
          <div className="glass rounded-[32px] border border-red-500/20 p-16 text-center space-y-4">
            <AlertCircle size={32} className="text-red-400 mx-auto" />
            <p className="text-red-400 font-black">{error}</p>
            <button onClick={fetchQuizzes} className="flex items-center gap-2 mx-auto px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-black text-xs uppercase"><RefreshCw size={12} /> Retry</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass rounded-[40px] border border-white/5 p-20 text-center space-y-4">
            <Store size={36} className="text-text-soft/30 mx-auto" />
            <h3 className="font-black text-lg uppercase italic">No quizzes found</h3>
            {user && <Link href="/create" className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-accent text-white font-black uppercase text-sm hover:bg-accent/80 transition-all"><Sparkles size={16} /> Create Quiz</Link>}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence>
              {filtered.map((q, i) => (
                <motion.div key={q.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                  <QuizCard quiz={q} onRemix={handleRemix} onRate={handleRate} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
  );
}
