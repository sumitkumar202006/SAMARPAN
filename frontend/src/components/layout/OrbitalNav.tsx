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
  
  const [isOpen, setIsOpen] = useState(false);
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

  // Visibility transition variants
  const sidebarVariants = {
    closed: { 
      x: -120, 
      opacity: 0,
      scale: 0.95,
      transition: { type: "spring", stiffness: 300, damping: 30 }
    },
    open: { 
      x: 0, 
      opacity: 1,
      scale: 1,
      transition: { type: "spring", stiffness: 200, damping: 20, staggerChildren: 0.05 }
    }
  } as const;

  const itemVariants = {
    closed: { opacity: 0, scale: 0, x: -30 },
    open: { 
      opacity: 1, 
      scale: 1, 
      x: 0,
      transition: { type: "spring", stiffness: 200, damping: 20 }
    }
  } as const;

  return (
    <>
      {/* Trigger Zone: Invisible area on the left edge to open the nav */}
      <div 
        onMouseEnter={() => setIsOpen(true)}
        className="hidden lg:block fixed left-0 top-0 w-12 h-full z-[101] pointer-events-auto"
      />

      <motion.aside 
        initial="closed"
        animate={isOpen ? "open" : "closed"}
        variants={sidebarVariants}
        onMouseLeave={() => {
          setHoveredIndex(null);
          setIsOpen(false);
        }}
        className="hidden lg:block fixed left-0 top-0 w-80 h-full z-[100] pointer-events-none select-none"
      >
        {/* The Semicircular Backing Track */}
        <div 
          className="absolute top-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full border border-white/10 bg-gradient-to-r from-accent/20 via-black/60 to-transparent pointer-events-none backdrop-blur-md overflow-hidden"
          style={{
            left: `${CENTER_X}px`,
            boxShadow: 'inset -30px 0 120px rgba(0,0,0,0.9), 0 0 60px rgba(99,102,241,0.15)',
            maskImage: 'linear-gradient(to right, black 30%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to right, black 30%, transparent 100%)',
          }}
        >
          {/* Scanning Beam Animation */}
          <motion.div
             className="absolute inset-0 rounded-full border-r-[3px] border-accent/40 blur-[4px]"
             animate={{ rotate: [0, 360] }}
             transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          />
          
          {/* Secondary Energy Flow */}
          <motion.div
             className="absolute inset-[4%] rounded-full border-r-[12px] border-accent/10 blur-[8px]"
             animate={{ rotate: [360, 0] }}
             transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />

          {/* Holographic Signal Pulse */}
          <motion.div
            className="absolute top-1/2 left-0 w-full h-[1px] bg-accent/30 blur-sm"
            animate={{ translateY: [-400, 400], opacity: [0, 1, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Holographic Grid Overlay */}
          <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
        </div>

        {/* Navigation Items */}
        <nav className="relative h-full w-full pointer-events-none pt-[10vh]">
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
                  onClick={() => {
                    playNavigate?.();
                    setIsOpen(false);
                  }}
                  className="group relative flex items-center"
                >
                  {/* Active Indicator Arc (Premium Glow) */}
                  <AnimatePresence>
                    {(isActive || isHovered) && (
                      <motion.div
                        layoutId="active-orbital-indicator"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className={cn(
                          "absolute -inset-10 rounded-full border-r-[8px] border-accent blur-[6px] transition-all",
                          isActive ? "opacity-100 shadow-[0_0_50px_rgba(99,102,241,1)]" : "opacity-20"
                        )}
                        style={{
                          transform: `rotate(${angle}deg)`,
                        }}
                      >
                         {isActive && (
                           <motion.div 
                             className="absolute inset-0 rounded-full border-r-[4px] border-white/50 blur-[2px]"
                             animate={{ opacity: [0.3, 0.8, 0.3], scale: [1, 1.05, 1] }}
                             transition={{ duration: 1.5, repeat: Infinity }}
                           />
                         )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Main Icon Container */}
                  <motion.div 
                    whileHover={{ scale: 1.2, rotate: isHovered ? [0, -10, 10, 0] : 0 }}
                    whileTap={{ scale: 0.85 }}
                    className={cn(
                      "relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 overflow-hidden backdrop-blur-2xl",
                      isActive 
                        ? "bg-gradient-to-br from-accent via-accent/50 to-indigo-900 text-white shadow-[0_0_60px_rgba(99,102,241,0.8)] border-2 border-white/60" 
                        : "bg-black/40 text-text-soft hover:text-white border border-white/10 hover:border-accent/40 shadow-xl"
                    )}
                  >
                    <item.icon 
                      size={32} 
                      className={cn(
                        "transition-all duration-500 z-10",
                        isActive ? "scale-110 drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]" : "scale-100 group-hover:scale-110"
                      )}
                    />
                    
                    {/* Interior Pulse Animation */}
                    {isActive && (
                      <motion.div 
                        className="absolute inset-0 bg-white/10"
                        animate={{ opacity: [0, 0.4, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}

                    {/* Lens Flare Edge */}
                    <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
                  </motion.div>

                  {/* Floating Label (Holographic HUD - Premium) */}
                  <AnimatePresence>
                    {(isHovered || isActive) && (
                      <motion.div
                        initial={{ opacity: 0, x: -20, skewX: 15 }}
                        animate={{ opacity: 1, x: 25, skewX: 0 }}
                        exit={{ opacity: 0, x: -20, skewX: 15 }}
                        className="absolute left-full ml-10 pointer-events-none"
                      >
                        <div className={cn(
                          "px-8 py-4 rounded-xl backdrop-blur-3xl border transition-all duration-300 relative overflow-hidden",
                          isActive 
                            ? "bg-accent/30 border-accent/60 shadow-[0_0_40px_rgba(99,102,241,0.4)]" 
                            : "bg-black/90 border-white/20 shadow-2xl"
                        )}>
                          {/* HUD Scanline Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent h-2 w-full animate-scan opacity-20" />
                          
                          <span className={cn(
                            "text-lg font-black uppercase tracking-[0.4em] italic block",
                            isActive ? "text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.9)]" : "text-text-soft"
                          )}>
                            {item.name}
                          </span>
                          
                          {item.href.includes('friendly=true') && (
                            <div className="mt-2 text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2 opacity-90">
                              <Disc size={12} className="animate-spin" />
                              <span>Neural Practice Active</span>
                            </div>
                          )}
                          {isActive && (
                            <motion.div 
                              className="mt-2 text-[9px] font-bold text-white/40 uppercase tracking-[.25em]"
                              animate={{ opacity: [0.4, 1, 0.4] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            >
                              Current Sector Initialized
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Link>
              </motion.div>
            );
          })}
        </nav>

        {/* Global Controls (Bottom-Left) */}
        <div className="absolute bottom-16 left-12 pointer-events-auto flex flex-col gap-6">
          {user?.role === 'admin' && (
            <Link 
              href="/admin" 
              onClick={() => {
                playNavigate?.();
                setIsOpen(false);
              }}
            >
              <motion.div 
                whileHover={{ scale: 1.3, rotate: 90, boxShadow: '0 0 30px rgba(99,102,241,0.6)' }}
                className="w-16 h-16 rounded-2xl bg-accent/20 flex items-center justify-center text-accent border border-accent/40 hover:bg-accent/40 transition-all backdrop-blur-3xl"
              >
                <ShieldCheck size={28} />
              </motion.div>
            </Link>
          )}
          
          {user && (
            <motion.button
              onClick={() => {
                playNavigate?.();
                setIsOpen(false);
                logout();
              }}
              whileHover={{ scale: 1.3, x: 10, boxShadow: '0 0 30px rgba(239,68,68,0.6)' }}
              className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center text-red-400 border border-red-500/40 hover:bg-red-500/40 transition-all backdrop-blur-3xl"
            >
              <LogOut size={28} />
            </motion.button>
          )}
        </div>

        {/* Brand Core (Central Hub) */}
        <div className="absolute left-[-60px] top-1/2 -translate-y-1/2 pointer-events-auto group">
          <motion.div 
            className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-600 via-accent to-accent-alt flex items-center justify-center p-2 shadow-[0_0_80px_rgba(99,102,241,0.8)] cursor-pointer overflow-hidden border-4 border-white/40 relative"
            whileHover={{ scale: 1.15, rotate: 45, boxShadow: '0 0 100px rgba(99,102,241,1)' }}
          >
            {/* Core Energy Pulse */}
            <motion.div 
              className="absolute inset-0 bg-white/20"
              animate={{ opacity: [0.1, 0.4, 0.1], scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            
            <img 
              src="/favicon.ico" 
              alt="Samarpan" 
              className="w-18 h-18 object-contain filter drop-shadow-[0_0_20px_rgba(255,255,255,0.9)] z-10" 
            />
            
            {/* Ambient Particles */}
            <div className="absolute inset-0 pointer-events-none opacity-60">
               {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1.5 h-1.5 bg-white rounded-full blur-[1px]"
                    animate={{
                      x: [Math.random() * 128, Math.random() * 128],
                      y: [Math.random() * 128, Math.random() * 128],
                      opacity: [0, 1, 0],
                    }}
                    transition={{ duration: 3 + i, repeat: Infinity }}
                  />
               ))}
            </div>
          </motion.div>
        </div>
      </motion.aside>
    </>
  );
};
  );
};
