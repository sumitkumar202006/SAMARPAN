import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Billing & Subscription — Samarpan Arena',
  description: 'Manage your Samarpan Arena subscription, view usage limits, and upgrade or cancel your plan.',
  robots: { index: false, follow: false }, // Private page — no indexing
};

export default function BillingLayout({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
}
