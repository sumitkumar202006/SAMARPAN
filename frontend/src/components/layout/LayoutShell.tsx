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

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [showFooter, setShowFooter] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
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

  const isAdminPath = pathname?.startsWith('/admin');

  if (isAdminPath) {
    return (
      <div className="flex flex-col min-h-screen">
        <Topbar />
        <DynamicBackground />
        <div className="fixed inset-0 pointer-events-none z-[9999] opacity-[0.02] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
        <main className="flex-1 relative z-10 font-sans">
          {children}
        </main>
      </div>
    );
  }

  return (
    <>
      <DynamicBackground />
      <div className="fixed inset-0 pointer-events-none z-[9999] opacity-[0.02] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />

      <div className="min-h-screen relative z-10 transition-all duration-300">
        <Suspense fallback={null}>
          <Sidebar isCollapsed={isSidebarCollapsed} onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
        </Suspense>
        <div className={cn(
          "flex flex-col min-h-screen transition-all duration-300 ease-in-out",
          mounted && (isSidebarCollapsed ? "lg:pl-20" : "lg:pl-72")
        )}>
          <Topbar />
          <main className={cn(
            "flex-1 flex flex-col pt-4 relative",
            mounted && !isSidebarCollapsed && "lg:pt-6"
          )}>
            <div className="flex-1 px-4 lg:px-8 max-w-7xl mx-auto w-full">
              {children}
            </div>

            {/* Footer Toggle Interface */}
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

            <AnimatePresence>
              {showFooter && (
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
          <MobileNav />
        </div>
      </div>

      <div className="hidden lg:block fixed top-16 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-accent/30 to-transparent opacity-20 pointer-events-none z-[100]" />
      <div className="hidden lg:block fixed bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-accent/20 to-transparent opacity-10 pointer-events-none z-[100]" />
      
      {/* Tactical Center Line (Background) */}
      <div className="fixed inset-y-0 right-0 w-[1px] bg-gradient-to-b from-transparent via-white/5 to-transparent pointer-events-none" />
    </>
  );
}
