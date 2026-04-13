'use client';

import React, { useState } from 'react';
import { Search, Bell, Menu, User as UserIcon, LogOut, Settings, BarChart } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export const Topbar = () => {
  const { user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-[100] w-full bg-background/80 backdrop-blur-xl border-b border-border-soft">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 h-16 flex items-center justify-between gap-4">
        
        {/* Left: Search (Desktop) / Menu (Mobile) */}
        <div className="flex items-center gap-4 flex-1">
          <div className="lg:hidden w-10 h-10 rounded-full bg-gradient-to-tr from-accent to-accent-alt flex items-center justify-center font-bold text-lg text-white">
            S
          </div>
          <div className="hidden md:flex items-center max-w-sm w-full relative">
            <Search className="absolute left-3 text-text-soft" size={18} />
            <input 
              type="text" 
              placeholder="Search quizzes, players..." 
              className="w-full bg-bg-soft/50 border border-border-soft rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
            />
          </div>
        </div>

        {/* Right: Actions & User */}
        <div className="flex items-center gap-3">
          <button className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-white text-xs font-bold uppercase tracking-wider hover:shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-all">
            Host Quiz
          </button>
          
          <button className="p-2 rounded-full text-text-soft hover:bg-background hover:text-white transition-all">
            <Bell size={20} />
          </button>

          <div className="relative">
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 p-1 pl-2 rounded-full border border-border-soft bg-background/50 hover:border-accent/50 transition-all shadow-[0_0_15px_rgba(99,102,241,0.1)]"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-accent to-accent-alt flex items-center justify-center font-semibold text-sm overflow-hidden">
                {user?.avatar ? <img src={user.avatar} alt="user" className="w-full h-full object-cover" /> : user?.name?.charAt(0).toUpperCase() || <UserIcon size={16} />}
              </div>
            </button>

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

                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm hover:bg-white/5 transition-all text-left">
                      <BarChart size={16} />
                      <span>My Stats</span>
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm hover:bg-white/5 transition-all text-left">
                      <Settings size={16} />
                      <span>Settings</span>
                    </button>
                    
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
