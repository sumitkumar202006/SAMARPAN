'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface GuestGuardProps {
  children: React.ReactNode;
}

/**
 * GuestGuard ensures that only unauthenticated users can access the page.
 * If a genuine user is already logged in, they are redirected to the Dashboard.
 */
export const GuestGuard: React.FC<GuestGuardProps> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6 bg-background">
        <div className="w-16 h-16 rounded-full border-4 border-accent border-t-transparent animate-spin shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
        <p className="font-black uppercase tracking-[0.3em] text-text-soft text-xs animate-pulse italic">
          Synchronizing Neural State...
        </p>
      </div>
    );
  }

  // If user is already logged in, don't show the guest content (login screen)
  if (user) return null;

  return <>{children}</>;
};
