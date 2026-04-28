'use client';

import React from 'react';
import { Shield, Zap, Crown, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export type Plan = 'free' | 'pro' | 'elite' | 'institution';

const PLAN_CONFIG: Record<Plan, {
  label: string;
  icon: React.ElementType;
  gradient: string;
  glow: string;
  border: string;
  text: string;
}> = {
  free:        { label: 'Free',        icon: Shield, gradient: 'from-slate-500 to-slate-600',   glow: 'shadow-slate-500/20',   border: 'border-slate-500/30',   text: 'text-slate-400' },
  pro:         { label: 'Pro',         icon: Zap,    gradient: 'from-[#CC0000] to-violet-600', glow: 'shadow-red-600/40', border: 'border-[#CC0000]/40', text: 'text-red-300' },
  elite:       { label: 'Elite',       icon: Crown,  gradient: 'from-amber-400 to-orange-500',  glow: 'shadow-amber-500/40',  border: 'border-amber-500/40',  text: 'text-amber-300'  },
  institution: { label: 'Institution', icon: Star,   gradient: 'from-teal-400 to-cyan-500',     glow: 'shadow-teal-500/40',   border: 'border-teal-500/40',   text: 'text-teal-300'   },
};

interface PlanBadgeProps {
  plan: Plan | string;
  size?: 'xs' | 'sm' | 'md';
  showLabel?: boolean;
  className?: string;
}

export function PlanBadge({ plan, size = 'sm', showLabel = true, className }: PlanBadgeProps) {
  const cfg = PLAN_CONFIG[(plan as Plan)] || PLAN_CONFIG.free;
  const Icon = cfg.icon;

  const iconSizes = { xs: 8, sm: 10, md: 12 };
  const textSizes = { xs: 'text-[7px]', sm: 'text-[9px]', md: 'text-[11px]' };
  const paddings  = { xs: 'px-1.5 py-0.5 gap-0.5', sm: 'px-2 py-0.5 gap-1', md: 'px-2.5 py-1 gap-1.5' };

  return (
    <span className={cn(
      'inline-flex items-center rounded-full border font-black uppercase tracking-widest shadow-sm',
      `bg-gradient-to-r ${cfg.gradient} bg-opacity-10`,
      cfg.border, cfg.text, cfg.glow,
      paddings[size],
      textSizes[size],
      'bg-transparent',
      className
    )}
    style={{ background: 'transparent' }}
    >
      {/* icon with gradient bg */}
      <span className={cn(`bg-gradient-to-br ${cfg.gradient} rounded-full p-[2px] shadow-sm`)}>
        <Icon size={iconSizes[size]} className="text-white" />
      </span>
      {showLabel && cfg.label}
    </span>
  );
}

/** Coloured ring for profile avatars based on plan */
export function planRingClass(plan: string): string {
  switch (plan) {
    case 'pro':         return 'border-[#CC0000] shadow-[0_0_12px_rgba(99,102,241,0.6)]';
    case 'elite':       return 'border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.6)]';
    case 'institution': return 'border-teal-400 shadow-[0_0_12px_rgba(20,184,166,0.6)]';
    default:            return 'border-white/20';
  }
}
