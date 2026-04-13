'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Input, Select } from '@/components/ui/Input';
import { Zap, Users, Shield, Sword, Gamepad2, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/axios';

export default function BattlesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [pin, setPin] = useState('');
  const [joinName, setJoinName] = useState(user?.name || '');
  const [password, setPassword] = useState('');
  const [hostStatus, setHostStatus] = useState<string | null>(null);
  const [joinStatus, setJoinStatus] = useState<string | null>(null);

  const handleJoin = () => {
    if (!pin || pin.length < 6) {
      setJoinStatus('Please enter a valid 6-digit PIN');
      return;
    }
    const name = joinName || user?.name || 'Guest';
    router.push(`/lobby/${pin}?role=player&name=${encodeURIComponent(name)}${password ? `&password=${password}` : ''}`);
  };

  const handleHost = async () => {
    setHostStatus('Initializing session...');
    try {
      // For now, redirecting to host page where quiz selection happens
      router.push('/host');
    } catch (err) {
      setHostStatus('Failed to start host session.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10">
      <div className="flex flex-col gap-1 mb-8">
        <h2 className="text-3xl font-bold tracking-tight">Team Battles</h2>
        <p className="text-text-soft">Host or join squad battles (2v2 & 4v4) using a quiz PIN.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Host a Battle */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-8 rounded-[32px] space-y-6 flex flex-col"
        >
          <div className="flex items-center gap-3 mb-2">
            <Sword className="text-accent" size={24} />
            <h3 className="text-xl font-bold">Start a Battle</h3>
          </div>

          <div className="space-y-4 flex-1">
            <div className="bg-accent/5 border border-accent/20 rounded-2xl p-4 mb-4">
              <p className="text-[11px] text-accent font-medium leading-relaxed">
                Hosting a battle? Choose a quiz from your library to generate a PIN. Players can join once you're in the lobby!
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-4">
            <button 
              onClick={handleHost}
              className="w-full py-4 rounded-2xl bg-accent text-white font-bold text-lg shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:scale-[1.02] transition-all active:scale-95"
            >
              Go to Host Arena
            </button>
            <button className="w-full py-4 rounded-2xl bg-bg-soft/50 border border-border-soft text-white font-bold hover:bg-bg-soft transition-all flex items-center justify-center gap-2">
              <Gamepad2 size={18} />
              Start Local Battle
            </button>
          </div>
          
          {hostStatus && <p className="text-center text-sm text-text-soft">{hostStatus}</p>}
        </motion.div>

        {/* Join a Battle */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass p-8 rounded-[32px] space-y-6 flex flex-col bg-gradient-to-br from-bg-soft/50 to-background/50"
        >
          <div className="flex items-center gap-3 mb-2">
            <Zap className="text-accent-alt" size={24} />
            <h3 className="text-xl font-bold">Enter Arena</h3>
          </div>

          <div className="space-y-4 flex-1">
            <div className="bg-accent-alt/5 border border-accent-alt/20 rounded-2xl p-4 mb-4">
              <p className="text-[11px] text-accent-alt/80 font-medium leading-relaxed">
                Joining a battle? Enter the PIN provided by the host. Team play requires coordinated answers!
              </p>
            </div>

            <Input 
              label="Battle PIN from friend" 
              placeholder="Enter PIN here" 
              maxLength={6} 
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="text-center text-2xl font-black tracking-widest uppercase placeholder:text-lg placeholder:font-normal placeholder:tracking-normal" 
            />
            
            <Input 
              label="Your Name / Team" 
              placeholder="Eg. Aman, Team Alpha" 
              value={joinName}
              onChange={(e) => setJoinName(e.target.value)}
            />
            
            <Input 
              label="Room Password (if required)" 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave blank if no password" 
            />
          </div>

          <button 
            onClick={handleJoin}
            className="w-full py-4 rounded-2xl bg-accent-alt text-white font-bold text-lg shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:scale-[1.02] transition-all active:scale-95"
          >
            Join Battle
          </button>
          
          {joinStatus && <p className="text-center text-sm text-red-400 font-bold">{joinStatus}</p>}
        </motion.div>
      </div>

      {/* Battle Stats Info */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {[
          { icon: Users, label: 'Co-op Scoring', desc: 'Team members share progress and score.' },
          { icon: Shield, label: 'Protection', desc: 'Anti-cheat measures active for rated battles.' },
          { icon: Trophy, label: 'Team XP', desc: 'Earn bonus XP when winning as a squad.' },
          { icon: Zap, label: 'Instant Sync', desc: 'Real-time synchronization across devices.' },
        ].map((feat, i) => (
          <div key={i} className="glass p-6 rounded-2xl flex flex-col gap-3">
            <feat.icon className="text-accent" size={24} />
            <h4 className="font-bold text-sm tracking-tight">{feat.label}</h4>
            <p className="text-[11px] text-text-soft leading-relaxed">{feat.desc}</p>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
