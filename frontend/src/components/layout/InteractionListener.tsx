'use client';

import React, { useEffect } from 'react';
import { useAudio } from '@/context/AudioContext';

export const InteractionListener: React.FC = () => {
  const { playClick } = useAudio();

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Define what counts as an interactive element
      const isClickable = target.closest('button, a, input, select, textarea, [role="button"], .clickable');
      
      if (isClickable) {
        playClick();
      }
    };

    window.addEventListener('click', handleClick, { capture: true });
    return () => window.removeEventListener('click', handleClick, { capture: true });
  }, [playClick]);

  return null; // This component doesn't render anything
};
