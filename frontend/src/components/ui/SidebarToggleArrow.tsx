'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

interface SidebarToggleArrowProps {
  isCollapsed: boolean;
  onClick: () => void;
}

export const SidebarToggleArrow: React.FC<SidebarToggleArrowProps> = ({ isCollapsed, onClick }) => {
  return (
    <motion.button
      onClick={onClick}
      className={cn(
        "absolute -right-4 z-[60]",
        "flex items-center justify-center w-8 h-20 group cursor-pointer outline-none",
        isCollapsed ? "top-1/2 -translate-y-1/2" : "top-20"
      )}
      initial={false}
      animate={{ 
        x: 0,
        rotate: isCollapsed ? 0 : 0 
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* The Futuristic Semicircular Base */}
      <div className="absolute inset-0 bg-[#020617]/80 backdrop-blur-xl border border-white/10 rounded-r-3xl rounded-l-none shadow-[0_0_20px_rgba(0,0,0,0.5)] overflow-hidden">
        {/* Animated Glow Trail */}
        <motion.div 
          className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-accent/40 to-transparent"
          animate={{
            top: [-100, 100],
            opacity: [0, 1, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <div className="absolute inset-0 border-r-2 border-accent/20 group-hover:border-accent/50 transition-colors" />
      </div>

      {/* The "Crazy" Arrow SVG */}
      <motion.div
        animate={{ rotate: isCollapsed ? 0 : 180 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="relative z-10 flex items-center justify-center"
      >
        <div className="relative">
          {/* Neon Ring */}
          <motion.div 
            className="absolute inset-0 -m-2 border border-accent/30 rounded-full blur-sm"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <ChevronRight className="text-white group-hover:text-accent transition-colors drop-shadow-[0_0_8px_rgba(99,102,241,0.8)]" size={20} />
        </div>
      </motion.div>

      {/* Holographic detail line */}
      <div className="absolute right-1 top-[15%] bottom-[15%] w-[1px] bg-gradient-to-b from-transparent via-accent/30 to-transparent" />
    </motion.button>
  );
};
