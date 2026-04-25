'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IndianRupee, Sliders, Gift, Save, RotateCcw, Check,
  AlertTriangle, Zap, Crown, Shield, Building2, ChevronDown, ChevronUp, Info,
  RefreshCw, Link2, Repeat
} from 'lucide-react';
import api from '@/lib/axios';

// ── Types ─────────────────────────────────────────────────────────────────────
interface PlanPrices {
  pro:         { monthly: number; yearly: number };
  elite:       { monthly: number; yearly: number };
  institution: { monthly: number; yearly: number };
}

interface PlanLimits {
  free:        PlanLimit;
  pro:         PlanLimit;
  elite:       PlanLimit;
  institution: PlanLimit;
}

interface PlanLimit {
  aiGenerations: number;
  pdfUploads:    number;
  ratedMatches:  boolean;
  allModes:      boolean;
  messaging:     boolean;
}

interface TrialConfig {
  enabled:        boolean;
  durationDays:   number;
  plan:           string;
  deviceLocked:   boolean;
  maxTrialsTotal: number | null;
}

interface Config {
  prices:          PlanPrices;
  limits:          PlanLimits;
  trial:           TrialConfig;
  totalTrialsUsed: number;
  razorpayPlanIds?: Record<string, string>;
}

// ── Plan meta ─────────────────────────────────────────────────────────────────
const PLAN_META = {
  free:        { label: 'Spark',       icon: Shield,    color: 'from-slate-500 to-slate-600',   glow: 'rgba(100,116,139,0.2)' },
  pro:         { label: 'Blaze Pro',   icon: Zap,       color: 'from-indigo-500 to-violet-600', glow: 'rgba(99,102,241,0.25)' },
  elite:       { label: 'Storm Elite', icon: Crown,     color: 'from-amber-500 to-orange-600',  glow: 'rgba(245,158,11,0.25)' },
  institution: { label: 'Institution', icon: Building2, color: 'from-teal-500 to-cyan-600',     glow: 'rgba(20,184,166,0.25)' },
} as const;

type PlanKey = keyof typeof PLAN_META;

