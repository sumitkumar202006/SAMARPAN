'use client';

import React, { useEffect, useRef } from 'react';
import { BikeArrow } from './BikeArrow';

export const BikeCursor = () => {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    // Use a direct event handler for absolute zero delay
    // This bypasses requestAnimationFrame and React's lifecycle
    const handleMouseMove = (e: MouseEvent) => {
      if (cursor) {
        // Direct style manipulation is the fastest possible way in JS
        cursor.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
        
        // Throttled hover check (every 5 pixels) to save CPU
        const target = e.target as HTMLElement;
        const hoverable = target.closest('button, a, input, select, textarea, [role="button"]');
        if (hoverable) {
          cursor.setAttribute('data-hovering', 'true');
        } else {
          cursor.removeAttribute('data-hovering');
        }
      }
    };

    const handleMouseLeave = () => {
      if (cursor) cursor.style.opacity = '0';
    };
    
    const handleMouseEnter = () => {
      if (cursor) cursor.style.opacity = '1';
    };

    // Use capture: true for high-priority event handling
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    // Absolute global cursor hide
    const style = document.createElement('style');
    style.id = 'hide-native-cursor';
    style.innerHTML = `* { cursor: none !important; }`;
    document.head.appendChild(style);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      document.getElementById('hide-native-cursor')?.remove();
    };
  }, []);

  return (
    <div
      ref={cursorRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 9999999, // Max priority
        marginLeft: '-12px',
        marginTop: '-8px',
        willChange: 'transform',
        opacity: 0,
        // No transition on transform here! Only on opacity.
        transition: 'opacity 0.15s ease-out', 
      }}
      className="cursor-root-container"
    >
      {/* Inner wrapper for visual effects (scaling) so it doesn't slow down the position */}
      <div className="relative transition-transform duration-200 ease-out [[data-hovering='true']_&]:scale-[1.6]">
        <BikeArrow className="text-accent drop-shadow-[0_0_12px_rgba(99,102,241,0.6)]" />
        
        {/* Anti-Lag Tail */}
        <div className="absolute right-full top-1/2 -translate-y-1/2 w-8 h-[1px] bg-gradient-to-r from-transparent to-accent/30 blur-[0.5px] pointer-events-none" />
      </div>

      <style jsx>{`
        .cursor-root-container[data-hovering='true'] .text-accent {
          filter: drop-shadow(0 0 20px rgba(99,102,241,1));
        }
      `}</style>
    </div>
  );
};
