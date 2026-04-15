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
  BarChart2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/axios';
import { 
  X, 
  Edit3, 
  Upload, 
  Check, 
  Camera, 
  ShieldAlert,
  Dna,
  Gamepad2,
  Sword,
  Flame,
  BrainCircuit,
  Zap as ZapIcon
} from 'lucide-react';

// Avatar Presets Matrix (DiceBear Collections)
const AVATAR_STUFF = [
  ...Array.from({ length: 15 }, (_, i) => `https://api.dicebear.com/7.x/bottts/svg?seed=nexus-${i}`),
  ...Array.from({ length: 15 }, (_, i) => `https://api.dicebear.com/7.x/pixel-art/svg?seed=gamer-${i}`),
  ...Array.from({ length: 15 }, (_, i) => `https://api.dicebear.com/7.x/adventurer/svg?seed=hero-${i}`),
  ...Array.from({ length: 10 }, (_, i) => `https://api.dicebear.com/7.x/avataaars/svg?seed=human-${i}`),
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
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [tempAvatar, setTempAvatar] = useState('');
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.email) {
        setLoading(false);
        return;
      }
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
  }, [user]);

  const handleUpdateProfile = async () => {
    setSyncing(true);
    try {
      await api.put('/api/user/profile', {
        email: user?.email,
        name: editName,
        avatar: tempAvatar
      });
      // Refresh local stats
      setStats({ ...stats, name: editName, avatar: tempAvatar });
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
    <div className="py-10">
      <div className="flex flex-col gap-1 mb-12">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">My Profile</h2>
        <p className="text-text-soft">Your rating, progress and recent performance across modes.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-8">
        {/* Profile Main Stats */}
        <div className="space-y-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass p-8 lg:p-12 rounded-[32px] relative overflow-hidden group shadow-2xl"
          >
            {/* Background Glow */}
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-accent/20 blur-[120px] rounded-full group-hover:bg-accent/30 transition-all pointer-events-none" />
            
            <div className="flex flex-col md:flex-row items-center gap-8 mb-12">
              <div className="group/avatar relative w-32 h-32 rounded-[40px] bg-gradient-to-tr from-accent to-accent-alt flex items-center justify-center font-bold text-5xl shadow-2xl overflow-hidden cursor-pointer" onClick={() => setIsEditing(true)}>
                {stats?.avatar ? (
                  <img src={stats.avatar} alt="profile" className="w-full h-full object-cover transition-transform group-hover/avatar:scale-110" />
                ) : stats?.name?.charAt(0).toUpperCase() || 'U'}
                
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-opacity">
                  <Camera className="text-white" size={32} />
                </div>
                
                <div className="absolute -bottom-2 -right-2 bg-background p-2 rounded-2xl shadow-xl z-20">
                  <Award className="text-yellow-400" size={24} />
                </div>
              </div>

              <div className="flex flex-col items-center md:items-start text-center md:text-left flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-4xl font-black">{stats?.name || 'Guest Explorer'}</h1>
                  <button onClick={() => setIsEditing(true)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-text-soft hover:text-white transition-all">
                    <Edit3 size={18} />
                  </button>
                </div>
                <p className="text-accent font-bold uppercase tracking-widest text-xs mb-4">
                  {user ? 'Verified Competitor' : 'Unregistered Terminal'}
                </p>
                
                {user && (
                  <div className="flex gap-4">
                    <div className={cn("px-4 py-2 rounded-full border border-white/5 text-[10px] font-black uppercase tracking-widest flex items-center gap-2", rank.bg, rank.color)}>
                      <rank.icon size={14} />
                      {rank.label} Tier
                    </div>
                    <div className="px-4 py-2 rounded-full bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-text-soft">XP: {stats?.xp || 0}</div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12 relative z-10">
              {[
                { label: 'Elo Rating', value: stats?.globalRating || 1200, change: rank.label, icon: rank.icon, color: rank.color },
                { label: 'Total XP', value: stats?.xp || 0, change: 'Level ' + Math.floor((stats?.xp || 0) / 1000), icon: ZapIcon, color: 'text-accent-alt' },
                { label: 'Quizzes Hosted', value: stats?.quizzesCount || 0, change: 'Arena Build', icon: Sword, color: 'text-purple-400' },
              ].map(({ label, value, change, icon: Icon, color }, i) => (
                <div key={i} className="flex flex-col p-6 rounded-3xl bg-background/50 border border-border-soft hover:border-accent/40 transition-all">
                  <Icon className={cn("mb-4", color)} size={24} />
                  <span className="text-[10px] text-text-soft uppercase font-black tracking-widest mb-1">{label}</span>
                  <span className="text-3xl font-black mb-1">{value}</span>
                  <span className={cn("text-[10px] font-bold", color)}>{change}</span>
                </div>
              ))}
            </div>

            <div className="space-y-4 relative z-10">
              <div className="flex justify-between items-end">
                <span className="text-[10px] text-text-soft font-black uppercase tracking-widest">Progress to {getRankInfo((stats?.globalRating || 1200) + 500).label}</span>
                <span className="text-xs font-bold text-accent-alt">{(stats?.globalRating % 500) / 5}%</span>
              </div>
              <div className="h-4 w-full bg-bg-soft rounded-2xl p-1 border border-border-soft shadow-inner">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(stats?.globalRating % 500) / 5}%` }}
                  className="h-full bg-gradient-to-r from-accent to-accent-alt rounded-xl shadow-[0_0_15px_rgba(34,197,94,0.5)]"
                />
              </div>
              <p className="text-[10px] text-text-soft italic text-center">Defeat higher-rated opponents to ascend tiers.</p>
            </div>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Mode-wise Ratings */}
            <div className="glass p-8 rounded-[32px] space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <BarChart2 className="text-accent" />
                <h3 className="font-bold text-lg">Mode-wise Ratings</h3>
              </div>
              {[
                { name: 'Quiz (Rapid)', desc: 'Classroom & Lab games', rating: stats?.ratings?.rapid || 1200 },
                { name: 'Tournament (Blitz)', desc: 'Fast-paced events', rating: stats?.ratings?.blitz || 1200 },
                { name: 'Practice (Casual)', desc: 'Solo practice, unrated', rating: stats?.ratings?.casual || 1200 },
              ].map((mode, i) => (
                <div key={i} className="flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-accent/30 transition-all group">
                  <div className="flex flex-col">
                    <span className="font-bold text-sm mb-1 group-hover:text-accent transition-all">{mode.name}</span>
                    <span className="text-[10px] text-text-soft uppercase tracking-widest leading-none">{mode.desc}</span>
                  </div>
                  <span className="text-xl font-black group-hover:scale-110 transition-all">{mode.rating}</span>
                </div>
              ))}
            </div>

            {/* Recent History */}
            <div className="glass p-8 rounded-[32px] space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="text-accent-alt" />
                <h3 className="font-bold text-lg">Recent Rated Quizzes</h3>
              </div>
              {history.length > 0 ? history.slice(0, 4).map((h, i) => (
                <div key={i} className="flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/5">
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-sm truncate max-w-[120px]">{h.mode.toUpperCase()} Battle</span>
                    <span className={cn("text-[10px] font-black uppercase tracking-widest", h.change >= 0 ? "text-accent-alt" : "text-red-400")}>
                      {h.change >= 0 ? 'Win' : 'Loss'}
                    </span>
                  </div>
                  <span className="text-[10px] text-text-soft font-mono">
                    {h.change >= 0 ? `+${h.change}` : h.change} ({h.oldRating} → {h.newRating})
                  </span>
                </div>
              )) : (
                <div className="py-10 text-center text-text-soft text-xs italic border border-dashed border-white/5 rounded-2xl">
                  No rated matches played yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tactical Divider (Mobile Only) */}
        <div className="xl:hidden h-px w-full bg-gradient-to-r from-transparent via-white/5 to-transparent my-10" />

        {/* Sidebar Achievements */}
        <div className="space-y-8">
          <div className="glass p-8 rounded-[32px]">
            <h3 className="font-bold text-lg mb-8 flex items-center gap-2 text-white">
              <ZapIcon className="text-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
              Arena Achievements
            </h3>
            <div className="flex flex-wrap gap-6">
              {[
                { icon: BrainCircuit, label: 'Strategist', unlocked: (stats?.xp || 0) > 1000, desc: 'Earned at 1k XP', color: 'text-blue-400' },
                { icon: Flame, label: 'On Fire', unlocked: (history.length) >= 5, desc: '5+ Games Played', color: 'text-orange-500' },
                { icon: ShieldAlert, label: 'Tank', unlocked: (stats?.globalRating || 1200) >= 2000, desc: 'Gold Tier+', color: 'text-purple-400' },
                { icon: Gamepad2, label: 'Veteran', unlocked: (stats?.quizzesCount || 0) >= 1, desc: 'Hosted 1+ Game', color: 'text-emerald-400' },
                { icon: Sword, label: 'Warlord', unlocked: (stats?.globalRating || 1200) >= 3000, desc: 'Diamond Tier+', color: 'text-red-500' },
              ].map((badge, i) => (
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  key={i} 
                  className={cn(
                    "flex flex-col items-center gap-3 transition-all duration-500",
                    !badge.unlocked && "opacity-30 grayscale"
                  )}
                >
                  <div className={cn(
                    "w-20 h-20 rounded-[28px] glass border-white/10 flex items-center justify-center shadow-xl relative group cursor-help",
                    badge.unlocked && "bg-white/5 border-white/20"
                  )}>
                    <badge.icon className={cn("w-10 h-10", badge.unlocked ? badge.color : "text-white/20")} />
                    
                    {/* Tooltip */}
                    <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-[#121111] border border-white/10 text-white px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap shadow-2xl z-50">
                      {badge.label}: <span className="text-text-soft">{badge.desc}</span>
                    </div>
                    
                    {badge.unlocked && (
                      <div className="absolute -bottom-1 -right-1 bg-accent p-1.5 rounded-lg">
                        <Check size={10} className="text-white" />
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-text-soft">{badge.label}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Identity Modifier Modal */}
          <AnimatePresence>
            {isEditing && (
              <div 
                className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
                onClick={() => setIsEditing(false)}
              >
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/80 backdrop-blur-md"
                />
                
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="relative w-full max-w-2xl glass p-8 rounded-[40px] border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Modal Header */}
                  <div className="flex justify-between items-center mb-10">
                    <div className="flex flex-col">
                      <h2 className="text-3xl font-black">Identity Forge</h2>
                      <p className="text-text-soft text-sm">Modify your arena presence and digital core.</p>
                    </div>
                    <button onClick={() => setIsEditing(false)} className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-text-soft hover:text-white transition-all">
                      <X size={24} />
                    </button>
                  </div>

                  <div className="grid md:grid-cols-[200px_1fr] gap-12 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
                    {/* Left: Preview & Upload */}
                    <div className="space-y-8">
                       <div className="flex flex-col items-center gap-6">
                         <div className="relative w-32 h-32 rounded-[40px] bg-gradient-to-tr from-accent to-accent-alt flex items-center justify-center text-5xl font-black shadow-2xl overflow-hidden">
                           {tempAvatar ? (
                             <img src={tempAvatar} alt="preview" className="w-full h-full object-cover" />
                           ) : (editName || 'U').charAt(0).toUpperCase()}
                           
                           {syncing && (
                             <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                               <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                             </div>
                           )}
                         </div>
                         
                         <label className="group flex flex-col items-center gap-2 cursor-pointer w-full p-4 rounded-2xl border border-dashed border-white/10 hover:border-accent/40 bg-white/5 transition-all">
                           <Upload size={20} className="text-text-soft group-hover:text-accent transition-colors" />
                           <span className="text-[10px] font-black uppercase tracking-widest text-text-soft group-hover:text-white">Upload from device</span>
                           <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                         </label>
                       </div>
                    </div>

                    {/* Right: Presets & Name */}
                    <div className="space-y-10">
                      <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-soft ml-1">Username Modifier</label>
                        <input 
                          type="text" 
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-lg font-bold focus:ring-1 focus:ring-accent outline-none transition-all"
                          placeholder="Your New Handle..."
                        />
                      </div>

                      <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-soft ml-1">Nexus Preset Core (40+ Avatars)</label>
                        <div className="grid grid-cols-5 gap-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar p-1">
                          {AVATAR_STUFF.map((url, i) => (
                            <div 
                              key={i} 
                              onClick={() => setTempAvatar(url)}
                              className={cn(
                                "aspect-square rounded-2xl cursor-pointer hover:scale-110 transition-all border-2 overflow-hidden bg-white/5",
                                tempAvatar === url ? "border-accent ring-4 ring-accent/20" : "border-transparent"
                              )}
                            >
                              <img src={url} alt={`preset-${i}`} className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="mt-12 pt-8 border-t border-white/5 flex gap-4">
                     <button 
                      onClick={handleUpdateProfile}
                      disabled={syncing}
                      className="flex-1 py-5 rounded-2xl bg-gradient-to-r from-accent to-accent-alt text-white font-black uppercase tracking-[0.2em] text-sm shadow-[0_0_30px_rgba(99,102,241,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                     >
                       {syncing ? 'Syncing Digital Core...' : (
                         <><Dna size={20} /> Deploy Identity</>
                       )}
                     </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          <div className="glass p-8 rounded-[32px] bg-gradient-to-br from-bg-soft/50 to-background/50">
            <h3 className="font-bold text-lg mb-6">Matchmaking History</h3>
            <div className="space-y-4">
              {history.length > 0 ? history.slice(0, 3).map((match, i) => (
                <div key={i} className="flex justify-between items-center text-sm p-4 rounded-2xl bg-white/5 border border-white/5">
                  <div className="flex flex-col">
                    <span className="font-bold text-xs">{match.mode.toUpperCase()} Arena</span>
                    <span className="text-[10px] text-text-soft">{new Date(match.createdAt).toLocaleDateString()}</span>
                  </div>
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                    match.change >= 0 ? 'bg-accent-alt/10 text-accent-alt' : 'bg-red-500/10 text-red-500'
                  )}>
                    {match.change >= 0 ? 'Victory' : 'Defeat'}
                  </span>
                </div>
              )) : (
                <p className="text-center text-[10px] text-text-soft italic">No games logged yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
