'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  PlusSquare, 
  Trophy, 
  Zap, 
  User, 
  Compass, 
  MessageSquare, 
  Info,
  LogOut
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useAudio } from '@/context/AudioContext';
import { cn } from '@/lib/utils'; // I'll need to create this helper

const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { name: 'Create', icon: PlusSquare, href: '/create' },
  { name: 'Host', icon: User, href: '/host' },
  { name: 'Battles', icon: Zap, href: '/battles' },
  { name: 'Leaderboard', icon: Trophy, href: '/leaderboard' },
  { name: 'Explore', icon: Compass, href: '/explore' },
  { name: 'Contact', icon: MessageSquare, href: '/contact' },
  { name: 'About', icon: Info, href: '/about' },
];

export const Sidebar = () => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { playNavigate } = useAudio();

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 bg-bg-soft/50 backdrop-blur-xl border-r border-border-soft p-4">
      {/* Brand */}
      <div className="flex items-center gap-3 mb-8 px-2">
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-accent to-accent-alt flex items-center justify-center overflow-hidden shadow-[0_0_20px_rgba(99,102,241,0.5)]">
          <img src="/favicon.ico" alt="Samarpan Logo" className="w-full h-full object-cover" />
        </div>
        <span className="font-bold text-xl tracking-wider uppercase">Samarpan</span>
      </div>

      {/* User Info */}
      {user && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-background/80 mb-6 group transition-all hover:bg-background">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-accent-alt to-accent flex items-center justify-center font-semibold text-lg overflow-hidden">
            {user.avatar ? <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" /> : user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="font-medium text-sm truncate">{user.name}</span>
            <span className="text-xs text-text-soft truncate">Global Rating: {user.globalRating || 1200}</span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => playNavigate()}
              className={cn(
                "group relative flex items-center justify-between p-3 rounded-xl text-sm transition-all overflow-hidden",
                isActive 
                  ? "bg-gradient-to-r from-accent to-accent-alt text-white shadow-[0_0_20px_rgba(99,102,241,0.4)]" 
                  : "text-text-soft hover:bg-background hover:text-white"
              )}
            >
              <div className="flex items-center gap-3 relative z-10">
                <item.icon 
                  size={18} 
                  className={cn(
                    isActive ? "text-white animate-pulse" : "text-text-soft group-hover:text-accent transition-colors"
                  )} 
                />
                <span className="font-bold tracking-tight">{item.name}</span>
              </div>
              
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 bg-white/10 z-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                />
              )}

              {/* Neon pulse effect on hover */}
              {!isActive && (
                <div className="absolute inset-0 border border-accent/0 group-hover:border-accent/40 rounded-xl transition-all pointer-events-none group-hover:shadow-[0_0_15px_rgba(99,102,241,0.3)]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      {user && (
        <button 
          onClick={logout}
          className="mt-auto flex items-center gap-3 p-3 rounded-xl text-sm text-text-soft hover:bg-red-500/10 hover:text-red-400 transition-all border border-transparent hover:border-red-500/20"
        >
          <LogOut size={18} />
          <span className="font-medium">Sign Out</span>
        </button>
      )}
    </aside>
  );
};
