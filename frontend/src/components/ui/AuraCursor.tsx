'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, useSpring, useMotionValue, AnimatePresence } from 'framer-motion';

export const AuraCursor = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  
  // Spring physics for buttery smooth following
  const mouseX = useSpring(0, { damping: 30, stiffness: 250 });
  const mouseY = useSpring(0, { damping: 30, stiffness: 250 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isVisible) setIsVisible(true);
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);

      const target = e.target as HTMLElement;
      const hoverable = target.closest('button, a, input, select, textarea, [role="button"]');
      setIsHovering(!!hoverable);
    };

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);
    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [isVisible, mouseX, mouseY]);

  if (!isVisible) return null;

  return (
    <motion.div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        x: mouseX,
        y: mouseY,
        pointerEvents: 'none',
        zIndex: 99999,
        translateX: '-50%',
        translateY: '-50%',
      }}
    >
      <div className="relative flex items-center justify-center">
        {/* Outer Pulsing Aura */}
        <motion.div
          animate={{
            scale: isHovering ? [1, 1.2, 1] : [1, 1.1, 1],
            opacity: isHovering ? 0.8 : 0.4,
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute w-12 h-12 rounded-full bg-accent/20 blur-xl"
        />

        {/* Outer Segmented Ring (Rotating Clockwise) */}
        <motion.svg
          width="40"
          height="40"
          viewBox="0 0 40 40"
          animate={{ rotate: isHovering ? 360 : 180 }}
          transition={{ duration: isHovering ? 1 : 4, repeat: Infinity, ease: "linear" }}
          className="absolute text-accent"
        >
          <circle 
            cx="20" cy="20" r="18" 
            stroke="currentColor" strokeWidth="1" 
            strokeDasharray="20 40" 
            fill="none" 
            opacity={isHovering ? 1 : 0.6}
          />
        </motion.svg>

        {/* Inner Segmented Ring (Rotating Counter-Clockwise) */}
        <motion.svg
          width="28"
          height="28"
          viewBox="0 0 28 28"
          animate={{ rotate: isHovering ? -360 : -180 }}
          transition={{ duration: isHovering ? 0.8 : 3, repeat: Infinity, ease: "linear" }}
          className="absolute text-accent-alt"
        >
          <circle 
            cx="14" cy="14" r="12" 
            stroke="currentColor" strokeWidth="2" 
            strokeDasharray="10 20" 
            fill="none" 
            opacity={isHovering ? 1 : 0.6}
          />
        </motion.svg>

        {/* The Central Core */}
        <motion.div
          animate={{
            scale: isClicking ? 0.6 : (isHovering ? 1.4 : 1),
            boxShadow: isHovering 
              ? "0 0 20px rgba(99, 102, 241, 0.8)" 
              : "0 0 10px rgba(99, 102, 241, 0.4)",
          }}
          className="relative w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_10px_white] z-10"
        />

        {/* Click/Action Burst */}
        <AnimatePresence>
          {isClicking && (
            <motion.div
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 4, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute w-2 h-2 rounded-full border border-white"
            />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
