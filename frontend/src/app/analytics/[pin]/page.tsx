'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart2, Target, Clock, Trophy, ArrowLeft, Download,
  TrendingUp, Zap, CheckCircle2, XCircle, AlertCircle,
  RefreshCw, Star, ChevronDown, ChevronUp, Share2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

// ─── Mini bar chart ───────────────────────────────────────────────────────────
function Bar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className={cn('h-full rounded-full', color)}
      />
    </div>
  );
}

// ─── Question row ─────────────────────────────────────────────────────────────
function QuestionRow({ q, idx }: { q: any; idx: number }) {
  const [open, setOpen] = useState(false);
  const acc = Math.round(q.accuracy || 0);
  const color = acc >= 70 ? 'bg-emerald-400' : acc >= 40 ? 'bg-yellow-400' : 'bg-red-400';
  const textColor = acc >= 70 ? 'text-emerald-400' : acc >= 40 ? 'text-yellow-400' : 'text-red-400';

  return (
    <div className="border border-white/5 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-4 p-4 hover:bg-white/[0.03] transition-colors text-left"
      >
        <span className="text-[9px] text-text-soft font-black w-6 shrink-0">Q{idx + 1}</span>
        <div className="flex-1 min-w-0">
          <p className="font-black text-xs line-clamp-1">{q.question}</p>
          <div className="flex items-center gap-4 mt-1.5">
            <Bar pct={acc} color={color} />
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className={cn('text-[10px] font-black', textColor)}>{acc}% acc</span>
          <span className="text-[9px] text-text-soft">{(q.avgTime || 0).toFixed(1)}s avg</span>
          <span className="text-[9px] text-text-soft">{q.responses} responses</span>
          {open ? <ChevronUp size={12} className="text-text-soft" /> : <ChevronDown size={12} className="text-text-soft" />}
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden border-t border-white/5"
          >
            <div className="p-4 grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-emerald-400/5 border border-emerald-400/20">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 size={10} className="text-emerald-400" />
                  <span className="text-[9px] text-emerald-400 font-black uppercase">Correct</span>
                </div>
                <p className="font-black text-lg text-emerald-400">{q.correct}</p>
              </div>
              <div className="p-3 rounded-xl bg-red-400/5 border border-red-400/20">
                <div className="flex items-center gap-2 mb-1">
                  <XCircle size={10} className="text-red-400" />
                  <span className="text-[9px] text-red-400 font-black uppercase">Incorrect</span>
                </div>
                <p className="font-black text-lg text-red-400">{q.incorrect}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Player card ──────────────────────────────────────────────────────────────
function PlayerCard({ p, rank }: { p: any; rank: number }) {
  const acc  = Math.round(p.accuracy || 0);
  const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.05 }}
      className={cn(
        'flex items-center gap-4 p-4 rounded-2xl border transition-all',
        rank === 1 ? 'bg-yellow-400/5 border-yellow-400/20' : 'bg-white/[0.02] border-white/5'
      )}
    >
      <span className="text-sm font-black w-8 text-center shrink-0">{medal}</span>
      <div className="flex-1 min-w-0">
        <p className="font-black text-sm uppercase italic truncate">{p.name}</p>
        <div className="flex items-center gap-3 mt-1">
          <Bar pct={acc} color={acc >= 70 ? 'bg-emerald-400' : acc >= 40 ? 'bg-yellow-400' : 'bg-red-400'} />
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className={cn('font-black text-sm', acc >= 70 ? 'text-emerald-400' : acc >= 40 ? 'text-yellow-400' : 'text-red-400')}>
          {acc}%
        </span>
        <span className="text-[8px] text-text-soft">{p.correct}/{p.total} correct</span>
        <span className="text-[8px] text-text-soft">{(p.totalTime / Math.max(p.total, 1)).toFixed(1)}s/q avg</span>
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const params   = useParams();
  const router   = useRouter();
  const { user } = useAuth();
  const pin      = params.pin as string;

  const [data,    setData]    = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [tab,     setTab]     = useState<'players' | 'questions'>('players');

  useEffect(() => {
    if (!pin) return;
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/api/host/analytics/${pin}`);
        setData(res.data);
      } catch (err: any) {
        setError(err?.response?.data?.error || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [pin]);

  const exportCSV = () => {
    if (!data) return;
    const rows = [
      ['Player', 'Correct', 'Incorrect', 'Total', 'Accuracy %', 'Avg Time (s)'],
      ...data.playerPerformance.map((p: any) => [
        p.name, p.correct, p.incorrect, p.total,
        Math.round(p.accuracy), (p.totalTime / Math.max(p.total, 1)).toFixed(2)
      ])
    ];
    const csv  = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `analytics-${pin}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="py-10 space-y-6 max-w-4xl mx-auto">
        <div className="h-10 bg-white/5 rounded-2xl animate-pulse w-1/3" />
        <div className="grid grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse" />)}
        </div>
        <div className="h-64 bg-white/5 rounded-[28px] animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-10 flex flex-col items-center gap-4 text-center max-w-md mx-auto">
        <AlertCircle size={40} className="text-red-400" />
        <h2 className="font-black text-xl uppercase italic">Session Not Found</h2>
        <p className="text-text-soft text-sm">{error}</p>
        <button onClick={() => router.back()} className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-accent text-white font-black uppercase text-sm hover:bg-accent/80 transition-all">
          <ArrowLeft size={14} /> Go Back
        </button>
      </div>
    );
  }

  if (!data) return null;

  const players   = [...(data.playerPerformance || [])].sort((a, b) => b.accuracy - a.accuracy);
  const questions = data.questionPerformance || [];
  const session   = data.session || {};
  const avgAcc    = players.length ? Math.round(players.reduce((s: number, p: any) => s + p.accuracy, 0) / players.length) : 0;
  const avgTime   = players.length ? (players.reduce((s: number, p: any) => s + p.totalTime / Math.max(p.total, 1), 0) / players.length).toFixed(1) : 0;
  const hardest   = [...questions].sort((a, b) => a.accuracy - b.accuracy)[0];

  return (
    <div className="py-2 lg:py-10 space-y-8 max-w-5xl mx-auto">
      {/* Back nav */}
      <div className="flex items-center justify-between">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-text-soft hover:text-white transition-colors font-black text-[11px] uppercase tracking-widest">
          <ArrowLeft size={14} /> Back
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500/20 transition-all"
          >
            <Download size={12} /> Export CSV
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <BarChart2 size={20} className="text-accent" />
          <h1 className="text-2xl lg:text-3xl font-black uppercase italic tracking-tight">{session.title || 'Match Analytics'}</h1>
        </div>
        <p className="text-text-soft text-sm">PIN: <span className="font-mono font-black text-white">{pin}</span> · {session.mode} · {new Date(session.createdAt).toLocaleString()}</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: Trophy,    label: 'Players',    value: players.length,       color: 'bg-yellow-500/20' },
          { icon: Target,    label: 'Avg Accuracy',value: `${avgAcc}%`,        color: 'bg-emerald-500/20' },
          { icon: Clock,     label: 'Avg Time/Q',  value: `${avgTime}s`,       color: 'bg-blue-500/20'   },
          { icon: Zap,       label: 'Questions',   value: questions.length,     color: 'bg-accent/20'     },
        ].map((s, i) => (
          <div key={i} className="glass p-4 rounded-[20px] border border-white/5 flex items-center gap-3">
            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', s.color)}>
              <s.icon size={15} className="text-white" />
            </div>
            <div>
              <p className="text-[8px] text-text-soft uppercase font-black">{s.label}</p>
              <p className="text-xl font-black">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Hardest question callout */}
      {hardest && (
        <div className="glass rounded-[24px] border border-red-400/20 p-5 flex items-start gap-4 bg-red-400/[0.03]">
          <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-[9px] text-red-400 font-black uppercase tracking-widest mb-1">Hardest Question ({Math.round(hardest.accuracy)}% accuracy)</p>
            <p className="font-black text-sm">{hardest.question}</p>
            <p className="text-[10px] text-text-soft mt-1">{hardest.correct} correct · {hardest.incorrect} incorrect · {hardest.avgTime?.toFixed(1)}s avg</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/5">
        {[
          { id: 'players',   label: 'Player Performance', icon: Trophy   },
          { id: 'questions', label: 'Question Breakdown',  icon: BarChart2 },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all -mb-px',
              tab === t.id ? 'text-accent border-accent' : 'text-text-soft border-transparent hover:text-white'
            )}
          >
            <t.icon size={11} /> {t.label}
          </button>
        ))}
      </div>

      {/* Player Performance */}
      {tab === 'players' && (
        <div className="space-y-2">
          {players.map((p: any, i: number) => (
            <PlayerCard key={p.name} p={p} rank={i + 1} />
          ))}
          {players.length === 0 && (
            <p className="py-12 text-center text-text-soft text-sm">No player data recorded for this session.</p>
          )}
        </div>
      )}

      {/* Question Breakdown */}
      {tab === 'questions' && (
        <div className="space-y-2">
          {questions.map((q: any, i: number) => (
            <QuestionRow key={i} q={q} idx={i} />
          ))}
          {questions.length === 0 && (
            <p className="py-12 text-center text-text-soft text-sm">No question data recorded.</p>
          )}
        </div>
      )}
    </div>
  );
}
