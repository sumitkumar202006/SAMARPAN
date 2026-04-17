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
    if (!socket) return;

    function onConnect() {
      setIsConnected(true);
      console.log("[Socket] Connected to Arena Server");
      if (user?.id) {
        socket.emit('social_connect', { userId: user.id });
      }
    }

    function onDisconnect() {
      console.log("[Socket] Disconnected from Arena Server");
      setIsConnected(false);
    }

    function onConnectError(err: any) {
      console.error("[Socket] Connection error:", err.message);
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
  }, [user, socket]);

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
