'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, RefreshCw, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSocket } from '@/context/SocketContext';

type ConnectionState = 'connected' | 'reconnecting' | 'syncing' | 'offline';

interface NetworkStatusWidgetProps {
  /** Pass true while QuizEngine is in isSyncing state */
  isSyncing?: boolean;
}

const STATE_CONFIG: Record<ConnectionState, {
  label: string;
  color: string;
  dot: string;
  Icon: React.ElementType;
  spin?: boolean;
}> = {
  connected: {
    label: 'Connected',
    color: 'text-[#00D4B4] border-[#00D4B4]/20 bg-[#00D4B4]/5',
    dot: 'bg-[#00D4B4]',
    Icon: Wifi,
  },
  syncing: {
    label: 'Syncing',
    color: 'text-blue-400 border-blue-400/20 bg-blue-400/5',
    dot: 'bg-blue-400',
    Icon: Loader2,
    spin: true,
  },
  reconnecting: {
    label: 'Reconnecting',
    color: 'text-amber-400 border-amber-400/20 bg-amber-400/5',
    dot: 'bg-amber-400',
    Icon: RefreshCw,
    spin: true,
  },
  offline: {
    label: 'Offline',
    color: 'text-red-400 border-red-400/20 bg-red-400/5',
    dot: 'bg-red-500',
    Icon: WifiOff,
  },
};

/**
 * Small corner badge showing real-time socket connection state.
 * Green = connected, Amber = reconnecting, Blue = syncing, Red = offline.
 */
export const NetworkStatusWidget: React.FC<NetworkStatusWidgetProps> = ({ isSyncing }) => {
  const { isConnected, socket } = useSocket();
  const [state, setState] = useState<ConnectionState>('connected');

  useEffect(() => {
    if (isSyncing) { setState('syncing'); return; }
    if (!isConnected) { setState('offline'); return; }
    setState('connected');
  }, [isConnected, isSyncing]);

  useEffect(() => {
    if (!socket) return;
    const onReconnectAttempt = () => setState('reconnecting');
    const onReconnect = () => setState('connected');
    const onDisconnect = () => setState('offline');

    socket.on('reconnect_attempt', onReconnectAttempt);
    socket.on('reconnect', onReconnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect', onReconnect);

    return () => {
      socket.off('reconnect_attempt', onReconnectAttempt);
      socket.off('reconnect', onReconnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect', onReconnect);
    };
  }, [socket]);

  const cfg = STATE_CONFIG[state];

  // Only show non-connected states prominently; always show as a tiny badge
  const isNominal = state === 'connected';

  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1 }}
      className={cn(
        'fixed top-20 right-4 z-[200] flex items-center gap-2 px-3 py-1.5 rounded-full border',
        'text-[9px] font-black uppercase tracking-widest backdrop-blur-xl transition-all duration-500',
        cfg.color,
        // Collapse to just dot when connected
        isNominal ? 'px-2' : 'px-3'
      )}
      title={`Network: ${cfg.label}`}
    >
      {/* Pulse dot */}
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', cfg.dot, !isNominal && 'animate-pulse')} />

      <AnimatePresence mode="wait">
        {!isNominal && (
          <motion.span
            key={state}
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            className="flex items-center gap-1.5 overflow-hidden whitespace-nowrap"
          >
            <cfg.Icon size={10} className={cfg.spin ? 'animate-spin' : ''} />
            {cfg.label}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
