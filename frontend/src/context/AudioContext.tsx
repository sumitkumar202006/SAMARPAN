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
  playHover: () => void;
  playToggle: () => void;
  playCountdown: () => void;
  playUrgent: () => void;
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
  const playHover = () => synthSound({ freq: 1500, duration: 0.02, type: 'sine', volume: 0.08 });

  const playToggle = () => {
    // Mechanical shutter / Slide sound
    synthSound({ freq: 800, duration: 0.05, type: 'square', volume: 0.1 });
    setTimeout(() => synthSound({ freq: 400, duration: 0.1, type: 'sine', rampTo: 100, volume: 0.15 }), 30);
    setTimeout(() => synthSound({ freq: 1200, duration: 0.04, type: 'sine', volume: 0.05 }), 100);
  };

  // Legacy mappings
  const playAccelerate = () => playNavigate();
  const playHorn = () => playError();

  /** Single sharp tick — used for countdown 5..1 */
  const playCountdown = () => synthSound({ freq: 1800, duration: 0.08, type: 'square', rampTo: 1200, volume: 0.18 });

  /** Double low-pulse — used for critical timer < 5s */
  const playUrgent = () => {
    synthSound({ freq: 80, duration: 0.06, type: 'sawtooth', volume: 0.25 });
    setTimeout(() => synthSound({ freq: 70, duration: 0.06, type: 'sawtooth', volume: 0.2 }), 100);
  };

  const toggleMute = () => setIsMuted(!isMuted);

  return (
    <AudioContext.Provider value={{ 
      playAccelerate, playHorn, playClick, playSuccess, playGlitch,
      playInput, playEnter, playError, playNavigate, playHover,
      playToggle, playCountdown, playUrgent, isMuted, toggleMute 
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
