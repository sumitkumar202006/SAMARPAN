'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, Menu, User as UserIcon, LogOut, Settings, BarChart, Volume2, VolumeX, Shield } from 'lucide-react';
import { useAudio } from '@/context/AudioContext';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export const Topbar = () => {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { isMuted, toggleMute, playAccelerate, playHorn } = useAudio();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  return (
    <header className="sticky top-0 z-[100] w-full bg-background/80 backdrop-blur-3xl border-b border-white/5">
      <div className="px-4 lg:px-12 h-16 flex items-center justify-between gap-4">
        
        {/* Left: Branding & Search */}
        <div className="flex items-center gap-2 lg:gap-8 flex-1">
          <Link href="/dashboard" className="flex items-center gap-2 group shrink-0">
            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg lg:rounded-xl bg-accent/20 flex items-center justify-center border border-accent/30 group-hover:bg-accent/30 transition-all">
              <img src="/favicon.ico" alt="Samarpan" className="w-5 h-5 lg:w-6 lg:h-6 object-contain" />
            </div>
            <span className="hidden sm:block text-base lg:text-xl font-black tracking-tighter uppercase italic">SAMARPAN</span>
          </Link>
          
          <div className="hidden lg:block h-6 w-px bg-white/5" />
          
          {/* Desktop Search */}
          <div className="hidden md:flex items-center max-w-xs w-full relative">
            <Search className="absolute left-3 text-text-soft" size={14} />
            <input 
              type="text" 
              placeholder="Search vault..." 
              className="w-full bg-white/5 border border-white/5 rounded-xl py-1.5 pl-9 pr-4 text-xs focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 transition-all"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const target = e.target as HTMLInputElement;
                  if (target.value.trim()) {
                    router.push(`/explore?q=${encodeURIComponent(target.value.trim())}`);
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Right: Actions & Identity */}
        <div className="flex items-center gap-2 lg:gap-4">
          <button 
            onClick={toggleMute}
            className="p-2 lg:p-2.5 rounded-lg lg:rounded-xl bg-white/5 hover:bg-white/10 text-text-soft hover:text-white transition-all outline-none"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          
          <button className="hidden sm:flex p-2 lg:p-2.5 rounded-lg lg:rounded-xl bg-white/5 hover:bg-white/10 text-text-soft hover:text-white transition-all relative outline-none">
            <Bell size={18} />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-accent rounded-full border-2 border-background" />
          </button>

          <div className="h-6 w-px bg-white/5 hidden sm:block" />

          {/* User Profile Hook */}
          <div className="relative" ref={dropdownRef}>
            {user ? (
               <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 lg:gap-3 p-1 rounded-xl lg:rounded-2xl hover:bg-white/5 transition-all outline-none"
              >
                <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg lg:rounded-xl bg-gradient-to-tr from-accent to-accent-alt p-0.5 shadow-lg">
                  <div className="w-full h-full rounded-md lg:rounded-lg bg-background flex items-center justify-center overflow-hidden">
                    {user?.avatar ? (
                      <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon size={16} className="text-text-soft" />
                    )}
                  </div>
                </div>
                <div className="hidden md:flex flex-col items-start leading-none gap-1">
                  <span className="text-xs font-black tracking-tight">{user?.name || 'Guest User'}</span>
                  <span className="text-[9px] text-accent uppercase font-black tracking-widest">Level 12 Host</span>
                </div>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <Link 
                  href="/auth"
                  className="px-4 py-2 rounded-xl bg-accent text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                >
                  Join Arena
                </Link>
              </div>
            )}

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-56 glass rounded-2xl p-2 shadow-2xl overflow-hidden z-50 border border-white/5"
                >
                  <div className="px-3 py-3 border-b border-white/5 mb-1 bg-white/5 rounded-t-xl">
                    <p className="font-bold text-sm text-white">{user?.name || 'Guest User'}</p>
                    <p className="text-[10px] text-text-soft truncate tracking-tight">{user?.email || 'Anonymous Session'}</p>
                  </div>

                  <div className="p-1 space-y-1">
                    <Link 
                      href={user?.email ? "/profile" : "/auth?redirect=/profile"}
                      onClick={() => setIsDropdownOpen(false)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm hover:bg-white/5 transition-all group/it"
                    >
                      <div className="flex items-center gap-3">
                        <BarChart size={16} className="text-white/60 group-hover/it:text-accent transition-colors" />
                        <span className="font-medium">My Performance</span>
                      </div>
                      {!user?.email && <Shield size={10} className="text-orange-400" />}
                    </Link>
                    
                    <Link 
                      href={user?.email ? "/settings" : "/auth?redirect=/settings"}
                      onClick={() => setIsDropdownOpen(false)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm hover:bg-white/5 transition-all group/it"
                    >
                      <div className="flex items-center gap-3">
                        <Settings size={16} className="text-white/60 group-hover/it:text-accent transition-colors" />
                        <span className="font-medium">Command Center</span>
                      </div>
                      {!user?.email && <Shield size={10} className="text-orange-400" />}
                    </Link>
                    
                    <div className="h-px bg-white/5 my-1 mx-2" />
                    
                    <button 
                      onClick={logout}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm hover:bg-red-500/10 text-red-400 transition-all font-medium"
                    >
                      <LogOut size={16} />
                      <span>Terminate Session</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
};
