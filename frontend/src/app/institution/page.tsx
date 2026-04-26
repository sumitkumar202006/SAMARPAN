'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart2, Users, BookOpen, TrendingUp, Download, Plus,
  UserMinus, Crown, Copy, Check, AlertCircle, RefreshCw,
  Flame, Trophy, Target, Zap, Shield, ClipboardList, Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';
import { AvatarFrame } from '@/components/ui/AvatarFrame';
import { AuthGuard } from '@/components/auth/AuthGuard';
import Link from 'next/link';

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color, sub }: any) {
  return (
    <div className="glass p-5 rounded-[24px] border border-white/5 flex items-center gap-4">
      <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center shrink-0', color)}>
        <Icon size={18} className="text-white" />
      </div>
      <div>
        <p className="text-[9px] text-text-soft uppercase font-black tracking-widest">{label}</p>
        <p className="text-2xl font-black leading-tight">{value}</p>
        {sub && <p className="text-[9px] text-text-soft">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Member Row ───────────────────────────────────────────────────────────────
function MemberRow({ m, isOwner, onRemove }: { m: any; isOwner: boolean; onRemove: (id: string) => void }) {
  const winRate = m.totalPlayed > 0 ? Math.round((m.accuracy || 0)) : 0;
  return (
    <motion.tr
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className="hover:bg-white/[0.03] transition-colors group border-b border-white/5 last:border-0"
    >
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <AvatarFrame src={m.avatar} name={m.name} size="sm" plan={m.plan} />
          <div>
            <p className="font-black text-sm uppercase italic">{m.name}</p>
            {m.username && <p className="text-[9px] text-text-soft">@{m.username}</p>}
          </div>
        </div>
      </td>
      <td className="px-5 py-4">
        <span className={cn('px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border',
          m.role === 'admin'   ? 'bg-accent/10 text-accent border-accent/20' :
          m.role === 'teacher' ? 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20' :
                                  'bg-white/5 text-text-soft border-white/10'
        )}>{m.role}</span>
      </td>
      <td className="px-5 py-4">
        <span className="font-black text-accent">{m.globalRating}</span>
        <span className="text-[9px] text-text-soft ml-1">ELO</span>
      </td>
      <td className="px-5 py-4 hidden lg:table-cell">
        <div className="flex items-center gap-1">
          <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-accent-alt rounded-full" style={{ width: `${winRate}%` }} />
          </div>
          <span className="text-[9px] text-text-soft">{winRate}%</span>
        </div>
      </td>
      <td className="px-5 py-4 hidden lg:table-cell">
        <div className="flex items-center gap-1 text-orange-400">
          <Flame size={10} />
          <span className="font-black text-xs">{m.dailyStreak || 0}</span>
        </div>
      </td>
      <td className="px-5 py-4 hidden lg:table-cell text-[9px] text-text-soft">
        {m.joinedAt ? new Date(m.joinedAt).toLocaleDateString() : '—'}
      </td>
      {isOwner && (
        <td className="px-5 py-4">
          <button
            onClick={() => onRemove(m.id)}
            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-400/10 transition-all"
          >
            <UserMinus size={12} />
          </button>
        </td>
      )}
    </motion.tr>
  );
}

// ─── Join code copy button ────────────────────────────────────────────────────
function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-mono font-black text-sm tracking-widest"
    >
      {code}
      {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} className="text-text-soft" />}
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function InstitutionPage() {
  const { user } = useAuth();
  const [institution, setInstitution] = useState<any>(null);
  const [analytics,   setAnalytics]   = useState<any>(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [joinCode,    setJoinCode]    = useState('');
  const [joining,     setJoining]     = useState(false);
  const [creating,    setCreating]    = useState(false);
  const [newName,     setNewName]     = useState('');
  const [toast,       setToast]       = useState<{ msg: string; ok: boolean } | null>(null);
  const [activeTab,   setActiveTab]   = useState<'overview' | 'members' | 'assignments'>('overview');
  const isOwner = institution?.isOwner || institution?.role === 'owner';

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = useCallback(async () => {
    if (!user?.token) return;
    setLoading(true); setError(null);
    try {
      const res = await api.get('/api/institution/me', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setInstitution(res.data);

      if (res.data.isOwner) {
        const aRes = await api.get('/api/institution/analytics', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setAnalytics(aRes.data);
      }
    } catch (err: any) {
      if (err?.response?.status !== 404) {
        setError(err?.response?.data?.error || 'Failed to load institution');
      }
    } finally {
      setLoading(false);
    }
  }, [user?.token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async () => {
    if (!newName.trim() || !user?.token) return;
    setCreating(true);
    try {
      const res = await api.post('/api/institution/create', { name: newName }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setInstitution({ ...res.data, isOwner: true });
      showToast('🏫 Institution created!');
    } catch (err: any) {
      showToast(err?.response?.data?.error || 'Failed to create', false);
    } finally { setCreating(false); }
  };

  const handleJoin = async () => {
    if (!joinCode.trim() || !user?.token) return;
    setJoining(true);
    try {
      const res = await api.post('/api/institution/join', { code: joinCode }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      showToast(`🎉 Joined ${res.data.institution.name}!`);
      fetchData();
    } catch (err: any) {
      showToast(err?.response?.data?.error || 'Invalid code', false);
    } finally { setJoining(false); }
  };

  const handleRemove = async (userId: string) => {
    if (!user?.token) return;
    try {
      await api.delete(`/api/institution/member/${userId}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      showToast('Member removed');
      fetchData();
    } catch { showToast('Failed to remove', false); }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!user?.token) return;
    if (!confirm('Remove this assignment?')) return;
    try {
      await api.delete(`/api/institution/assignment/${assignmentId}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      showToast('Assignment removed');
      fetchData();
    } catch { showToast('Failed to remove assignment', false); }
  };

  const handleExport = () => {
    if (!user?.token) return;
    window.location.href = `/api/institution/export?token=${user.token}`;
  };

  const inst = institution?.institution || null;
  const members = analytics?.memberStats || inst?.members?.map((m: any) => m.user ? { ...m.user, role: m.role, joinedAt: m.joinedAt } : m) || [];
  const assignments = inst?.assignments || [];
  const summary = analytics?.summary || {};

  // ── Not in any institution ───────────────────────────────────────────────
  if (!loading && !institution && !error) {
    return (
      <AuthGuard>
        <div className="py-2 lg:py-10 space-y-8">
          <div>
            <h1 className="text-3xl lg:text-4xl font-black tracking-tight uppercase italic">Institution Hub</h1>
            <p className="text-text-soft text-sm mt-1">Create or join an institution to access class analytics, assignments, and more.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Create */}
            <div className="glass rounded-[32px] border border-white/5 p-8 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center"><Crown size={18} className="text-accent" /></div>
                <div>
                  <h3 className="font-black uppercase italic text-sm">Create Institution</h3>
                  <p className="text-[10px] text-text-soft">Requires Institution plan</p>
                </div>
              </div>
              <input
                type="text"
                placeholder="Institution name..."
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-accent/40 transition-all"
              />
              <button
                onClick={handleCreate}
                disabled={creating || !newName.trim()}
                className="w-full py-3 rounded-xl bg-accent text-white font-black uppercase text-[11px] tracking-widest hover:bg-accent/80 transition-all disabled:opacity-50"
              >
                {creating ? 'Creating…' : 'Create Institution'}
              </button>
              {user?.plan !== 'institution' && (
                <Link href="/pricing" className="block text-center text-[10px] text-text-soft hover:text-accent transition-colors">
                  Upgrade to Institution Plan →
                </Link>
              )}
            </div>
            {/* Join */}
            <div className="glass rounded-[32px] border border-white/5 p-8 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent-alt/20 flex items-center justify-center"><Users size={18} className="text-accent-alt" /></div>
                <div>
                  <h3 className="font-black uppercase italic text-sm">Join Institution</h3>
                  <p className="text-[10px] text-text-soft">Enter your institution's join code</p>
                </div>
              </div>
              <input
                type="text"
                placeholder="Join code (e.g. INST-ABC123)"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-mono uppercase focus:outline-none focus:border-accent-alt/40 transition-all"
              />
              <button
                onClick={handleJoin}
                disabled={joining || !joinCode.trim()}
                className="w-full py-3 rounded-xl bg-accent-alt/10 border border-accent-alt/20 text-accent-alt font-black uppercase text-[11px] tracking-widest hover:bg-accent-alt hover:text-white transition-all disabled:opacity-50"
              >
                {joining ? 'Joining…' : 'Join Institution'}
              </button>
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="py-2 lg:py-10 space-y-8">
        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className={cn('fixed top-24 left-1/2 -translate-x-1/2 z-[500] px-5 py-3 rounded-2xl border backdrop-blur-xl text-[11px] font-black uppercase tracking-widest',
                toast.ok ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'
              )}>{toast.msg}</motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="flex items-center gap-4">
            {inst?.logoUrl ? (
              <img src={inst.logoUrl} alt="logo" className="w-14 h-14 rounded-2xl object-contain bg-white/5 border border-white/10 p-2" />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                <Shield size={24} className="text-accent" />
              </div>
            )}
            <div>
              <h1 className="text-2xl lg:text-3xl font-black tracking-tight uppercase italic">{inst?.name || 'Institution'}</h1>
              {inst?.code && <CopyCode code={inst.code} />}
            </div>
          </div>
          {isOwner && (
            <div className="flex gap-2">
              <button onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500/20 transition-all">
                <Download size={13} /> Export CSV
              </button>
              <Link href="/institution/assign"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent/10 border border-accent/20 text-accent font-black text-[10px] uppercase tracking-widest hover:bg-accent hover:text-white transition-all">
                <Plus size={13} /> Assign Quiz
              </Link>
            </div>
          )}
        </div>

        {/* Summary stats */}
        {isOwner && analytics && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard icon={Users}    label="Members"      value={summary.totalMembers || 0}       color="bg-accent/20"      />
            <StatCard icon={Trophy}   label="Avg ELO"      value={summary.avgRating    || 1200}    color="bg-yellow-500/20"  />
            <StatCard icon={Target}   label="Avg Accuracy" value={`${summary.avgAccuracy || 0}%`}  color="bg-emerald-500/20" />
            <StatCard icon={Zap}      label="Total Games"  value={summary.totalGames   || 0}       color="bg-purple-500/20"  />
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 border-b border-white/5 pb-0">
          {[
            { id: 'overview',     label: 'Overview',    icon: BarChart2     },
            { id: 'members',      label: 'Members',     icon: Users         },
            { id: 'assignments',  label: 'Assignments', icon: ClipboardList },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all -mb-px',
                activeTab === tab.id
                  ? 'text-accent border-accent'
                  : 'text-text-soft border-transparent hover:text-white'
              )}
            >
              <tab.icon size={12} /> {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Top members */}
            <div className="glass rounded-[28px] border border-white/5 overflow-hidden">
              <div className="p-5 border-b border-white/5 flex items-center gap-2">
                <Trophy size={14} className="text-yellow-400" />
                <h3 className="text-[10px] font-black uppercase tracking-widest">Top Performers</h3>
              </div>
              <div className="divide-y divide-white/5">
                {members.slice(0, 5).map((m: any, i: number) => (
                  <div key={m.id || i} className="flex items-center gap-3 px-5 py-3">
                    <span className="text-[9px] text-text-soft font-black w-5">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}
                    </span>
                    <AvatarFrame src={m.avatar} name={m.name} size="xs" plan={m.plan} />
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-xs uppercase italic truncate">{m.name}</p>
                      <p className="text-[8px] text-text-soft">{m.globalRating} ELO · {m.accuracy || 0}% acc</p>
                    </div>
                    <div className="flex items-center gap-1 text-orange-400">
                      <Flame size={10} /><span className="text-[10px] font-black">{m.dailyStreak || 0}</span>
                    </div>
                  </div>
                ))}
                {members.length === 0 && (
                  <p className="px-5 py-8 text-center text-text-soft text-[10px]">No members yet</p>
                )}
              </div>
            </div>

            {/* Recent assignments */}
            <div className="glass rounded-[28px] border border-white/5 overflow-hidden">
              <div className="p-5 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ClipboardList size={14} className="text-accent" />
                  <h3 className="text-[10px] font-black uppercase tracking-widest">Recent Assignments</h3>
                </div>
                {isOwner && (
                  <Link href="/institution/assign" className="text-[9px] text-accent hover:underline font-black uppercase">+ Assign</Link>
                )}
              </div>
              <div className="divide-y divide-white/5">
                {assignments.slice(0, 5).map((a: any) => (
                  <div key={a.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="w-8 h-8 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                      <BookOpen size={12} className="text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-xs truncate">{a.title}</p>
                      <p className="text-[8px] text-text-soft">{a.dueAt ? `Due: ${new Date(a.dueAt).toLocaleDateString()}` : 'No deadline'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/play/solo?quiz=${a.quizId}`}
                        className="px-3 py-1 rounded-xl bg-accent/10 text-accent text-[9px] font-black uppercase hover:bg-accent hover:text-white transition-all">
                        Play
                      </Link>
                      {isOwner && (
                        <button onClick={() => handleDeleteAssignment(a.id)}
                          className="p-1 rounded-lg text-red-400/40 hover:text-red-400 hover:bg-red-400/10 transition-all">
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {assignments.length === 0 && (
                  <p className="px-5 py-8 text-center text-text-soft text-[10px]">No assignments yet</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'members' && (
          <div className="glass rounded-[28px] border border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white/5 text-[9px] uppercase tracking-widest text-text-soft font-black">
                    <th className="px-5 py-4">Member</th>
                    <th className="px-5 py-4">Role</th>
                    <th className="px-5 py-4">ELO</th>
                    <th className="px-5 py-4 hidden lg:table-cell">Accuracy</th>
                    <th className="px-5 py-4 hidden lg:table-cell">Streak</th>
                    <th className="px-5 py-4 hidden lg:table-cell">Joined</th>
                    {isOwner && <th className="px-5 py-4" />}
                  </tr>
                </thead>
                <tbody>
                  {members.map((m: any, i: number) => (
                    <MemberRow key={m.id || i} m={m} isOwner={isOwner} onRemove={handleRemove} />
                  ))}
                </tbody>
              </table>
              {members.length === 0 && (
                <p className="px-5 py-12 text-center text-text-soft text-[10px]">No members yet. Share the join code!</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'assignments' && (
          <div className="space-y-3">
            {assignments.map((a: any) => (
              <div key={a.id} className="glass rounded-[20px] border border-white/5 p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                  <BookOpen size={16} className="text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-sm">{a.title}</p>
                  <p className="text-[10px] text-text-soft">{a.dueAt ? `Due: ${new Date(a.dueAt).toLocaleDateString()}` : 'No deadline'} · Assigned by {a.assignedBy?.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/play/solo?quiz=${a.quizId}`}
                    className="px-4 py-2 rounded-xl bg-accent text-white text-[10px] font-black uppercase tracking-widest hover:bg-accent/80 transition-all">
                    Start
                  </Link>
                  {isOwner && (
                    <button onClick={() => handleDeleteAssignment(a.id)}
                      className="p-2 rounded-xl text-red-400/40 hover:text-red-400 hover:bg-red-400/10 transition-all">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {assignments.length === 0 && (
              <div className="glass rounded-[32px] border border-white/5 p-16 text-center space-y-4">
                <ClipboardList size={32} className="text-text-soft/30 mx-auto" />
                <h3 className="font-black uppercase italic">No Assignments</h3>
                {isOwner && <Link href="/institution/assign" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-accent text-white font-black text-sm uppercase hover:bg-accent/80 transition-all">
                  <Plus size={14} /> Assign a Quiz
                </Link>}
              </div>
            )}
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
