'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Volume2, 
  VolumeX, 
  Settings as SettingsIcon, 
  Shield, 
  Zap, 
  Save, 
  Sparkles,
  School,
  BookOpen,
  Camera,
  Upload,
  Edit3,
  Check,
  Activity
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useAudio } from '@/context/AudioContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { cn } from '@/lib/utils';
import { AuthGuard } from '@/components/auth/AuthGuard';

// Avatar Database Configuration
const AVATAR_COLLECTIONS = [
  {
    id: 'starter',
    name: 'Neural Pilots',
    style: 'bottts',
    description: 'Standard issue neural shells for baseline synchronization.',
    requirement: { xp: 0, rating: 0 },
    count: 50,
  },
  {
    id: 'cyber',
    name: 'Cybernetic Bots',
    style: 'bottts-neutral',
    description: 'Advanced silicon-based entities with enhanced processing.',
    requirement: { xp: 500, rating: 1200 },
    count: 50,
  },
  {
    id: 'retro',
    name: 'Retro Glitch',
    style: 'pixel-art',
    description: 'Legacy-tier shells from the pre-nexus era.',
    requirement: { xp: 1500, rating: 1500 },
    count: 50,
  },
  {
    id: 'guardian',
    name: 'Artistic Guardians',
    style: 'lorelei',
    description: 'Ethereal entities forged in the artistic forge.',
    requirement: { xp: 5000, rating: 2000 },
    count: 50,
  },
  {
    id: 'elite',
    name: 'Protocol Elites',
    style: 'notionists',
    description: 'High-ranking nexus administrators and protocol masters.',
    requirement: { xp: 15000, rating: 2500 },
    count: 50,
  }
];

