import React from 'react';
import { Play } from 'lucide-react';

interface QuizCardProps {
  title: string;
  description: string;
  lastPlayed: string;
  onHost: () => void;
}

export const QuizCard: React.FC<QuizCardProps> = ({ title, description, lastPlayed, onHost }) => {
  return (
    <div className="glass p-5 rounded-2xl group hover:border-accent transition-all cursor-pointer">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-bold text-sm text-foreground group-hover:text-accent transition-colors">{title}</h4>
      </div>
      <p className="text-xs text-text-soft mb-4">{description}</p>
      
      <div className="flex justify-between items-center text-[10px] text-text-soft">
        <span>Last played: {lastPlayed}</span>
        <button 
          onClick={(e) => { e.stopPropagation(); onHost(); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent-soft text-accent font-bold uppercase tracking-wider hover:bg-accent hover:text-white transition-all overflow-hidden relative"
        >
          <Play size={10} fill="currentColor" />
          <span>Host again</span>
        </button>
      </div>
    </div>
  );
};
