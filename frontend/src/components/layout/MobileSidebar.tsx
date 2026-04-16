'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, PlusSquare, ShieldCheck, Users, Zap, 
  Trophy, Compass, MessageSquare, Info, LogOut, X, Disc
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { name: 'Create', icon: PlusSquare, href: '/create' },
  { name: 'Host Hub', icon: ShieldCheck, href: '/host' },
  { name: 'Casual Play', icon: Users, href: '/host?friendly=true' },
  { name: 'Battles', icon: Zap, href: '/battles' },
  { name: 'Leaderboard', icon: Trophy, href: '/leaderboard' },
  { name: 'Explore', icon: Compass, href: '/explore' },
  { name: 'Contact', icon: MessageSquare, href: '/contact' },
  { name: 'About', icon: Info, href: '/about' },
];

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileSidebar: React.FC<MobileSidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] lg:hidden"
          />

          {/* Sidebar Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-64 bg-[#020617]/95 backdrop-blur-2xl border-l border-white/10 z-[201] lg:hidden flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="p-6 flex items-center justify-between border-b border-white/5 bg-white/[0.02]">
              <div className="flex flex-col">
                <span className="text-sm font-black uppercase tracking-widest italic text-white leading-none">Samarpan</span>
                <span className="text-[7px] font-bold text-accent tracking-[0.3em] uppercase opacity-60 mt-1">Nexus Protocol</span>
              </div>
              <button 
                onClick={onClose}
                className="p-2 rounded-lg bg-white/5 text-text-soft hover:text-white transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* User Profile */}
            {user && (
              <div className="p-6 border-b border-white/5 bg-gradient-to-br from-accent/5 to-transparent">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl border-2 border-accent/30 p-0.5 bg-background overflow-hidden shrink-0">
                    {user.avatar ? (
                      <img src={user.avatar} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <div className="w-full h-full bg-accent/20 flex items-center justify-center text-accent font-black">
                        {user.name?.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-xs font-black text-white truncate uppercase">{user.name}</span>
                    <span className="text-[9px] text-accent font-black uppercase tracking-tighter flex items-center gap-1.5 mt-0.5">
                      <Disc size={8} className="animate-pulse" />
                      Lvl {Math.floor((user.globalRating || 1200) / 100)} Online
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Nav Items */}
            <nav className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 border",
                      isActive 
                        ? "bg-accent/15 border-accent/30 text-white shadow-[0_0_20px_rgba(99,102,241,0.2)]" 
                        : "text-text-soft border-transparent hover:bg-white/5"
                    )}
                  >
                    <item.icon size={18} className={cn(isActive && "text-accent")} />
                    <span className="text-[11px] font-black uppercase tracking-widest">{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Footer / Controls */}
            <div className="p-6 border-t border-white/5 space-y-3">
              {user?.role === 'admin' && (
                <Link 
                  href="/admin" 
                  onClick={onClose}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-black uppercase tracking-widest"
                >
                  <ShieldCheck size={16} />
                  <span>Security</span>
                </Link>
              )}
              {user && (
                <button
                  onClick={() => {
                    onClose();
                    logout();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/5 text-red-400 border border-red-500/10 text-[10px] font-black uppercase tracking-widest"
                >
                  <LogOut size={16} />
                  <span>Terminate</span>
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
