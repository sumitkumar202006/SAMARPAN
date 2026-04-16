'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Input, Select } from '@/components/ui/Input';
import { Zap, Users, Shield, Sword, Gamepad2, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/axios';

  const { user, profileCompletion } = useAuth();
  const [pin, setPin] = useState('');
  const [joinName, setJoinName] = useState(user?.name || '');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  const handleJoin = () => {
    if (!pin || pin.length < 6) {
      setStatus({ type: 'error', msg: 'Neural Sync requires a valid 6-digit PIN' });
      return;
    }
    const name = joinName || user?.name || 'GUEST_PILOT';
    router.push(`/lobby/${pin}?role=player&name=${encodeURIComponent(name)}${password ? `&password=${password}` : ''}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10 space-y-10">
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl lg:text-4xl font-black tracking-tight uppercase italic">Combat Theaters</h2>
        <p className="text-text-soft text-xs lg:text-sm">Initialize squad-based deployment or solo training sessions.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        
        {/* Track 1: Tactical Briefing */}
        <div className="space-y-6">
           <div className="flex items-center gap-3 px-2">
            <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center text-accent text-[10px]">1</div>
            <h2 className="text-xs font-black uppercase tracking-widest text-text-soft italic">Tactical Briefing</h2>
          </div>

          <CollapsibleCard 
            title="Pilot Standing" 
            icon={Shield} 
            className="border-white/5 shadow-2xl"
          >
             <div className="space-y-6">
                <div className="flex justify-between items-end">
                   <div>
                      <p className="text-[9px] text-text-soft uppercase font-black">Global Rating</p>
                      <p className="text-3xl font-black text-accent-alt">{user?.globalRating || 1200}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-[9px] text-text-soft uppercase font-black">Rank</p>
                      <p className="text-xl font-black italic uppercase">Silver II</p>
                   </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3">
                   <div className="flex justify-between text-[8px] font-black uppercase text-text-soft">
                      <span>Sync Strength</span>
                      <span>{profileCompletion}%</span>
                   </div>
                   <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-accent rounded-full" style={{ width: `${profileCompletion}%` }} />
                   </div>
                </div>
             </div>
          </CollapsibleCard>

          <div className="grid grid-cols-2 gap-4">
             {[
               { icon: Users, label: 'Squad ready', val: 'Active' },
               { icon: Sword, label: 'Win Rate', val: '64%' }
             ].map((s, i) => (
                <div key={i} className="glass p-5 rounded-3xl border-white/5 text-center space-y-1">
                   <s.icon className="mx-auto text-text-soft opacity-40 mb-2" size={16} />
                   <p className="text-[8px] text-text-soft uppercase font-black">{s.label}</p>
                   <p className="text-sm font-black italic">{s.val}</p>
                </div>
             ))}
          </div>
        </div>

        {/* Track 2: Deployment Portal */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 text-[10px]">2</div>
            <h2 className="text-xs font-black uppercase tracking-widest text-text-soft italic">Neural Deployment</h2>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass p-8 rounded-[40px] border-white/10 space-y-8 shadow-2xl relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-all pointer-events-none" />
            
            <div className="flex flex-col items-center gap-2 text-center pb-2 border-b border-white/5">
               <Zap className="text-yellow-400" size={32} />
               <h3 className="text-xl font-black uppercase italic tracking-widest">Join Theater</h3>
               <p className="text-[10px] text-text-soft font-black uppercase tracking-widest">Enter the 6-digit access PIN</p>
            </div>

            <div className="space-y-6 relative z-10">
              <div className="space-y-2">
                 <input 
                   type="text"
                   placeholder="000 000"
                   maxLength={6}
                   value={pin}
                   onChange={(e) => setPin(e.target.value)}
                   className="w-full bg-background/40 border-2 border-white/5 rounded-2xl py-6 text-center text-4xl font-black tracking-[0.3em] outline-none focus:border-accent/40 focus:bg-background transition-all placeholder:opacity-20 uppercase italic"
                 />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                 <Input 
                   label="Pilot Handle" 
                   placeholder="Gamer ID" 
                   value={joinName}
                   onChange={(e) => setJoinName(e.target.value)}
                   className="bg-background/20"
                 />
                 <Input 
                   label="Theater Key" 
                   type="password"
                   placeholder="PIN (Optional)" 
                   value={password}
                   onChange={(e) => setPassword(e.target.value)}
                   className="bg-background/20"
                 />
              </div>

              <button 
                onClick={handleJoin}
                className="w-full py-5 rounded-[24px] bg-white text-black font-black text-xs uppercase tracking-[0.3em] hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-white/5"
              >
                Infiltrate Arena
              </button>

              {status && (
                <p className="text-[9px] font-black uppercase text-red-400 text-center animate-pulse italic">
                  {status.msg}
                </p>
              )}
            </div>
          </motion.div>

          <div className="p-6 rounded-[32px] bg-accent-soft/5 border border-accent/20 italic">
             <p className="text-[10px] text-text-soft leading-relaxed text-center">
                Squad battles support up to <span className="text-accent font-black">4v4 operations</span>. Ensure your neural sync is at least 50% for optimal performance.
             </p>
          </div>
        </div>

        {/* Track 3: Strategic Command */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="w-5 h-5 rounded-full bg-accent-alt/20 flex items-center justify-center text-accent-alt text-[10px]">3</div>
            <h2 className="text-xs font-black uppercase tracking-widest text-text-soft italic">Battle Operations</h2>
          </div>

          <div className="space-y-4">
             <CollapsibleCard title="Ranked Arena" icon={Trophy} badge="Affects globalRating" className="border-accent-alt/30">
                <p className="text-[11px] text-text-soft mb-8 leading-relaxed italic border-l-2 border-accent-alt/20 pl-4">
                  High-stakes competitive mode. Strict anti-cheat logic and ELO scaling enabled.
                </p>
                <button 
                   onClick={() => router.push('/host')}
                   className="w-full py-4 rounded-2xl bg-accent-alt text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-accent-alt/20 hover:scale-[1.02] transition-all"
                >
                   Initialize Ranked
                </button>
             </CollapsibleCard>

             <CollapsibleCard title="Friendly Skirmish" icon={Gamepad2} badge="Rating Protected" className="border-accent/30">
                <p className="text-[11px] text-text-soft mb-8 leading-relaxed italic border-l-2 border-accent/20 pl-4">
                  Low-stakes training. Perfect for testing new neural assets or teaching squads.
                </p>
                <button 
                   onClick={() => router.push('/host?friendly=true')}
                   className="w-full py-4 rounded-2xl bg-accent text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-accent/20 hover:scale-[1.02] transition-all"
                >
                   Initialize Casual
                </button>
             </CollapsibleCard>
          </div>
        </div>
      </div>
    </div>
  );
}
