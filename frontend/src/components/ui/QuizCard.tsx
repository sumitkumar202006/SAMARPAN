import { Play } from 'lucide-react';
import { motion, useMotionTemplate, useMotionValue } from 'framer-motion';
import { useAudio } from '@/context/AudioContext';

interface QuizCardProps {
  title: string;
  description: string;
  lastPlayed: string;
  onHost: () => void;
}

export const QuizCard: React.FC<QuizCardProps> = ({ title, description, lastPlayed, onHost }) => {
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
              rgba(99, 102, 241, 0.1),
              transparent 80%
            )
          `,
        }}
      />
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-bold text-sm text-foreground group-hover:text-accent transition-colors">{title}</h4>
      </div>
      <p className="text-xs text-text-soft mb-4">{description}</p>
      
      <div className="flex justify-between items-center text-[10px] text-text-soft">
        <span>Last played: {lastPlayed}</span>
        <button 
          onClick={(e) => { 
            e.stopPropagation(); 
            playAccelerate();
            onHost(); 
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent-soft text-accent font-bold uppercase tracking-wider hover:bg-accent hover:text-white transition-all overflow-hidden relative z-10"
        >
          <Play size={10} fill="currentColor" />
          <span>Host again</span>
        </button>
      </div>
    </div>
  );
};
