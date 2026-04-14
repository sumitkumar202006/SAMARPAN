'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, 
  Shield, 
  Zap, 
  Palette, 
  Lock, 
  Globe, 
  Bell, 
  Save,
  Wrench,
  Server
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function AdminSettingsPage() {
  const [siteName, setSiteName] = useState('Samarpan Quiz Platform');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-4xl font-black tracking-tight mb-2">Platform Forge</h1>
        <p className="text-text-soft font-medium">Fine-tune the arena parameters and global security protocols.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* General Config */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass p-8 rounded-[40px] border-white/5 space-y-8"
          >
            <div className="flex items-center gap-3 border-b border-white/5 pb-6">
               <Wrench className="text-accent" size={24} />
               <h3 className="text-xl font-black tracking-tight uppercase tracking-widest">Core Configuration</h3>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
               <Input 
                 label="Platform Name"
                 value={siteName}
                 onChange={(e) => setSiteName(e.target.value)}
                 className="bg-background/20"
               />
               <Input 
                 label="Protocol Logo URL"
                 placeholder="https://..."
                 className="bg-background/20"
               />
               <div className="space-y-2">
                 <label className="text-xs font-black uppercase tracking-widest text-text-soft">Default Quiz Timer (Seconds)</label>
                 <select className="w-full bg-background/20 border border-white/5 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-1 focus:ring-accent">
                    <option>30 Seconds (Rapid)</option>
                    <option>60 Seconds (Standard)</option>
                    <option>10 Seconds (Hyper)</option>
                 </select>
               </div>
               <div className="space-y-2">
                 <label className="text-xs font-black uppercase tracking-widest text-text-soft">Scoring Algorithm</label>
                 <select className="w-full bg-background/20 border border-white/5 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-1 focus:ring-accent">
                    <option>Standard Exponential (Time-based)</option>
                    <option>Static (Points per Q)</option>
                    <option>Competitive (Rank-weighted)</option>
                 </select>
               </div>
            </div>
          </motion.div>

          {/* Social & Integrations */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass p-8 rounded-[40px] border-white/5 space-y-6"
          >
            <div className="flex items-center gap-3">
               <Globe className="text-accent-alt" size={20} />
               <h3 className="text-lg font-black tracking-tight">Social Relay & SSO</h3>
            </div>
            <div className="flex flex-wrap gap-4">
               {['Google Auth', 'Email/Password', 'Facebook Login', 'GitHub Forge'].map((prov) => (
                 <div key={prov} className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/5 border border-white/5 text-xs font-black uppercase tracking-widest text-text-soft">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    {prov}
                 </div>
               ))}
               <button className="px-6 py-3 rounded-2xl bg-white/5 border border-white/5 border-dashed text-accent text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                  + Add Auth Relay
               </button>
            </div>
          </motion.div>
        </div>

        {/* Status & Security Sidebar */}
        <div className="space-y-6">
           <motion.div 
             initial={{ opacity: 0, scale: 0.98 }}
             animate={{ opacity: 1, scale: 1 }}
             className="glass p-8 rounded-[40px] border-white/5 space-y-8"
           >
              <div className="flex items-center gap-3 text-red-500">
                 <Shield size={20} />
                 <h3 className="text-sm font-black uppercase tracking-widest">Safety Protocols</h3>
              </div>

              <div className="space-y-6">
                 <div className="flex items-center justify-between">
                    <div>
                       <p className="text-xs font-black tracking-tight">Maintenance Mode</p>
                       <p className="text-[10px] text-text-soft">Shutdown public access</p>
                    </div>
                    <button 
                      onClick={() => setMaintenanceMode(!maintenanceMode)}
                      className={`w-12 h-6 rounded-full transition-all relative ${maintenanceMode ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]' : 'bg-white/10'}`}
                    >
                       <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${maintenanceMode ? 'left-7' : 'left-1'}`} />
                    </button>
                 </div>
                 
                 <div className="flex items-center justify-between">
                    <div>
                       <p className="text-xs font-black tracking-tight">Force HTTPS</p>
                       <p className="text-[10px] text-text-soft">Secure relay only</p>
                    </div>
                    <div className="w-12 h-6 rounded-full bg-emerald-500 relative">
                       <div className="absolute top-1 left-7 w-4 h-4 bg-white rounded-full" />
                    </div>
                 </div>
              </div>

              <div className="pt-6 border-t border-white/5 space-y-4">
                 <div className="flex items-center gap-3 text-accent-alt">
                   <Server size={14} />
                   <span className="text-[10px] font-black uppercase tracking-widest">Infrastructure Status</span>
                 </div>
                 <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold">
                       <span>Database Load</span>
                       <span className="text-emerald-400">12%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                       <div className="h-full w-[12%] bg-emerald-400" />
                    </div>
                 </div>
              </div>
           </motion.div>

           <Button className="w-full py-6 text-sm font-black tracking-widest uppercase">
              <Save size={18} />
              Deploy Global Changes
           </Button>
        </div>

      </div>
    </div>
  );
}
