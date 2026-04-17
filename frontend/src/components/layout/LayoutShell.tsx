'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { MobileNav } from "@/components/layout/MobileNav";
import { Footer } from "@/components/layout/Footer";
import { DynamicBackground } from "@/components/ui/DynamicBackground";
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FloatingChat } from '@/components/social/FloatingChat';
import { MobileSidebar } from '@/components/layout/MobileSidebar';
import { useAuth } from '@/context/AuthContext';

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [showFooter, setShowFooter] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('sidebar_collapsed') === 'true';
    setIsSidebarCollapsed(saved);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('sidebar_collapsed', isSidebarCollapsed.toString());
    }
  }, [isSidebarCollapsed, mounted]);

  const isMatchOrLobby = React.useMemo(() => {
    return pathname?.includes('/play/') || pathname?.includes('/host/live/') || pathname?.includes('/lobby/');
  }, [pathname]);

  const isAdminPath = pathname?.startsWith('/admin');

  // Force override the sidebar visually during tactical engagements
  const perfClass = user?.settings?.performanceMode ? `perf-${user.settings.performanceMode}` : 'perf-high';

  // Force override the sidebar visually during tactical engagements
  const effectiveSidebarCollapsed = isMatchOrLobby ? true : isSidebarCollapsed;

  // 1. Loading State (SSR-safe)
  if (!mounted) {
    return (
      <div className={cn("min-h-screen bg-background relative overflow-hidden", perfClass)}>
        <DynamicBackground />
        <div className="fixed inset-0 pointer-events-none z-[9999] opacity-[0.02] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
        <div className="flex flex-col min-h-screen">
          <header className="h-16 border-b border-white/5 backdrop-blur-3xl" />
          <main className="flex-1 flex items-center justify-center">
             <div className="w-10 h-10 rounded-full border-2 border-accent border-t-transparent animate-spin opacity-20" />
          </main>
        </div>
      </div>
    );
  }

  // 2. Admin Interface
  if (isAdminPath) {
    return (
      <div className={cn("flex flex-col min-h-screen", perfClass)}>
        <Topbar onOpenMobileMenu={() => setIsMobileSidebarOpen(true)} isMatchOrLobby={false} />
        <DynamicBackground />
        <div className="fixed inset-0 pointer-events-none z-[9999] opacity-[0.02] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
        <main className="flex-1 relative z-10 font-sans">
          <Suspense fallback={null}>
            {children}
          </Suspense>
        </main>
        <MobileSidebar isOpen={isMobileSidebarOpen} onClose={() => setIsMobileSidebarOpen(false)} />
      </div>
    );
  }

  // 3. Primary Shell (Dashboard, Explore, etc.)
  return (
    <div className={perfClass}>
      <DynamicBackground />
      <div className="fixed inset-0 pointer-events-none z-[9999] opacity-[0.02] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />

      <div className="min-h-screen relative z-10 transition-all duration-300">
        <Suspense fallback={null}>
          {!isMatchOrLobby ? (
            <Sidebar isCollapsed={effectiveSidebarCollapsed} onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
          ) : (
            <Sidebar isCollapsed={true} onToggle={() => {}} />
          )}
        </Suspense>
        
        <div className={cn(
          "flex flex-col min-h-screen transition-all duration-300 ease-in-out",
          effectiveSidebarCollapsed ? "lg:pl-20" : "lg:pl-72"
        )}>
          <Topbar onOpenMobileMenu={() => setIsMobileSidebarOpen(true)} isMatchOrLobby={isMatchOrLobby} />
          
          <main className={cn(
            "flex-1 flex flex-col pt-4 relative",
            !effectiveSidebarCollapsed && "lg:pt-6",
            !isMatchOrLobby ? "pb-32 lg:pb-10" : "pb-10"
          )}>
            <div className="flex-1 px-5 lg:px-8 max-w-7xl mx-auto w-full">
              <Suspense fallback={null}>
                {children}
              </Suspense>
            </div>

            {!isMatchOrLobby && (
              <div className="flex flex-col items-center py-8">
                 <button 
                  onClick={() => setShowFooter(!showFooter)}
                  className="group flex flex-col items-center gap-2 transition-all hover:scale-105"
                 >
                   <div className="w-10 h-1 h-px bg-white/10 rounded-full overflow-hidden group-hover:bg-accent/30 transition-colors" />
                   <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-text-soft group-hover:text-accent group-hover:tracking-[0.4em] transition-all">
                      {showFooter ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                      {showFooter ? 'Close terminal' : 'Terminal Info'}
                   </div>
                 </button>
              </div>
            )}

            <AnimatePresence>
              {showFooter && !isMatchOrLobby && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 120 }}
                  className="overflow-hidden border-t border-white/5"
                >
                  <Footer />
                </motion.div>
              )}
            </AnimatePresence>
          </main>
          
          {!isMatchOrLobby && <MobileNav />}
        </div>
      </div>

      <div className="hidden lg:block fixed top-16 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-accent/30 to-transparent opacity-20 pointer-events-none z-[100]" />
      <div className="hidden lg:block fixed bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-accent/20 to-transparent opacity-10 pointer-events-none z-[100]" />
      
      <div className="fixed inset-y-0 right-0 w-[1px] bg-gradient-to-b from-transparent via-white/5 to-transparent pointer-events-none" />

      <Suspense fallback={null}>
        {!isMatchOrLobby && (
          <FloatingChat />
        )}
      </Suspense>

      <MobileSidebar isOpen={isMobileSidebarOpen} onClose={() => setIsMobileSidebarOpen(false)} />
    </div>
  );
}
