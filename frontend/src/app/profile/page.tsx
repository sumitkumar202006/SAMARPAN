'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { 
  Trophy, 
  Target, 
  Activity, 
  Award, 
  Zap, 
  Clock,
  TrendingUp,
  BarChart2,
  Menu,
  User,
  Shield,
  Camera,
  Edit3,
  X,
  Upload,
  Check,
  ShieldAlert,
  Dna,
  Gamepad2,
  Sword,
  Flame,
  BrainCircuit,
  Zap as ZapIcon,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { CollapsibleCard } from '@/components/ui/CollapsibleCard';

// Avatar Presets Matrix (DiceBear Collections)
const AVATAR_STUFF = [
  ...Array.from({ length: 12 }, (_, i) => `https://api.dicebear.com/7.x/bottts/svg?seed=nexus-${i}`),
  ...Array.from({ length: 12 }, (_, i) => `https://api.dicebear.com/7.x/pixel-art/svg?seed=gamer-${i}`),
  ...Array.from({ length: 12 }, (_, i) => `https://api.dicebear.com/7.x/adventurer/svg?seed=hero-${i}`),
  ...Array.from({ length: 8 }, (_, i) => `https://api.dicebear.com/7.x/avataaars/svg?seed=human-${i}`),
];

// Badge Logic Engine
const getRankInfo = (rating: number) => {
  if (rating >= 5000) return { label: 'Apex Predator', color: 'text-[#ff4b50]', icon: ShieldAlert, bg: 'bg-[#ff4b50]/10' };
  if (rating >= 3500) return { label: 'Master', color: 'text-[#ea580c]', icon: Trophy, bg: 'bg-orange-500/10' };
  if (rating >= 2500) return { label: 'Diamond', color: 'text-[#0ea5e9]', icon: Award, bg: 'bg-sky-500/10' };
  if (rating >= 2000) return { label: 'Gold', color: 'text-[#f59e0b]', icon: ZapIcon, bg: 'bg-amber-500/10' };
  if (rating >= 1500) return { label: 'Silver', color: 'text-[#94a3b8]', icon: Activity, bg: 'bg-slate-400/10' };
  return { label: 'Iron', color: 'text-[#78350f]', icon: Target, bg: 'bg-orange-900/10' };
};

