'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface User {
  userId: string;
  name: string;
  email: string;
  avatar?: string;
  token: string;
  globalRating?: number;
  xp?: number;
  preferredField?: string;
  settings?: {
    soundEnabled: boolean;
  };
  college?: string;
  course?: string;
  role?: string;
  status?: string;
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isLoading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Check URL for social login tokens
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      const newUser: User = {
        token,
        userId: params.get('userId') || '',
        name: params.get('name') || '',
        email: params.get('email') || '',
        avatar: params.get('avatar') || '',
      };
      setUserState(newUser);
      localStorage.setItem('samarpanUser', JSON.stringify(newUser));
      
      // Clear URL params
      const url = new URL(window.location.href);
      url.search = '';
      window.history.replaceState({}, document.title, url.toString());
      setIsLoading(false);
      return;
    }

    // 2. Check localStorage
    const savedUser = localStorage.getItem('samarpanUser');
    if (savedUser) {
      try {
        setUserState(JSON.parse(savedUser));
      } catch (e) {
        console.error('Failed to parse saved user', e);
      }
    }
    setIsLoading(false);
  }, []);

  const setUser = (user: User | null) => {
    setUserState(user);
    if (user) {
      localStorage.setItem('samarpanUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('samarpanUser');
    }
  };

  const logout = () => {
    setUser(null);
    // Any other cleanup like stopping the socket
  };

  return (
    <AuthContext.Provider value={{ user, setUser, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
