import React from 'react';
import { Zap, Trophy, ShieldCheck, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

const updates = [
  { icon: Flame, text: "New: AI quiz generator added for PDFs", color: "text-orange-400" },
  { icon: Trophy, text: "Live coding tournament scheduled for Friday", color: "text-yellow-400" },
  { icon: ShieldCheck, text: "Dynamic rating & ranking system now live", color: "text-blue-400" },
];

export const UpdatesStrip = () => {
  return (
    <section className="glass rounded-[20px] bg-gradient-to-r from-accent/10 via-background/40 to-accent/5 border border-white/5 p-4 mb-8 relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-1 h-full bg-accent opacity-50 shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
      
      <div className="flex items-center gap-2 mb-3">
        <Zap size={14} className="text-accent animate-pulse" />
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-soft">Nexus Feed / Daily Intelligence</h2>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {updates.map((update, i) => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-default group/item">
            <div className={cn("mt-0.5 group-hover/item:scale-110 transition-transform", update.color)}>
              <update.icon size={16} />
            </div>
            <p className="text-xs font-bold leading-tight group-hover/item:text-accent transition-colors">{update.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
};
