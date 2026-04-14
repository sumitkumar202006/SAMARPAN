'use client';

import React, { useState } from 'react';
import { Search, Bell, Menu, User as UserIcon, LogOut, Settings, BarChart, Volume2, VolumeX } from 'lucide-react';
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

  return (
    <header className="sticky top-0 z-[100] w-full bg-background/80 backdrop-blur-3xl border-b border-white/5">
      <div className="px-6 lg:px-12 h-16 flex items-center justify-between gap-4">
        
        {/* Left: Search (Desktop) / Menu (Mobile) */}
        <div className="flex items-center gap-4 flex-1">
          <div className="lg:hidden w-10 h-10 rounded-full bg-gradient-to-tr from-accent to-accent-alt flex items-center justify-center overflow-hidden">
            <img src="/favicon.ico" alt="Samarpan Logo" className="w-full h-full object-cover" />
          </div>
          <div className="hidden md:flex items-center max-w-sm w-full relative">
            <Search className="absolute left-3 text-text-soft" size={18} />
            <input 
              type="text" 
              placeholder="Search quizzes, topics..." 
              className="w-full bg-bg-soft/50 border border-border-soft rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
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

        {/* Right: Actions & User */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button 
            onClick={() => {
              playAccelerate();
              router.push('/host');
            }}
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-accent/10 border border-accent/20 text-accent text-[11px] font-black uppercase tracking-[0.1em] hover:bg-accent hover:text-white transition-all duration-300 shadow-[0_0_15px_rgba(99,102,241,0.1)] hover:shadow-[0_0_25px_rgba(99,102,241,0.3)]"
          >
            Host Quiz
          </button>
          
          <button 
            onClick={toggleMute}
            className="p-2 rounded-full text-text-soft hover:bg-background hover:text-white transition-all flex items-center justify-center"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>

          <button className="hidden xs:flex p-2 rounded-full text-text-soft hover:bg-background hover:text-white transition-all">
            <Bell size={20} />
          </button>

          <div className="relative">
            {user ? (
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 p-1 pl-2 rounded-full border border-border-soft bg-background/50 hover:border-accent/50 transition-all shadow-[0_0_15px_rgba(99,102,241,0.1)]"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-accent to-accent-alt flex items-center justify-center font-semibold text-sm overflow-hidden">
                  {user?.avatar ? <img src={user.avatar} alt="user" className="w-full h-full object-cover" /> : user?.name?.charAt(0).toUpperCase() || <UserIcon size={16} />}
                </div>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <Link 
                  href="/auth"
                  onClick={() => playAccelerate()}
                  className="relative group overflow-hidden flex flex-col items-center justify-center px-6 py-2 rounded-2xl bg-gradient-to-r from-[#00c6ff] via-[#0072ff] to-[#00c6ff] bg-[length:200%_auto] animate-flow text-white shadow-[0_0_20px_rgba(0,198,255,0.4)] hover:shadow-[0_0_40px_rgba(0,198,255,0.6)] transition-all duration-500 hover:-translate-y-1 active:scale-95 border border-white/20"
                >
                  <span className="relative z-10 text-[10px] font-black uppercase tracking-[0.15em] drop-shadow-lg">Again? Respect!</span>
                  <span className="relative z-10 text-[9px] font-bold uppercase opacity-90 italic tracking-widest mt-0.5">Login</span>
                  {/* High-gloss shimmer */}
                  <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:animate-shimmer" />
                </Link>
                
                <Link 
                  href="/auth?mode=signup"
                  onClick={() => playAccelerate()}
                  className="relative group overflow-hidden flex flex-col items-center justify-center px-6 py-2 rounded-2xl bg-gradient-to-r from-[#00b09b] via-[#96c93d] to-[#00b09b] bg-[length:200%_auto] animate-flow text-white shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:shadow-[0_0_40px_rgba(34,197,94,0.6)] transition-all duration-500 hover:-translate-y-1 active:scale-95 border border-white/20"
                >
                  <span className="relative z-10 text-[10px] font-black uppercase tracking-[0.15em] drop-shadow-lg">First Time? Good Luck!</span>
                  <span className="relative z-10 text-[9px] font-bold uppercase opacity-90 italic tracking-widest mt-0.5">Sign up</span>
                  {/* High-gloss shimmer */}
                  <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:animate-shimmer" />
                </Link>
              </div>
            )}

            <AnimatePresence>
              {isDropdownOpen && (
                <>
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsDropdownOpen(false)}
                    className="fixed inset-0 z-[-1]"
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-56 glass rounded-2xl p-2 shadow-2xl overflow-hidden"
                  >
                    <div className="px-3 py-3 border-b border-white/5 mb-1">
                      <p className="font-bold text-sm">{user?.name || 'Guest User'}</p>
                      <p className="text-xs text-text-soft">{user?.email || 'Sign in to sync stats'}</p>
                    </div>

                    <Link 
                      href="/profile/stats"
                      onClick={() => setIsDropdownOpen(false)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm hover:bg-white/5 transition-all text-left"
                    >
                      <BarChart size={16} />
                      <span>My Stats</span>
                    </Link>
                    <Link 
                      href="/settings"
                      onClick={() => setIsDropdownOpen(false)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm hover:bg-white/5 transition-all text-left"
                    >
                      <Settings size={16} />
                      <span>Settings</span>
                    </Link>
                    
                    <div className="border-t border-white/5 my-1" />
                    
                    <button 
                      onClick={logout}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm hover:bg-red-500/10 text-red-400 transition-all text-left"
                    >
                      <LogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
};
