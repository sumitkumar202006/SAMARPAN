'use client';
import React, { useState, useEffect } from 'react';
import { AlertCircle, BookOpen } from 'lucide-react';
import api from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AssignQuizPage() {
  const { user } = useAuth();
  const router   = useRouter();
  const [quizzes, setQuizzes]   = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [form, setForm] = useState({ quizId: '', title: '', dueAt: '' });

  useEffect(() => {
    if (!user?.email) return;
    api.get(`/api/quizzes/user/${user.email}`)
      .then(r => setQuizzes(r.data.quizzes || []))
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.quizId) return setError('Please select a quiz.');
    if (!user?.token) return;
    setLoading(true); setError(null);
    try {
      await api.post('/api/institution/assign', { quizId: form.quizId, title: form.title, dueAt: form.dueAt ? new Date(form.dueAt).toISOString() : null }, { headers: { Authorization: `Bearer ${user.token}` } });
      router.push('/institution');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to assign quiz');
      setLoading(false);
    }
  };

  return (
    <AuthGuard>
      <div className="py-2 lg:py-10 max-w-xl mx-auto space-y-8">
        <div>
          <Link href="/institution" className="text-text-soft hover:text-white transition-colors text-[11px] font-black uppercase">← Back to Institution</Link>
          <h1 className="text-3xl font-black uppercase italic mt-2">Assign Quiz</h1>
          <p className="text-text-soft text-sm">Assign a quiz as homework to all institution members.</p>
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
            <AlertCircle size={16} className="text-red-400 shrink-0" />
            <p className="text-red-400 text-sm font-black">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="glass rounded-[32px] border border-white/5 p-8 space-y-6">
          <div>
            <label className="text-[9px] font-black uppercase tracking-widest text-text-soft mb-1.5 block">Select Quiz *</label>
            {fetching ? <div className="h-12 bg-white/5 rounded-xl animate-pulse" /> :
             quizzes.length === 0 ? (
              <div className="p-4 rounded-xl bg-yellow-400/5 border border-yellow-400/20">
                <p className="text-yellow-400 text-[11px] font-black">No quizzes found. <Link href="/create" className="underline">Create one first →</Link></p>
              </div>
             ) : (
              <select required value={form.quizId} onChange={e => setForm({...form, quizId: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:border-accent/40 text-sm transition-all">
                <option value="">Select a quiz…</option>
                {quizzes.map((q: any) => <option key={q.id || q._id} value={q.id || q._id}>{q.title}</option>)}
              </select>
             )}
          </div>
          <div>
            <label className="text-[9px] font-black uppercase tracking-widest text-text-soft mb-1.5 block">Assignment Title (optional)</label>
            <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Week 3 Practice" className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:border-accent/40 text-sm transition-all" />
          </div>
          <div>
            <label className="text-[9px] font-black uppercase tracking-widest text-text-soft mb-1.5 block">Due Date (optional)</label>
            <input type="datetime-local" value={form.dueAt} onChange={e => setForm({...form, dueAt: e.target.value})} min={new Date().toISOString().slice(0,16)} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:border-accent/40 text-sm transition-all" />
          </div>
          <button type="submit" disabled={loading || quizzes.length === 0} className="w-full py-4 rounded-2xl bg-accent text-white font-black uppercase text-[11px] tracking-widest hover:bg-accent/80 transition-all disabled:opacity-50">
            {loading ? 'Assigning…' : '📝 Assign to All Members'}
          </button>
        </form>
      </div>
    </AuthGuard>
  );
}
