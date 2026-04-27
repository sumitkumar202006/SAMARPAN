'use client';

/**
 * AuraCursorLoader — Client Component wrapper for AuraCursor.
 *
 * Next.js App Router: `dynamic({ ssr: false })` is only allowed inside Client Components.
 * layout.tsx is a Server Component, so we isolate the dynamic import here.
 * This component is imported into layout.tsx and renders the cursor only on the client.
 */

import dynamic from 'next/dynamic';

const AuraCursor = dynamic(
  () => import('@/components/ui/AuraCursor').then(m => ({ default: m.AuraCursor })),
  { ssr: false }
);

export function AuraCursorLoader() {
  return <AuraCursor />;
}
