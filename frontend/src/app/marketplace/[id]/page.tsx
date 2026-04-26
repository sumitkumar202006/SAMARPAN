'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, Play, GitFork, ArrowLeft, Users, Clock, Sparkles,
  BarChart2, BookOpen, MessageSquare, AlertCircle, RefreshCw, Check, Tag
} from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';
import { AvatarFrame } from '@/components/ui/AvatarFrame';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function StarRating({ rating, interactive = false, onRate }: { rating: number; interactive?: boolean; onRate?: (r: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map(i => (
        <button key={i} onClick={() => interactive && onRate?.(i)}
          onMouseEnter={() => interactive && setHover(i)}
          onMouseLeave={() => interactive && setHover(0)}
          disabled={!interactive}
          className={cn('transition-all', interactive && 'cursor-pointer hover:scale-125', !interactive && 'cursor-default')}>
          <Star size={interactive ? 20 : 13}
            className={cn('transition-colors', i <= (hover || rating) ? 'text-yellow-400 fill-yellow-400' : 'text-white/20')} />
        </button>
      ))}
    </div>
  );
}

export default function MarketplaceQuizDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router   = useRouter();
  const [quiz,    setQuiz]    = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [myRating, setMyRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    if (!id) return;
    api.get(`/api/marketplace/${id}`)
      .then(r => setQuiz(r.data.quiz))
      .catch(() => setError('Quiz not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleRemix = async () => {
    if (!user?.token) return showToast('Log in to remix', false);
    try {
      await api.post(`/api/marketplace/${id}/remix`, {}, { headers: { Authorization: `Bearer ${user.token}` } });
      showToast('🎉 Remixed! Check your quiz library.');
    } catch (err: any) { showToast(err?.response?.data?.error || 'Remix failed', false); }
  };

  const handleSubmitReview = async () => {
    if (!user?.token) return showToast('Log in to review', false);
    if (!myRating) return showToast('Please select a star rating', false);
    setSubmitting(true);
    try {
      await api.post(`/api/marketplace/${id}/review`, { rating: myRating, comment }, { headers: { Authorization: `Bearer ${user.token}` } });
      showToast('⭐ Review submitted!');
      setComment(''); setMyRating(0);
      const r = await api.get(`/api/marketplace/${id}`);
      setQuiz(r.data.quiz);
    } catch (err: any) { showToast(err?.response?.data?.error || 'Review failed', false); }
    finally { setSubmitting(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-12 h-12 rounded-full border-2 border-accent border-t-transparent animate-spin" />
    </div>
  );

  if (error || !quiz) return (
    <div className="max-w-md mx-auto mt-20 glass rounded-[32px] border border-red-500/20 p-12 text-center space-y-4">
      <AlertCircle size={32} className="text-red-400 mx-auto" />
      <p className="text-red-400 font-black">{error || 'Quiz not found'}</p>
      <Link href="/marketplace" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-text-soft hover:text-white text-sm font-black uppercase">
        ← Back to Marketplace
      </Link>
    </div>
  );

  const avgRating = quiz.averageRating || 0;
  const difficulty = quiz.difficulty || 'medium';

  return (
    <AuthGuard>
      <div className="py-2 lg:py-10 max-w-5xl mx-auto space-y-8">
        <AnimatePresence>
          {toast && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className={cn('fixed top-24 left-1/2 -translate-x-1/2 z-[500] px-5 py-3 rounded-2xl border backdrop-blur-xl text-[11px] font-black uppercase tracking-widest',
                toast.ok ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'
              )}>{toast.msg}</motion.div>
          )}
        </AnimatePresence>

        {/* Back */}
        <Link href="/marketplace" className="flex items-center gap-2 text-text-soft hover:text-white transition-colors text-[11px] font-black uppercase w-fit">
          <ArrowLeft size={14} /> Back to Marketplace
        </Link>

        <div className="grid lg:grid-cols-[1fr_320px] gap-8 items-start">
          {/* Left — main content */}
          <div className="space-y-6">
            {/* Title card */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[32px] border border-white/5 p-8 space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn('px-2 py-0.5 rounded-full text-[9px] font-black uppercase border capitalize',
                  difficulty === 'hard' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                  difficulty === 'medium' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                )}>{difficulty}</span>
                {quiz.aiGenerated && <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-accent/10 text-accent border border-accent/20 uppercase"><Sparkles size={8} /> AI Generated</span>}
                {quiz.topic && <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-white/5 text-text-soft border border-white/5 uppercase">{quiz.topic}</span>}
              </div>

              <h1 className="text-2xl lg:text-3xl font-black uppercase italic tracking-tight">{quiz.title}</h1>

              {quiz.author && (
                <div className="flex items-center gap-3 pt-2 border-t border-white/5">
                  <AvatarFrame src={quiz.author.avatar} name={quiz.author.name} size="sm" frame={quiz.author.avatarFrame} showFrame />
                  <div>
                    <p className="font-black text-sm">{quiz.author.name}</p>
                    {quiz.author.username && <p className="text-[9px] text-text-soft">@{quiz.author.username}</p>}
                  </div>
                </div>
              )}

              {/* Stats row */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Questions', val: (quiz.questions as any[])?.length || 0, icon: BookOpen },
                  { label: 'Plays',     val: quiz.playCount || 0,                    icon: Play },
                  { label: 'Reviews',   val: quiz.reviewCount || 0,                  icon: MessageSquare },
                  { label: 'Rating',    val: avgRating.toFixed(1),                   icon: Star },
                ].map((s, i) => (
                  <div key={i} className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 text-center">
                    <s.icon size={12} className="text-text-soft mx-auto mb-1" />
                    <p className="text-[8px] text-text-soft uppercase font-black">{s.label}</p>
                    <p className="font-black text-sm">{s.val}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <StarRating rating={Math.round(avgRating)} />
                <span className="text-yellow-400 font-black">{avgRating.toFixed(1)}</span>
                <span className="text-text-soft text-[10px]">/ 5 ({quiz.reviewCount} reviews)</span>
              </div>

              {/* Tags */}
              {quiz.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {quiz.tags.map((t: string, i: number) => (
                    <span key={i} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-[9px] text-text-soft">
                      <Tag size={8} />#{t}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Reviews */}
            <div className="glass rounded-[28px] border border-white/5 overflow-hidden">
              <div className="p-5 border-b border-white/5 flex items-center gap-2">
                <MessageSquare size={14} className="text-accent" />
                <h2 className="text-[10px] font-black uppercase tracking-widest">Community Reviews</h2>
              </div>

              {/* Submit review */}
              {user && (
                <div className="p-5 border-b border-white/5 space-y-3">
                  <p className="text-[9px] font-black uppercase tracking-widest text-text-soft">Your Review</p>
                  <StarRating rating={myRating} interactive onRate={setMyRating} />
                  <textarea
                    value={comment} onChange={e => setComment(e.target.value)}
                    placeholder="Share your thoughts (optional)…"
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm resize-none focus:outline-none focus:border-accent/40 transition-all"
                  />
                  <button onClick={handleSubmitReview} disabled={submitting || !myRating}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white font-black text-[10px] uppercase tracking-widest hover:bg-accent/80 transition-all disabled:opacity-50">
                    {submitting ? 'Submitting…' : <><Check size={12} /> Submit Review</>}
                  </button>
                </div>
              )}

              {/* Review list */}
              <div className="divide-y divide-white/5">
                {quiz.reviews?.length > 0 ? quiz.reviews.map((r: any) => (
                  <div key={r.id} className="flex items-start gap-3 p-5">
                    <AvatarFrame src={r.user?.avatar} name={r.user?.name} size="xs" showFrame={false} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-black text-xs">{r.user?.name}</p>
                        <StarRating rating={r.rating} />
                      </div>
                      {r.comment && <p className="text-[11px] text-text-soft leading-relaxed">{r.comment}</p>}
                    </div>
                  </div>
                )) : (
                  <div className="p-10 text-center">
                    <MessageSquare size={24} className="text-text-soft/20 mx-auto mb-2" />
                    <p className="text-[10px] text-text-soft">No reviews yet. Be the first!</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right — actions sidebar */}
          <div className="space-y-4 lg:sticky lg:top-24">
            <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="glass rounded-[28px] border border-white/5 p-6 space-y-3">
              <h3 className="text-[9px] font-black uppercase tracking-widest text-text-soft">Actions</h3>
              <Link href={`/host?quizId=${quiz.id}`}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-accent text-white font-black text-[11px] uppercase tracking-widest hover:bg-accent/80 transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                <Play size={14} /> Host Session
              </Link>
              <Link href={`/play/solo?quiz=${quiz.id}`}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-black text-[11px] uppercase tracking-widest hover:bg-white/10 transition-all">
                <BarChart2 size={14} /> Solo Practice
              </Link>
              <button onClick={handleRemix}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-accent-alt/10 border border-accent-alt/20 text-accent-alt font-black text-[11px] uppercase tracking-widest hover:bg-accent-alt hover:text-white transition-all">
                <GitFork size={14} /> Remix & Edit
              </button>
            </motion.div>

            {/* Quick stats */}
            <div className="glass rounded-[28px] border border-white/5 p-6 space-y-3">
              <h3 className="text-[9px] font-black uppercase tracking-widest text-text-soft">Info</h3>
              {[
                { label: 'Created', val: new Date(quiz.createdAt).toLocaleDateString() },
                { label: 'Topic',   val: quiz.topic || 'General' },
                { label: 'Language', val: 'English' },
              ].map((row, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                  <span className="text-[9px] text-text-soft uppercase font-black">{row.label}</span>
                  <span className="text-[10px] font-black">{row.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
