'use client';

import React, { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { OrbitalNav } from "@/components/layout/OrbitalNav";
import { Topbar } from "@/components/layout/Topbar";
import { MobileNav } from "@/components/layout/MobileNav";
import { Footer } from "@/components/layout/Footer";
import { DynamicBackground } from "@/components/ui/DynamicBackground";
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, MoreHorizontal } from 'lucide-react';

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [showFooter, setShowFooter] = useState(false);
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

      <div className="flex min-h-screen relative z-10 lg:pl-24">
        <Suspense fallback={null}>
          <OrbitalNav />
        </Suspense>
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar />
          <main className="flex-1 pb-16 lg:pb-0 flex flex-col">
            <div className="flex-1">
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

      <div className="hidden lg:block fixed top-16 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-accent to-transparent opacity-30 pointer-events-none" />
    </>
  );
}