// ── Helpers ───────────────────────────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-12 h-6 rounded-full transition-all flex-shrink-0 ${checked ? 'bg-accent shadow-[0_0_10px_rgba(99,102,241,0.4)]' : 'bg-white/10'}`}
    >
      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${checked ? 'left-7' : 'left-1'}`} />
    </button>
  );
}

function NumberInput({ value, onChange, min = 0, max, prefix }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number; prefix?: string;
}) {
  return (
    <div className="relative flex items-center">
      {prefix && <span className="absolute left-3 text-text-soft font-bold text-sm">{prefix}</span>}
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={e => onChange(Number(e.target.value) || 0)}
        className={`w-full bg-white/5 border border-white/10 rounded-xl py-2.5 text-sm font-bold outline-none focus:ring-1 focus:ring-accent transition-all ${prefix ? 'pl-7 pr-3' : 'px-3'}`}
      />
    </div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle, color }: { icon: any; title: string; subtitle: string; color: string }) {
  return (
    <div className="flex items-center gap-4 mb-8">
      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg flex-shrink-0`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <h2 className="text-xl font-black tracking-tight">{title}</h2>
        <p className="text-text-soft text-xs">{subtitle}</p>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function PlanConfigPage() {
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [expandedPlan, setExpandedPlan] = useState<PlanKey | null>('pro');

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/admin/plan-config');
      setConfig(data);
    } catch {
      showToast('Failed to load plan config', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  // ── Razorpay plan IDs state (separate from main config) ──────────────────
  const [rzpPlanIds, setRzpPlanIds] = useState<Record<string, string>>({});
  const [loadingRzp, setLoadingRzp] = useState(false);

  const fetchRzpPlanIds = useCallback(async () => {
    setLoadingRzp(true);
    try {
      const { data } = await api.get('/api/admin/plan-config/razorpay-plans');
      setRzpPlanIds(data.planIds || {});
    } catch { /* optional */ } finally { setLoadingRzp(false); }
  }, []);

  useEffect(() => { fetchRzpPlanIds(); }, [fetchRzpPlanIds]);

  const saveRzpPlanId = async (key: string, value: string) => {
    try {
      await api.put('/api/admin/plan-config/razorpay-plans', { planIds: { ...rzpPlanIds, [key]: value } });
      setRzpPlanIds(p => ({ ...p, [key]: value }));
      showToast(`Saved Razorpay plan ID for ${key}`);
    } catch { showToast('Failed to save plan ID', 'error'); }
  };

  const clearRzpPlanId = async (key: string) => {
    const updated = { ...rzpPlanIds };
    delete updated[key];
    try {
      await api.put('/api/admin/plan-config/razorpay-plans', { planIds: updated });
      setRzpPlanIds(updated);
      showToast(`Cleared — will auto-create on next purchase`);
    } catch { showToast('Failed to clear plan ID', 'error'); }
  };

  // ── Prices save ──────────────────────────────────────────────────────────
  const savePrices = async () => {
    if (!config) return;
    setSaving('prices');
    try {
      await api.put('/api/admin/plan-config/prices', { prices: config.prices });
      showToast('Plan prices updated successfully!');
    } catch (e: any) {
      showToast(e?.response?.data?.error || 'Failed to save prices', 'error');
    } finally { setSaving(null); }
  };

  // ── Limits save ──────────────────────────────────────────────────────────
  const saveLimits = async () => {
    if (!config) return;
    setSaving('limits');
    try {
      await api.put('/api/admin/plan-config/limits', { limits: config.limits });
      showToast('Plan limits updated successfully!');
    } catch (e: any) {
      showToast(e?.response?.data?.error || 'Failed to save limits', 'error');
    } finally { setSaving(null); }
  };

  // ── Trial save ───────────────────────────────────────────────────────────
  const saveTrial = async () => {
    if (!config) return;
    setSaving('trial');
    try {
      await api.put('/api/admin/plan-config/trial', { trial: config.trial });
      showToast('Trial settings updated successfully!');
    } catch (e: any) {
      showToast(e?.response?.data?.error || 'Failed to save trial config', 'error');
    } finally { setSaving(null); }
  };

  // ── Setters ──────────────────────────────────────────────────────────────
  const setPrice = (plan: keyof PlanPrices, interval: 'monthly' | 'yearly', val: number) =>
    setConfig(c => c ? { ...c, prices: { ...c.prices, [plan]: { ...c.prices[plan], [interval]: val } } } : c);

  const setLimit = (plan: PlanKey, key: keyof PlanLimit, val: number | boolean) =>
    setConfig(c => c ? { ...c, limits: { ...c.limits, [plan]: { ...c.limits[plan as keyof PlanLimits], [key]: val } } } : c);

  const setTrial = (key: keyof TrialConfig, val: any) =>
    setConfig(c => c ? { ...c, trial: { ...c.trial, [key]: val } } : c);

  if (loading) return (
    <div className="flex items-center justify-center h-80 gap-4">
      <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      <p className="text-text-soft font-black uppercase tracking-widest text-xs">Loading Plan Config…</p>
    </div>
  );

  if (!config) return (
    <div className="flex items-center justify-center h-80 text-red-400 gap-3">
      <AlertTriangle size={24} /> Failed to load configuration.
    </div>
  );

  const paidPlans: (keyof PlanPrices)[] = ['pro', 'elite', 'institution'];
  const allPlans: PlanKey[] = ['free', 'pro', 'elite', 'institution'];

  return (
    <div className="space-y-8 pb-16">

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border backdrop-blur-md ${
              toast.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}
          >
            {toast.type === 'success' ? <Check size={18} /> : <AlertTriangle size={18} />}
            <span className="font-black text-sm">{toast.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-1 flex items-center gap-3">
            <Sliders className="text-accent" size={28} />
            Plan Configuration
          </h1>
          <p className="text-text-soft text-sm">Control pricing, quotas, and free trial settings live from here.</p>
        </div>
        <button
          onClick={fetchConfig}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 text-xs font-black hover:bg-white/10 transition-all"
        >
          <RotateCcw size={13} /> Reload
        </button>
      </div>

      {/* ── SECTION 1: Plan Prices ────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="glass rounded-[36px] border border-white/5 p-8">
        <SectionHeader
          icon={IndianRupee}
          title="Plan Prices"
          subtitle="Set monthly & yearly prices for each paid plan. Changes take effect immediately on the pricing page."
          color="from-emerald-500 to-teal-600"
        />

        <div className="space-y-4 mb-8">
          {paidPlans.map(plan => {
            const meta = PLAN_META[plan as PlanKey];
            const Icon = meta.icon;
            return (
              <div key={plan} className={`rounded-2xl p-5 bg-white/[0.03] border border-white/5`}
                style={{ boxShadow: `inset 0 0 30px ${meta.glow}` }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${meta.color} flex items-center justify-center`}>
                    <Icon size={15} className="text-white" />
                  </div>
                  <span className="font-black text-sm uppercase tracking-widest">{meta.label}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-soft mb-1.5 block">Monthly (₹)</label>
                    <NumberInput
                      value={config.prices[plan].monthly}
                      onChange={v => setPrice(plan, 'monthly', v)}
                      prefix="₹"
                      min={0}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-soft mb-1.5 block">Yearly (₹)</label>
                    <NumberInput
                      value={config.prices[plan].yearly}
                      onChange={v => setPrice(plan, 'yearly', v)}
                      prefix="₹"
                      min={0}
                    />
                    {config.prices[plan].monthly > 0 && (
                      <p className="text-[10px] text-emerald-400 mt-1 font-bold">
                        {Math.round(100 - (config.prices[plan].yearly / (config.prices[plan].monthly * 12)) * 100)}% off vs monthly
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl bg-amber-500/5 border border-amber-500/20 p-3 flex items-start gap-2 mb-6 text-amber-400 text-xs">
          <Info size={13} className="flex-shrink-0 mt-0.5" />
          Price changes apply to new purchases immediately. Existing subscribers are unaffected until renewal.
        </div>

        <button
          id="save-prices-btn"
          onClick={savePrices}
          disabled={saving === 'prices'}
          className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-sm uppercase tracking-widest hover:opacity-90 transition-all shadow-lg disabled:opacity-60"
        >
          {saving === 'prices'
            ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving…</>
            : <><Save size={16} />Save Prices</>}
        </button>
      </motion.div>

      {/* ── SECTION 2: Plan Limits ────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="glass rounded-[36px] border border-white/5 p-8">
        <SectionHeader
          icon={Sliders}
          title="Usage Limits & Features"
          subtitle="Set per-plan quotas and toggle feature access. Quotas reset monthly per user."
          color="from-indigo-500 to-violet-600"
        />

        <div className="space-y-3">
          {allPlans.map(plan => {
            const meta = PLAN_META[plan];
            const Icon = meta.icon;
            const limit = config.limits[plan as keyof PlanLimits];
            const isExpanded = expandedPlan === plan;

            return (
              <div key={plan} className="rounded-2xl border border-white/5 overflow-hidden">
                <button
                  onClick={() => setExpandedPlan(isExpanded ? null : plan)}
                  className="w-full flex items-center justify-between px-5 py-4 bg-white/[0.03] hover:bg-white/[0.05] transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${meta.color} flex items-center justify-center`}>
                      <Icon size={14} className="text-white" />
                    </div>
                    <span className="font-black text-sm">{meta.label}</span>
                    <span className="text-[10px] text-text-soft font-bold px-2 py-0.5 rounded-full bg-white/5">
                      AI: {limit.aiGenerations >= 9999 ? '∞' : limit.aiGenerations} &middot; PDF: {limit.pdfUploads >= 9999 ? '∞' : limit.pdfUploads}
                    </span>
                  </div>
                  {isExpanded ? <ChevronUp size={16} className="text-text-soft" /> : <ChevronDown size={16} className="text-text-soft" />}
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 py-5 grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/[0.01]">
                        {/* Numeric quotas */}
                        <div className="space-y-4">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-text-soft">Monthly Quotas</h4>
                          <div>
                            <label className="text-xs font-bold text-text-soft mb-1.5 block">AI Quiz Generations / month</label>
                            <NumberInput value={limit.aiGenerations} onChange={v => setLimit(plan, 'aiGenerations', v)} min={0} />
                            <p className="text-[10px] text-text-soft mt-1">Use 99999 for unlimited</p>
                          </div>
                          <div>
                            <label className="text-xs font-bold text-text-soft mb-1.5 block">PDF Uploads / month</label>
                            <NumberInput value={limit.pdfUploads} onChange={v => setLimit(plan, 'pdfUploads', v)} min={0} />
                            <p className="text-[10px] text-text-soft mt-1">Use 99999 for unlimited, 0 to disable</p>
                          </div>
                        </div>

                        {/* Boolean features */}
                        <div className="space-y-4">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-text-soft">Feature Access</h4>
                          {([
                            { key: 'ratedMatches', label: 'Rated Matches', desc: 'Competitive ELO-ranked games' },
                            { key: 'allModes',     label: 'All Battle Modes', desc: '2v2, 4v4 team battles' },
                            { key: 'messaging',    label: 'E2EE Messaging', desc: 'Encrypted social chat' },
                          ] as { key: keyof PlanLimit; label: string; desc: string }[]).map(f => (
                            <div key={f.key} className="flex items-center justify-between gap-4">
                              <div>
                                <p className="text-xs font-black">{f.label}</p>
                                <p className="text-[10px] text-text-soft">{f.desc}</p>
                              </div>
                              <Toggle
                                checked={limit[f.key] as boolean}
                                onChange={v => setLimit(plan, f.key, v)}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        <button
          id="save-limits-btn"
          onClick={saveLimits}
          disabled={saving === 'limits'}
          className="mt-8 flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-black text-sm uppercase tracking-widest hover:opacity-90 transition-all shadow-lg disabled:opacity-60"
        >
          {saving === 'limits'
            ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving…</>
            : <><Save size={16} />Save Limits</>}
        </button>
      </motion.div>

      {/* ── SECTION 3: Free Trial Config ──────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="glass rounded-[36px] border border-white/5 p-8">
        <SectionHeader
          icon={Gift}
          title="Free Trial Settings"
          subtitle={`Control how the free trial works. ${config.totalTrialsUsed} trials have been activated so far.`}
          color="from-pink-500 to-rose-600"
        />

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left column */}
          <div className="space-y-6">
            {/* Enable/Disable Trial */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/5">
              <div>
                <p className="font-black text-sm">Free Trial Enabled</p>
                <p className="text-[10px] text-text-soft mt-0.5">When off, the trial button is blocked for all users</p>
              </div>
              <Toggle checked={config.trial.enabled} onChange={v => setTrial('enabled', v)} />
            </div>

            {/* Device lock */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/5">
              <div>
                <p className="font-black text-sm">Device Fingerprint Lock</p>
                <p className="text-[10px] text-text-soft mt-0.5">One trial per device (prevents abuse)</p>
              </div>
              <Toggle checked={config.trial.deviceLocked} onChange={v => setTrial('deviceLocked', v)} />
            </div>

            {/* Trial duration */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-text-soft block">Trial Duration (Days)</label>
              <NumberInput value={config.trial.durationDays} onChange={v => setTrial('durationDays', v)} min={1} max={365} />
              <p className="text-[10px] text-text-soft">Currently: <span className="text-white font-bold">{config.trial.durationDays} days</span></p>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Trial plan */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-text-soft block">Trial Gives Access To</label>
              <select
                value={config.trial.plan}
                onChange={e => setTrial('plan', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm font-bold outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="pro">Blaze Pro</option>
                <option value="elite">Storm Elite</option>
                <option value="institution">Institution</option>
              </select>
              <p className="text-[10px] text-text-soft">Users will get this plan's features during their trial</p>
            </div>

            {/* Stats card */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-pink-500/5 to-rose-600/5 border border-pink-500/20 space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-pink-400">Trial Usage Statistics</p>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-black tracking-tighter">{config.totalTrialsUsed}</span>
                <span className="text-text-soft text-sm mb-1">trials activated</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-pink-500 to-rose-600 rounded-full transition-all"
                  style={{ width: config.trial.maxTrialsTotal
                    ? `${Math.min((config.totalTrialsUsed / config.trial.maxTrialsTotal) * 100, 100)}%`
                    : '40%' }}
                />
              </div>
              {config.trial.maxTrialsTotal && (
                <p className="text-[10px] text-text-soft">
                  Limit: <span className="text-white font-bold">{config.trial.maxTrialsTotal}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        <button
          id="save-trial-btn"
          onClick={saveTrial}
          disabled={saving === 'trial'}
          className="mt-8 flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-600 text-white font-black text-sm uppercase tracking-widest hover:opacity-90 transition-all shadow-lg disabled:opacity-60"
        >
          {saving === 'trial'
            ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving…</>
            : <><Save size={16} />Save Trial Settings</>}
        </button>
      </motion.div>

      {/* ── SECTION 4: Razorpay Plan IDs ─────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="glass rounded-[36px] border border-white/5 p-8">
        <SectionHeader
          icon={Repeat}
          title="Razorpay Subscription Plans"
          subtitle="Razorpay needs a Plan ID for recurring auto-pay. IDs are auto-created on first purchase, or paste yours from the Razorpay Dashboard."
          color="from-blue-500 to-indigo-600"
        />

        <div className="rounded-2xl bg-blue-500/5 border border-blue-500/20 p-4 flex items-start gap-3 mb-6 text-blue-300 text-xs">
          <Info size={14} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-black mb-0.5">How ₹1 trial auto-pay works</p>
            <p>User pays ₹1 → mandate authorized → trial starts immediately → Razorpay auto-debits real plan price after trial ends. For paid plans, subscription auto-debits every month/year.</p>
            <p className="mt-1 text-blue-400">Blank = auto-created in Razorpay on first purchase at the configured price.</p>
          </div>
        </div>

        {loadingRzp ? (
          <div className="flex items-center justify-center h-24 gap-3">
            <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            <p className="text-text-soft text-xs font-bold">Loading Razorpay Plans…</p>
          </div>
        ) : (
          <div className="space-y-3">
            {(['pro', 'elite', 'institution'] as const).map(plan =>
              (['monthly', 'yearly'] as const).map(interval => {
                const meta = PLAN_META[plan];
                const Icon = meta.icon;
                const key  = `${plan}_${interval}`;
                const val  = rzpPlanIds[key] || '';
                return (
                  <div key={key} className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${meta.color} flex items-center justify-center flex-shrink-0`}>
                        <Icon size={12} className="text-white" />
                      </div>
                      <span className="font-black text-xs uppercase tracking-widest">{meta.label} — {interval}</span>
                      {val
                        ? <span className="ml-auto text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black">LINKED</span>
                        : <span className="ml-auto text-[9px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-text-soft font-black">AUTO</span>}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="plan_XXXXXXXXXXXXXX  (leave blank for auto-creation)"
                        value={val}
                        onChange={e => setRzpPlanIds(p => ({ ...p, [key]: e.target.value }))}
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono outline-none focus:ring-1 focus:ring-accent text-text-soft"
                      />
                      <button
                        id={`save-rzp-${key}`}
                        onClick={() => saveRzpPlanId(key, rzpPlanIds[key] || '')}
                        className="px-3 py-2 rounded-xl bg-accent/10 border border-accent/20 text-accent text-[10px] font-black hover:bg-accent/20 transition-all"
                        title="Save Plan ID"
                      >
                        <Save size={12} />
                      </button>
                      {val && (
                        <button
                          onClick={() => clearRzpPlanId(key)}
                          title="Clear — new plan auto-created on next purchase"
                          className="px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-black hover:bg-red-500/20 transition-all"
                        >
                          <RotateCcw size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        <div className="mt-6 rounded-2xl bg-amber-500/5 border border-amber-500/20 p-4 text-amber-400 text-xs flex items-start gap-2">
          <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" />
          <p>After changing plan prices, clear old Plan IDs so new Razorpay plans are created at the updated price. Existing subscribers continue at their original plan until they re-subscribe.</p>
        </div>
      </motion.div>

    </div>
  );
}
