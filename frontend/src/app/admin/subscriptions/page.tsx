'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard, Search, RefreshCw, IndianRupee,
  Users, TrendingUp, Clock, Check, AlertTriangle,
  Sliders, X, Crown, Zap, Shield, Building2, UserCheck
} from 'lucide-react';
import api from '@/lib/axios';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// ── Meta ──────────────────────────────────────────────────────────────────────
const PLAN_META: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  free:        { label: 'Spark (Free)', color: 'text-slate-400',  bg: 'bg-slate-500/10 border-slate-500/20',  icon: Shield   },
  pro:         { label: 'Blaze Pro',    color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20', icon: Zap      },
  elite:       { label: 'Storm Elite',  color: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-500/20',  icon: Crown    },
  institution: { label: 'Institution',  color: 'text-teal-400',   bg: 'bg-teal-500/10 border-teal-500/20',    icon: Building2 },
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
  isVirtual?: boolean;  // true = free user, no real sub row
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

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }: { msg: string; type: 'success' | 'error'; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        'fixed top-6 right-6 z-[200] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border backdrop-blur-md',
        type === 'success'
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          : 'bg-red-500/10 border-red-500/30 text-red-400'
      )}
    >
      {type === 'success' ? <Check size={16} /> : <AlertTriangle size={16} />}
      <span className="font-black text-sm">{msg}</span>
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100"><X size={14} /></button>
    </motion.div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AdminSubscriptionsPage() {
  const pathname   = usePathname();
  const [subs,     setSubs]     = useState<SubRecord[]>([]);
  const [metrics,  setMetrics]  = useState<Metrics | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [planFilter,   setPlanFilter]   = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [toast,    setToast]    = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Override modal
  const [overrideTarget,  setOverrideTarget]  = useState<SubRecord | null>(null);
  const [overridePlan,    setOverridePlan]    = useState('pro');
  const [overrideDays,    setOverrideDays]    = useState(30);
  const [overrideLoading, setOverrideLoading] = useState(false);

  const tabs = [
    { label: 'All Users & Plans', href: '/admin/subscriptions',             icon: CreditCard },
    { label: 'Plan Config',       href: '/admin/subscriptions/plan-config', icon: Sliders    },
  ];

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [subsRes, metricsRes] = await Promise.all([
        api.get('/api/admin/subscriptions', {
          params: {
            plan:   planFilter  || undefined,
            status: statusFilter || undefined,
            q:      search      || undefined,
          },
        }),
        api.get('/api/admin/subscriptions/metrics'),
      ]);
      setSubs(subsRes.data.subscriptions || []);
      setMetrics(metricsRes.data);
    } catch (err) {
      console.error('Failed to load subscriptions', err);
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }, [planFilter, statusFilter, search]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Override handler ───────────────────────────────────────────────────────
  async function handleOverride() {
    if (!overrideTarget) return;
    setOverrideLoading(true);
    try {
      const res = await api.put(`/api/admin/subscriptions/${overrideTarget.userId}/override`, {
        plan:        overridePlan,
        status:      'active',
        durationDays: overrideDays,
      });
      setOverrideTarget(null);
      showToast(res.data.message || `Plan set to ${overridePlan}`);
      fetchAll();
    } catch (e: any) {
      showToast(e?.response?.data?.error || 'Override failed', 'error');
    } finally {
      setOverrideLoading(false);
    }
  }

  // ── Cancel handler ─────────────────────────────────────────────────────────
  async function handleCancel(sub: SubRecord) {
    if (!confirm(`Cancel ${sub.user.name}'s subscription and revert to free?`)) return;
    try {
      await api.post(`/api/admin/subscriptions/${sub.userId}/cancel`);
      showToast(`${sub.user.name} downgraded to free`);
      fetchAll();
    } catch {
      showToast('Cancellation failed', 'error');
    }
  }

  // ── Quick-assign via dropdown ──────────────────────────────────────────────
  async function quickAssign(sub: SubRecord, plan: string) {
    try {
      const res = await api.put(`/api/admin/subscriptions/${sub.userId}/override`, {
        plan,
        status: plan === 'free' ? 'cancelled' : 'active',
        durationDays: 30,
      });
      showToast(res.data.message || `Assigned ${plan}`);
      fetchAll();
    } catch (e: any) {
      showToast(e?.response?.data?.error || 'Assignment failed', 'error');
    }
  }

  return (
    <div className="space-y-8">
      <AnimatePresence>
        {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      </AnimatePresence>

      {/* Tab nav */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/5 border border-white/5 w-fit">
        {tabs.map(tab => (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all',
              pathname === tab.href
                ? 'bg-accent text-white shadow-[0_4px_16px_rgba(99,102,241,0.4)]'
                : 'text-text-soft hover:text-white hover:bg-white/5'
            )}
          >
            <tab.icon size={13} />
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-1 flex items-center gap-3">
            <CreditCard className="text-accent" size={28} />
            Users &amp; Plans
          </h1>
          <p className="text-text-soft text-sm">
            All registered users are shown — assign, override or cancel plans from here.
          </p>
        </div>
        <button
          onClick={fetchAll}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/5 border border-white/5 text-sm font-black hover:bg-white/10 transition-all"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* MRR Metrics */}
      {metrics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Est. MRR',      value: `₹${metrics.estimatedMRR.toLocaleString()}`, icon: IndianRupee, color: 'from-emerald-500 to-teal-600' },
            { label: 'Active Subs',   value: metrics.activeSubs,                          icon: Check,       color: 'from-indigo-500 to-violet-600' },
            { label: 'Active Trials', value: metrics.trialSubs,                           icon: Clock,       color: 'from-amber-500 to-orange-600'  },
            { label: 'Total Signups', value: metrics.totalSubs,                           icon: Users,       color: 'from-pink-500 to-rose-600'     },
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

      {/* Plan breakdown */}
      {metrics && (
        <div className="glass rounded-[28px] border border-white/5 p-6">
          <p className="text-xs font-black uppercase tracking-widest text-text-soft mb-4 flex items-center gap-2">
            <TrendingUp size={12} /> Plan Breakdown
          </p>
          <div className="flex gap-6 flex-wrap">
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
            onKeyDown={e => e.key === 'Enter' && fetchAll()}
            className="w-full bg-white/5 border border-white/5 rounded-2xl py-3 pl-10 pr-4 text-sm outline-none focus:ring-1 focus:ring-accent font-medium"
          />
        </div>
        <select value={planFilter} onChange={e => setPlanFilter(e.target.value)}
          className="bg-white/5 border border-white/5 rounded-2xl p-3 text-sm font-bold outline-none focus:ring-1 focus:ring-accent cursor-pointer"
        >
          <option value="">All Plans</option>
          <option value="free">Free (Spark)</option>
          <option value="pro">Blaze Pro</option>
          <option value="elite">Storm Elite</option>
          <option value="institution">Institution</option>
        </select>
        <button onClick={fetchAll} className="px-6 py-3 rounded-2xl bg-accent text-white text-sm font-black hover:bg-accent/90 transition-all">
          Search
        </button>
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-[40px] border border-white/5 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                {['User', 'Current Plan', 'Status', 'Usage This Month', 'Expires', 'Assign Plan', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-5 text-[10px] font-black uppercase tracking-widest text-text-soft">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={7} className="py-20 text-center">
                  <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
                </td></tr>
              ) : subs.length === 0 ? (
                <tr><td colSpan={7} className="py-20 text-center text-text-soft text-sm">No users found.</td></tr>
              ) : subs.map(sub => {
                const pm = PLAN_META[sub.plan] || PLAN_META.free;
                const PlanIcon = pm.icon;
                const sm = STATUS_META[sub.status] || STATUS_META.cancelled;
                const expiry = sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString('en-IN') : '—';

                return (
                  <motion.tr key={sub.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="hover:bg-white/[0.02] transition-all group"
                  >
                    {/* User */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center text-xs font-black border border-white/5 flex-shrink-0 overflow-hidden">
                          {sub.user.avatar
                            ? <img src={sub.user.avatar} className="w-full h-full object-cover rounded-xl" />
                            : sub.user.name?.charAt(0)?.toUpperCase()
                          }
                        </div>
                        <div>
                          <p className="font-black text-sm tracking-tight">{sub.user.name}</p>
                          <p className="text-[10px] text-text-soft truncate max-w-[160px]">{sub.user.email}</p>
                          {sub.isVirtual && (
                            <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-text-soft font-black uppercase">no sub row</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Plan */}
                    <td className="px-5 py-4">
                      <span className={cn('flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border w-fit', pm.bg, pm.color)}>
                        <PlanIcon size={10} />
                        {pm.label}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <span className={cn('px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border', sm)}>
                        {sub.status}
                      </span>
                    </td>

                    {/* Usage */}
                    <td className="px-5 py-4">
                      <div className="text-xs text-text-soft space-y-0.5">
                        <div>AI: <span className="text-white font-bold">{sub.quota?.aiGenerations ?? 0}</span></div>
                        <div>PDF: <span className="text-white font-bold">{sub.quota?.pdfUploads ?? 0}</span></div>
                      </div>
                    </td>

                    {/* Expires */}
                    <td className="px-5 py-4">
                      <span className="text-xs font-bold text-text-soft">{expiry}</span>
                    </td>

                    {/* Quick Assign */}
                    <td className="px-5 py-4">
                      <div className="flex gap-1 flex-wrap">
                        {(['free', 'pro', 'elite', 'institution'] as const).map(p => {
                          const meta = PLAN_META[p];
                          return (
                            <button
                              key={p}
                              onClick={() => quickAssign(sub, p)}
                              disabled={sub.plan === p}
                              title={`Assign ${meta.label}`}
                              className={cn(
                                'px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-all',
                                sub.plan === p
                                  ? cn(meta.bg, meta.color, 'opacity-100 cursor-default')
                                  : 'bg-white/5 border-white/10 text-text-soft hover:bg-white/10 hover:text-white'
                              )}
                            >
                              {p === 'free' ? 'Free' : p === 'pro' ? 'Pro' : p === 'elite' ? 'Elite' : 'Inst'}
                            </button>
                          );
                        })}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setOverrideTarget(sub); setOverridePlan(sub.plan); setOverrideDays(30); }}
                          className="px-3 py-1.5 rounded-xl bg-accent/10 border border-accent/20 text-accent text-[10px] font-black uppercase tracking-widest hover:bg-accent/20 transition-all flex items-center gap-1"
                        >
                          <UserCheck size={11} /> Override
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
            Showing {subs.length} users
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                    <CreditCard size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black tracking-tight">Override Plan</h3>
                    <p className="text-xs text-text-soft">{overrideTarget.user.name} · {overrideTarget.user.email}</p>
                  </div>
                </div>
                <button onClick={() => setOverrideTarget(null)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-text-soft hover:text-white transition-all">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-soft mb-2 block">Assign Plan</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['free', 'pro', 'elite', 'institution'] as const).map(p => {
                      const meta = PLAN_META[p];
                      const Icon = meta.icon;
                      return (
                        <button
                          key={p}
                          onClick={() => setOverridePlan(p)}
                          className={cn(
                            'flex items-center gap-2 p-3 rounded-2xl border font-black text-sm transition-all',
                            overridePlan === p
                              ? cn(meta.bg, meta.color, 'border-opacity-60')
                              : 'bg-white/5 border-white/10 text-text-soft hover:bg-white/10'
                          )}
                        >
                          <Icon size={14} />
                          {meta.label}
                        </button>
                      );
                    })}
                  </div>
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
                  <p className="text-[10px] text-text-soft mt-1">For free plan, duration is ignored.</p>
                </div>
              </div>

              <div className="rounded-2xl bg-amber-500/5 border border-amber-500/20 p-4 text-xs text-amber-400 flex items-start gap-2">
                <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                This overrides the user&apos;s plan immediately. Usage quota will be reset. The change takes effect next time the user refreshes their app.
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleOverride}
                  disabled={overrideLoading}
                  className="flex-1 py-4 rounded-2xl bg-accent text-white font-black text-sm uppercase tracking-widest hover:bg-accent/90 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {overrideLoading
                    ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <><Check size={14} /> Apply Override</>
                  }
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
