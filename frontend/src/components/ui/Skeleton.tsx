'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

/** Base shimmer skeleton block */
export const Skeleton: React.FC<SkeletonProps> = ({ className }) => (
  <div
    className={cn(
      'relative overflow-hidden rounded-lg bg-white/5',
      'before:absolute before:inset-0 before:-translate-x-full',
      'before:bg-gradient-to-r before:from-transparent before:via-white/[0.06] before:to-transparent',
      'before:animate-[shimmer_1.8s_infinite]',
      className
    )}
  />
);

/** Quiz card skeleton — matches QuizCard dimensions to prevent layout shift */
export const QuizCardSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="bg-[#080d20] border border-white/5 rounded-[24px] p-6 space-y-4"
        style={{ animationDelay: `${i * 80}ms` }}
      >
        {/* Category tag */}
        <Skeleton className="h-5 w-20 rounded-full" />

        {/* Title */}
        <div className="space-y-2">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-3/4" />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
        </div>

        {/* Footer stats row */}
        <div className="flex items-center gap-3 pt-2 border-t border-white/5">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <div className="ml-auto">
            <Skeleton className="h-8 w-24 rounded-xl" />
          </div>
        </div>
      </div>
    ))}
  </>
);

/** Leaderboard row skeleton */
export const LeaderboardSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 p-4 rounded-2xl border border-white/5 bg-white/[0.02]">
        <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-6 w-16 rounded-lg" />
      </div>
    ))}
  </div>
);

/** Generic stat card skeleton */
export const StatCardSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="glass rounded-3xl p-6 space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-8 rounded-xl" />
        </div>
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-3 w-32" />
      </div>
    ))}
  </>
);
