'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, ShieldAlert, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      {/* Tactical Glow Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/10 blur-[150px] rounded-full translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent-alt/10 blur-[150px] rounded-full -translate-x-1/2 translate-y-1/2" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg text-center relative z-10"
      >
        <div className="glass p-12 rounded-[50px] border-white/5 shadow-2xl space-y-8">
          <div className="relative inline-block">
             <div className="w-24 h-24 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-500">
                <ShieldAlert size={48} />
             </div>
             <div className="absolute -top-2 -right-2 px-3 py-1 bg-red-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-[0_0_15px_rgba(239,68,68,0.5)]">
                404_ERR
             </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl font-black uppercase italic tracking-tighter text-white">Route Terminated</h1>
            <p className="text-text-soft text-sm uppercase tracking-widest font-bold">The requested neural coordinates do not exist in the Arena Nexus.</p>
          </div>

          <div className="h-px w-24 bg-gradient-to-r from-transparent via-white/10 to-transparent mx-auto" />

          <div className="flex flex-col gap-4">
             <Link 
               href="/dashboard"
               className="group flex items-center justify-center gap-3 py-5 rounded-[24px] bg-accent text-white font-black uppercase tracking-[0.2em] text-[10px] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-accent/20"
             >
                <Home size={16} />
                Return to HQ Dashboard
             </Link>
             <button 
               onClick={() => window.history.back()}
               className="flex items-center justify-center gap-3 py-5 rounded-[24px] bg-white/5 border border-white/10 text-white font-black uppercase tracking-[0.2em] text-[10px] hover:bg-white/10 transition-all"
             >
                <ArrowLeft size={16} />
                Previous Sector
             </button>
          </div>
        </div>

        <p className="mt-8 text-[9px] text-text-soft font-black uppercase tracking-[0.4em] opacity-40">
           SAMARPAN // NEURAL COMMAND // SYSTEM_STABLE
        </p>
      </motion.div>
    </div>
  );
}
