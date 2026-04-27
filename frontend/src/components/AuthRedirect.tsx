'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Drop this on any public page.
 * If samarpanUser with a token exists in localStorage → redirect to /dashboard.
 * Uses both synchronous initializer AND useEffect for maximum reliability.
 */
export default function AuthRedirect() {
  const router = useRouter();

  // Check synchronously on first render (works in client components)
  const [shouldRedirect] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      const raw = localStorage.getItem('samarpanUser');
      if (!raw) return false;
      const user = JSON.parse(raw);
      return !!(user?.token);
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (shouldRedirect) {
      // Use hard redirect for reliability — avoids router hydration timing issues
      window.location.replace('/dashboard');
    }
  }, [shouldRedirect, router]);

  // While redirecting, show nothing (avoids flash of landing page for logged-in users)
  return null;
}
