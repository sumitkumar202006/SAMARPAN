'use client';

import React, { createContext, useContext, useRef, useState, useEffect } from 'react';

interface AudioContextType {
  playAccelerate: () => void;
  playHorn: () => void;
  isMuted: boolean;
  toggleMute: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  
  const accelerateRef = useRef<HTMLAudioElement | null>(null);
  const hornRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Clean Futuristic Interface Click
    accelerateRef.current = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-positive-interface-click-1112.mp3');
    // Subtle Digital Pulse for background
    hornRef.current = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-low-impact-digital-heartbeat-2124.mp3');
    
    accelerateRef.current.volume = 0.3;
    hornRef.current.volume = 0.2;

    // Load audio on mount
    accelerateRef.current.load();
    hornRef.current.load();
  }, []);

  const unlockAudio = () => {
    if (!hasInteracted) {
      setHasInteracted(true);
      // Brief silent play to unlock the context
      if (accelerateRef.current) {
        const p = accelerateRef.current.play();
        if (p) p.then(() => accelerateRef.current?.pause()).catch(() => {});
      }
    }
  };

  const playAccelerate = () => {
    unlockAudio();
    if (isMuted || !accelerateRef.current) return;
    accelerateRef.current.currentTime = 0;
    accelerateRef.current.play().catch(e => console.log("Audio play blocked", e));
  };

  const playHorn = () => {
    unlockAudio();
    if (isMuted || !hornRef.current) return;
    hornRef.current.currentTime = 0;
    hornRef.current.play().catch(e => console.log("Audio play blocked", e));
  };

  const toggleMute = () => setIsMuted(!isMuted);

  return (
    <AudioContext.Provider value={{ playAccelerate, playHorn, isMuted, toggleMute }}>
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
