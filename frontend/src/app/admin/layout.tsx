'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  BarChart3, 
  Settings, 
  LogOut, 
  ShieldCheck,
  Zap,
  ChevronRight,
  CreditCard
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);

  useEffect(() => {
    // Redirect to login if not authenticated or not an admin
    if (pathname !== '/admin/login' && (!user || user.role !== 'admin')) {
      router.push('/admin/login');
    }
  }, [user, router, pathname]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (pathname === '/admin/login') return <>{children}</>;
  
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  const navItems = [
    { name: 'Overview',       icon: LayoutDashboard, href: '/admin' },
    { name: 'News & Updates', icon: Zap,             href: '/admin/news' },
    { name: 'User Management',icon: Users,            href: '/admin/users' },
    { name: 'Quiz Vault',     icon: BookOpen,         href: '/admin/quizzes' },
    { name: 'Subscriptions',  icon: CreditCard,       href: '/admin/subscriptions' },
    { name: 'Analytics',      icon: BarChart3,        href: '/admin/analytics' },
    { name: 'General Settings',icon: Settings,        href: '/admin/settings' },
  ];

  return (
    <div className="flex min-h-screen bg-background font-sans relative">
      
      {/* Logout Confirmation Modal */}
      <motion.div 
        animate={{ opacity: showLogoutConfirm ? 1 : 0, pointerEvents: showLogoutConfirm ? 'auto' : 'none' }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      >
        <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={() => setShowLogoutConfirm(false)} />
        <motion.div 
          animate={{ scale: showLogoutConfirm ? 1 : 0.9, y: showLogoutConfirm ? 0 : 20 }}
          className="glass max-w-sm w-full p-8 rounded-[40px] border-white/5 relative z-10 text-center space-y-6 shadow-2xl"
        >
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-500">
             <LogOut size={32} />
          </div>
          <div>
            <h3 className="text-xl font-black tracking-tight mb-2">Terminate Session?</h3>
            <p className="text-sm text-text-soft font-medium leading-relaxed">
              You are about to disconnect from the Zenith Nexus. All administrative overrides will be suspended.
            </p>
          </div>
          <div className="flex flex-col gap-3">
             <button 
               onClick={handleLogout}
               className="w-full py-4 rounded-2xl bg-red-500 text-white text-sm font-black tracking-widest hover:bg-red-600 transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)]"
             >
                TERMINATE SIMULATION
             </button>
             <button 
               onClick={() => setShowLogoutConfirm(false)}
               className="w-full py-4 rounded-2xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
             >
                Stay Connected
             </button>
          </div>
        </motion.div>
      </motion.div>

      {/* Admin Sidebar */}
      <aside className="w-72 bg-bg-soft/50 backdrop-blur-3xl border-r border-white/5 sticky top-0 h-screen flex flex-col p-6 z-20">
        <div className="flex items-center gap-4 mb-10 px-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-accent to-accent-alt flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)]">
             <ShieldCheck className="text-white" size={24} />
          </div>
          <div>
            <h2 className="font-black text-lg tracking-tight leading-none">Nexus</h2>
            <p className="text-[10px] text-accent uppercase font-black tracking-widest mt-1">Admin Panel</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={cn(
                  "flex items-center justify-between p-4 rounded-2xl text-sm font-black transition-all group",
                  isActive 
                    ? "bg-accent text-white shadow-[0_10px_20px_-10px_rgba(99,102,241,0.5)]" 
                    : "text-text-soft hover:bg-white/5 hover:text-white"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={18} className={cn(isActive ? "text-white" : "group-hover:text-accent transition-colors")} />
                  <span className="tracking-tight">{item.name}</span>
                </div>
                {isActive && <ChevronRight size={14} />}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-4">
          <div className="p-4 rounded-[24px] bg-gradient-to-tr from-accent/10 to-transparent border border-white/5 space-y-3">
            <div className="flex items-center gap-2 text-accent">
              <Zap size={14} fill="currentColor" />
              <span className="text-[10px] font-black uppercase tracking-widest">System Status</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-accent-alt animate-pulse" />
              <span className="text-[10px] font-bold text-text-soft">Vitals: Optimal</span>
            </div>
          </div>

          <button 
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center gap-3 p-4 rounded-2xl text-sm font-black text-red-400 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/10"
          >
            <LogOut size={18} />
            <span>Terminate Session</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-10 relative">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/5 blur-[150px] -translate-y-1/2 translate-x-1/2 rounded-full pointer-events-none" />
        
        <div className="max-w-7xl mx-auto space-y-10 relative z-10">
           {children}
        </div>
      </main>
    </div>
  );
}
