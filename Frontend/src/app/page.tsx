'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Preserve ALL query params (e.g. ?token=... from Google/Facebook OAuth)
    // when redirecting to dashboard so AuthContext can read them
    const search = window.location.search;
    router.replace(`/dashboard${search}`);
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-12 h-12 rounded-full border-4 border-accent border-t-transparent animate-spin" />
    </div>
  );
}
