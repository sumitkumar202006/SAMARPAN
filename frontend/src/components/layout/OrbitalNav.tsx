'use client';

import React, { useState, useEffect } from 'react';
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

// Radial calculation constants
const RADIUS = 320;
const CENTER_X = -220; // Move center off-screen to the left
const START_ANGLE = -60; // Degrees
const END_ANGLE = 60;    // Degrees

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

export const OrbitalNav = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFriendly = searchParams.get('friendly') === 'true';
  const { user, logout } = useAuth();
  const { playNavigate, playHover } = useAudio();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const TOTAL_ITEMS = navItems.length;
  const ANGLE_STEP = (END_ANGLE - START_ANGLE) / (TOTAL_ITEMS - 1);

  const getItemPosition = (index: number) => {
    const angleInDegrees = START_ANGLE + (index * ANGLE_STEP);
    const angleInRadians = (angleInDegrees * Math.PI) / 180;
    
    // x = r * cos(theta), y = r * sin(theta)
    const x = CENTER_X + Math.cos(angleInRadians) * RADIUS;
    const y = Math.sin(angleInRadians) * RADIUS;
    
    return { x, y, angle: angleInDegrees };
  };

  // Entrance stagger animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      }
    }
  } as const;

  const itemVariants = {
    hidden: { opacity: 0, scale: 0, x: -50 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      x: 0,
      transition: { type: "spring" as const, stiffness: 200, damping: 20 }
    }
  };

  return (
    <aside className="hidden lg:block fixed left-0 top-0 w-64 h-full z-[100] pointer-events-none">
      {/* The Semicircular Backing Track */}
      <motion.div 
        initial={{ opacity: 0, x: -100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="absolute top-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full border border-white/5 bg-gradient-to-r from-accent/10 via-black/40 to-transparent pointer-events-none backdrop-blur-[2px] overflow-hidden"
        style={{
          left: `${CENTER_X}px`,
          boxShadow: 'inset -20px 0 100px rgba(0,0,0,0.8), 0 0 40px rgba(99,102,241,0.1)',
          maskImage: 'linear-gradient(to right, black 40%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to right, black 40%, transparent 100%)',
        }}
      >
        {/* Scanning Beam Animation */}
        <motion.div
           className="absolute inset-0 rounded-full border-r-2 border-accent/30 blur-[2px]"
           animate={{ rotate: [0, 360] }}
           transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Secondary Energy Flow */}
        <motion.div
           className="absolute inset-[2%] rounded-full border-r-[8px] border-accent/5 blur-[4px]"
           animate={{ rotate: [360, 0] }}
           transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        />

        {/* Holographic Grid Overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
      </motion.div>

      {/* Navigation Items */}
      <motion.nav 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative h-full w-full pointer-events-none"
      >
        {navItems.map((item, index) => {
          const { x, y, angle } = getItemPosition(index);
          let isActive = pathname === item.href;
          
          if (item.href === '/host?friendly=true') {
            isActive = pathname === '/host' && isFriendly;
          } else if (item.href === '/host') {
            isActive = pathname === '/host' && !isFriendly;
          }

          const isHovered = hoveredIndex === index;

          return (
            <motion.div
              key={item.href}
              variants={itemVariants}
              className="absolute pointer-events-auto"
              style={{
                left: `${x}px`,
                top: `calc(50% + ${y}px)`,
                transform: 'translate(-50%, -50%)',
              }}
              onMouseEnter={() => {
                setHoveredIndex(index);
                playHover?.();
              }}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <Link
                href={item.href}
                onClick={() => playNavigate?.()}
                className="group relative flex items-center"
              >
                {/* Active Indicator Arc */}
                <AnimatePresence>
                  {(isActive || isHovered) && (
                    <motion.div
                      layoutId="active-orbital-indicator"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className={cn(
                        "absolute -inset-8 rounded-full border-r-[5px] border-accent blur-[3px]",
                        isActive ? "opacity-100 shadow-[0_0_30px_rgba(99,102,241,0.8)]" : "opacity-30"
                      )}
                      style={{
                        transform: `rotate(${angle}deg)`,
                      }}
                    >
                       {isActive && (
                         <motion.div 
                           className="absolute inset-0 rounded-full border-r-[2px] border-white/40 blur-[1px]"
                           animate={{ opacity: [0, 1, 0] }}
                           transition={{ duration: 2, repeat: Infinity }}
                         />
                       )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Main Icon Container */}
                <motion.div 
                  whileHover={{ scale: 1.15, rotate: isHovered ? [0, -5, 5, 0] : 0 }}
                  whileTap={{ scale: 0.9 }}
                  className={cn(
                    "relative z-10 w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 overflow-hidden",
                    isActive 
                      ? "bg-gradient-to-br from-accent/60 via-accent/30 to-accent-alt/10 text-white shadow-[0_0_40px_rgba(99,102,241,0.6)] border-2 border-white/40" 
                      : "bg-black/40 text-text-soft hover:text-white border border-white/10 hover:border-accent/40 backdrop-blur-3xl"
                  )}
                >
                  <item.icon 
                    size={28} 
                    className={cn(
                      "transition-all duration-500 z-10",
                      isActive ? "scale-110 drop-shadow-[0_0_15px_rgba(255,255,255,0.9)]" : "scale-100 group-hover:scale-110"
                    )}
                  />
                  
                  {isActive && (
                    <motion.div 
                      className="absolute inset-0 bg-accent/20"
                      animate={{ opacity: [0.2, 0.5, 0.2] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}
                </motion.div>

                {/* Floating Label (Holographic HUD) */}
                <AnimatePresence>
                  {(isHovered || isActive) && (
                    <motion.div
                      initial={{ opacity: 0, x: -30, skewX: 10 }}
                      animate={{ opacity: 1, x: 28, skewX: 0 }}
                      exit={{ opacity: 0, x: -30, skewX: 10 }}
                      className="absolute left-full ml-6 pointer-events-none"
                    >
                      <div className={cn(
                        "px-5 py-2.5 rounded-lg backdrop-blur-3xl border shadow-[0_0_30px_rgba(0,0,0,0.5)] transition-all duration-300 relative overflow-hidden",
                        isActive 
                          ? "bg-accent/20 border-accent/50 shadow-accent/20" 
                          : "bg-black/80 border-white/15 shadow-black/80"
                      )}>
                        {/* Label Scanline Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent h-1/2 w-full animate-scan pointer-events-none" />
                        
                        <span className={cn(
                          "text-sm font-black uppercase tracking-[0.3em] italic block",
                          isActive ? "text-white drop-shadow-[0_0_12px_rgba(99,102,241,1)]" : "text-text-soft"
                        )}>
                          {item.name}
                        </span>
                        
                        {item.href.includes('friendly=true') && (
                          <div className="mt-1.5 text-[9px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5 opacity-80">
                            <Disc size={10} className="animate-spin" />
                            <span>Neural Practice</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Link>
            </motion.div>
          );
        })}
      </motion.nav>

      {/* Admin & Logout */}
      <div className="absolute bottom-12 left-8 pointer-events-auto flex flex-col gap-4">
        {user?.role === 'admin' && (
          <Link href="/admin" onClick={() => playNavigate?.()}>
            <motion.div 
              onMouseEnter={() => playHover?.()}
              whileHover={{ scale: 1.2, x: 5, boxShadow: '0 0 20px rgba(99,102,241,0.4)' }}
              className="w-12 h-12 rounded-full bg-accent/15 flex items-center justify-center text-accent border border-accent/30 hover:bg-accent/30 transition-all backdrop-blur-xl"
            >
              <ShieldCheck size={20} />
            </motion.div>
          </Link>
        )}
        
        {user && (
          <motion.button
            onClick={() => {
              playNavigate?.();
              logout();
            }}
            onMouseEnter={() => playHover?.()}
            whileHover={{ scale: 1.2, x: 5, boxShadow: '0 0 20px rgba(239,68,68,0.4)' }}
            className="w-12 h-12 rounded-full bg-red-500/15 flex items-center justify-center text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-all backdrop-blur-xl"
          >
            <LogOut size={20} />
          </motion.button>
        )}
      </div>

      {/* Brand / Logo Orb */}
      <div className="absolute left-[-45px] top-1/2 -translate-y-1/2 pointer-events-auto group">
        <motion.div 
          className="w-24 h-24 rounded-full bg-gradient-to-br from-accent via-accent-alt to-indigo-900 flex items-center justify-center p-1.5 shadow-[0_0_50px_rgba(99,102,241,0.7)] cursor-pointer overflow-hidden border-2 border-white/30 relative"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.2 }}
          whileHover={{ scale: 1.1, rotate: 15 }}
          onMouseEnter={() => playHover?.()}
        >
          <div className="absolute inset-0 bg-white/10 animate-pulse" />
          <img 
            src="/favicon.ico" 
            alt="Logo" 
            className="w-14 h-14 object-contain filter drop-shadow-[0_0_15px_rgba(255,255,255,0.7)] z-10 transition-transform group-hover:scale-110" 
          />
          <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-50">
             {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-white rounded-full blur-[1px]"
                  animate={{
                    x: [Math.random() * 100, Math.random() * 100],
                    y: [Math.random() * 100, Math.random() * 100],
                    opacity: [0, 1, 0],
                  }}
                  transition={{ duration: 2 + i, repeat: Infinity }}
                />
             ))}
          </div>
        </motion.div>
      </div>
    </aside>
  );
};
