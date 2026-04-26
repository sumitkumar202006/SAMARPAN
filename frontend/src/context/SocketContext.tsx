'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import socket from '@/lib/socket';
import { useAuth } from './AuthContext';
import { logger } from '@/lib/logger';

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

interface SocketContextType {
  socket: typeof socket;
  isConnected: boolean;
  connectionStatus: ConnectionStatus;
  reconnect: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    socket.connected ? 'connected' : 'connecting'
  );
  const { user } = useAuth();

  const reconnect = useCallback(() => {
    if (!socket.connected) {
      setConnectionStatus('connecting');
      socket.connect();
    }
  }, []);

  useEffect(() => {
    if (!socket) return;

    function onConnect() {
      setIsConnected(true);
      setConnectionStatus('connected');
      logger.debug('[Socket] Connected to Arena Server');
      if (user?.id) {
        socket.emit('social_connect', { userId: user.id });
      }
    }

    function onDisconnect() {
      logger.debug('[Socket] Disconnected from Arena Server');
      setIsConnected(false);
      setConnectionStatus('disconnected');
    }

    function onConnectError(err: any) {
      logger.error('[Socket] Connection error:', err.message);
      setConnectionStatus('disconnected');
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);

    // Initial check/emit if already connected
    if (socket.connected && user?.id) {
      socket.emit('social_connect', { userId: user.id });
    }

    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, connectionStatus, reconnect }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
