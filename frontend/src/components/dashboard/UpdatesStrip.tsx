import React from 'react';

export const UpdatesStrip = () => {
  return (
    <section className="rounded-2xl bg-gradient-to-r from-accent/30 via-accent-alt/20 to-accent/30 border border-accent/80 p-3 lg:p-4 shadow-soft mb-6">
      <h2 className="text-xs font-bold uppercase tracking-widest text-text-soft mb-2">Latest Updates</h2>
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <span className="flex items-center gap-2">
          <span className="text-orange-400">🔥</span> New: AI quiz generator added for PDFs
        </span>
        <span className="flex items-center gap-2">
          <span className="text-yellow-400">🏆</span> Live coding tournament scheduled for Friday
        </span>
        <span className="flex items-center gap-2">
          <span className="text-blue-400">✨</span> Dynamic rating & ranking system now live
        </span>
      </div>
    </section>
  );
};
