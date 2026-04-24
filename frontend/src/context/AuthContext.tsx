'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '@/lib/axios';

interface User {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatar?: string;
  token: string;
  globalRating?: number;
  xp?: number;
  preferredField?: string;
  interest?: string;
  settings?: {
    soundEnabled: boolean;
    performanceMode?: 'high' | 'medium' | 'low';
  };
  college?: string;
  course?: string;
  customField?: string;
  dob?: string | Date;
  username?: string;
  lastUsernameChange?: string;
  publicKey?: string;
  role?: string;
  status?: string;
  // Subscription
  plan?: string;        // 'free' | 'pro' | 'elite' | 'institution'
  planStatus?: string;  // 'active' | 'trialing' | 'cancelled'
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isLoading: boolean;
  logout: () => void;
  profileCompletion: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Profile Completion Calculation logic
  const calculateCompletion = (u: User | null): number => {
    if (!u) return 0;
    const fields = [
      { val: u.name, weight: 15 },
      { val: u.username, weight: 15 },
      { val: u.avatar, weight: 15 },
      { val: u.preferredField, weight: 10 },
      { val: u.college, weight: 15 },
      { val: u.course, weight: 15 },
      { val: u.customField, weight: 10 },
      { val: u.dob, weight: 5 }
    ];
    
    let total = 0;
    fields.forEach(f => {
      if (f.val) total += f.weight;
    });
    return Math.min(total, 100);
  };

  const profileCompletion = React.useMemo(() => calculateCompletion(user), [user]);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // 1. Check URL for social login tokens
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      const uId = params.get('userId') || '';
      const newUser: User = {
        token,
        id: uId,
        userId: uId,
        name: params.get('name') || '',
        email: params.get('email') || '',
        avatar: params.get('avatar') || '',
        username: params.get('username') || '',
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

  // Profile Sync Logic (Keep localStorage and State fresh)
  useEffect(() => {
    if (!isMounted || !user?.email || !user?.token) return;

    const syncProfile = async () => {
      try {
        const [profileRes, billingRes] = await Promise.allSettled([
          api.get(`/api/user/profile/${user.email}`),
          api.get('/api/billing/status'),
        ]);

        let updatedUser = { ...user };
        if (profileRes.status === 'fulfilled' && profileRes.value.data) {
          updatedUser = { ...updatedUser, ...profileRes.value.data };
        }
        if (billingRes.status === 'fulfilled' && billingRes.value.data) {
          updatedUser.plan = billingRes.value.data.plan || 'free';
          updatedUser.planStatus = billingRes.value.data.status || 'none';
        }
        setUserState(updatedUser);
        localStorage.setItem('samarpanUser', JSON.stringify(updatedUser));
      } catch (err) {
        console.error('Profile sync failed', err);
      }
    };

    syncProfile();
  }, [user?.email, user?.token, isMounted]);

  // E2EE Key Sync Logic
  useEffect(() => {
    if (!isMounted || !user?.email || !user?.token || user.publicKey) return;

    const syncE2EE = async () => {
      try {
        const { getLocalKeys, generateChatKeyPair } = await import('@/lib/crypto');
        let keys = getLocalKeys();
        
        if (!keys) {
          console.log("[E2EE] No local keys found. Generating new neural pair...");
          const newKeys = await generateChatKeyPair();
          keys = newKeys;
        }

        // Always register public key with backend to ensure synchronization
        console.log("[E2EE] Synchronizing neural public key with server...");
        await api.put('/api/user/public-key', {
          email: user.email,
          publicKey: JSON.stringify(keys.publicKey)
        });
        
        // Refresh local user state to reflect registration
        setUserState(prev => prev ? { ...prev, publicKey: JSON.stringify(keys!.publicKey) } : null);
      } catch (err) {
        console.error("[E2EE] Sync failed", err);
      }
    };

    syncE2EE();
  }, [user?.email, user?.publicKey, isMounted]);

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
  };

  if (!isMounted) return null;

  return (
    <AuthContext.Provider value={{ user, setUser, isLoading, logout, profileCompletion }}>
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
