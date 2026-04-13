'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export const SwordSlash: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn("relative flex items-center justify-center w-5 h-5", className)}>
      <motion.svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-current"
      >
        {/* Sword blade icon */}
        <motion.path
          d="M14.5 9.5L21 3M14.5 9.5L10 14M14.5 9.5L19 14"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
        <path
          d="M10 14L3 21M10 14L6 18"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </motion.svg>
      
      {/* Decorative slash arc */}
      <motion.div
        className="absolute inset-0 border-r-2 border-t-2 border-white/40 rounded-full"
        initial={{ rotate: -90, opacity: 0 }}
        whileHover={{ rotate: 90, opacity: 1 }}
        transition={{ duration: 0.3 }}
      />
    </div>
  );
};
