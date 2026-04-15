'use client';

import React, { useEffect, useState } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { NeuralBackground } from './NeuralBackground';

export const DynamicBackground = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { scrollY } = useScroll();
  
  // Subtle parallax effect based on scroll
  const backgroundY = useTransform(scrollY, [0, 1000], [0, 200]);
  const secondaryY = useTransform(scrollY, [0, 1000], [0, -100]);
  
  // Smooth spring mouse values for parallax
  const smoothX = useSpring(0, { damping: 50, stiffness: 200 });
  const smoothY = useSpring(0, { damping: 50, stiffness: 200 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Small movement range for background elements
      const x = (e.clientX / window.innerWidth - 0.5) * 40;
      const y = (e.clientY / window.innerHeight - 0.5) * 40;
      smoothX.set(x);
      smoothY.set(y);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [smoothX, smoothY]);

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

      {/* 2. Animated Aurora Blobs */}
      <motion.div
        style={{ x: smoothX, y: backgroundY }}
        className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-accent/15 blur-[120px]"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.15, 0.25, 0.15],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        style={{ x: useTransform(smoothX, x => x * -1.5), y: secondaryY }}
        className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent-alt/10 blur-[100px]"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />

      <motion.div
        style={{ x: useTransform(smoothX, x => x * 0.8), y: useTransform(secondaryY, y => y * 0.5) }}
        className="absolute top-[30%] right-[10%] w-[30%] h-[30%] rounded-full bg-indigo-500/10 blur-[90px]"
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
