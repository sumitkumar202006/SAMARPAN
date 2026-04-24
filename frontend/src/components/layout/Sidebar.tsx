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
  Disc,
  CreditCard
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useAudio } from '@/context/AudioContext';
import { cn } from '@/lib/utils';
import { SidebarToggleArrow } from '@/components/ui/SidebarToggleArrow';
import { PlanBadge, planRingClass } from '@/components/ui/PlanBadge';

const navItems = [
  { name: 'Dashboard',   icon: LayoutDashboard, href: '/dashboard' },
  { name: 'Create',      icon: PlusSquare,      href: '/create' },
  { name: 'Room Hub',    icon: ShieldCheck,     href: '/host' },
  { name: 'Battles',     icon: Zap,             href: '/battles' },
  { name: 'Leaderboard', icon: Trophy,          href: '/leaderboard' },
  { name: 'Friends',     icon: Users,           href: '/friends' },
  { name: 'Explore',     icon: Compass,         href: '/explore' },
  { name: 'Billing',     icon: CreditCard,      href: '/billing' },
  { name: 'Contact',     icon: MessageSquare,   href: '/contact' },
  { name: 'About',       icon: Info,            href: '/about' },
];

export const Sidebar = ({ isCollapsed = false, onToggle }: { isCollapsed?: boolean; onToggle?: () => void }) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFriendly = searchParams.get('friendly') === 'true';
  const { user, logout } = useAuth();
  const { playNavigate, playHover, playToggle } = useAudio();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

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
      className={cn(
        "hidden lg:flex flex-col h-screen fixed left-0 top-0 bg-black/40 backdrop-blur-3xl border-r border-white/10 z-[110] transition-all duration-300 ease-in-out",
        mounted && isCollapsed ? "w-20" : "w-72"
      )}
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

      <SidebarToggleArrow isCollapsed={mounted && isCollapsed} onClick={() => {
        playToggle?.();
        onToggle?.();
      }} />

      {/* Brand / Logo Section */}
      <div className={cn(
        "p-6 pb-2 flex items-center gap-4 shrink-0 transition-all duration-500",
        mounted && isCollapsed && "px-0 justify-center pb-4"
      )}>
        <motion.div 
          whileHover={{ rotate: 15, scale: 1.1 }}
          className={cn(
            "w-9 h-9 rounded-full bg-gradient-to-br from-accent to-accent-alt flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)] border border-white/20 relative shrink-0 overflow-hidden",
            mounted && isCollapsed && "w-10 h-10 shadow-[0_0_25px_rgba(99,102,241,0.6)]"
          )}
        >
          <img src="/favicon.ico" alt="Logo" className="w-full h-full object-cover" />
        </motion.div>
        <div className="flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {mounted && !isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex flex-col"
              >
                <span className="text-lg font-black uppercase tracking-[0.05em] italic text-white leading-tight">
                  Samarpan
                </span>
                <span className="text-[7.5px] font-bold text-accent tracking-[0.35em] uppercase opacity-60 mt-1">
                  Nexus Protocol V4
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* User Status Card / Profile Link */}
      {mounted && user && (
        <Link href="/profile" onClick={() => playNavigate?.()}>
          <motion.div 
            variants={itemVariants}
            className="mx-6 p-5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl mb-4 relative overflow-hidden group hover:border-accent/30 hover:bg-white/10 transition-all duration-500 shrink-0 cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className={cn(
              "flex items-center gap-3 relative z-10 transition-all duration-500",
              mounted && isCollapsed && "justify-center gap-0"
            )}>
              <div className={cn(
                 "w-10 h-10 rounded-full border-2 p-0.5 relative shrink-0 transition-all",
                 planRingClass(user.plan || 'free'),
                 isCollapsed && "scale-110"
              )}>
                 <div className="absolute inset-[-4px] rounded-full border border-accent/20 animate-spin-slow opacity-50" style={{ animationDuration: '10s' }} />
                 {isCollapsed && (
                   <motion.div 
                     className="absolute inset-0 rounded-full border-t-2 border-accent z-20"
                     animate={{ rotate: 360 }}
                     transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                   />
                 )}
                 {user.avatar ? (
                   <img src={user.avatar} alt={user.name || 'User'} className="w-full h-full rounded-full object-cover" />
                 ) : (
                   <div className="w-full h-full rounded-full bg-accent/20 flex items-center justify-center text-accent font-black">
                     {(user.name || 'User').charAt(0).toUpperCase()}
                   </div>
                 )}
              </div>
              
              <AnimatePresence mode="wait">
                {!isCollapsed && (
                  <motion.div 
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="flex flex-col overflow-hidden whitespace-nowrap"
                  >
                     <span className="font-black text-xs uppercase tracking-widest text-white truncate group-hover:text-accent transition-colors">{user.name || 'Guest Explorer'}</span>
                     <span className="text-[10px] text-text-soft font-black uppercase tracking-widest mt-0.5 group-hover:text-white/60 transition-colors">@{user.username || 'nexus_pilot'}</span>
                     <div className="mt-1">
                       <PlanBadge plan={user.plan || 'free'} size="xs" />
                     </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </Link>
      )}

      {/* Go Premium CTA — only for free users, expanded sidebar */}
      {mounted && user && !isCollapsed && (user.plan === 'free' || !user.plan) && (
        <Link href="/pricing" onClick={() => playNavigate?.()}
          className="mx-6 mb-4 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-500/10 to-violet-600/10 border border-indigo-500/20 hover:border-indigo-500/50 hover:from-indigo-500/20 hover:to-violet-600/20 transition-all group shrink-0"
        >
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm shadow-indigo-500/30 shrink-0">
            <Zap size={13} className="text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-white uppercase tracking-widest group-hover:text-indigo-300 transition-colors">Go Premium</span>
            <span className="text-[9px] text-text-soft">Blaze Pro — ₹99/mo</span>
          </div>
        </Link>
      )}

      {/* Navigation Matrix */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto scrollbar-hide">
        {navItems.map((item) => {
          const isFriendlyLink = item.href.includes('friendly=true');
          // Use startsWith so /profile/stats also highlights Profile, etc.
          let isActive: boolean;
          if (pathname === '/host' || pathname?.startsWith('/host?')) {
            isActive = isFriendlyLink ? isFriendly : (!isFriendly && item.href === '/host');
          } else {
            // Match exact or startsWith for parent routes (/explore, /profile, etc.)
            isActive = pathname === item.href || 
                       (item.href !== '/dashboard' && (pathname?.startsWith(item.href + '/') || pathname?.startsWith(item.href + '?')));
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => {
                if (playNavigate) playNavigate();
              }}
              onMouseEnter={() => {
                if (playHover) playHover();
              }}
              className="block outline-none"
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
                    : "text-text-soft hover:bg-white/5 hover:text-white border border-transparent",
                  mounted && isCollapsed && "justify-center px-0 gap-0"
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
                  "relative p-2 rounded-lg transition-all duration-500",
                  isActive 
                    ? "bg-accent text-white shadow-[0_0_20px_rgba(99,102,241,0.5)] scale-110" 
                    : "bg-white/5 text-text-soft group-hover:text-accent group-hover:bg-accent/15",
                  mounted && isCollapsed && "p-3" // Larger hit area in collapsed mode
                )}>
                  {/* Holographic Rotating Ring (Collapsed Active only) */}
                  {mounted && isActive && isCollapsed && (
                    <motion.div 
                      className="absolute inset-0 -m-1 border border-accent/40 rounded-lg blur-[1px]"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    />
                  )}
                  {mounted && isActive && isCollapsed && (
                    <motion.div 
                      className="absolute inset-0 -m-2 border border-accent/20 rounded-lg opacity-50"
                      animate={{ rotate: -360 }}
                      transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    />
                  )}
                  <item.icon size={mounted && isCollapsed ? 20 : 18} />
                </div>

                {/* Cyber-Tooltip (Collapsed mode only) */}
                {mounted && isCollapsed && (
                  <div className="absolute left-[64px] px-3 py-1.5 rounded-md bg-[#020617]/95 backdrop-blur-2xl border border-accent/30 text-[10px] font-black uppercase tracking-widest text-accent opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 pointer-events-none whitespace-nowrap z-[120] shadow-[0_0_30px_rgba(99,102,241,0.3)]">
                    <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-r-[4px] border-r-accent/30" />
                    {item.name}
                  </div>
                )}

                <AnimatePresence>
                  {mounted && !isCollapsed && (
                    <motion.span 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className={cn(
                        "font-black text-[11.5px] uppercase tracking-[0.2em] transition-all duration-300 flex-1 whitespace-nowrap",
                        isActive ? "text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]" : "text-text-soft group-hover:text-white"
                      )}
                    >
                      {item.name}
                    </motion.span>
                  )}
                </AnimatePresence>

                {/* Holographic Detail Tags */}
                <AnimatePresence>
                  {mounted && isActive && !isCollapsed && (
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
            <div className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all font-black text-[11.5px] uppercase tracking-widest shadow-sm group",
              mounted && isCollapsed && "px-0 justify-center w-12 h-12 mx-auto"
            )}>
              <ShieldCheck size={mounted && isCollapsed ? 20 : 16} className={cn(mounted && isCollapsed && "text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.5)]")} />
              {mounted && !isCollapsed && <span>Security Nexus</span>}
            </div>
          </Link>
        )}
        
        {user && (
          <button
            onClick={() => {
              try { playNavigate?.(); } catch(e) {}
              try { logout(); } catch(e) { console.error("Logout failed", e); }
            }}
            className={cn(
              "group flex items-center gap-4 px-4 py-3 rounded-xl bg-red-500/5 text-red-400/60 border border-red-500/10 hover:bg-red-500/15 hover:text-red-400 hover:border-red-500/30 transition-all font-black text-[11.5px] uppercase tracking-[0.2em] shadow-sm",
              isCollapsed && "px-0 justify-center w-12 h-12 mx-auto"
            )}
          >
            <div className={cn(
              "p-2 rounded-lg bg-red-500/5 group-hover:bg-red-500/10 transition-colors",
              mounted && isCollapsed && "p-0 bg-transparent"
            )}>
              <LogOut size={mounted && isCollapsed ? 20 : 18} />
            </div>
            {mounted && !isCollapsed && <span>Terminate Session</span>}
          </button>
        )}
      </div>

      {/* Footer Meta */}
      {mounted && !isCollapsed && (
        <div className="px-8 pb-6 text-[8px] font-bold text-text-soft/40 uppercase tracking-[0.3em] overflow-hidden whitespace-nowrap">
          Signal Strength: Optimized
        </div>
      )}
    </motion.aside>
  );
};