import { Lock, Info } from 'lucide-react';
export default function SettingsPage() {
  const { user, setUser, profileCompletion: completion } = useAuth();
  const { isMuted, toggleMute, playSuccess } = useAudio();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    username: user?.username || '',
    avatar: user?.avatar || '',
    preferredField: user?.preferredField || 'General',
    interest: user?.interest || '',
    customField: '',
    college: user?.college || '',
    course: user?.course || '',
    dob: user?.dob ? new Date(user.dob).toISOString().split('T')[0] : '',
    soundEnabled: user?.settings?.soundEnabled ?? true,
    performanceMode: user?.settings?.performanceMode || 'high'
  });
  
  const [activeCollection, setActiveCollection] = useState(AVATAR_COLLECTIONS[0].id);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  const checkIsLocked = (req: { xp: number, rating: number }) => {
    if (!user) return true;
    const userXp = user.xp || 0;
    const userRating = user.globalRating || 0;
    return userXp < req.xp && userRating < req.rating;
  };

  useEffect(() => {
    if (!user?.email) return;
    
    const isCustom = !fields.includes(user.preferredField || 'General');
    
    setFormData({
      name: user.name || '',
      username: user.username || '',
      avatar: user.avatar || '',
      preferredField: user.preferredField || 'General',
      interest: user.interest || '',
      customField: user.customField || '',
      college: user.college || '',
      course: user.course || '',
      dob: user.dob ? new Date(user.dob).toISOString().split('T')[0] : '',
      soundEnabled: user.settings?.soundEnabled ?? true,
      performanceMode: user.settings?.performanceMode || 'high'
    });
  }, [user]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const postData = new FormData();
    postData.append('avatar', file);

    setIsUploading(true);
    try {
      const res = await api.post('/api/user/upload-avatar', postData);
      setFormData(prev => ({ ...prev, avatar: res.data.url }));
    } catch (err) {
      console.error("Upload failed", err);
      setStatus({ type: 'error', msg: 'Identity upload compromised. Check network.' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    setStatus(null);
    
    try {
      const res = await api.put('/api/user/settings', {
        email: user.email,
        name: formData.name,
        avatar: formData.avatar,
        preferredField: formData.preferredField,
        interest: formData.interest,
        customField: formData.customField,
        college: formData.college,
        course: formData.course,
        dob: formData.dob || null,
        username: formData.username,
        settings: {
          soundEnabled: formData.soundEnabled,
          performanceMode: formData.performanceMode
        }
      });
      
      if (res.status === 200) {
        setUser({
          ...user,
          name: formData.name,
          avatar: formData.avatar,
          preferredField: formData.preferredField,
          interest: formData.interest,
          customField: formData.customField,
          college: formData.college,
          course: formData.course,
          username: formData.username,
          lastUsernameChange: formData.username !== user.username ? new Date().toISOString() : user.lastUsernameChange,
          dob: formData.dob || undefined,
          settings: {
            soundEnabled: formData.soundEnabled,
            performanceMode: formData.performanceMode as 'high' | 'medium' | 'low'
          }
        });
        
        setStatus({ type: 'success', msg: 'Settings synchronized with the cloud!' });
        playSuccess();
      }
    } catch (err: any) {
      setStatus({ type: 'error', msg: err.response?.data?.error || 'Failed to save settings' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setStatus(null), 3000);
    }
  };

  const fields = [
    "General", "Computer Science", "Medical Sciences", "Engineering", 
    "Aptitude & Reasoning", "Civil Services", "Arts & Literature", "Business & Finance"
  ];

  return (
    <AuthGuard>
      <div className="max-w-7xl mx-auto p-4 lg:p-10 space-y-10 font-bold overflow-hidden">

      {/* Header & Profile Completion */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 px-2">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl bg-accent/20 flex items-center justify-center text-accent">
            <SettingsIcon size={20} lg-size={24} />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight uppercase tracking-widest leading-tight italic">Command Center</h1>
            <p className="text-text-soft text-[10px] lg:text-sm">Personalize your arena experience and AI brain.</p>
          </div>
        </div>

        {/* Completion Matrix */}
        <div className="w-full lg:w-96 flex flex-col sm:flex-row items-center gap-6">
           <div className="flex-1 w-full space-y-2">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-text-soft">
                 <span>Synchronization Level</span>
                 <span className={cn(completion === 100 ? "text-[#00D4B4]" : "text-accent")}>{completion}%</span>
              </div>
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                 <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${completion}%` }}
                   className={cn(
                     "h-full rounded-full transition-all duration-1000",
                     completion === 100 ? "bg-[#00D4B4] shadow-[0_0_15px_rgba(16,185,129,0.5)]" : "bg-accent shadow-[0_0_10px_rgba(99,102,241,0.3)]"
                   )}
                 />
              </div>
           </div>

           <div className="shrink-0 w-full sm:w-auto flex flex-col items-center">
              <Button 
                onClick={handleSave}
                isLoading={isSaving}
                className={cn(
                  "px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl hover:scale-[1.02] active:scale-95",
                  completion === 100 ? "bg-emerald-600 shadow-emerald-600/20" : "bg-accent shadow-accent/20"
                )}
              >
                <div className="flex items-center gap-2">
                  <Save size={14} />
                  <span>Commit Sync</span>
                </div>
              </Button>
              
              <AnimatePresence>
                {status && (
                  <motion.p 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={cn(
                      "text-[8px] font-black uppercase tracking-widest mt-2 italic absolute -bottom-4 whitespace-nowrap",
                      status.type === 'success' ? "text-accent-alt" : "text-red-400"
                    )}
                  >
                    {status.msg}
                  </motion.p>
                )}
              </AnimatePresence>
           </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        
        {/* Track 1: Pilot Identity */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center text-accent text-[10px]">1</div>
            <h2 className="text-xs font-black uppercase tracking-widest text-text-soft">Pilot Briefing</h2>
          </div>

          <div className="glass rounded-[32px] p-6 border-white/5 space-y-6">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-accent to-accent-alt flex items-center justify-center font-black text-white text-xl">
                {formData.avatar ? (
                   <img src={formData.avatar} className="w-full h-full object-cover rounded-xl" />
                ) : (
                   user?.name?.charAt(0).toUpperCase()
                )}
              </div>
              <div className="overflow-hidden">
                <p className="font-black text-base tracking-tight truncate uppercase italic">{user?.name || 'GUEST PILOT'}</p>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#00D4B4] animate-pulse" />
                  <p className="text-[9px] text-text-soft uppercase font-black tracking-widest">@{user?.username || 'nexus_pilot'}</p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-[10px] leading-relaxed text-text-soft italic">
              {completion === 100 
                ? "Neural sync fully optimized. Core systems operational." 
                : "Initialize institutional context to increase neural accuracy."}
            </div>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-[32px] p-6 border-white/5 space-y-6"
          >
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <Camera className="text-accent" size={16} />
              <h2 className="text-[10px] font-black uppercase tracking-widest">Identity Forge</h2>
            </div>

            <div className="space-y-6">
              <div className="relative group/avatar w-40 h-40 mx-auto font-bold">
                 <div className="absolute inset-0 bg-accent/20 blur-[40px] rounded-full opacity-0 group-hover/avatar:opacity-100 transition-all" />
                <div className="w-full h-full rounded-2xl bg-gradient-to-tr from-accent to-accent-alt p-1 relative z-10">
                  <div className="w-full h-full rounded-[14px] bg-background flex items-center justify-center overflow-hidden">
                    {formData.avatar ? (
                      <img src={formData.avatar} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User size={48} className="text-text-soft" />
                    )}
                  </div>
                </div>
                <label className="absolute -bottom-2 -right-2 p-3 rounded-xl bg-accent text-white cursor-pointer hover:scale-110 active:scale-95 transition-all shadow-xl z-20">
                  <Upload size={18} />
                  <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*" />
                </label>
              </div>

              {/* Avatar Collection Matrix */}
              <div className="space-y-4 pt-4 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-black uppercase tracking-widest text-text-soft flex items-center gap-2">
                    <Activity size={10} /> Identity Collections
                  </p>
                  <p className="text-[8px] font-black text-accent-alt uppercase italic">250+ Neutral Matrix Shells</p>
                </div>

                {/* Categories Tab Scroll */}
                <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar no-scrollbar">
                   {AVATAR_COLLECTIONS.map(col => {
                     const isLocked = checkIsLocked(col.requirement);
                     return (
                        <button
                          key={col.id}
                          onClick={() => setActiveCollection(col.id)}
                          className={cn(
                            "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all border shrink-0",
                            activeCollection === col.id 
                              ? "bg-accent border-accent text-white shadow-lg" 
                              : "bg-white/5 border-white/5 text-text-soft hover:bg-white/10"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            {isLocked && <Lock size={10} />}
                            {col.name}
                          </div>
                        </button>
                     );
                   })}
                </div>

                {/* Selected Collection Info */}
                {(() => {
                  const col = AVATAR_COLLECTIONS.find(c => c.id === activeCollection)!;
                  const isLocked = checkIsLocked(col.requirement);
                  return (
                    <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex items-start gap-4">
                      <div className="flex-1 space-y-1">
                        <p className="text-[9px] font-black text-white uppercase italic">{col.name}</p>
                        <p className="text-[8px] text-text-soft leading-relaxed">{col.description}</p>
                      </div>
                      {isLocked && (
                        <div className="text-right space-y-1 shrink-0">
                          <p className="text-[8px] font-black text-red-400 uppercase tracking-tighter">[LOCKED]</p>
                          <p className="text-[7px] text-text-soft uppercase font-bold">REQ: {col.requirement.xp} XP / {col.requirement.rating} RTG</p>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Grid of Avatars */}
                <div className="grid grid-cols-5 gap-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                   {(() => {
                      const col = AVATAR_COLLECTIONS.find(c => c.id === activeCollection)!;
                      const isLocked = checkIsLocked(col.requirement);
                      return Array.from({ length: col.count }).map((_, i) => {
                        const url = `https://api.dicebear.com/7.x/${col.style}/svg?seed=${col.id}-${i}`;
                        return (
                          <button
                            key={i}
                            disabled={isLocked}
                            onClick={() => !isLocked && setFormData({...formData, avatar: url})}
                            className={cn(
                              "aspect-square rounded-xl border-2 transition-all p-1 relative overflow-hidden",
                              formData.avatar === url 
                                ? "border-accent bg-accent/10 shadow-[0_0_15px_rgba(99,102,241,0.2)]" 
                                : "border-transparent bg-white/5 hover:border-white/20",
                              isLocked && "opacity-20 grayscale cursor-not-allowed"
                            )}
                          >
                            <img src={url} alt={`${col.id}-${i}`} className="w-full h-full object-cover rounded-lg" />
                            {isLocked && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                <Lock size={12} className="text-white/40" />
                              </div>
                            )}
                          </button>
                        );
                      });
                   })()}
                </div>
              </div>

              <Input 
                label="Gamer Handle"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Pilot Name..."
                className="bg-background/20"
              />

              <div className="space-y-2">
                <Input 
                  label="Unique Neural ID (Username)"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '')})}
                  placeholder="unique_id..."
                  className={cn(
                    "bg-background/20",
                    (() => {
                      if (!user?.lastUsernameChange) return "";
                      const diff = Date.now() - new Date(user.lastUsernameChange).getTime();
                      return diff < 30 * 24 * 60 * 60 * 1000 ? "opacity-50 cursor-not-allowed" : "";
                    })()
                  )}
                  disabled={(() => {
                    if (!user?.lastUsernameChange) return false;
                    const diff = Date.now() - new Date(user.lastUsernameChange).getTime();
                    return diff < 30 * 24 * 60 * 60 * 1000;
                  })()}
                />
                {(() => {
                  if (!user?.lastUsernameChange) return null;
                  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
                  const diff = Date.now() - new Date(user.lastUsernameChange).getTime();
                  if (diff < thirtyDays) {
                    const daysLeft = Math.ceil((thirtyDays - diff) / (24 * 60 * 60 * 1000));
                    return (
                      <p className="text-[9px] text-amber-500 font-bold px-1 italic">
                        Neural ID locked. Available to recalibrate in {daysLeft} days.
                      </p>
                    );
                  }
                  return null;
                })()}
              </div>


            </div>
          </motion.div>
        </div>

        {/* Track 2: Institutional Context */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="w-5 h-5 rounded-full bg-[#00D4B4]/20 flex items-center justify-center text-[#00D4B4] text-[10px]">2</div>
            <h2 className="text-xs font-black uppercase tracking-widest text-text-soft">Institutional Logic</h2>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-[32px] p-8 border-white/5 space-y-8"
          >
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <School className="text-[#00D4B4]" size={18} />
              <h2 className="text-[10px] font-black uppercase tracking-widest">Environment Mapping</h2>
            </div>
            
            <div className="space-y-6">
              <Input 
                label="Primary Institution"
                value={formData.college}
                onChange={(e) => setFormData({...formData, college: e.target.value})}
                placeholder="University / School..."
                className="bg-background/20"
              />
              <Input 
                label="Focus Stream"
                value={formData.course}
                onChange={(e) => setFormData({...formData, course: e.target.value})}
                placeholder="Major / Department..."
                className="bg-background/20"
              />
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-text-soft ml-1">Bios Timeline</p>
                <input 
                  type="date"
                  value={formData.dob}
                  onChange={(e) => setFormData({...formData, dob: e.target.value})}
                  className="w-full bg-background/20 border border-white/5 rounded-xl px-4 py-3 text-xs font-black outline-none focus:border-accent/40 transition-colors uppercase italic"
                />
              </div>

              <div className="p-5 rounded-2xl bg-accent-soft/10 border border-accent/20 italic">
                 <p className="text-[11px] text-text-soft leading-relaxed">
                   Institutional data is used to calibrate the <span className="text-accent font-black">AI Forge</span>. By mapping your environment, we ensure all generated challenges align with your academic timeline.
                 </p>
              </div>
            </div>
          </motion.div>

          {/* Performance Optimization Tier */}
          <div className="space-y-6 mt-6">
            <div className="glass rounded-[32px] p-6 lg:p-8 border-white/5 space-y-6">
              <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                <Activity className="text-accent" size={18} />
                <h2 className="text-[10px] font-black uppercase tracking-widest italic">Neural Optimization Mode</h2>
              </div>
              
              <div className="space-y-4">
                <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
                  {(['low', 'medium', 'high'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setFormData({...formData, performanceMode: mode})}
                      className={cn(
                        "flex-1 py-3 text-[10px] font-black uppercase tracking-tighter rounded-xl transition-all relative overflow-hidden",
                        formData.performanceMode === mode 
                          ? mode === 'low' ? "bg-[#00D4B4] text-white shadow-lg" 
                            : mode === 'medium' ? "bg-accent text-white shadow-lg"
                            : "bg-[#CC0000] text-white shadow-lg"
                          : "text-text-soft hover:text-white"
                      )}
                    >
                      {mode === 'low' ? 'Efficiency' : mode === 'medium' ? 'Balanced' : 'High Fidelity'}
                    </button>
                  ))}
                </div>
                
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 italic text-center lg:text-left">
                  <p className="text-[10px] text-text-soft leading-relaxed">
                    {formData.performanceMode === 'low' && "🔄 [MAX PERFORMANCE] Neural blurs deactivated. Animations throttled for maximum frame rate on mobile/legacy systems."}
                    {formData.performanceMode === 'medium' && "⚖️ [BALANCED] Optimized blur intensity and subtle animation smoothing for a stable experience."}
                    {formData.performanceMode === 'high' && "✨ [HIGH FIDELITY] Maximum visual sensory input. Full neural blurs and fluid atmospheric effects active."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Track 3: Neural Forge & System */}
        <div className="space-y-6 h-full flex flex-col">
          <div className="flex items-center gap-3 px-2">
            <div className="w-5 h-5 rounded-full bg-accent-alt/20 flex items-center justify-center text-accent-alt text-[10px]">3</div>
            <h2 className="text-xs font-black uppercase tracking-widest text-text-soft">Forge calibration</h2>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-[32px] p-8 border-white/5 space-y-8 flex-1"
          >
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <Sparkles className="text-accent-alt" size={20} />
              <h2 className="text-[10px] font-black uppercase tracking-widest">Neural Direct Input</h2>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3">
                {[...fields, "Custom"].map(f => (
                  <button
                    key={f}
                    onClick={() => setFormData({...formData, preferredField: f})}
                    className={cn(
                      "p-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all text-center flex items-center justify-center min-h-[50px]",
                      formData.preferredField === f 
                        ? "bg-accent-alt/15 border-accent-alt text-white shadow-[0_0_15px_rgba(34,197,94,0.3)] scale-[1.02]" 
                        : "bg-white/5 border-white/5 text-text-soft hover:border-white/20"
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <AnimatePresence>
                {formData.preferredField === 'Custom' && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="space-y-3"
                  >
                    <Input 
                      label="Custom Expertise Node"
                      value={formData.customField}
                      onChange={(e) => setFormData({...formData, customField: e.target.value})}
                      placeholder="Define expertise..."
                      className="bg-accent-alt/5 border-accent-alt/20"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Field of Interest / Background Paragraph */}
              <div className="space-y-3 pt-4 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <BookOpen className="text-accent" size={16} />
                  <p className="text-[10px] font-black uppercase tracking-widest text-text-soft">Field of Interest / Research Background</p>
                </div>
                <textarea 
                  value={formData.interest}
                  onChange={(e) => setFormData({...formData, interest: e.target.value})}
                  placeholder="Describe your field, projects, or interests in detail. The AI will use this to fine-tune your quizzes..."
                  className="w-full h-32 bg-background/20 border border-white/5 rounded-2xl p-4 text-xs font-bold outline-none focus:border-accent/40 transition-colors uppercase italic resize-none"
                />
                <p className="text-[8px] text-text-soft uppercase font-black tracking-widest leading-relaxed">
                  TIP: Explaining your specific focus (e.g., 'Quantum Computing optimization') will result in highly relevant 1v1 and practice battles.
                </p>
              </div>
            </div>
          </motion.div>

          <div className="space-y-6 mt-6">
            {/* Audio Settings */}
            <div className="glass rounded-[28px] p-5 border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-lg",
                  formData.soundEnabled ? "bg-accent/20 text-accent" : "bg-white/5 text-text-soft"
                )}>
                  {formData.soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                </div>
                <div>
                  <p className="font-black text-[11px] italic uppercase">Systems Audio</p>
                  <p className="text-[8px] text-text-soft font-black uppercase tracking-[0.2em] mt-0.5">Neural Sfx</p>
                </div>
              </div>
              <button 
                onClick={() => setFormData({...formData, soundEnabled: !formData.soundEnabled})}
                className={cn(
                  "w-10 h-5 rounded-full p-1 transition-all duration-300 relative",
                  formData.soundEnabled ? "bg-accent" : "bg-white/10"
                )}
              >
                <div className={cn(
                  "w-3 h-3 rounded-full bg-white shadow-xl transition-all duration-300",
                  formData.soundEnabled ? "translate-x-5" : "translate-x-0"
                )} />
              </button>
            </div>
          </div>

            {/* Action Matrix */}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
