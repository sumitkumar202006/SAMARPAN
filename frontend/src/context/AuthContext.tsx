'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '@/lib/axios';
import { logger } from '@/lib/logger';

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
  // Gamification
  avatarFrame?: string;    // 'none' | 'bronze' | 'gold' | 'diamond' | 'champion'
  totalWins?: number;
  totalLosses?: number;
  winStreak?: number;
  bestWinStreak?: number;
  dailyStreak?: number;
  lastPlayedAt?: string;
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
    // 1. Check URL for social login tokens (OAuth callback drops ?token=JWT&user=JSON)
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      let userData: any = {};

      // Backend sends ?token=JWT&user=ENCODED_JSON
      const userRaw = params.get('user');
      if (userRaw) {
        try {
          userData = JSON.parse(decodeURIComponent(userRaw));
        } catch {
          // ignore parse failure — use individual params below
        }
      }

      // Fallback: individual params (legacy)
      if (!userData.email) {
        userData = {
          id:       params.get('userId') || '',
          name:     params.get('name')   || '',
          email:    params.get('email')  || '',
          avatar:   params.get('avatar') || '',
          username: params.get('username') || '',
        };
      }

      const newUser: User = {
        token,
        id:       userData.id || userData._id || '',
        userId:   userData.id || userData._id || '',
        name:     userData.name     || '',
        email:    userData.email    || '',
        avatar:   userData.avatar   || '',
        username: userData.username || '',
        plan:     userData.plan     || 'free',
        role:     userData.role     || 'user',
      };
      setUserState(newUser);
      localStorage.setItem('samarpanUser', JSON.stringify(newUser));

      // Clean URL so token doesn't leak in browser history
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
        // Sync profile data
        const profileRes = await api.get(`/api/user/profile/${user.email}`);
        let updatedUser = { ...user, ...profileRes.data };

        // Sync billing — may 401 on first OAuth login tick, that's OK
        try {
          const billingRes = await api.get('/api/billing/status');
          if (billingRes.data) {
            updatedUser.plan       = billingRes.data.plan       || 'free';
            updatedUser.planStatus = billingRes.data.status     || 'none';
          }
        } catch {
          // Billing 401 on first load — keep existing plan (default: 'free')
          updatedUser.plan = updatedUser.plan || 'free';
        }

        setUserState(updatedUser);
        localStorage.setItem('samarpanUser', JSON.stringify(updatedUser));
      } catch (err) {
        logger.debug('[Auth] Profile sync failed silently', err);
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
          logger.debug('[E2EE] No local keys found. Generating new neural pair...');
          const newKeys = await generateChatKeyPair();
          keys = newKeys;
        }

        // Always register public key with backend to ensure synchronization
        logger.debug('[E2EE] Synchronizing neural public key with server...');
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
