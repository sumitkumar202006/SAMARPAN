'use client';

import React, { useEffect } from 'react';
import { RefreshCcw, Home, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Drop-in for Sentry/Datadog when you add it:
    // Sentry.captureException(error);
    console.error('[Qyro] Unhandled error:', {
      message: error.message,
      digest:  error.digest,
      stack:   error.stack,
    });
  }, [error]);

  return (
    <main
      className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden"
      aria-labelledby="error-heading"
      role="alert"
    >
      {/* Ambient glows */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-red-500/5 blur-[150px] rounded-full -translate-x-1/2 -translate-y-1/2" aria-hidden="true" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-red-500/5 blur-[150px] rounded-full translate-x-1/2 translate-y-1/2" aria-hidden="true" />

      <div className="w-full max-w-lg text-center relative z-10">
        <div className="glass p-12 rounded-[50px] border border-red-500/10 shadow-2xl space-y-8">

          <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-400" aria-hidden="true">
            <AlertTriangle size={40} />
          </div>

          <div className="space-y-3">
            <h1
              id="error-heading"
              className="text-3xl font-black uppercase italic tracking-tighter text-white"
            >
              Something Went Wrong
            </h1>
            <p className="text-white/50 text-sm leading-relaxed">
              An unexpected error occurred. You can try again or return to the dashboard.
            </p>
          </div>

          {/* Error detail (collapsed, for developers) */}
          <details className="text-left">
            <summary className="text-[10px] text-white/30 font-black uppercase tracking-widest cursor-pointer hover:text-white/50 transition-colors">
              Error details
            </summary>
            <div className="mt-3 bg-black/40 p-4 rounded-2xl border border-white/5 font-mono text-[10px] text-red-400 overflow-x-auto">
              <p className="break-all">{error.message || 'Unknown error'}</p>
              {error.digest && (
                <p className="mt-1 opacity-40">Digest: {error.digest}</p>
              )}
            </div>
          </details>

          <nav aria-label="Recovery options" className="flex flex-col gap-4">
            <button
              onClick={reset}
              className="flex items-center justify-center gap-3 py-5 rounded-[24px] bg-red-500 text-white font-black uppercase tracking-[0.2em] text-[10px] hover:bg-red-600 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-red-500/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-400"
              aria-label="Try again"
            >
              <RefreshCcw size={16} />
              Try Again
            </button>
            <Link
              href="/dashboard"
              className="flex items-center justify-center gap-3 py-5 rounded-[24px] bg-white/5 border border-white/10 text-white font-black uppercase tracking-[0.2em] text-[10px] hover:bg-white/10 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/30"
            >
              <Home size={16} />
              Go to Dashboard
            </Link>
          </nav>
        </div>

        <p className="mt-8 text-[9px] text-white/20 font-semibold uppercase tracking-[0.4em]">
          Qyro &mdash; Unhandled Error
        </p>
      </div>
    </main>
  );
}
