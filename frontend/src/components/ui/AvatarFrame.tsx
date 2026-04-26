'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface AvatarFrameProps {
  src?: string | null;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  frame?: string | null;      // 'none' | 'bronze' | 'gold' | 'diamond' | 'champion'
  plan?: string | null;       // 'free' | 'pro' | 'elite' | 'institution'
  showFrame?: boolean;
  className?: string;
  onClick?: () => void;
}

const FRAME_CONFIG: Record<string, { gradient: string; glow: string; label: string; icon: string }> = {
  none:      { gradient: 'from-white/10 to-white/5',                    glow: '',                                    label: '',            icon: '' },
  bronze:    { gradient: 'from-amber-700 via-amber-500 to-amber-700',   glow: 'shadow-[0_0_12px_rgba(180,83,9,0.6)]', label: 'Bronze',      icon: '🥉' },
  gold:      { gradient: 'from-yellow-400 via-amber-300 to-yellow-500', glow: 'shadow-[0_0_16px_rgba(234,179,8,0.7)]',label: 'Gold',        icon: '🥇' },
  diamond:   { gradient: 'from-cyan-400 via-blue-300 to-indigo-400',    glow: 'shadow-[0_0_20px_rgba(34,211,238,0.7)]',label: 'Diamond',    icon: '💎' },
  champion:  { gradient: 'from-purple-500 via-pink-400 to-indigo-500',  glow: 'shadow-[0_0_24px_rgba(168,85,247,0.8)]',label: 'Champion',   icon: '👑' },
};

// Plan → default frame mapping (plan upgrades unlock minimum frame tier)
const PLAN_FRAME: Record<string, string> = {
  free:        'none',
  pro:         'bronze',
  elite:       'gold',
  institution: 'diamond',
};

const SIZE_MAP = {
  xs: { outer: 'w-8 h-8',   inner: 'w-6 h-6',   p: 'p-0.5', ring: 'w-8 h-8'  },
  sm: { outer: 'w-10 h-10', inner: 'w-8 h-8',   p: 'p-0.5', ring: 'w-10 h-10' },
  md: { outer: 'w-14 h-14', inner: 'w-12 h-12', p: 'p-0.5', ring: 'w-14 h-14' },
  lg: { outer: 'w-20 h-20', inner: 'w-17 h-17', p: 'p-1',   ring: 'w-20 h-20' },
  xl: { outer: 'w-28 h-28', inner: 'w-24 h-24', p: 'p-1',   ring: 'w-28 h-28' },
};

export function AvatarFrame({ src, name, size = 'md', frame, plan, showFrame = true, className, onClick }: AvatarFrameProps) {
  // Resolve effective frame: explicit frame overrides plan-based default
  const resolvedFrame = frame && frame !== 'none' ? frame : (plan ? PLAN_FRAME[plan] : 'none');
  const config = FRAME_CONFIG[resolvedFrame] || FRAME_CONFIG.none;
  const dims   = SIZE_MAP[size];
  const hasFrame = resolvedFrame !== 'none' && showFrame;
  const initials = name ? name.charAt(0).toUpperCase() : '?';

  return (
    <div
      className={cn('relative flex items-center justify-center shrink-0', dims.outer, className)}
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : {}}
    >
      {/* Animated glow ring for champion frame */}
      {resolvedFrame === 'champion' && (
        <div className={cn('absolute inset-0 rounded-full animate-pulse', dims.outer)}
          style={{ background: 'conic-gradient(from 0deg, #a855f7, #ec4899, #6366f1, #a855f7)', opacity: 0.6, filter: 'blur(4px)' }}
        />
      )}

      {/* Frame ring */}
      {hasFrame ? (
        <div className={cn(
          'absolute inset-0 rounded-full bg-gradient-to-br transition-all duration-500',
          config.gradient,
          config.glow,
          dims.outer
        )}>
          {/* Rotating shine for gold/champion */}
          {(resolvedFrame === 'gold' || resolvedFrame === 'champion') && (
            <div className="absolute inset-0 rounded-full overflow-hidden">
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'conic-gradient(from 0deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)',
                  animation: 'spin 3s linear infinite',
                }}
              />
            </div>
          )}
        </div>
      ) : (
        <div className={cn('absolute inset-0 rounded-full bg-gradient-to-tr from-accent/40 to-accent-alt/40', dims.outer)} />
      )}

      {/* Avatar image */}
      <div className={cn(
        'relative z-10 rounded-full bg-background flex items-center justify-center overflow-hidden',
        hasFrame ? dims.p : '',
        dims.inner
      )}>
        <div className="w-full h-full rounded-full overflow-hidden bg-gradient-to-tr from-accent/20 to-accent-alt/20 flex items-center justify-center">
          {src ? (
            <img src={src} alt={name || 'avatar'} className="w-full h-full object-cover" />
          ) : (
            <span className="font-black text-white/70 select-none"
              style={{ fontSize: size === 'xl' ? '2rem' : size === 'lg' ? '1.25rem' : '0.75rem' }}>
              {initials}
            </span>
          )}
        </div>
      </div>

      {/* Frame icon badge */}
      {hasFrame && config.icon && (size === 'lg' || size === 'xl') && (
        <span className="absolute -bottom-1 -right-1 text-xs leading-none z-20 select-none">
          {config.icon}
        </span>
      )}
    </div>
  );
}

export { FRAME_CONFIG, PLAN_FRAME };
