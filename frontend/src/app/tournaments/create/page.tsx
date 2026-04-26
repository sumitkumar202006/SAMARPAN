'use client';
import React, { useState, useEffect } from 'react';
import { Crown, Calendar, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CreateTournamentPage() {
  const { user } = useAuth();
  const router   = useRouter();
  const [quizzes, setQuizzes]   = useState<any[]>([]);
  const [loading, setLoading]   = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '', description: '', quizId: '', maxPlayers: 16,
    format: 'single_elimination', startTime: '', prize: '', requiredPlan: ''
  });

  const isPro = ['pro','elite','institution'].includes(user?.plan || '');

  useEffect(() => {
    if (!user?.email) return;
    api.get(`/api/quizzes/user/${user.email}`)
      .then(r => setQuizzes(r.data.quizzes || []))
      .catch(() => setQuizzes([]))
      .finally(() => setFetching(false));
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.quizId || !form.startTime) return setError('Name, quiz, and start time are required.');
    if (!user?.token) return;
    setLoading(true); setError(null);
    try {
      await api.post('/api/tournaments', {
        ...form,
        maxPlayers: parseInt(String(form.maxPlayers)),
        startTime: new Date(form.startTime).toISOString(),
        requiredPlan: form.requiredPlan || null,
      }, { headers: { Authorization: `Bearer ${user.token}` } });
      router.push('/tournaments');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to create tournament');
      setLoading(false);
    }
  };

  if (!isPro) return (
    <AuthGuard>
      <div className="py-10 max-w-lg mx-auto text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-yellow-400/10 flex items-center justify-center mx-auto"><Crown size={32} className="text-yellow-400" /></div>
        <h1 className="text-2xl font-black uppercase italic">Pro Plan Required</h1>
        <p className="text-text-soft">Tournament hosting is available on Blaze Pro and above.</p>
        <Link href="/pricing" className="inline-flex items-center gap-2 px-8 py-3 rounded-2xl bg-gradient-to-r from-accent to-accent-alt text-white font-black uppercase hover:opacity-90 transition-all">Upgrade Now →</Link>
      </div>
    </AuthGuard>
  );

  return (
    <AuthGuard>
      <div className="py-2 lg:py-10 max-w-3xl mx-auto space-y-8">
        <div>
          <Link href="/tournaments" className="text-text-soft hover:text-white transition-colors text-[11px] font-black uppercase">← Back to Tournaments</Link>
          <h1 className="text-3xl font-black uppercase italic mt-2">Host Tournament</h1>
          <p className="text-text-soft text-sm">Set up a bracket competition for the arena.</p>
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
            <AlertCircle size={16} className="text-red-400 shrink-0" />
            <p className="text-red-400 text-sm font-black">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="glass rounded-[32px] border border-white/5 p-8 space-y-5">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-text-soft">Basic Info</h2>
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-text-soft mb-1.5 block">Tournament Name *</label>
              <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. CS Championship S1" className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:border-accent/40 text-sm font-black transition-all" />
            </div>
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-text-soft mb-1.5 block">Description</label>
              <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Describe the tournament…" rows={3} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:border-accent/40 text-sm resize-none transition-all" />
            </div>
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-text-soft mb-1.5 block">Prize / Reward</label>
              <input value={form.prize} onChange={e => setForm({...form, prize: e.target.value})} placeholder="e.g. Neural Core Badge" className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:border-accent/40 text-sm transition-all" />
            </div>
          </div>

          {/* Quiz & Schedule */}
          <div className="glass rounded-[32px] border border-white/5 p-8 space-y-5">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-text-soft">Quiz & Schedule</h2>
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-text-soft mb-1.5 block">Select Quiz *</label>
              {fetching ? <div className="h-12 bg-white/5 rounded-xl animate-pulse" /> :
               quizzes.length === 0 ? (
                <div className="p-4 rounded-xl bg-yellow-400/5 border border-yellow-400/20">
                  <p className="text-yellow-400 text-[11px] font-black">No quizzes found. <Link href="/create" className="underline">Create one →</Link></p>
                </div>
               ) : (
                <select required value={form.quizId} onChange={e => setForm({...form, quizId: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:border-accent/40 text-sm transition-all">
                  <option value="">Select a quiz…</option>
                  {quizzes.map((q: any) => <option key={q.id || q._id} value={q.id || q._id}>{q.title}</option>)}
                </select>
               )}
            </div>
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-text-soft mb-1.5 block">Start Date & Time *</label>
              <input required type="datetime-local" value={form.startTime} onChange={e => setForm({...form, startTime: e.target.value})} min={new Date().toISOString().slice(0,16)} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:border-accent/40 text-sm transition-all" />
            </div>
          </div>

          {/* Format & Access */}
          <div className="glass rounded-[32px] border border-white/5 p-8 space-y-5">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-text-soft">Format & Access</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-text-soft mb-1.5 block">Max Players</label>
                <select value={form.maxPlayers} onChange={e => setForm({...form, maxPlayers: parseInt(e.target.value)})} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:border-accent/40 text-sm transition-all">
                  {[8,16,32,64,128].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-text-soft mb-1.5 block">Format</label>
                <select value={form.format} onChange={e => setForm({...form, format: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:border-accent/40 text-sm transition-all">
                  <option value="single_elimination">Single Elimination</option>
                  <option value="round_robin">Round Robin</option>
                </select>
              </div>
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-text-soft mb-1.5 block">Required Plan</label>
                <select value={form.requiredPlan} onChange={e => setForm({...form, requiredPlan: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:border-accent/40 text-sm transition-all">
                  <option value="">Open to all</option>
                  <option value="pro">Pro+</option>
                  <option value="elite">Elite+</option>
                  <option value="institution">Institution</option>
                </select>
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading || quizzes.length === 0} className="w-full py-4 rounded-2xl bg-gradient-to-r from-accent to-accent-alt text-white font-black uppercase text-[11px] tracking-widest hover:opacity-90 transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] disabled:opacity-50">
            {loading ? 'Creating…' : '🏆 Launch Tournament'}
          </button>
        </form>
      </div>
    </AuthGuard>
  );
}
