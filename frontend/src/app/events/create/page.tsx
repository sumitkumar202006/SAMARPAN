'use client';
import React, { useState, useEffect } from 'react';
import { Calendar, AlertCircle, BookOpen } from 'lucide-react';
import api from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CreateEventPage() {
  const { user } = useAuth();
  const router   = useRouter();
  const [quizzes, setQuizzes]   = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [form, setForm] = useState({ quizId: '', title: '', description: '', scheduledAt: '', maxPlayers: 100, isPublic: true, recurrence: '' });

  useEffect(() => {
    if (!user?.email) return;
    api.get(`/api/quizzes/user/${user.email}`)
      .then(r => setQuizzes(r.data.quizzes || []))
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.quizId || !form.title || !form.scheduledAt) return setError('Quiz, title and date are required.');
    if (!user?.token) return;
    setLoading(true); setError(null);
    try {
      await api.post('/api/events', { ...form, maxPlayers: parseInt(String(form.maxPlayers)), scheduledAt: new Date(form.scheduledAt).toISOString() }, { headers: { Authorization: `Bearer ${user.token}` } });
      router.push('/events');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to create event');
      setLoading(false);
    }
  };

  return (
    <AuthGuard>
      <div className="py-2 lg:py-10 max-w-2xl mx-auto space-y-8">
        <div>
          <Link href="/events" className="text-text-soft hover:text-white transition-colors text-[11px] font-black uppercase">← Back to Events</Link>
          <h1 className="text-3xl font-black uppercase italic mt-2">Schedule Event</h1>
          <p className="text-text-soft text-sm">Create a public quiz event that anyone can RSVP to.</p>
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
            <AlertCircle size={16} className="text-red-400 shrink-0" />
            <p className="text-red-400 text-sm font-black">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="glass rounded-[32px] border border-white/5 p-8 space-y-6">
          <div>
            <label className="text-[9px] font-black uppercase tracking-widest text-text-soft mb-1.5 block">Event Title *</label>
            <input required value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Friday CS Night" className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:border-accent/40 text-sm font-black transition-all" />
          </div>
          <div>
            <label className="text-[9px] font-black uppercase tracking-widest text-text-soft mb-1.5 block">Description</label>
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="What's this event about?" rows={3} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:border-accent/40 text-sm resize-none transition-all" />
          </div>
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
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-text-soft mb-1.5 block">Date & Time *</label>
              <input required type="datetime-local" value={form.scheduledAt} onChange={e => setForm({...form, scheduledAt: e.target.value})} min={new Date().toISOString().slice(0,16)} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:border-accent/40 text-sm transition-all" />
            </div>
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-text-soft mb-1.5 block">Max Players</label>
              <input type="number" value={form.maxPlayers} onChange={e => setForm({...form, maxPlayers: parseInt(e.target.value)})} min={2} max={500} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:border-accent/40 text-sm transition-all" />
            </div>
          </div>
          <div>
            <label className="text-[9px] font-black uppercase tracking-widest text-text-soft mb-1.5 block">Recurrence</label>
            <select value={form.recurrence} onChange={e => setForm({...form, recurrence: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:border-accent/40 text-sm transition-all">
              <option value="">One-time</option>
              <option value="weekly">Weekly</option>
              <option value="daily">Daily</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="isPublic" checked={form.isPublic} onChange={e => setForm({...form, isPublic: e.target.checked})} className="w-4 h-4 rounded accent-indigo-500" />
            <label htmlFor="isPublic" className="text-[10px] font-black uppercase tracking-widest cursor-pointer">Make this event public</label>
          </div>
          <button type="submit" disabled={loading || quizzes.length === 0} className="w-full py-4 rounded-2xl bg-gradient-to-r from-accent-alt to-accent text-white font-black uppercase text-[11px] tracking-widest hover:opacity-90 transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] disabled:opacity-50">
            {loading ? 'Scheduling…' : '📅 Schedule Event'}
          </button>
        </form>
      </div>
    </AuthGuard>
  );
}
