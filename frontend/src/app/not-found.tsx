'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Home, ArrowLeft, Compass } from 'lucide-react';

export default function NotFound() {
  const router = useRouter();

  return (
    <main
      className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden"
      aria-labelledby="notfound-heading"
    >
      {/* Ambient glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#CC0000]/10 blur-[150px] rounded-full translate-x-1/2 -translate-y-1/2" aria-hidden="true" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#00D4B4]/8 blur-[150px] rounded-full -translate-x-1/2 translate-y-1/2" aria-hidden="true" />

      <div className="w-full max-w-lg text-center relative z-10">
        <div className="glass p-12 rounded-[50px] border border-white/5 shadow-2xl space-y-8">

          <div className="relative inline-block" aria-hidden="true">
            <div className="w-24 h-24 rounded-3xl bg-[#CC0000]/10 border border-[#CC0000]/20 flex items-center justify-center mx-auto text-[#CC0000]">
              <Compass size={48} />
            </div>
            <div className="absolute -top-2 -right-2 px-3 py-1 bg-[#CC0000] text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-red-600/30">
              404
            </div>
          </div>

          <div className="space-y-3">
            <h1
              id="notfound-heading"
              className="text-4xl font-black uppercase italic tracking-tighter text-white"
            >
              Page Not Found
            </h1>
            <p className="text-white/50 text-sm leading-relaxed">
              The page you&apos;re looking for doesn&apos;t exist or has been moved.
              Head back to safety below.
            </p>
          </div>

          <div className="h-px w-24 bg-gradient-to-r from-transparent via-white/10 to-transparent mx-auto" aria-hidden="true" />

          <nav aria-label="Recovery navigation" className="flex flex-col gap-4">
            <Link
              href="/dashboard"
              className="group flex items-center justify-center gap-3 py-5 rounded-[24px] bg-[#CC0000] text-white font-black uppercase tracking-[0.2em] text-[10px] hover:bg-[#CC0000] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-red-600/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-400"
            >
              <Home size={16} />
              Go to Dashboard
            </Link>
            <button
              onClick={() => router.back()}
              className="flex items-center justify-center gap-3 py-5 rounded-[24px] bg-white/5 border border-white/10 text-white font-black uppercase tracking-[0.2em] text-[10px] hover:bg-white/10 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/30"
            >
              <ArrowLeft size={16} />
              Go Back
            </button>
          </nav>
        </div>

        <p className="mt-8 text-[9px] text-white/20 font-semibold uppercase tracking-[0.4em]">
          Qyro &mdash; Error 404
        </p>
      </div>
    </main>
  );
}
