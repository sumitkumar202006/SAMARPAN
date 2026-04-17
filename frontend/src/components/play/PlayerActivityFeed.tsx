'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Users, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActivityEvent {
  id: number;
  type: 'answered' | 'leading' | 'joined' | 'system';
  text: string;
  icon?: React.ReactNode;
}

let _eventId = 0;

interface PlayerActivityFeedProps {
  socket?: any;
  totalPlayers?: number;
  isLive: boolean;
}

/**
 * Real-time player activity feed shown during live matches.
 * Shows events like "3/10 players answered", "Alex is leading with 400pts".
 * Auto-expires events after 4 seconds.
 */
export const PlayerActivityFeed: React.FC<PlayerActivityFeedProps> = ({
  socket,
  totalPlayers,
  isLive,
}) => {
  const [events, setEvents] = useState<ActivityEvent[]>([]);

  const pushEvent = (ev: Omit<ActivityEvent, 'id'>) => {
    const id = ++_eventId;
    setEvents(prev => [{ ...ev, id }, ...prev].slice(0, 5)); // Keep last 5
    // Auto-expire after 4s
    setTimeout(() => {
      setEvents(prev => prev.filter(e => e.id !== id));
    }, 4000);
  };

  useEffect(() => {
    if (!isLive || !socket) return;

    // Track answer count per question
    let answeredCount = 0;
    let total = totalPlayers || 0;

    const handlePlayerList = (data: any) => {
      total = Object.values(data.players || {}).filter((p: any) => !p.isHost).length;
    };

    const handlePlayerAnswered = (data: { answeredCount: number; totalPlayers: number }) => {
      answeredCount = data.answeredCount;
      total = data.totalPlayers || total;
      pushEvent({
        type: 'answered',
        text: `${answeredCount}/${total} players answered`,
        icon: <Users size={11} />,
      });
    };

    const handleLeaderboardUpdate = (data: { leaderboard?: Array<{ name: string; score: number }> }) => {
      const lb = data.leaderboard;
      if (lb && lb.length > 0) {
        const leader = lb[0];
        pushEvent({
          type: 'leading',
          text: `${leader.name} leads with ${leader.score}pts`,
          icon: <Crown size={11} />,
        });
      }
    };

    const handleNextQuestion = (data: { index: number }) => {
      answeredCount = 0;
      pushEvent({
        type: 'system',
        text: `Question ${data.index + 1} started`,
        icon: <Zap size={11} />,
      });
    };

    socket.on('host_player_list_update', handlePlayerList);
    socket.on('player_answered_count', handlePlayerAnswered);
    socket.on('leaderboard_update', handleLeaderboardUpdate);
    socket.on('next_question', handleNextQuestion);

    return () => {
      socket.off('host_player_list_update', handlePlayerList);
      socket.off('player_answered_count', handlePlayerAnswered);
      socket.off('leaderboard_update', handleLeaderboardUpdate);
      socket.off('next_question', handleNextQuestion);
    };
  }, [isLive, socket, totalPlayers]);

  if (!isLive || events.length === 0) return null;

  return (
    <div className="fixed bottom-20 left-4 z-[80] flex flex-col-reverse gap-1.5 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {events.map(ev => (
          <motion.div
            key={ev.id}
            layout
            initial={{ opacity: 0, x: -20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest',
              'bg-[#080d20]/90 border backdrop-blur-xl shadow-xl',
              ev.type === 'leading' ? 'border-yellow-400/30 text-yellow-400' :
              ev.type === 'answered' ? 'border-accent/30 text-accent' :
              'border-white/10 text-text-soft'
            )}
          >
            {ev.icon}
            {ev.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