export default function ProfilePage() {
  const { user, profileCompletion, setUser } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandLog, setExpandLog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [tempAvatar, setTempAvatar] = useState('');
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!user?.email) {
      router.push('/auth?redirect=/profile&message=Access+Denied');
      return;
    }
    const fetchProfile = async () => {
      try {
        const [profileRes, historyRes] = await Promise.all([
          api.get(`/api/profile/${user.email}`),
          api.get(`/ratings/${user.email}`)
        ]);
        setStats(profileRes.data);
        setEditName(profileRes.data.name);
        setTempAvatar(profileRes.data.avatar);
        setHistory(historyRes.data.history || []);
      } catch (err) {
        console.error("Failed to fetch profile data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user, router]);

  const handleUpdateProfile = async () => {
    setSyncing(true);
    try {
      await api.put('/api/user/profile', {
        email: user?.email,
        name: editName,
        avatar: tempAvatar
      });
      setStats({ ...stats, name: editName, avatar: tempAvatar });
      if (user) {
        setUser({
          ...user,
          name: editName,
          avatar: tempAvatar
        });
      }
      setIsEditing(false);
    } catch (err) {
      console.error("Update failed", err);
    } finally {
      setSyncing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    setSyncing(true);
    try {
      const res = await api.post('/api/user/upload-avatar', formData);
      setTempAvatar(res.data.url);
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setSyncing(false);
    }
  };

  const rank = getRankInfo(stats?.globalRating || 1200);

  return (
    <div className="py-2 lg:py-10 space-y-10">
      <div className="flex flex-col gap-1 px-2">
        <h2 className="text-3xl lg:text-4xl font-black tracking-tight uppercase italic text-white flex items-center gap-4">
          Pilot Profile
          <span className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent hidden lg:block" />
        </h2>
        <p className="text-text-soft text-xs lg:text-sm">Comprehensive breakdown of your neural signatures and arena standing.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        
        {/* Track 1: Pilot Core */}
        <div className="space-y-6">
           <div className="flex items-center gap-3 px-2">
            <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center text-accent text-[10px]">1</div>
            <h2 className="text-xs font-black uppercase tracking-widest text-text-soft italic">Identity Core</h2>
          </div>

          <div className="glass p-8 rounded-[40px] border-white/5 space-y-8 relative overflow-hidden group">
             <div className="absolute -top-20 -right-20 w-64 h-64 bg-accent/5 blur-[80px] rounded-full group-hover:bg-accent/10 transition-all pointer-events-none" />
             
             <div className="relative z-10 flex flex-col items-center gap-6">
                <div className="relative">
                   <div className="w-28 h-28 rounded-[40px] bg-gradient-to-tr from-accent to-accent-alt p-1 shadow-2xl relative">
                      <div className="w-full h-full rounded-[36px] bg-background flex items-center justify-center overflow-hidden border-2 border-background">
                         <img src={stats?.avatar || user?.avatar || '/favicon.ico'} className="w-full h-full object-cover scale-110" />
                      </div>
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-accent flex items-center justify-center border-4 border-background text-white shadow-lg">
                         <Check size={14} />
                      </div>
                   </div>
                </div>

                <div className="text-center">
                   <h3 className="text-2xl font-black uppercase italic tracking-tight">{stats?.name || user?.name}</h3>
                   <div className={cn("mt-2 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] inline-block", rank.bg, rank.color)}>
                      {rank.label} PILOT
                   </div>
                </div>
             </div>

             <div className="space-y-6 pt-4 border-t border-white/5">
                <div className="flex justify-between items-end">
                   <div>
                      <p className="text-[9px] text-text-soft uppercase font-black mb-1">Global Rating</p>
                      <p className="text-3xl font-black text-accent-alt">{stats?.globalRating || 1200}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-[9px] text-text-soft uppercase font-black mb-1">Total XP</p>
                      <p className="text-xl font-black italic">{stats?.xp || 0}</p>
                   </div>
                </div>

                <div className="p-5 rounded-3xl bg-white/5 border border-white/10 space-y-3 shadow-inner">
                   <div className="flex justify-between text-[8px] font-black uppercase text-text-soft">
                      <span>Neural Sync Strength</span>
                      <span>{profileCompletion}%</span>
                   </div>
                   <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-accent rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]" style={{ width: `${profileCompletion}%` }} />
                   </div>
                </div>
             </div>

             <button 
               onClick={() => {
                 setEditName(stats?.name || user?.name || '');
                 setTempAvatar(stats?.avatar || user?.avatar || '');
                 setIsEditing(true);
               }}
               className="w-full py-4 rounded-2xl bg-white text-black font-black text-[10px] uppercase tracking-[0.3em] hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-white/5"
             >
               Remodel Identity
             </button>
          </div>
        </div>

        {/* Track 2: Combat Statistics */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 text-[10px]">2</div>
            <h2 className="text-xs font-black uppercase tracking-widest text-text-soft italic">Combat Analytics</h2>
          </div>

          <div className="grid grid-cols-1 gap-4">
             {[
               { name: 'Blitz Arena', val: stats?.ratings?.blitz || 1200, icon: ZapIcon, color: 'text-yellow-400' },
               { name: 'Tactical Arena', val: stats?.ratings?.rapid || 1200, icon: Activity, color: 'text-accent' },
               { name: 'Casual Arena', val: stats?.ratings?.casual || 1200, icon: Gamepad2, color: 'text-text-soft' }
             ].map((mode, i) => (
                <div key={i} className="glass p-6 rounded-[32px] flex items-center justify-between border-white/5 hover:border-accent/20 transition-all group">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center transition-all group-hover:scale-110">
                         <mode.icon className={mode.color} size={18} />
                      </div>
                      <span className="text-xs font-black uppercase italic tracking-tight">{mode.name}</span>
                   </div>
                   <span className="text-xl font-black">{mode.val}</span>
                </div>
             ))}
          </div>

          <CollapsibleCard title="Neural Activity Log" icon={Clock} isDefaultExpanded={true}>
             <div className="space-y-4 pt-2">
                <div className={cn(
                  "space-y-3 overflow-y-auto transition-all duration-700 pr-2 scrollbar-none relative",
                  expandLog ? "max-h-[1000px]" : "max-h-[400px]"
                )}>
                  {history.length > 0 ? (
                    <>
                      {history.map((h, i) => (
                        <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/10 flex justify-between items-center group hover:bg-white/10 transition-all">
                           <div className="flex flex-col">
                              <span className="text-[10px] font-black uppercase italic">{h.mode} Deployment</span>
                              <span className="text-[8px] text-text-soft font-mono">{new Date(h.createdAt).toLocaleDateString()}</span>
                           </div>
                           <div className="flex flex-col items-end">
                              <span className={cn("text-[9px] font-black uppercase tracking-widest", h.change >= 0 ? "text-accent-alt" : "text-red-400")}>
                                 {h.change >= 0 ? `+${h.change}` : h.change}
                              </span>
                              <span className="text-[8px] text-text-soft font-mono">{h.oldRating} → {h.newRating}</span>
                           </div>
                        </div>
                      ))}
                      {!expandLog && history.length > 5 && (
                        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background/90 to-transparent pointer-events-none z-10" />
                      )}
                    </>
                  ) : (
                    <div className="p-10 text-center text-[10px] text-text-soft italic uppercase border border-dashed border-white/10 rounded-2xl mt-2">
                       Zero deployments detected.
                    </div>
                  )}
                </div>

                {history.length > 5 && (
                  <button 
                    onClick={() => setExpandLog(!expandLog)}
                    className="w-full py-3 text-[9px] font-black uppercase tracking-widest text-text-soft hover:text-white transition-all flex items-center justify-center gap-2 border-t border-white/5"
                  >
                    {expandLog ? (
                      <><ChevronUp size={12} /> Standard View</>
                    ) : (
                      <><ChevronDown size={12} /> Full Log Analysis ({history.length})</>
                    )}
                  </button>
                )}
             </div>
          </CollapsibleCard>
        </div>

        {/* Track 3: Hall of Commendations */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="w-5 h-5 rounded-full bg-accent-alt/20 flex items-center justify-center text-accent-alt text-[10px]">3</div>
            <h2 className="text-xs font-black uppercase tracking-widest text-text-soft italic">Commendations</h2>
          </div>

          <div className="glass p-8 rounded-[40px] border-white/5 space-y-8">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-accent-alt/10 flex items-center justify-center text-accent-alt shadow-inner">
                   <Award size={24} />
                </div>
                <div>
                   <h4 className="font-black text-sm uppercase italic">Achievements</h4>
                   <p className="text-[8px] text-text-soft font-black uppercase tracking-widest">Global Arena Unlocks</p>
                </div>
             </div>

             <div className="grid grid-cols-4 gap-4">
                {[
                  { icon: BrainCircuit, unlocked: (stats?.xp || 0) > 1000, color: 'text-blue-400', tip: 'Strategist: 1k+ XP' },
                  { icon: Flame, unlocked: history.length >= 5, color: 'text-orange-500', tip: 'Streak: 5+ Matches' },
                  { icon: ShieldAlert, unlocked: (stats?.globalRating || 1200) >= 2000, color: 'text-purple-400', tip: 'Tank: 2k+ Rating' },
                  { icon: Sword, unlocked: (stats?.quizzesCount || 0) >= 1, color: 'text-red-500', tip: 'Warlord: Hosted 1+ Match' }
                ].map((badge, i) => (
                   <motion.div 
                     whileHover={{ scale: 1.1, rotate: 5 }}
                     key={i} 
                     className={cn(
                       "aspect-square rounded-2xl flex items-center justify-center border transition-all cursor-help relative group",
                       badge.unlocked ? "bg-white/5 border-white/20" : "bg-black/20 border-white/5 grayscale opacity-20"
                     )}
                     title={badge.tip}
                   >
                      <badge.icon className={badge.unlocked ? badge.color : "text-white/20"} size={22} />
                      {badge.unlocked && <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full border-2 border-background shadow-xs" />}
                   </motion.div>
                ))}
             </div>
          </div>

          <div className="p-8 rounded-[40px] bg-gradient-to-br from-bg-soft/50 to-transparent border border-white/5 space-y-6">
             <div className="flex items-center gap-3">
                <TrendingUp size={16} className="text-accent" />
                <h4 className="text-[10px] font-black uppercase tracking-widest">Growth Curve</h4>
             </div>
             
             <div className="space-y-4">
                <div className="flex justify-between items-center text-[9px] font-black uppercase">
                   <span className="text-text-soft">Matches won</span>
                   <span className="text-white">64%</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                   <div className="h-full bg-emerald-500 rounded-full" style={{ width: '64%' }} />
                </div>

                <div className="flex justify-between items-center text-[9px] font-black uppercase">
                   <span className="text-text-soft">Accuracy</span>
                   <span className="text-white">82%</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                   <div className="h-full bg-accent-alt rounded-full" style={{ width: '82%' }} />
                </div>
             </div>
          </div>

          <div className="p-6 rounded-[32px] bg-accent-alt/5 border border-accent-alt/20 text-center">
             <p className="text-[9px] text-text-soft italic uppercase font-black leading-relaxed">
                Ranked operations resume in <span className="text-accent-alt">14h 22m</span>. Prepare your neural links.
             </p>
          </div>
        </div>
      </div>

      {/* Identity Modifier Modal */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4" onClick={() => setIsEditing(false)}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/90 backdrop-blur-xl" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-2xl glass p-8 rounded-[50px] border-white/10 shadow-3xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-10 border-b border-white/5 pb-6">
                <div className="flex flex-col">
                  <h2 className="text-3xl font-black italic uppercase tracking-tighter">Identity Forge</h2>
                  <p className="text-text-soft text-[10px] font-black uppercase tracking-widest mt-1 italic">Modify your arena presence.</p>
                </div>
                <button onClick={() => setIsEditing(false)} className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-text-soft hover:text-white transition-all">
                  <X size={24} />
                </button>
              </div>

              <div className="grid md:grid-cols-[200px_1fr] gap-12 max-h-[50vh] overflow-y-auto pr-4 scrollbar-thin">
                <div className="space-y-8 flex flex-col items-center">
                   <div className="relative w-36 h-36 rounded-[44px] bg-gradient-to-tr from-accent to-accent-alt p-1 shadow-2xl overflow-hidden group">
                     <div className="w-full h-full rounded-[40px] bg-background flex items-center justify-center overflow-hidden border-2 border-background">
                       {tempAvatar ? <img src={tempAvatar} alt="preview" className="w-full h-full object-cover scale-110" /> : <p className="text-4xl font-black">{editName.charAt(0)}</p>}
                     </div>
                     {syncing && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>}
                   </div>
                   
                   <label className="group flex flex-col items-center gap-2 cursor-pointer w-full p-4 rounded-3xl border border-dashed border-white/10 hover:border-accent/40 bg-white/5 transition-all">
                     <Upload size={20} className="text-text-soft group-hover:text-accent transition-colors" />
                     <span className="text-[8px] font-black uppercase tracking-widest text-text-soft group-hover:text-white">Neural Load Image</span>
                     <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                   </label>
                </div>

                <div className="space-y-10">
                  <div className="space-y-3">
                    <label className="text-[9px] font-black uppercase tracking-widest text-text-soft italic">Pilot Handle</label>
                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-lg font-black italic focus:border-accent outline-none transition-all uppercase" placeholder="Enter Callsign..." />
                  </div>

                  <div className="space-y-4">
                    <label className="text-[9px] font-black uppercase tracking-widest text-text-soft italic">Nexus Avatar Presets</label>
                    <div className="grid grid-cols-4 lg:grid-cols-5 gap-3 max-h-[220px] overflow-y-auto pr-2 scrollbar-none">
                      {AVATAR_STUFF.map((url, i) => (
                        <button key={i} onClick={() => setTempAvatar(url)} className={cn("aspect-square rounded-2xl border-2 transition-all p-1 bg-white/5", tempAvatar === url ? "border-accent bg-accent/20 scale-110" : "border-transparent opacity-60 hover:opacity-100")}>
                          <img src={url} alt="preset" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-12 pt-8 border-t border-white/5 flex gap-4">
                 <button onClick={handleUpdateProfile} disabled={syncing} className="flex-1 py-5 rounded-[24px] bg-white text-black font-black uppercase tracking-[0.3em] text-[10px] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3">
                   {syncing ? 'UPDATING NEURAL CORE...' : (<><Dna size={18} /> DEPLOY IDENTITY</>)}
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
