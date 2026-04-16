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

// Avatar Presets Matrix (DiceBear Collections)
const AVATAR_STUFF = [
  ...Array.from({ length: 15 }, (_, i) => `https://api.dicebear.com/7.x/bottts/svg?seed=nexus-${i}`),
  ...Array.from({ length: 15 }, (_, i) => `https://api.dicebear.com/7.x/pixel-art/svg?seed=gamer-${i}`),
  ...Array.from({ length: 15 }, (_, i) => `https://api.dicebear.com/7.x/adventurer/svg?seed=hero-${i}`),
  ...Array.from({ length: 10 }, (_, i) => `https://api.dicebear.com/7.x/avataaars/svg?seed=human-${i}`),
];

export default function SettingsPage() {
  const router = useRouter();
  const { user, setUser } = useAuth();
  const { isMuted, toggleMute, playSuccess } = useAudio();
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    username: user?.username || '',
    avatar: user?.avatar || '',
    preferredField: user?.preferredField || 'General',
    customField: '',
    college: user?.college || '',
    course: user?.course || '',
    dob: user?.dob ? new Date(user.dob).toISOString().split('T')[0] : '',
    soundEnabled: user?.settings?.soundEnabled ?? true
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  // Profile Completion Calculation
  const calculateCompletion = () => {
    const fields = [
      { val: formData.name, weight: 15 },
      { val: user?.username, weight: 15 },
      { val: formData.avatar, weight: 15 },
      { val: formData.preferredField, weight: 15 },
      { val: formData.college, weight: 15 },
      { val: formData.course, weight: 15 },
      { val: formData.dob, weight: 10 }
    ];
    
    let total = 0;
    fields.forEach(f => {
      if (f.val) total += f.weight;
    });
    return total;
  };

  const completion = calculateCompletion();

  useEffect(() => {
    if (!user?.email) {
      router.push('/auth?redirect=/settings&message=Access+Denied');
      return;
    }
    
    const isCustom = !fields.includes(user.preferredField || 'General');
    
    setFormData({
      name: user.name || '',
      username: user.username || '',
      avatar: user.avatar || '',
      preferredField: isCustom ? 'Custom' : (user.preferredField || 'General'),
      customField: isCustom ? (user.preferredField || '') : '',
      college: user.college || '',
      course: user.course || '',
      dob: user.dob ? new Date(user.dob).toISOString().split('T')[0] : '',
      soundEnabled: user.settings?.soundEnabled ?? true
    });
  }, [user, router]);

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
    
    const finalField = formData.preferredField === 'Custom' ? formData.customField : formData.preferredField;
    
    try {
      const res = await api.put('/api/user/settings', {
        email: user.email,
        name: formData.name,
        avatar: formData.avatar,
        preferredField: finalField,
        college: formData.college,
        course: formData.course,
        dob: formData.dob || null,
        settings: {
          soundEnabled: formData.soundEnabled
        }
      });
      
      if (res.status === 200) {
        setUser({
          ...user,
          name: formData.name,
          avatar: formData.avatar,
          preferredField: finalField,
          college: formData.college,
          course: formData.course,
          dob: formData.dob || undefined,
          settings: {
            soundEnabled: formData.soundEnabled
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
    <div className="max-w-6xl mx-auto p-4 lg:p-10 space-y-10 font-bold">
      {/* Header & Profile Completion */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
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
        <div className="w-full lg:w-64 space-y-2">
           <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-text-soft">
              <span>Profile Synchronization</span>
              <span className={cn(completion === 100 ? "text-emerald-400" : "text-accent")}>{completion}%</span>
           </div>
           <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${completion}%` }}
                className={cn(
                  "h-full rounded-full transition-all duration-1000",
                  completion === 100 ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-accent"
                )}
              />
           </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        
        {/* Left Column: Identity & Institutional (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Profile Identity */}
          <div className="glass rounded-[24px] lg:rounded-[32px] p-5 lg:p-6 border-white/5 space-y-6">
            <div className="flex items-center gap-4 p-3 rounded-2xl bg-white/5 border border-white/5">
              <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg lg:rounded-xl bg-gradient-to-tr from-accent to-accent-alt flex items-center justify-center font-black text-white text-lg lg:text-xl">
                {formData.avatar ? (
                   <img src={formData.avatar} className="w-full h-full object-cover rounded-lg lg:rounded-xl" />
                ) : (
                   user?.name?.charAt(0).toUpperCase()
                )}
              </div>
              <div className="overflow-hidden">
                <p className="font-bold text-base lg:text-lg tracking-tight truncate uppercase">{user?.name}</p>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-[9px] text-text-soft uppercase font-black tracking-widest">@{user?.username || 'user'}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
               <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest text-text-soft px-1">
                 <span>Security Status</span>
                 <Shield size={12} className={cn(completion > 50 ? "text-emerald-400" : "text-amber-400")} />
               </div>
               <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-[10px] leading-relaxed text-text-soft italic">
                 {completion === 100 
                   ? "Identity fully synchronized. AI Forge accuracy at maximum capacity." 
                   : "Complete your profile to increase AI precision and unlock unique rewards."}
               </div>
            </div>
          </div>

          {/* Identity Matrix */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-[24px] lg:rounded-[32px] p-5 lg:p-6 border-white/5 space-y-6"
          >
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <Camera className="text-accent" size={16} lg-size={18} />
              <h2 className="text-xs lg:text-sm font-black uppercase tracking-widest">Identity Forge</h2>
            </div>

            <div className="space-y-4">
              <div className="relative group/avatar w-24 h-24 mx-auto mb-4 font-bold">
                <div className="w-full h-full rounded-2xl bg-gradient-to-tr from-accent to-accent-alt p-1">
                  <div className="w-full h-full rounded-[14px] bg-background flex items-center justify-center overflow-hidden">
                    {formData.avatar ? (
                      <img src={formData.avatar} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User size={32} className="text-text-soft" />
                    )}
                  </div>
                </div>
                <label className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-accent text-white cursor-pointer hover:scale-110 active:scale-95 transition-all shadow-xl">
                  <Upload size={14} />
                  <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*" />
                </label>
              </div>

              <Input 
                label="Gamer Handle"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Enter your handle..."
                className="bg-background/20"
              />

              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-text-soft flex items-center gap-2">
                  <Activity size={10} /> Identity Matrix
                </p>
                <div className="grid grid-cols-5 gap-2 max-h-[140px] overflow-y-auto pr-1 custom-scrollbar">
                   {AVATAR_STUFF.map((url, i) => (
                     <button
                        key={i}
                        onClick={() => setFormData({...formData, avatar: url})}
                        className={cn(
                          "aspect-square rounded-lg border-2 transition-all p-0.5 bg-white/5",
                          formData.avatar === url ? "border-accent" : "border-transparent opacity-60 hover:opacity-100"
                        )}
                     >
                       <img src={url} alt={`preset-${i}`} className="w-full h-full object-cover rounded-md" />
                     </button>
                   ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Institutional Context */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-[24px] lg:rounded-[32px] p-5 lg:p-6 border-white/5 space-y-6"
          >
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <School className="text-emerald-400" size={16} lg-size={18} />
              <h2 className="text-xs lg:text-sm font-black uppercase tracking-widest">Institutional Context</h2>
            </div>
            
            <div className="space-y-4">
              <Input 
                label="College / Institution"
                value={formData.college}
                onChange={(e) => setFormData({...formData, college: e.target.value})}
                placeholder="Where do you study?"
                className="bg-background/20"
              />
              <Input 
                label="Course / Stream"
                value={formData.course}
                onChange={(e) => setFormData({...formData, course: e.target.value})}
                placeholder="What is your focus?"
                className="bg-background/20"
              />
              <div className="space-y-1.5 px-0.5">
                <p className="text-[10px] font-black uppercase tracking-widest text-text-soft ml-1">Birth Timeline</p>
                <input 
                  type="date"
                  value={formData.dob}
                  onChange={(e) => setFormData({...formData, dob: e.target.value})}
                  className="w-full bg-background/20 border border-white/5 rounded-xl px-4 py-2.5 text-xs lg:text-sm font-bold outline-none focus:border-accent/40 transition-colors uppercase italic"
                />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Experience & Audio (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* AI Personalization */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-[32px] p-8 border-white/5 space-y-8"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="text-accent-alt" size={24} />
                <h2 className="text-xl font-black tracking-tight uppercase tracking-widest italic drop-shadow-[0_0_10px_rgba(34,197,94,0.2)]">AI Forge Personalization</h2>
              </div>
              <div className="px-3 py-1 rounded-full bg-accent-alt/10 border border-accent-alt/20 text-accent-alt text-[9px] font-black uppercase tracking-[0.2em] animate-pulse">
                Neural Context Active
              </div>
            </div>
            
            <div className="space-y-8">
              <p className="text-sm text-text-soft leading-relaxed max-w-3xl">
                Synchronize your <span className="text-white font-bold italic">Deep Knowledge Matrix</span> with the AI Forge. This data is injected into every quiz generation, ensuring the language and difficulty align with your academic path at <span className="text-accent underline underline-offset-4">{formData.college || 'your institution'}</span>.
              </p>
              
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[...fields, "Custom"].map(f => (
                    <button
                      key={f}
                      onClick={() => setFormData({...formData, preferredField: f})}
                      className={cn(
                        "p-4 rounded-2xl border text-[11px] font-black uppercase tracking-widest transition-all text-center h-full flex items-center justify-center min-h-[64px]",
                        formData.preferredField === f 
                          ? "bg-accent-alt/15 border-accent-alt text-white shadow-[0_0_20px_rgba(34,197,94,0.3)] ring-1 ring-white/5 scale-105" 
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
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3 overflow-hidden mt-4"
                    >
                      <Input 
                        label="Define Custom Expertise Matrix"
                        value={formData.customField}
                        onChange={(e) => setFormData({...formData, customField: e.target.value})}
                        placeholder="e.g. Fullstack Web Dev, Quantum Biology, Ancient History..."
                        className="bg-accent-alt/5 border-accent-alt/20"
                      />
                      <p className="text-[10px] text-accent-alt italic ml-2">* The AI will now prioritize this specific field in all future generations.</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Audio Settings */}
            <motion.div 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="glass rounded-[32px] p-6 border-white/5 space-y-6"
            >
              <div className="flex items-center gap-3">
                <Volume2 className="text-accent" size={20} />
                <h2 className="text-sm font-black uppercase tracking-widest">Audio Experience</h2>
              </div>
              
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                    formData.soundEnabled ? "bg-accent/20 text-accent" : "bg-white/5 text-text-soft"
                  )}>
                    {formData.soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                  </div>
                  <div>
                    <p className="font-bold text-xs italic">System Audio</p>
                    <p className="text-[9px] text-text-soft uppercase tracking-widest leading-none mt-1">Feedback SFX</p>
                  </div>
                </div>
                
                <button 
                  onClick={() => setFormData({...formData, soundEnabled: !formData.soundEnabled})}
                  className={cn(
                    "w-12 h-7 rounded-full p-1 transition-all duration-300 relative",
                    formData.soundEnabled ? "bg-accent" : "bg-white/10"
                  )}
                >
                  <div className={cn(
                    "w-5 h-5 rounded-full bg-white shadow-xl transition-all duration-300",
                    formData.soundEnabled ? "translate-x-5" : "translate-x-0"
                  )} />
                </button>
              </div>
            </motion.div>

            {/* Action Matrix */}
            <motion.div 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="glass rounded-[32px] p-6 border-white/5 flex flex-col justify-center items-center gap-4 text-center relative overflow-hidden"
            >
              <div className="p-3 rounded-full bg-accent/10 text-accent relative">
                <Save size={20} />
              </div>
              <p className="text-[10px] text-text-soft uppercase font-black tracking-widest relative">Ready to Commit Changes?</p>
              <Button 
                 className={cn(
                   "w-full py-4 text-xs font-black relative overflow-hidden transition-all duration-500",
                   completion === 100 ? "bg-emerald-600 hover:bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]" : "bg-accent"
                 )}
                 isLoading={isSaving}
                 onClick={handleSave}
              >
                <div 
                  className="absolute inset-x-0 bottom-0 h-1 bg-white/20 transition-all duration-500" 
                  style={{ width: `${completion}%` }}
                />
                <Upload size={16} className="mr-2" />
                Commit Synchronization
              </Button>
              
              {status && (
                <p className={cn(
                  "text-[10px] font-black uppercase tracking-widest mt-1 animate-pulse",
                  status.type === 'success' ? "text-accent-alt" : "text-red-400"
                )}>
                  {status.msg}
                </p>
              )}
            </motion.div>
          </div>

        </div>
      </div>
    </div>
  );
}
