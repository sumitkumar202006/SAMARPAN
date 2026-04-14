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
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    // Initialize Web Audio Context on the first user interaction
    const initAudioContext = () => {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
    };

    window.addEventListener('click', initAudioContext, { once: true });
    window.addEventListener('keydown', initAudioContext, { once: true });

    return () => {
      window.removeEventListener('click', initAudioContext);
      window.removeEventListener('keydown', initAudioContext);
    };
  }, []);

  // Synthesize a minimalist "Crazy" blip using an Oscillator (Zero external dependencies)
  const synthClick = (frequency: number = 800, duration: number = 0.05, type: OscillatorType = 'sine') => {
    if (isMuted || !audioCtxRef.current) return;
    
    // Resume context if it's suspended (browsers block it until interaction)
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }

    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    // Rapid frequency drop for a "click" feel
    osc.frequency.exponentialRampToValueAtTime(10, ctx.currentTime + duration);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  };

  const playClick = () => synthClick(1200, 0.04, 'sine'); // High crisp blip
  const playSuccess = () => synthClick(800, 0.15, 'triangle'); // Warm chime
  const playGlitch = () => synthClick(2000, 0.05, 'square'); // Short digital crunchy pop
  
  // Fallbacks for existing calls
  const playAccelerate = () => synthClick(1500, 0.1, 'sine');
  const playHorn = () => synthClick(100, 0.2, 'sine');

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
