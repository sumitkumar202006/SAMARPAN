'use client';

import React, { createContext, useContext, useRef, useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

interface AudioContextType {
  playAccelerate: () => void;
  playHorn: () => void;
  playClick: () => void;
  playSuccess: () => void;
  playGlitch: () => void;
  playInput: () => void;
  playEnter: () => void;
  playError: () => void;
  playNavigate: () => void;
  isMuted: boolean;
  toggleMute: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isMuted, setIsMuted] = useState(false);

  // Sync with user settings
  useEffect(() => {
    if (user?.settings) {
      setIsMuted(!user.settings.soundEnabled);
    }
  }, [user]);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
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

  const synthSound = (params: {
    freq: number,
    duration: number,
    type?: OscillatorType,
    rampTo?: number,
    volume?: number,
    rampType?: 'exponential' | 'linear'
  }) => {
    if (isMuted || !audioCtxRef.current) return;
    
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }

    const { freq, duration, type = 'sine', rampTo = 10, volume = 0.3, rampType = 'exponential' } = params;
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (rampType === 'exponential') {
      osc.frequency.exponentialRampToValueAtTime(Math.max(rampTo, 0.001), ctx.currentTime + duration);
    } else {
      osc.frequency.linearRampToValueAtTime(rampTo, ctx.currentTime + duration);
    }

    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  };

  const playClick = () => synthSound({ freq: 1200, duration: 0.04, type: 'sine', volume: 0.2 });
  const playInput = () => synthSound({ freq: 2500, duration: 0.02, type: 'sine', volume: 0.1 }); // Ultra-light tick
  const playSuccess = () => synthSound({ freq: 800, duration: 0.2, type: 'triangle', rampTo: 1200, volume: 0.2 });
  const playGlitch = () => synthSound({ freq: 2000, duration: 0.05, type: 'square', volume: 0.15 });
  
  const playEnter = () => {
    // Multi-tone "Arena" startup sound
    synthSound({ freq: 400, duration: 0.4, type: 'triangle', rampTo: 800, volume: 0.25 });
    setTimeout(() => synthSound({ freq: 600, duration: 0.3, type: 'sine', rampTo: 1200, volume: 0.2 }), 50);
  };

  const playError = () => {
    synthSound({ freq: 150, duration: 0.1, type: 'square', rampTo: 50, volume: 0.3 });
    setTimeout(() => synthSound({ freq: 120, duration: 0.15, type: 'square', rampTo: 30, volume: 0.3 }), 100);
  };

  const playNavigate = () => synthSound({ freq: 400, duration: 0.3, type: 'sine', rampTo: 50, volume: 0.15, rampType: 'linear' });

  // Legacy mappings
  const playAccelerate = () => playNavigate();
  const playHorn = () => playError();

  const toggleMute = () => setIsMuted(!isMuted);

  return (
    <AudioContext.Provider value={{ 
      playAccelerate, playHorn, playClick, playSuccess, playGlitch,
      playInput, playEnter, playError, playNavigate,
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
