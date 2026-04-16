'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import socket from '@/lib/socket';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: typeof socket;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const { user } = useAuth();

  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
      // Emit global identity for social features
      if (user?.id) {
        socket.emit('social_connect', { userId: user.id });
      }
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

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
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
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
