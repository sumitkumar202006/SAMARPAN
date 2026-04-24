'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, PlusSquare, ShieldCheck, Zap, Trophy, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { PlanBadge, planRingClass } from '@/components/ui/PlanBadge';

const navItems = [
  { name: 'Home',    icon: LayoutDashboard, href: '/dashboard' },
  { name: 'Host',    icon: ShieldCheck,     href: '/host'      },
  { name: 'Battles', icon: Zap,             href: '/battles'   },
  { name: 'Create',  icon: PlusSquare,      href: '/create'    },
  { name: 'Rank',    icon: Trophy,          href: '/leaderboard'},
];

export const MobileNav = () => {
  const pathname = usePathname();
  const { user } = useAuth();
  const isFree = !user?.plan || user.plan === 'free';

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[100]">
      {/* Go Premium strip — only for free users */}
      <AnimatePresence>
        {isFree && user && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
          >
            <Link
              href="/pricing"
              className="flex items-center justify-between px-5 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white"
            >
              <div className="flex items-center gap-2">
                <Sparkles size={13} />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  Upgrade to Blaze Pro
                </span>
              </div>
              <span className="text-[10px] font-black">₹99/mo →</span>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nav dock */}
      <nav className="relative flex items-center justify-around px-2 py-2 bg-background/60 backdrop-blur-3xl border-t border-white/5 shadow-[0_-10px_40px_rgba(0,0,0,0.4)]">
        {/* Gloss effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none" />

        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className="relative flex flex-col items-center gap-1 py-1 px-3 transition-all active:scale-90"
            >
              <div className={cn(
                'relative z-10 p-2 rounded-xl transition-all duration-300',
                isActive ? 'text-accent bg-accent/10 shadow-[0_0_15px_rgba(99,102,241,0.3)]' : 'text-text-soft'
              )}>
                <item.icon size={20} className={cn(isActive && 'drop-shadow-[0_0_6px_rgba(99,102,241,0.8)]')} />
              </div>

              {isActive && (
                <motion.div
                  layoutId="mobile-active-dot"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-accent rounded-full shadow-[0_0_8px_rgba(99,102,241,0.8)]"
                  transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                />
              )}

              <span className={cn(
                'text-[9px] font-black uppercase tracking-widest transition-colors',
                isActive ? 'text-accent' : 'text-text-soft'
              )}>
                {item.name}
              </span>
            </Link>
          );
        })}

        {/* Profile avatar with plan ring */}
        <Link href="/profile" className="relative flex flex-col items-center gap-1 py-1 px-3 active:scale-90">
          <div className={cn(
            'w-9 h-9 rounded-xl border-2 overflow-hidden transition-all',
            planRingClass(user?.plan || 'free')
          )}>
            {user?.avatar ? (
              <img src={user.avatar} alt={user?.name || ''} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-accent/20 flex items-center justify-center text-accent font-black text-sm">
                {(user?.name || 'U').charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          {user && (
            <div className="flex flex-col items-center gap-0.5">
              <PlanBadge plan={user?.plan || 'free'} size="xs" showLabel={false} />
            </div>
          )}
        </Link>
      </nav>

      {/* Bottom safe-area spacer for iOS */}
      <div className="h-[env(safe-area-inset-bottom)] bg-background/60" />
    </div>
  );
};
