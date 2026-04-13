'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface BikeArrowProps {
  className?: string;
  speed?: number; // Animation duration in seconds (lower is faster)
}

export const BikeArrow: React.FC<BikeArrowProps> = ({ className, speed = 1 }) => {
  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <motion.svg
        width="24"
        height="16"
        viewBox="0 0 24 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-current"
      >
        {/* Bike Frame */}
        <path 
          d="M4 12L8 4H16L20 12" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
        <path 
          d="M8 4L10 2H14" 
          stroke="currentColor" 
          strokeWidth="1.5" 
          strokeLinecap="round" 
        />
        
        {/* Wheels */}
        <motion.circle
          cx="6"
          cy="12"
          r="3"
          stroke="currentColor"
          strokeWidth="1.5"
          animate={{ rotate: 360 }}
          transition={{ duration: speed, repeat: Infinity, ease: "linear" }}
        />
        <motion.circle
          cx="18"
          cy="12"
          r="3"
          stroke="currentColor"
          strokeWidth="1.5"
          animate={{ rotate: 360 }}
          transition={{ duration: speed, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Spoke detail for wheels to show rotation */}
        <motion.line
          x1="6" y1="9" x2="6" y2="15"
          stroke="currentColor" strokeWidth="1"
          animate={{ rotate: 360 }}
          transition={{ duration: speed, repeat: Infinity, ease: "linear" }}
          style={{ originX: '6px', originY: '12px' }}
        />
        <motion.line
          x1="18" y1="9" x2="18" y2="15"
          stroke="currentColor" strokeWidth="1"
          animate={{ rotate: 360 }}
          transition={{ duration: speed, repeat: Infinity, ease: "linear" }}
          style={{ originX: '18px', originY: '12px' }}
        />
      </motion.svg>
    </div>
  );
};
