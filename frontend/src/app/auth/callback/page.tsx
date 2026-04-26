'use client';

/**
 * /auth/callback — OAuth Callback Handler
 *
 * Backend redirects here after Google/Facebook OAuth:
 *   /auth/callback?token=JWT&user=ENCODED_JSON
 *
 * This page:
 *  1. Parses token + user from URL
 *  2. Saves to localStorage as 'samarpanUser'
 *  3. Redirects to /dashboard
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const token  = params.get('token');
      const userRaw = params.get('user');

      if (!token) {
        // No token — redirect to auth with error
        router.replace('/auth?error=oauth_failed');
        return;
      }

      let userData: any = {};
      if (userRaw) {
        try {
          userData = JSON.parse(decodeURIComponent(userRaw));
        } catch {
          // Fallback: try individual params (legacy format)
          userData = {
            id:       params.get('userId') || '',
            userId:   params.get('userId') || '',
            name:     params.get('name')   || '',
            email:    params.get('email')  || '',
            avatar:   params.get('avatar') || '',
            username: params.get('username') || '',
          };
        }
      }

      // Merge token into user object and persist
      const fullUser = {
        ...userData,
        id:     userData.id || userData._id || '',
        userId: userData.id || userData._id || '',
        token,
      };

      localStorage.setItem('samarpanUser', JSON.stringify(fullUser));

      // Redirect to dashboard
      router.replace('/dashboard');
    } catch (err) {
      console.error('[OAuth Callback] Failed to parse credentials:', err);
      router.replace('/auth?error=parse_failed');
    }
  }, [router]);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background gap-6">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-2 border-accent/20" />
        <div className="absolute inset-0 w-16 h-16 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
      <div className="text-center space-y-2">
        <p className="text-[11px] font-black uppercase tracking-[0.4em] text-accent-alt animate-pulse">
          Authenticating Neural Link
        </p>
        <p className="text-[9px] text-text-soft uppercase tracking-widest">
          Securing your session...
        </p>
      </div>
    </div>
  );
}
