'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Drop this anywhere on a public page.
 * If a samarpanUser token exists in localStorage the user is already
 * authenticated — redirect them immediately to /dashboard.
 * Renders nothing visible.
 */
export default function AuthRedirect() {
  const router = useRouter();

  useEffect(() => {
    try {
      const raw = localStorage.getItem('samarpanUser');
      if (raw) {
        const user = JSON.parse(raw);
        if (user?.token) {
          router.replace('/dashboard');
        }
      }
    } catch {
      // Corrupted localStorage — ignore, stay on landing page
    }
  }, [router]);

  return null;
}
