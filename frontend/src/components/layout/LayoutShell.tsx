'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { MobileNav } from "@/components/layout/MobileNav";
import { Footer } from "@/components/layout/Footer";
import { DynamicBackground } from "@/components/ui/DynamicBackground";
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { MobileSidebar } from '@/components/layout/MobileSidebar';
import { useAuth } from '@/context/AuthContext';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
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
  // Landing page renders its own full-width layout — no shell
  const isLandingPage = pathname === '/';

  // Force override the sidebar visually during tactical engagements
  const perfClass = user?.settings?.performanceMode ? `perf-${user.settings.performanceMode}` : 'perf-high';
  
  const childrenWithBoundary = <ErrorBoundary>{children}</ErrorBoundary>;

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

  // 2. Landing Page — render naked, no shell (has its own layout)
  if (isLandingPage) {
    return <>{children}</>;
  }

  // 3. Admin Interface
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
      {/* Only render heavy animated background when NOT in a match — saves GPU during gameplay */}
      {!isMatchOrLobby && <DynamicBackground />}
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
          
          <main
            id="main-content"
            className={cn(
            "flex-1 flex flex-col pt-4 relative",
            !effectiveSidebarCollapsed && "lg:pt-6",
            !isMatchOrLobby ? "pb-40 lg:pb-10" : "pb-10"
          )}>
            <div className="flex-1 px-5 lg:px-8 max-w-7xl mx-auto w-full">
              <Suspense fallback={null}>
                {childrenWithBoundary}
              </Suspense>
            </div>

            {!isMatchOrLobby && !isAdminPath && (
              <Footer />
            )}
          </main>
          
          {!isMatchOrLobby && <MobileNav />}
        </div>
      </div>

      <div className="hidden lg:block fixed top-16 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-accent/30 to-transparent opacity-20 pointer-events-none z-[100]" />
      <div className="hidden lg:block fixed bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-accent/20 to-transparent opacity-10 pointer-events-none z-[100]" />
      
      <div className="fixed inset-y-0 right-0 w-[1px] bg-gradient-to-b from-transparent via-white/5 to-transparent pointer-events-none" />


      <MobileSidebar isOpen={isMobileSidebarOpen} onClose={() => setIsMobileSidebarOpen(false)} />
    </div>
  );
}
