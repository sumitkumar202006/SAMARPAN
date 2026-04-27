'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, useSpring, useMotionValue, AnimatePresence } from 'framer-motion';

export const AuraCursor = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  // false = unknown (SSR), true = has fine pointer (mouse), false = touch-only
  const [hasFinePointer, setHasFinePointer] = useState<boolean | null>(null);

  // Raw values for ZERO-DELAY tracking (feels like native cursor)
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);

  // High-performance spring physics for the trailing elements only
  const springConfig = { damping: 40, stiffness: 800, mass: 0.1 };
  const springX = useSpring(rawX, springConfig);
  const springY = useSpring(rawY, springConfig);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Only enable cursor on devices with a precise pointer (mouse/trackpad)
    setHasFinePointer(window.matchMedia('(pointer: fine)').matches);
  }, []);

  // Dedicated trail springs (slightly slower for the 'exhaust' effect)
  const trailX = useSpring(rawX, { damping: 25, stiffness: 300 });
  const trailY = useSpring(rawY, { damping: 25, stiffness: 300 });

  useEffect(() => {
    if (!isMounted) return;

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
  }, [isVisible, rawX, rawY, isMounted]);

  if (!isMounted || !isVisible || hasFinePointer === false) return null;

  const sharedStyles: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    pointerEvents: 'none',
    zIndex: 9991,
    willChange: 'transform',
  };

  return (
    <>
      {/* 1. Decorative Trailing Layer (Spring-based lag) */}
      <motion.div
        style={{
          ...sharedStyles,
          x: trailX,
          y: trailY,
          translateX: '-50%',
          translateY: '-50%',
        }}
        className="flex items-center justify-center p-4"
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

      {/* 2. Primary Core Layer (Zero Latency - Native Speed) */}
      <motion.div
        style={{
          ...sharedStyles,
          x: rawX,
          y: rawY,
          translateX: '-50%',
          translateY: '-50%',
          zIndex: 9992, // Core on top
        }}
        className="flex items-center justify-center"
      >
        {/* The Central Core */}
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
      </motion.div>
    </>
  );
};
