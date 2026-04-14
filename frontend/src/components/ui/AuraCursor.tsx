'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, useSpring, useMotionValue, AnimatePresence } from 'framer-motion';

export const AuraCursor = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  
  // Raw values for ZERO-DELAY tracking (feels like native cursor)
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  
  // High-performance spring physics for the trailing elements only
  const springConfig = { damping: 40, stiffness: 800, mass: 0.1 };
  const springX = useSpring(rawX, springConfig);
  const springY = useSpring(rawY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isVisible) setIsVisible(true);
      
      // Update raw values instantly (Zero Latency)
      rawX.set(e.clientX);
      rawY.set(e.clientY);

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
  }, [isVisible, rawX, rawY]);

  if (!isVisible) return null;

  return (
    <motion.div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        x: rawX,
        y: rawY,
        pointerEvents: 'none',
        zIndex: 9991, // Keep core accessible
        translateX: '-50%',
        translateY: '-50%',
        willChange: 'transform',
      }}
    >
      <div className="relative flex items-center justify-center">
        {/* Decorative Trailing Elements (Spring-based lag effect) */}
        <motion.div
          style={{
            position: 'absolute',
            x: useSpring(useMotionValue(0), { damping: 25, stiffness: 300 }), // Dedicated trail lag
            y: useSpring(useMotionValue(0), { damping: 25, stiffness: 300 }),
          }}
          className="relative flex items-center justify-center pointer-events-none"
        >
          {/* Outer Pulsing Aura */}
          <motion.div
            animate={{
              scale: isHovering ? [1, 1.4, 1] : [1, 1.2, 1],
              opacity: isHovering ? 0.6 : 0.3,
            }}
            transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
            className="absolute w-12 h-12 rounded-full bg-accent/30 blur-xl"
          />

          {/* Outer Segmented Ring */}
          <motion.svg
            width="40"
            height="40"
            viewBox="0 0 40 40"
            animate={{ rotate: isHovering ? 720 : 360 }}
            transition={{ duration: isHovering ? 0.8 : 3, repeat: Infinity, ease: "linear" }}
            className="absolute text-accent"
          >
            <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="1" strokeDasharray="20 40" fill="none" opacity={isHovering ? 1 : 0.5} />
          </motion.svg>

          {/* Inner Segmented Ring */}
          <motion.svg
            width="28"
            height="28"
            viewBox="0 0 28 28"
            animate={{ rotate: isHovering ? -720 : -360 }}
            transition={{ duration: isHovering ? 0.6 : 2, repeat: Infinity, ease: "linear" }}
            className="absolute text-accent-alt"
          >
            <circle cx="14" cy="14" r="12" stroke="currentColor" strokeWidth="2" strokeDasharray="10 20" fill="none" opacity={isHovering ? 1 : 0.5} />
          </motion.svg>
        </motion.div>

        {/* The Central Core (Zero Latency - Pure Hardware Accelerated) */}
        <motion.div
          animate={{
            scale: isClicking ? 0.5 : (isHovering ? 1.8 : 1),
            boxShadow: isHovering 
              ? "0 0 30px rgba(99, 102, 241, 1)" 
              : "0 0 15px rgba(99, 102, 241, 0.5)",
          }}
          transition={{ type: "spring", stiffness: 600, damping: 30 }}
          className="relative w-2 h-2 rounded-full bg-white shadow-[0_0_15px_white] z-10"
        />

        {/* Click/Action Burst */}
        <AnimatePresence>
          {isClicking && (
            <motion.div
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 6, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="absolute w-2 h-2 rounded-full border-2 border-white"
            />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
