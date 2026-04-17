'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, ChevronDown, ChevronUp, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeaderboardEntry {
  name: string;
  score: number;
  avatar?: string;
  rank?: number;
}

interface LiveLeaderboardProps {
  socket?: any;
  pin?: string;
  /** Current player's name (to highlight self) */
  myName?: string;
  isLive: boolean;
}

const RANK_COLORS = [
  'text-yellow-400 border-yellow-400/30 bg-yellow-400/10',
  'text-slate-300 border-slate-400/30 bg-slate-400/10',
  'text-amber-600 border-amber-600/30 bg-amber-600/10',
];

/**
 * Collapsible real-time leaderboard panel shown during live matches.
 * Updates via `leaderboard_update` socket event (emitted by server periodically).
 */
export const LiveLeaderboard: React.FC<LiveLeaderboardProps> = ({
  socket,
  pin,
  myName,
  isLive,
}) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const prevRanksRef = useRef<Record<string, number>>({});

  useEffect(() => {
    if (!isLive || !socket) return;

    const handleUpdate = (data: { leaderboard: LeaderboardEntry[] }) => {
      const lb = data.leaderboard || [];
      // Track rank deltas
      const newRanks: Record<string, number> = {};
      lb.forEach((e, i) => { newRanks[e.name] = i + 1; });
      prevRanksRef.current = newRanks;

      setEntries(lb.slice(0, 8)); // Show top 8
      setLastUpdated(new Date());
    };

    // Also catch quiz_finished leaderboard
    const handleFinish = (data: { leaderboard?: LeaderboardEntry[] }) => {
      if (data.leaderboard) setEntries(data.leaderboard.slice(0, 8));
    };

    socket.on('leaderboard_update', handleUpdate);
    socket.on('quiz_finished', handleFinish);

    return () => {
      socket.off('leaderboard_update', handleUpdate);
      socket.off('quiz_finished', handleFinish);
    };
  }, [isLive, socket]);

  if (!isLive || entries.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      className="hidden xl:flex flex-col w-64 shrink-0"
    >
      {/* Header */}
      <button
        onClick={() => setIsCollapsed(v => !v)}
        className="flex items-center justify-between px-5 py-3 rounded-t-2xl bg-[#080d20] border border-b-0 border-white/5 w-full hover:border-accent/20 transition-colors"
      >
        <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-accent">
          <Trophy size={14} /> Live Rankings
        </span>
        <span className="text-text-soft">
          {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </span>
      </button>

      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-1 p-3 bg-[#080d20] border border-t-0 border-white/5 rounded-b-2xl">
              <AnimatePresence mode="popLayout">
                {entries.map((entry, i) => {
                  const isMe = entry.name === myName;
                  const rankClass = RANK_COLORS[i] || 'text-text-soft border-white/5 bg-white/[0.02]';

                  return (
                    <motion.div
                      key={entry.name}
                      layout
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-xl border transition-all',
                        isMe ? 'border-accent/40 bg-accent/10 shadow-[0_0_12px_rgba(99,102,241,0.2)]' : rankClass
                      )}
                    >
                      {/* Rank # */}
                      <span className={cn(
                        'w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black shrink-0',
                        i === 0 ? 'text-yellow-400' : 'text-text-soft'
                      )}>
                        {i === 0 ? <Crown size={12} /> : i + 1}
                      </span>

                      {/* Name */}
                      <span className={cn(
                        'flex-1 text-[11px] font-black truncate',
                        isMe ? 'text-accent' : 'text-white'
                      )}>
                        {entry.name}{isMe && ' (you)'}
                      </span>

                      {/* Score */}
                      <motion.span
                        key={entry.score}
                        initial={{ scale: 1.3, color: '#22c55e' }}
                        animate={{ scale: 1, color: '#9ca3af' }}
                        transition={{ duration: 0.4 }}
                        className="text-[10px] font-black tabular-nums text-text-soft"
                      >
                        {entry.score}
                      </motion.span>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {lastUpdated && (
                <p className="text-[8px] text-text-soft text-center mt-1 font-mono opacity-40">
                  Updated {lastUpdated.toLocaleTimeString()}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
