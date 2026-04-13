'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, useSpring, useMotionValue, AnimatePresence } from 'framer-motion';

export const SwordCursor = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  
  // Spring physics for smooth following
  const mouseX = useSpring(0, { damping: 25, stiffness: 200 });
  const mouseY = useSpring(0, { damping: 25, stiffness: 200 });
  
  // Sword rotation logic
  const rotation = useSpring(-15, { damping: 15, stiffness: 100 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isVisible) setIsVisible(true);
      
      const { clientX: x, clientY: y } = e;
      mouseX.set(x);
      mouseY.set(y);

      // Check if hovering over clickable elements
      const target = e.target as HTMLElement;
      const hoverable = target.closest('button, a, input, select, textarea, [role="button"]');
      setIsHovering(!!hoverable);
    };

    const handleMouseDown = () => {
      setIsClicking(true);
      rotation.set(0); // Slash downward
    };

    const handleMouseUp = () => {
      setIsClicking(false);
      rotation.set(-15); // Return to slightly tilted
    };

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
  }, [isVisible, mouseX, mouseY, rotation]);

  if (!isVisible) return null;

  return (
    <motion.div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        x: mouseX,
        y: mouseY,
        rotate: rotation,
        pointerEvents: 'none',
        zIndex: 99999,
        // Center the sword on the pointer tip
        transformOrigin: 'bottom right', 
        marginLeft: -32,
        marginTop: -32,
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ 
        opacity: 1, 
        scale: isHovering ? 1.4 : 1.2,
        filter: isHovering 
          ? 'drop-shadow(0 0 12px rgba(168, 85, 247, 0.8))' 
          : 'drop-shadow(0 0 6px rgba(168, 85, 247, 0.4))'
      }}
      transition={{ type: 'spring', damping: 15 }}
    >
      <svg
        width="64"
        height="64"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="filter drop-shadow-[0_0_4px_rgba(168,85,247,0.8)]"
        style={{ transform: 'rotate(-45deg)' }} // Standard Minecraft item orientation
      >
        {/* Minecraft Sword Silhouette in 16x16 Pixel Grid */}
        
        {/* Blade (Bottom-left to top-right diagonal) */}
        <path d="M15 0h1v1h-1V0z" fill="#fff" fillOpacity="0.3" /> {/* Tip shine */}
        <path 
          d="M6 9h1v1H6V9zm1-1h1v1H7V8zm1-1h1v1H8V7zm1-1h1v1H9V6zm1-1h1v1h-1V5zm1-1h1v1h-1V4zm1-1h1v1h-1V3zm1-1h1v1h-1V2zm1-1h1v1h-1V1z" 
          fill="#a855f7" 
        />
        <path 
          d="M5 10h1v1H5v-1zm1-1h1v1H6V9zm1-1h1v1H7V8zm1-1h1v1H8V7zm1-1h1v1H9V6zm1-1h1v1h-1V5zm1-1h1v1h-1V4zm1-1h1v1h-1V3zm1-1h1v1h-1V2z" 
          fill="#7e22ce" 
        />
        <path 
          d="M7 10h1v1H7v-1zm1-1h1v1H8V9zm1-1h1v1H9V8zm1-1h1v1h-1V7zm1-1h1v1h-1V6zm1-1h1v1h-1V5zm1-1h1v1h-1V4zm1-1h1v1h-1V3z" 
          fill="#6b21a8" 
        />

        {/* Guard */}
        <path d="M3 10h3v1H3v-1zm2 1h1v2H5v-2zm-1 1h1v1H4v-1zm6-7v3h-1V4h1zm1 2h2v1h-2V6zm1 1v1h1V7h-1z" fill="#581c87" />
        <path d="M4 11h2v1H4v-1zm1 1h1v1H5v-1zm5-6h1v2h-1V5zm1 1h1v1h-1V6z" fill="#3b0764" />

        {/* Handle */}
        <path d="M2 13h1v1H2v-1zm1 1h1v1H3v-1zm1 1h1v1H4v-1z" fill="#4c1d95" />
        <path d="M3 13h1v1H3v-1zm1 1h1v1H4v-1z" fill="#2e1065" />
        <path d="M1 14h1v1H1v-1zm1 1h1v1H2v-1zm3-3h1v1H5v-1z" fill="#1e1b4b" />
      </svg>
      
      {/* Click Slash Effect */}
      <AnimatePresence>
        {isClicking && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, rotate: -45 }}
            animate={{ opacity: 1, scale: 1.5, rotate: 0 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 to-transparent rounded-full blur-xl"
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};
