'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  PlusSquare, 
  Trophy, 
  Users, 
  Zap,
  User, 
  Compass, 
  MessageSquare, 
  Info,
  LogOut,
  ShieldCheck,
  Disc
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useAudio } from '@/context/AudioContext';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { name: 'Create', icon: PlusSquare, href: '/create' },
  { name: 'Host', icon: User, href: '/host' },
  { name: 'Friendly Match', icon: Users, href: '/host?friendly=true' },
  { name: 'Battles', icon: Zap, href: '/battles' },
  { name: 'Leaderboard', icon: Trophy, href: '/leaderboard' },
  { name: 'Explore', icon: Compass, href: '/explore' },
  { name: 'Contact', icon: MessageSquare, href: '/contact' },
  { name: 'About', icon: Info, href: '/about' },
];

export const Sidebar = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFriendly = searchParams.get('friendly') === 'true';
  const { user, logout } = useAuth();
  const { playNavigate, playHover } = useAudio();

  const containerVariants = {
    hidden: { x: -300, opacity: 0 },
    visible: { 
      x: 0, 
      opacity: 1, 
      transition: { 
        type: "spring", 
        stiffness: 100, 
        damping: 20,
        staggerChildren: 0.1,
        delayChildren: 0.2
      } 
    }
  } as const;

  const itemVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: { x: 0, opacity: 1 }
  } as const;

  return (
    <motion.aside 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="hidden lg:flex flex-col w-72 h-screen fixed left-0 top-0 bg-black/40 backdrop-blur-3xl border-r border-white/10 z-[50] overflow-hidden"
    >
      {/* Background HUD Effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
        <motion.div 
          className="absolute top-0 left-0 w-full h-[2px] bg-accent/30 shadow-[0_0_15px_rgba(99,102,241,0.5)]"
          animate={{ top: ['0%', '100%'] }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] opacity-[0.05]" />
      </div>

      {/* Brand / Logo Section */}
      <div className="p-6 pb-2 flex items-center gap-4 shrink-0">
        <motion.div 
          whileHover={{ rotate: 15, scale: 1.1 }}
          className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-accent-alt flex items-center justify-center p-1.5 shadow-[0_0_20px_rgba(99,102,241,0.4)] border border-white/20 relative"
        >
          <img src="/favicon.ico" alt="Logo" className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(255,255,255,0.7)]" />
        </motion.div>
        <div className="flex flex-col justify-center">
          <span className="text-lg font-black uppercase tracking-[0.05em] italic text-white leading-tight">
            Samarpan
          </span>
          <span className="text-[7.5px] font-bold text-accent tracking-[0.35em] uppercase opacity-60 mt-1">
            Nexus Protocol V4
          </span>
        </div>
      </div>

      {/* User Status Card */}
      {user && (
        <motion.div 
          variants={itemVariants}
          className="mx-6 p-5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl mb-8 relative overflow-hidden group hover:border-accent/30 transition-all duration-500 shrink-0"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-full border-2 border-accent/50 p-0.5 relative">
               <div className="absolute inset-[-4px] rounded-full border border-accent/20 animate-spin-slow opacity-50" style={{ animationDuration: '10s' }} />
               {user.avatar ? (
                 <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
               ) : (
                 <div className="w-full h-full rounded-full bg-accent/20 flex items-center justify-center text-accent font-black">
                   {user.name.charAt(0).toUpperCase()}
                 </div>
               )}
            </div>
            <div className="flex flex-col overflow-hidden">
               <span className="font-black text-xs uppercase tracking-widest text-white truncate">{user.name}</span>
               <span className="text-[9px] font-bold text-emerald-400/80 uppercase tracking-tighter flex items-center gap-1.5">
                 <Disc size={10} className="animate-pulse" />
                 Lvl {Math.floor((user.globalRating || 1200) / 100)} Online
               </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Navigation Matrix */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto scrollbar-hide">
        {navItems.map((item) => {
          let isActive = pathname === item.href;
          if (item.href === '/host?friendly=true') {
            isActive = pathname === '/host' && isFriendly;
          } else if (item.href === '/host') {
            isActive = pathname === '/host' && !isFriendly;
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => playNavigate?.()}
              onMouseEnter={() => playHover?.()}
            >
              <motion.div
                variants={itemVariants}
                animate={{ 
                  scale: isActive ? 1.02 : 1,
                  x: isActive ? 4 : 0
                }}
                whileHover={{ x: isActive ? 4 : 8 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "group relative flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300",
                  isActive 
                    ? "bg-accent/15 border border-accent/30 text-white shadow-[0_0_25px_rgba(99,102,241,0.2)] ring-1 ring-white/5" 
                    : "text-text-soft hover:bg-white/5 hover:text-white border border-transparent"
                )}
              >
                {/* Active Indicator Neon Bar */}
                {isActive && (
                  <motion.div 
                    layoutId="sidebar-active-glow"
                    className="absolute left-[-2px] top-[20%] bottom-[20%] w-[4px] bg-accent rounded-full shadow-[0_0_20px_rgba(99,102,241,1)]"
                  />
                )}

                <div className={cn(
                  "p-2 rounded-lg transition-all duration-300",
                  isActive 
                    ? "bg-accent text-white shadow-[0_0_15px_rgba(99,102,241,0.4)] scale-110" 
                    : "bg-white/5 text-text-soft group-hover:text-accent group-hover:bg-accent/10"
                )}>
                  <item.icon size={18} />
                </div>

                <span className={cn(
                  "font-black text-[11.5px] uppercase tracking-[0.2em] transition-all duration-300 flex-1",
                  isActive ? "text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]" : "text-text-soft group-hover:text-white"
                )}>
                  {item.name}
                </span>

                {/* Holographic Detail Tags */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="ml-auto"
                    >
                      <div className={cn(
                        "text-[8px] font-black px-2 py-0.5 rounded-md border uppercase tracking-wider shadow-sm",
                        item.href.includes('friendly') ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-accent/10 border-accent/30 text-accent"
                      )}>
                        {item.href.includes('friendly') ? "Casual" : "Ranked"}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* System Controls */}
      <div className="p-6 space-y-3 shrink-0">
        {user?.role === 'admin' && (
          <Link href="/admin" onClick={() => playNavigate?.()}>
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all font-black text-[11.5px] uppercase tracking-widest shadow-sm">
              <ShieldCheck size={16} />
              <span>Security Nexus</span>
            </div>
          </Link>
        )}
        
        {user && (
          <button
            onClick={() => {
              playNavigate?.();
              logout();
            }}
            className="group flex items-center gap-4 px-4 py-3 rounded-xl bg-red-500/5 text-red-400/60 border border-red-500/10 hover:bg-red-500/15 hover:text-red-400 hover:border-red-500/30 transition-all font-black text-[11.5px] uppercase tracking-[0.2em] shadow-sm"
          >
            <div className="p-2 rounded-lg bg-red-500/5 group-hover:bg-red-500/10 transition-colors">
              <LogOut size={18} />
            </div>
            <span>Terminate Session</span>
          </button>
        )}
      </div>

      {/* Footer Meta */}
      <div className="px-8 pb-6 text-[8px] font-bold text-text-soft/40 uppercase tracking-[0.3em]">
        Signal Strength: Optimized
      </div>
    </motion.aside>
  );
};
