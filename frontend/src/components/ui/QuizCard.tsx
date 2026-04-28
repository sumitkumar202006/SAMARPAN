import React from 'react';
import { Play, HardDrive, Database, Zap, Store, Sparkles, BarChart2 } from 'lucide-react';
import { motion, useMotionTemplate, useMotionValue } from 'framer-motion';
import { useAudio } from '@/context/AudioContext';

interface QuizCardProps {
  title: string;
  description: string;
  lastPlayed: string;
  isLocal?: boolean;
  onHost: () => void;
  onPlay: () => void;
  onPublish?: () => void;
  onAutoTag?: () => void;
  quizId?: string;
  isPublished?: boolean;
}

export const QuizCard: React.FC<QuizCardProps> = ({
  title, description, lastPlayed, isLocal, onHost, onPlay,
  onPublish, onAutoTag, quizId, isPublished
}) => {
  const { playAccelerate } = useAudio();
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <div
      className="glass p-5 rounded-2xl group hover:border-accent/50 transition-all cursor-pointer relative overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              400px circle at ${mouseX}px ${mouseY}px,
              rgba(var(--accent-rgb, 99, 102, 241), 0.1),
              transparent 80%
            )
          `,
        }}
      />

      <div className="flex justify-between items-start mb-2">
        <h4 className="font-bold text-sm text-foreground group-hover:text-accent transition-colors flex items-center gap-2 truncate pr-2">
          {title}
          {isLocal ? (
            <HardDrive size={12} className="text-accent-alt opacity-60 shrink-0" />
          ) : (
            <Database size={12} className="text-accent opacity-60 shrink-0" />
          )}
        </h4>
        <div className="flex items-center gap-1 shrink-0">
          {isPublished && (
            <span className="text-[8px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded bg-[#00D4B4]/10 text-[#00D4B4] border border-[#00D4B4]/20">
              Listed
            </span>
          )}
          {isLocal && (
            <span className="text-[8px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded bg-accent-alt/10 text-accent-alt border border-accent-alt/20">
              Local
            </span>
          )}
        </div>
      </div>

      <p className="text-xs text-text-soft mb-4 line-clamp-2">{description}</p>

      <div className="flex justify-between items-center text-[10px] text-text-soft mt-auto gap-2 flex-wrap">
        <span className="hidden sm:inline opacity-60 italic truncate">{lastPlayed}</span>

        <div className="flex gap-1.5 ml-auto flex-wrap justify-end">
          {onAutoTag && (
            <button
              onClick={(e) => { e.stopPropagation(); onAutoTag(); }}
              title="Auto-Tag with AI"
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-accent/10 text-accent text-[9px] font-black uppercase tracking-wider hover:bg-accent hover:text-white transition-all relative z-10"
            >
              <Sparkles size={9} />
            </button>
          )}
          {onPublish && (
            <button
              onClick={(e) => { e.stopPropagation(); onPublish(); }}
              title="Publish to Marketplace"
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-accent-alt/10 text-accent-alt text-[9px] font-black uppercase tracking-wider hover:bg-accent-alt hover:text-white transition-all relative z-10"
            >
              <Store size={9} />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); playAccelerate(); onPlay(); }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-bg-soft/50 text-text-soft font-bold uppercase tracking-wider hover:bg-white/10 hover:text-white transition-all relative z-10"
          >
            <Zap size={10} fill="currentColor" />
            <span>Solo</span>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); playAccelerate(); onHost(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent-soft text-accent font-bold uppercase tracking-wider hover:bg-accent hover:text-white transition-all relative z-10"
          >
            <Play size={10} fill="currentColor" />
            <span>Host</span>
          </button>
        </div>
      </div>
    </div>
  );
};
