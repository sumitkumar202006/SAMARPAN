'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard, Search,
  RefreshCw, IndianRupee,
  Users, TrendingUp, Clock, Check, AlertTriangle
} from 'lucide-react';
import api from '@/lib/axios';
import { cn } from '@/lib/utils';

const PLAN_META: Record<string, { label: string; color: string; bg: string }> = {
  free:        { label: 'Spark',       color: 'text-slate-400',   bg: 'bg-slate-500/10 border-slate-500/20'   },
  pro:         { label: 'Blaze Pro',   color: 'text-indigo-400',  bg: 'bg-indigo-500/10 border-indigo-500/20'  },
  elite:       { label: 'Storm Elite', color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20'   },
  institution: { label: 'Institution', color: 'text-teal-400',    bg: 'bg-teal-500/10 border-teal-500/20'     },
};

const STATUS_META: Record<string, string> = {
  active:    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  trialing:  'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
  past_due:  'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

interface SubRecord {
  id: string;
  userId: string;
  plan: string;
  status: string;
  currentPeriodEnd: string | null;
  trialEndsAt: string | null;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  user: { id: string; name: string; email: string; avatar?: string };
  quota?: { aiGenerations: number; pdfUploads: number } | null;
}

interface Metrics {
  totalSubs: number;
  activeSubs: number;
  trialSubs: number;
  breakdown: { pro: number; elite: number; institution: number };
  estimatedMRR: number;
}

export default function AdminSubscriptionsPage() {
  const [subs, setSubs] = useState<SubRecord[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Override modal state
  const [overrideTarget, setOverrideTarget] = useState<SubRecord | null>(null);
  const [overridePlan, setOverridePlan] = useState('pro');
  const [overrideDays, setOverrideDays] = useState(30);
  const [overrideLoading, setOverrideLoading] = useState(false);

  useEffect(() => { fetchAll(); }, [planFilter, statusFilter, search]);

  async function fetchAll() {
    setLoading(true);
    try {
      const [subsRes, metricsRes] = await Promise.all([
        api.get('/api/admin/subscriptions', { params: { plan: planFilter || undefined, status: statusFilter || undefined, q: search || undefined } }),
        api.get('/api/admin/subscriptions/metrics'),
      ]);
      setSubs(subsRes.data.subscriptions || []);
      setMetrics(metricsRes.data);
    } catch (err) {
      console.error('Failed to load subscriptions', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch() { fetchAll(); }

  async function handleOverride() {
    if (!overrideTarget) return;
    setOverrideLoading(true);
    try {
      await api.put(`/api/admin/subscriptions/${overrideTarget.userId}/override`, {
        plan: overridePlan,
        status: 'active',
        durationDays: overrideDays,
      });
      setOverrideTarget(null);
      fetchAll();
    } catch { alert('Override failed'); }
    finally { setOverrideLoading(false); }
  }

  async function handleCancel(sub: SubRecord) {
    if (!confirm(`Cancel ${sub.user.name}'s subscription?`)) return;
    try {
      await api.post(`/api/admin/subscriptions/${sub.userId}/cancel`);
      fetchAll();
    } catch { alert('Cancellation failed'); }
  }

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-1 flex items-center gap-3">
            <CreditCard className="text-accent" size={28} />
            Subscriptions
          </h1>
          <p className="text-text-soft text-sm">Manage all user plans, overrides, and revenue.</p>
        </div>
        <button
          onClick={fetchAll}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/5 border border-white/5 text-sm font-black hover:bg-white/10 transition-all"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* MRR Metric Cards */}
      {metrics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Est. MRR',       value: `₹${metrics.estimatedMRR.toLocaleString()}`, icon: IndianRupee, color: 'from-emerald-500 to-teal-600' },
            { label: 'Active Subs',    value: metrics.activeSubs,                           icon: Check,       color: 'from-indigo-500 to-violet-600' },
            { label: 'Active Trials',  value: metrics.trialSubs,                            icon: Clock,       color: 'from-amber-500 to-orange-600'  },
            { label: 'Total Signups',  value: metrics.totalSubs,                            icon: Users,       color: 'from-pink-500 to-rose-600'      },
          ].map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="glass rounded-[28px] border border-white/5 p-6 relative overflow-hidden"
            >
              <div className={`absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br ${m.color} opacity-10 blur-xl rounded-full`} />
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${m.color} flex items-center justify-center mb-3`}>
                <m.icon size={18} className="text-white" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-text-soft mb-1">{m.label}</p>
              <p className="text-2xl font-black tracking-tighter">{m.value}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Plan breakdown bar */}
      {metrics && (
        <div className="glass rounded-[28px] border border-white/5 p-6">
          <p className="text-xs font-black uppercase tracking-widest text-text-soft mb-4 flex items-center gap-2">
            <TrendingUp size={12} /> Plan Breakdown
          </p>
          <div className="flex gap-4 flex-wrap">
            {[
              { label: 'Blaze Pro',   count: metrics.breakdown.pro,         color: 'bg-indigo-500' },
              { label: 'Storm Elite', count: metrics.breakdown.elite,       color: 'bg-amber-500'  },
              { label: 'Institution', count: metrics.breakdown.institution, color: 'bg-teal-500'   },
            ].map(b => (
              <div key={b.label} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${b.color}`} />
                <span className="text-xs font-bold text-text-soft">{b.label}:</span>
                <span className="text-xs font-black text-white">{b.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-soft" />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="w-full bg-white/5 border border-white/5 rounded-2xl py-3 pl-10 pr-4 text-sm outline-none focus:ring-1 focus:ring-accent font-medium"
          />
        </div>
        <select value={planFilter} onChange={e => setPlanFilter(e.target.value)}
          className="bg-white/5 border border-white/5 rounded-2xl p-3 text-sm font-bold outline-none focus:ring-1 focus:ring-accent cursor-pointer"
        >
          <option value="">All Plans</option>
          <option value="free">Free</option>
          <option value="pro">Blaze Pro</option>
          <option value="elite">Storm Elite</option>
          <option value="institution">Institution</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="bg-white/5 border border-white/5 rounded-2xl p-3 text-sm font-bold outline-none focus:ring-1 focus:ring-accent cursor-pointer"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="trialing">Trial</option>
          <option value="cancelled">Cancelled</option>
          <option value="past_due">Past Due</option>
        </select>
        <button onClick={handleSearch} className="px-6 py-3 rounded-2xl bg-accent text-white text-sm font-black hover:bg-accent/90 transition-all">
          Search
        </button>
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-[40px] border border-white/5 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                {['User', 'Plan', 'Status', 'Usage', 'Expires', 'Actions'].map(h => (
                  <th key={h} className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-text-soft">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={6} className="py-20 text-center text-text-soft">
                  <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
                </td></tr>
              ) : subs.length === 0 ? (
                <tr><td colSpan={6} className="py-20 text-center text-text-soft text-sm">No subscriptions found.</td></tr>
              ) : subs.map(sub => {
                const pm = PLAN_META[sub.plan] || PLAN_META.free;
                const sm = STATUS_META[sub.status] || STATUS_META.cancelled;
                const expiry = sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString() : '—';

                return (
                  <motion.tr key={sub.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="hover:bg-white/[0.02] transition-all group"
                  >
                    {/* User */}
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent/20 to-accent-alt/20 flex items-center justify-center text-xs font-black border border-white/5 flex-shrink-0">
                          {sub.user.avatar
                            ? <img src={sub.user.avatar} className="w-full h-full object-cover rounded-xl" />
                            : sub.user.name?.charAt(0)?.toUpperCase()
                          }
                        </div>
                        <div>
                          <p className="font-black text-sm tracking-tight">{sub.user.name}</p>
                          <p className="text-[10px] text-text-soft truncate max-w-[150px]">{sub.user.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Plan */}
                    <td className="px-6 py-5">
                      <span className={cn('px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border', pm.bg, pm.color)}>
                        {pm.label}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-5">
                      <span className={cn('px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border', sm)}>
                        {sub.status}
                      </span>
                    </td>

                    {/* Usage */}
                    <td className="px-6 py-5">
                      <div className="text-xs text-text-soft space-y-1">
                        <div>AI: <span className="text-white font-bold">{sub.quota?.aiGenerations ?? 0}</span></div>
                        <div>PDF: <span className="text-white font-bold">{sub.quota?.pdfUploads ?? 0}</span></div>
                      </div>
                    </td>

                    {/* Expires */}
                    <td className="px-6 py-5">
                      <span className="text-xs font-bold text-text-soft">{expiry}</span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button
                          onClick={() => { setOverrideTarget(sub); setOverridePlan(sub.plan); setOverrideDays(30); }}
                          className="px-3 py-1.5 rounded-xl bg-accent/10 border border-accent/20 text-accent text-[10px] font-black uppercase tracking-widest hover:bg-accent/20 transition-all"
                        >
                          Override
                        </button>
                        {sub.plan !== 'free' && sub.status !== 'cancelled' && (
                          <button
                            onClick={() => handleCancel(sub)}
                            className="px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-all"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="p-5 bg-white/[0.02] border-t border-white/5">
          <p className="text-[10px] font-bold text-text-soft uppercase tracking-widest">
            Showing {subs.length} subscription records
          </p>
        </div>
      </motion.div>

      {/* Override Modal */}
      <AnimatePresence>
        {overrideTarget && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={() => setOverrideTarget(null)} />
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
              className="glass max-w-md w-full p-8 rounded-[40px] border border-white/5 relative z-10 space-y-6 shadow-2xl"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                  <CreditCard size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight">Override Plan</h3>
                  <p className="text-xs text-text-soft">{overrideTarget.user.name}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-soft mb-2 block">Plan</label>
                  <select
                    value={overridePlan}
                    onChange={e => setOverridePlan(e.target.value)}
                    className="w-full bg-white/5 border border-white/5 rounded-2xl p-3 text-sm font-bold outline-none focus:ring-1 focus:ring-accent"
                  >
                    <option value="free">Spark (Free)</option>
                    <option value="pro">Blaze Pro — ₹99/mo</option>
                    <option value="elite">Storm Elite — ₹499/mo</option>
                    <option value="institution">Institution — ₹4,999/mo</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-soft mb-2 block">Duration (days)</label>
                  <input
                    type="number"
                    value={overrideDays}
                    onChange={e => setOverrideDays(parseInt(e.target.value) || 30)}
                    min={1} max={365}
                    className="w-full bg-white/5 border border-white/5 rounded-2xl p-3 text-sm font-bold outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
              </div>

                <div className="rounded-2xl bg-amber-500/5 border border-amber-500/20 p-4 text-xs text-amber-400 flex items-start gap-2">
                <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                This overrides the user&apos;s plan immediately. Usage quota will be reset.
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleOverride}
                  disabled={overrideLoading}
                  className="flex-1 py-4 rounded-2xl bg-accent text-white font-black text-sm uppercase tracking-widest hover:bg-accent/90 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {overrideLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <>Apply Override <Check size={14} /></>}
                </button>
                <button onClick={() => setOverrideTarget(null)}
                  className="px-6 rounded-2xl bg-white/5 border border-white/5 font-black text-sm text-text-soft hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
