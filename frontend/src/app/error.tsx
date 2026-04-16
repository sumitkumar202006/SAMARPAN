'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { RefreshCcw, ShieldAlert, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('CRITICAL_NEURAL_ERROR:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      {/* Red alert glow elements */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-red-500/5 blur-[150px] rounded-full -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-red-500/5 blur-[150px] rounded-full translate-x-1/2 translate-y-1/2" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg text-center relative z-10"
      >
        <div className="glass p-12 rounded-[50px] border-red-500/10 shadow-2xl space-y-8">
          <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-500">
             <ShieldAlert size={40} />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-black uppercase italic tracking-tighter text-white">System Breach</h1>
            <p className="text-text-soft text-sm uppercase tracking-widest font-bold">A critical exception has destabilized the current neural session.</p>
          </div>

          <div className="bg-black/40 p-6 rounded-3xl border border-white/5 text-left font-mono text-[10px] text-red-400 overflow-x-auto">
             <p className="uppercase font-black mb-2 opacity-50 underline">Diagnostic Log:</p>
             <code>{error.message || 'UNKNOWN_EXCEPTION_CORE'}</code>
             {error.digest && <p className="mt-2 opacity-40">DIGEST: {error.digest}</p>}
          </div>

          <div className="flex flex-col gap-4">
             <button 
               onClick={() => reset()}
               className="flex items-center justify-center gap-3 py-5 rounded-[24px] bg-red-500 text-white font-black uppercase tracking-[0.2em] text-[10px] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-red-500/20"
             >
                <RefreshCcw size={16} />
                Reboot Session
             </button>
             <Link 
               href="/dashboard"
               className="flex items-center justify-center gap-3 py-5 rounded-[24px] bg-white/5 border border-white/10 text-white font-black uppercase tracking-[0.2em] text-[10px] hover:bg-white/10 transition-all"
             >
                <Home size={16} />
                Abort mission
             </Link>
          </div>
        </div>

        <p className="mt-8 text-[9px] text-text-soft font-black uppercase tracking-[0.4em] opacity-40 italic">
           CRITICAL_STATE_CAPTURED // EMERGENCY_OVERRIDE_ACTIVE
        </p>
      </motion.div>
    </div>
  );
}
