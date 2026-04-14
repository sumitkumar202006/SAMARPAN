'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { MobileNav } from "@/components/layout/MobileNav";
import { Footer } from "@/components/layout/Footer";
import { DynamicBackground } from "@/components/ui/DynamicBackground";

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminPath = pathname?.startsWith('/admin');

  if (isAdminPath) {
    return (
      <>
        <DynamicBackground />
        <div className="fixed inset-0 pointer-events-none z-[9999] opacity-[0.02] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
        <main className="min-h-screen relative z-10 font-sans">
          {children}
        </main>
      </>
    );
  }

  return (
    <>
      <DynamicBackground />
      <div className="fixed inset-0 pointer-events-none z-[9999] opacity-[0.02] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />

      <div className="flex min-h-screen relative z-10">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar />
          <main className="flex-1 pb-16 lg:pb-0">
            {children}
            <Footer />
          </main>
          <MobileNav />
        </div>
      </div>

      <div className="hidden lg:block fixed top-16 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-accent to-transparent opacity-30 pointer-events-none" />
    </>
  );
}
