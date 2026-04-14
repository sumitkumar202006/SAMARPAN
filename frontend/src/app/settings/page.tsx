'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
  BookOpen
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useAudio } from '@/context/AudioContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import api from '@/lib/axios';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const { user, setUser } = useAuth();
  const { isMuted, toggleMute, playSuccess } = useAudio();
  
  const [formData, setFormData] = useState({
    preferredField: user?.preferredField || 'General',
    college: user?.college || '',
    course: user?.course || '',
    soundEnabled: user?.settings?.soundEnabled ?? true
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        preferredField: user.preferredField || 'General',
        college: user.college || '',
        course: user.course || '',
        soundEnabled: user.settings?.soundEnabled ?? true
      });
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    setStatus(null);
    
    try {
      const res = await api.put('/api/user/settings', {
        email: user.email,
        preferredField: formData.preferredField,
        college: formData.college,
        course: formData.course,
        settings: {
          soundEnabled: formData.soundEnabled
        }
      });
      
      if (res.status === 200) {
        // Sync local auth context
        setUser({
          ...user,
          preferredField: formData.preferredField,
          college: formData.college,
          course: formData.course,
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
    <div className="max-w-4xl mx-auto p-4 lg:p-10 space-y-10">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center text-accent">
          <SettingsIcon size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight">Command Center</h1>
          <p className="text-text-soft text-sm">Personalize your arena experience and AI brain.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Left: Navigation / Summaries */}
        <div className="lg:col-span-1 space-y-4">
          <div className="glass rounded-[32px] p-6 border-white/5 space-y-6">
            <div className="flex items-center gap-4 p-3 rounded-2xl bg-white/5 border border-white/5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-accent to-accent-alt flex items-center justify-center font-black text-white">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-sm tracking-tight">{user?.name}</p>
                <p className="text-[10px] text-text-soft uppercase font-black tracking-widest leading-none mt-1">Status: Online</p>
              </div>
            </div>
            
            <div className="space-y-3">
               <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest text-text-soft px-1">
                 <span>Security Level</span>
                 <Shield size={12} className="text-accent" />
               </div>
               <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                 <motion.div initial={{ width: 0 }} animate={{ width: '85%' }} className="h-full bg-accent" />
               </div>
            </div>
          </div>
        </div>

        {/* Right: Actual Form Components */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* AI Personalization */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-[32px] p-8 border-white/5 space-y-6"
          >
            <div className="flex items-center gap-3">
              <Sparkles className="text-accent-alt" size={20} />
              <h2 className="text-lg font-black tracking-tight underline elevation-1 underline-offset-8 decoration-accent-alt/30">AI Forge Personalization</h2>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-text-soft leading-relaxed">
                Tell the AI about your <span className="text-white font-bold italic">Field of Expertise</span>. This context will be injected into every quiz generation to ensure the questions remain relevant to your career path.
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                {fields.map(f => (
                  <button
                    key={f}
                    onClick={() => setFormData({...formData, preferredField: f})}
                    className={cn(
                      "p-4 rounded-2xl border text-[11px] font-black uppercase tracking-widest transition-all text-center",
                      formData.preferredField === f 
                        ? "bg-accent-alt/20 border-accent-alt text-white shadow-[0_0_15px_rgba(34,197,94,0.2)]" 
                        : "bg-white/5 border-white/5 text-text-soft hover:border-white/20"
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Audio Settings */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-[32px] p-8 border-white/5 space-y-6"
          >
            <div className="flex items-center gap-3">
              <Volume2 className="text-accent" size={20} />
              <h2 className="text-lg font-black tracking-tight underline elevation-1 underline-offset-8 decoration-accent/30">Audio Identity</h2>
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                  formData.soundEnabled ? "bg-accent/20 text-accent" : "bg-white/5 text-text-soft"
                )}>
                  {formData.soundEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
                </div>
                <div>
                  <p className="font-bold text-sm">System SFX</p>
                  <p className="text-[10px] text-text-soft uppercase tracking-widest">Interface & Feedback</p>
                </div>
              </div>
              
              <button 
                onClick={() => setFormData({...formData, soundEnabled: !formData.soundEnabled})}
                className={cn(
                  "w-14 h-8 rounded-full p-1 transition-all duration-300 relative",
                  formData.soundEnabled ? "bg-accent" : "bg-white/10"
                )}
              >
                <div className={cn(
                  "w-6 h-6 rounded-full bg-white shadow-xl transition-all duration-300",
                  formData.soundEnabled ? "translate-x-6" : "translate-x-0"
                )} />
              </button>
            </div>
          </motion.div>

          {/* Academic Info */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-[32px] p-8 border-white/5 space-y-6"
          >
            <div className="flex items-center gap-3">
              <School className="text-emerald-400" size={20} />
              <h2 className="text-lg font-black tracking-tight underline elevation-1 underline-offset-8 decoration-emerald-400/30">Institutional Metadata</h2>
            </div>
            
            <div className="space-y-4">
              <Input 
                label="College / Institution"
                value={formData.college}
                onChange={(e) => setFormData({...formData, college: e.target.value})}
                placeholder="Enter your college"
              />
              <Input 
                label="Course / Stream"
                value={formData.course}
                onChange={(e) => setFormData({...formData, course: e.target.value})}
                placeholder="Enter your course"
              />
            </div>
          </motion.div>

          {/* Action Area */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button 
               className="flex-1 py-4 text-sm font-black"
               isLoading={isSaving}
               onClick={handleSave}
            >
              <Save size={18} />
              Deploy Configuration
            </Button>
            
            {status && (
              <p className={cn(
                "flex items-center justify-center px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest",
                status.type === 'success' ? "bg-accent-alt/10 text-accent-alt" : "bg-red-500/10 text-red-400"
              )}>
                {status.msg}
              </p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
