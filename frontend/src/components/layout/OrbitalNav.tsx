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
const RADIUS = 280;
const CENTER_X = -170; // Tighter pivot for better reach
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
        className="hidden lg:block fixed left-0 top-0 w-16 h-full z-[101] pointer-events-auto"
      />

      <motion.aside 
        initial="closed"
        animate={isOpen ? "open" : "closed"}
        variants={sidebarVariants}
        onMouseLeave={() => {
          setHoveredIndex(null);
          setIsOpen(false);
        }}
        className={cn(
          "hidden lg:block fixed left-0 top-0 w-80 h-full z-[100] select-none",
          isOpen ? "pointer-events-auto" : "pointer-events-none"
        )}
      >
        {/* The Semicircular Backing Track - Performance Optimized (No heavy blur) */}
        <div 
          className="absolute top-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full border border-white/5 bg-gradient-to-r from-accent/10 via-black/80 to-transparent pointer-events-none overflow-hidden"
          style={{
            left: `${CENTER_X}px`,
            boxShadow: 'inset -20px 0 80px rgba(0,0,0,0.8)',
            maskImage: 'linear-gradient(to right, black 30%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to right, black 30%, transparent 100%)',
          }}
        >
          {/* Scanning Beam Animation - Simplified */}
          <motion.div
             className="absolute inset-[0%] rounded-full border-r-[2px] border-accent/20 blur-[1px]"
             animate={{ rotate: [0, 360] }}
             transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          />
          
          {/* Holographic Signal Pulse - Subtle */}
          <motion.div
            className="absolute top-1/2 left-0 w-full h-[1px] bg-accent/20"
            animate={{ translateY: [-400, 400], opacity: [0, 0.5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Holographic Grid Overlay */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
        </div>

        {/* Navigation Items */}
        <nav className="relative h-full w-full pointer-events-none">
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
                  {/* Active Indicator Arc (Optimized Glow) */}
                  <AnimatePresence>
                    {(isActive || isHovered) && (
                      <motion.div
                        layoutId="active-orbital-indicator"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className={cn(
                          "absolute -inset-8 rounded-full border-r-[6px] border-accent blur-[4px] transition-all",
                          isActive ? "opacity-100 shadow-[0_0_30px_rgba(99,102,241,0.6)]" : "opacity-20"
                        )}
                        style={{
                          transform: `rotate(${angle}deg)`,
                        }}
                      />
                    )}
                  </AnimatePresence>

                  {/* Main Icon Container */}
                  <motion.div 
                    whileHover={{ scale: 1.15, rotate: isHovered ? [0, -5, 5, 0] : 0 }}
                    whileTap={{ scale: 0.9 }}
                    className={cn(
                      "relative z-10 w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 overflow-hidden backdrop-blur-xl",
                      isActive 
                        ? "bg-gradient-to-br from-accent via-accent/50 to-indigo-900 text-white shadow-[0_0_30px_rgba(99,102,241,0.5)] border-2 border-white/50" 
                        : "bg-black/60 text-text-soft hover:text-white border border-white/10 hover:border-accent/40"
                    )}
                  >
                    <item.icon 
                      size={28} 
                      className={cn(
                        "transition-all duration-500 z-10",
                        isActive ? "scale-110 drop-shadow-[0_0_10px_rgba(255,255,255,0.7)]" : "scale-100 group-hover:scale-110"
                      )}
                    />
                    
                    {/* Interior Pulse Animation - Optimized */}
                    {isActive && (
                      <motion.div 
                        className="absolute inset-0 bg-white/5"
                        animate={{ opacity: [0, 0.2, 0] }}
                        transition={{ duration: 3, repeat: Infinity }}
                      />
                    )}
                  </motion.div>

                  {/* Floating Label (Holographic HUD - Premium) */}
                  <AnimatePresence>
                    {(isHovered || isActive) && (
                      <motion.div
                        initial={{ opacity: 0, x: -15, skewX: 10 }}
                        animate={{ opacity: 1, x: 20, skewX: 0 }}
                        exit={{ opacity: 0, x: -15, skewX: 10 }}
                        className="absolute left-full ml-8 pointer-events-none"
                      >
                        <div className={cn(
                          "px-6 py-3 rounded-lg backdrop-blur-2xl border transition-all duration-300 relative overflow-hidden",
                          isActive 
                            ? "bg-accent/20 border-accent/50 shadow-[0_0_20px_rgba(99,102,241,0.3)]" 
                            : "bg-black/90 border-white/15 shadow-xl"
                        )}>
                          {/* HUD Scanline Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent h-1 w-full animate-scan opacity-10" />
                          
                          <span className={cn(
                            "text-sm font-black uppercase tracking-[0.3em] italic block",
                            isActive ? "text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" : "text-text-soft"
                          )}>
                            {item.name}
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Link>
              </motion.div>
            );
          })}
        </nav>

        {/* Global Controls - Repositioned to prevent overlap */}
        <div className="absolute bottom-10 left-6 pointer-events-auto flex gap-4">
          {user?.role === 'admin' && (
            <Link 
              href="/admin" 
              onClick={() => {
                playNavigate?.();
                setIsOpen(false);
              }}
            >
              <motion.div 
                whileHover={{ scale: 1.1, boxShadow: '0 0 20px rgba(99,102,241,0.4)' }}
                className="w-12 h-12 rounded-xl bg-accent/15 flex items-center justify-center text-accent border border-accent/30 backdrop-blur-xl"
              >
                <ShieldCheck size={22} />
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
              whileHover={{ scale: 1.1, boxShadow: '0 0 20px rgba(239,68,68,0.4)' }}
              className="w-12 h-12 rounded-xl bg-red-500/15 flex items-center justify-center text-red-400 border border-red-500/30 backdrop-blur-xl"
            >
              <LogOut size={22} />
            </motion.button>
          )}
        </div>

        {/* Brand Core (Central Hub) - Performance Optimized */}
        <div className="absolute left-[-45px] top-1/2 -translate-y-1/2 pointer-events-auto group">
          <motion.div 
            className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-800 via-accent to-accent-alt flex items-center justify-center p-1.5 shadow-[0_0_40px_rgba(99,102,241,0.6)] cursor-pointer overflow-hidden border-2 border-white/30 relative"
            whileHover={{ scale: 1.1, rotate: 15 }}
          >
            <img 
              src="/favicon.ico" 
              alt="Samarpan" 
              className="w-14 h-14 object-contain filter drop-shadow-[0_0_15px_rgba(255,255,255,0.8)] z-10" 
            />
          </motion.div>
        </div>
      </motion.aside>
    </>
  );
};
