import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing Plans | Samarpan Arena',
  description:
    'Choose the right Samarpan Arena plan. Free Spark plan, Blaze Pro at ₹99/mo, Storm Elite at ₹499/mo, and Institution plans for colleges. Cancel anytime.',
  alternates: {
    canonical: 'https://samarpan-quiz.vercel.app/pricing',
  },
  openGraph: {
    title: 'Pricing | Samarpan Arena',
    description: 'Start free. Upgrade for AI generations, rated battles, analytics, and more. Plans from ₹99/mo.',
    url: 'https://samarpan-quiz.vercel.app/pricing',
    type: 'website',
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
}
