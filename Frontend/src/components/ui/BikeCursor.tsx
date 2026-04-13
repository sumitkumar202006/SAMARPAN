'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';
import { BikeArrow } from './BikeArrow';

export const BikeCursor = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  
  // Spring physics for smooth following
  const mouseX = useSpring(0, { damping: 20, stiffness: 150 });
  const mouseY = useSpring(0, { damping: 20, stiffness: 150 });
  
  // Store previous position to calculate velocity
  const prevPos = useRef({ x: 0, y: 0 });
  const [velocity, setVelocity] = useState(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isVisible) setIsVisible(true);
      
      const { clientX: x, clientY: y } = e;
      
      // Calculate velocity
      const dx = x - prevPos.current.x;
      const dy = y - prevPos.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      setVelocity(dist);
      prevPos.current = { x, y };

      // Update positions
      mouseX.set(x);
      mouseY.set(y);

      // Check if hovering over clickable elements
      const target = e.target as HTMLElement;
      const hoverable = target.closest('button, a, input, select, textarea, [role="button"]');
      setIsHovering(!!hoverable);
    };

    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
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
        // Offset to align with pointer tip (bike center)
        marginLeft: -12, 
        marginTop: -8,
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ 
        opacity: 1, 
        scale: isHovering ? 1.5 : 1,
        filter: isHovering ? 'drop-shadow(0 0 8px rgba(99, 102, 241, 0.8))' : 'drop-shadow(0 0 4px rgba(99, 102, 241, 0.4))'
      }}
      transition={{ type: 'spring', damping: 15 }}
    >
      <BikeArrow className="text-accent" speed={Math.max(0.1, 1 - (velocity / 50))} />
      
      {/* Velocity Spark Effect - only when moving fast */}
      {velocity > 20 && (
        <motion.div
          animate={{ opacity: [0, 1, 0], x: [-10, -20] }}
          className="absolute right-full top-1/2 -translate-y-1/2 w-4 h-[1px] bg-accent"
        />
      )}
    </motion.div>
  );
};
