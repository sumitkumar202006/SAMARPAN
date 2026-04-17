'use client';

import React, { useEffect, useState } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { NeuralBackground } from './NeuralBackground';

export const DynamicBackground = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { scrollY } = useScroll();
  const pathname = usePathname();
  
  // Performance Mode: Disable heavy GPU/CPU background calculations during active arena matches
  // Resolves extreme battery drain and device heating.
  const isMatchOrLobby = pathname?.includes('/play') || pathname?.includes('/lobby') || pathname?.includes('/host/live');

  // Subtle parallax effect based on scroll
  const backgroundY = useTransform(scrollY, [0, 1000], [0, 200]);
  const secondaryY = useTransform(scrollY, [0, 1000], [0, -100]);
  
  // Smooth spring mouse values for parallax
  const smoothX = useSpring(0, { damping: 50, stiffness: 200 });
  const smoothY = useSpring(0, { damping: 50, stiffness: 200 });

  // Pre-computed transforms to avoid calling hooks inside JSX or after early returns
  const reverseXTransform = useTransform(smoothX, x => x * -1.5);
  const smallXTransform = useTransform(smoothX, x => x * 0.8);
  const halfSecondaryY = useTransform(secondaryY, y => y * 0.5);

  useEffect(() => {
    if (isMatchOrLobby) return; // Don't bind listeners if we're disabled

    const handleMouseMove = (e: MouseEvent) => {
      // Small movement range for background elements
      const x = (e.clientX / window.innerWidth - 0.5) * 40;
      const y = (e.clientY / window.innerHeight - 0.5) * 40;
      smoothX.set(x);
      smoothY.set(y);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [smoothX, smoothY, isMatchOrLobby]);

  // High-Performance Base Only for Matches
  if (isMatchOrLobby) {
    return (
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#020617]">
        <div 
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `
              radial-gradient(circle at 20% 30%, #4338ca 0%, transparent 40%),
              radial-gradient(circle at 80% 70%, #1e1b4b 0%, transparent 40%),
              radial-gradient(circle at 50% 50%, #0f172a 0%, transparent 100%)
            `
          }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] opacity-[0.05]" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#020617]">
      {/* 1. Base Mesh Gradient */}
      <div 
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 30%, #4338ca 0%, transparent 40%),
            radial-gradient(circle at 80% 70%, #1e1b4b 0%, transparent 40%),
            radial-gradient(circle at 50% 50%, #0f172a 0%, transparent 100%)
          `
        }}
      />

      {/* 2. Animated Aurora Blobs (Hidden on mobile for performance) */}
      <motion.div
        style={{ x: smoothX, y: backgroundY }}
        className="hidden sm:block absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-accent/15 blur-[120px]"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.15, 0.25, 0.15],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        style={{ x: reverseXTransform, y: secondaryY }}
        className="hidden sm:block absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent-alt/10 blur-[100px]"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />

      <motion.div
        style={{ x: smallXTransform, y: halfSecondaryY }}
        className="hidden sm:block absolute top-[30%] right-[10%] w-[30%] h-[30%] rounded-full bg-indigo-500/10 blur-[90px]"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.05, 0.15, 0.05],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* 3. Neural Network Particle Layer */}
      <NeuralBackground />

      {/* 4. Moving Highlight Line (Cyber Scan) */}
      <motion.div 
        className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-accent/20 to-transparent"
        animate={{ top: ['-10%', '110%'] }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      />
      
      {/* 5. Vignette (Darker Edges) */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#020617]/40 shadow-[inset_0_0_150px_rgba(2,6,23,0.8)]" />
    </div>
  );
};
