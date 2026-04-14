'use client';

import React, { createContext, useContext, useRef, useState, useEffect } from 'react';

interface AudioContextType {
  playAccelerate: () => void;
  playHorn: () => void;
  playClick: () => void;
  playSuccess: () => void;
  playGlitch: () => void;
  isMuted: boolean;
  toggleMute: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  
  const accelerateRef = useRef<HTMLAudioElement | null>(null);
  const hornRef = useRef<HTMLAudioElement | null>(null);
  const clickRef = useRef<HTMLAudioElement | null>(null);
  const successRef = useRef<HTMLAudioElement | null>(null);
  const glitchRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // 1. Accelerate - Fast transition / Navigation
    accelerateRef.current = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-fast-double-click-on-computer-mouse-275.mp3');
    // 2. Horn - Background Pulse / Error / Cancel
    hornRef.current = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-low-impact-digital-heartbeat-2124.mp3');
    // 3. Click - Minimalist tactile blip
    clickRef.current = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-positive-interface-click-1112.mp3');
    // 4. Success - Task completed / Forward motion
    successRef.current = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-modern-technology-select-3124.mp3');
    // 5. Glitch - Special "Crazy" but minimal sound
    glitchRef.current = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-crunchy-digital-input-904.mp3');
    
    // Set refined volumes
    accelerateRef.current.volume = 0.25;
    hornRef.current.volume = 0.2;
    clickRef.current.volume = 0.15;
    successRef.current.volume = 0.2;
    glitchRef.current.volume = 0.15;

    // Load audio on mount
    [accelerateRef, hornRef, clickRef, successRef, glitchRef].forEach(ref => ref.current?.load());
  }, []);

  const unlockAudio = () => {
    if (!hasInteracted) {
      setHasInteracted(true);
      // Brief silent play to unlock the browser's audio context
      [accelerateRef, clickRef].forEach(ref => {
        if (ref.current) {
          const p = ref.current.play();
          if (p) p.then(() => ref.current?.pause()).catch(() => {});
        }
      });
    }
  };

  const playSound = (ref: React.MutableRefObject<HTMLAudioElement | null>) => {
    unlockAudio();
    if (isMuted || !ref.current) return;
    ref.current.currentTime = 0;
    ref.current.play().catch(e => console.log("Audio play blocked", e));
  };

  const playAccelerate = () => playSound(accelerateRef);
  const playHorn = () => playSound(hornRef);
  const playClick = () => playSound(clickRef);
  const playSuccess = () => playSound(successRef);
  const playGlitch = () => playSound(glitchRef);

  const toggleMute = () => setIsMuted(!isMuted);

  return (
    <AudioContext.Provider value={{ 
      playAccelerate, playHorn, playClick, playSuccess, playGlitch, 
      isMuted, toggleMute 
    }}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};
