'use client';

import React from 'react';
import Link from 'next/link';
import { Shield } from 'lucide-react';
import { WhatsappIcon as WhatsApp, InstagramIcon as Instagram, GithubIcon as GitHub } from '@/components/ui/BrandIcons';

export const Footer = () => {
  return (
    <footer className="w-full bg-background border-t border-white/5 py-12 px-8 overflow-hidden relative">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
        <div className="flex flex-col items-center md:items-start gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-accent to-accent-alt flex items-center justify-center p-1.5 shadow-[0_0_15px_rgba(99,102,241,0.3)]">
               <img src="/favicon.ico" alt="Samarpan Logo" className="w-full h-full object-contain" />
            </div>
            <span className="font-bold tracking-tight uppercase text-sm">Samarpan Arena</span>
          </div>
          <p className="text-[10px] text-text-soft uppercase tracking-[0.2em] font-medium opacity-60">
            © 2026 Developed for the Next Generation of Competitors.
          </p>
          <div className="flex gap-4 mt-2">
            {[
              { icon: WhatsApp, href: 'https://whatsapp.com/channel/0029VbCDJ4M1XquaIIpJFw2b' },
              { icon: Instagram, href: 'https://www.instagram.com/me.aman_2005?igsh=azJhMHpzOWtwOTM3' },
              { icon: GitHub, href: 'https://github.com/infinity-me' }
            ].map((social, i) => (
              <a 
                key={i} 
                href={social.href} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-text-soft hover:text-accent transition-colors"
              >
                <social.icon size={16} />
              </a>
            ))}
          </div>
        </div>

        <div className="flex gap-10">
           <div className="flex flex-col gap-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-text-soft">Ecosystem</span>
              <div className="flex flex-col gap-2 text-xs font-medium text-text-soft">
                 <Link href="/explore" className="hover:text-white transition-colors">Explore</Link>
                 <Link href="/leaderboard" className="hover:text-white transition-colors">Leaderboard</Link>
                 <Link href="/battles" className="hover:text-white transition-colors">Battles</Link>
              </div>
           </div>
           <div className="flex flex-col gap-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-text-soft">Resources</span>
              <div className="flex flex-col gap-2 text-xs font-medium text-text-soft">
                 <Link href="/about" className="hover:text-white transition-colors">About</Link>
                 <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
                 {/* The "Hidden" Admin entry requested */}
                 <Link href="/admin/login" className="opacity-0 hover:opacity-100 transition-opacity flex items-center gap-2 group">
                    <Shield size={10} className="text-accent group-hover:animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-accent/50">Admin Portal</span>
                 </Link>
              </div>
           </div>
        </div>
      </div>
      
      {/* Background Decorative Element */}
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-accent/5 blur-[80px] rounded-full translate-y-1/2 translate-x-1/2 pointer-events-none" />
    </footer>
  );
};
