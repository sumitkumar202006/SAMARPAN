'use client';

'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, PlusSquare, User, UserCircle, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { name: 'Host', icon: User, href: '/host' },
  { name: 'Battles', icon: Zap, href: '/battles' },
  { name: 'Create', icon: PlusSquare, href: '/create' },
  { name: 'Profile', icon: UserCircle, href: '/profile' },
];

export const MobileNav = () => {
  const pathname = usePathname();

  return (
    <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[92%] max-w-md">
      <nav className="relative flex items-center justify-around px-2 py-3 bg-background/40 backdrop-blur-3xl border border-white/5 rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
        {/* Dock Gloss Effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
        
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className="relative flex flex-col items-center gap-1.5 p-2 transition-all active:scale-90"
            >
              <div className={cn(
                "relative z-10 p-2 rounded-xl transition-all duration-300",
                isActive ? "text-accent bg-accent/10" : "text-text-soft"
              )}>
                <item.icon size={22} className={cn(isActive && "drop-shadow-[0_0_8px_rgba(99,102,241,0.8)]")} />
              </div>
              
              {isActive && (
                <motion.div 
                  layoutId="active-nav"
                  className="absolute bottom-0 w-1 h-1 bg-accent rounded-full shadow-[0_0_10px_2px_rgba(99,102,241,0.8)]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                />
              )}
              
              <span className={cn(
                "text-[9px] font-black uppercase tracking-widest transition-colors duration-300",
                isActive ? "text-accent" : "text-text-soft"
              )}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
