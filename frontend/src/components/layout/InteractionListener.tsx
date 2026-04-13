'use client';

import React, { useEffect } from 'react';
import { useAudio } from '@/context/AudioContext';

export const InteractionListener: React.FC = () => {
  const { playHorn } = useAudio();

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // Check if the click target is a button, link, or part of an interactive component
      const target = e.target as HTMLElement;
      const isClickable = target.closest('button, a, input, select, textarea, [role="button"], .clickable');
      
      if (!isClickable) {
        playHorn();
      }
    };

    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [playHorn]);

  return null; // This component doesn't render anything
};
