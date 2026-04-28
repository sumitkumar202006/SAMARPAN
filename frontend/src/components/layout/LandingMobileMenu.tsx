'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, Zap, ArrowRight, Store, Trophy, Tag, Info } from 'lucide-react';

const NAV_LINKS = [
  { href: '/marketplace', label: 'Marketplace', icon: Store  },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/pricing',     label: 'Pricing',     icon: Tag   },
  { href: '/about',       label: 'About',       icon: Info  },
];

export function LandingMobileMenu() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all"
      >
        <Menu size={18} />
      </button>

      {open && (
        <div className="fixed inset-0 z-[9999]" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Drawer */}
          <div className="absolute top-0 right-0 h-full w-72 bg-[#020617] border-l border-white/5 flex flex-col shadow-2xl shadow-black/50">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#CC0000] to-[#00D4B4] flex items-center justify-center">
                  <Zap size={13} fill="white" className="text-white" />
                </div>
                <span className="font-black text-base tracking-tight uppercase italic">Qyro</span>
              </Link>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Links */}
            <nav className="flex flex-col gap-1 p-4 flex-1" aria-label="Mobile navigation">
              {NAV_LINKS.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-all font-semibold text-sm group"
                >
                  <Icon size={16} className="text-[#CC0000] group-hover:text-red-300 transition-colors" />
                  {label}
                </Link>
              ))}
            </nav>

            {/* Auth CTAs */}
            <div className="p-4 border-t border-white/5 space-y-3">
              <Link
                href="/auth"
                onClick={() => setOpen(false)}
                className="w-full flex items-center justify-center py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-black text-white/70 hover:text-white hover:bg-white/10 transition-all"
              >
                Log in
              </Link>
              <Link
                href="/auth?mode=signup"
                onClick={() => setOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-[#CC0000] to-[#CC0000] text-white font-black text-sm shadow-lg shadow-red-600/25 hover:opacity-95 transition-all"
              >
                Get Started Free <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
