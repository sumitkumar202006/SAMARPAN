'use client';

import React, { useEffect } from 'react';
import { useAudio } from '@/context/AudioContext';

export const InteractionListener: React.FC = () => {
  const { playClick, playInput } = useAudio();

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // 1. Text Inputs / Textareas get a subtle "Tick"
      const isInput = target.closest('input, textarea, select, [contenteditable="true"]');
      if (isInput) {
        playInput();
        return;
      }

      // 2. Clickable Elements (Buttons, Links) get a crisp "Click"
      const isClickable = target.closest('button, a, [role="button"], .clickable');
      if (isClickable) {
        playClick();
      }
    };

    window.addEventListener('click', handleClick, { capture: true });
    return () => window.removeEventListener('click', handleClick, { capture: true });
  }, [playClick, playInput]);

  return null; // This component doesn't render anything
};
