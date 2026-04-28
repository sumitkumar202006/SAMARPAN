import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Quiz Marketplace | Browse & Remix Community Quizzes — Qyro Arena',
  description:
    'Explore thousands of community-created quizzes. Filter by topic, difficulty, or popularity. Play, rate, and remix — or publish your own quiz to earn creator XP.',
  alternates: {
    canonical: 'https://samarpan-quiz.vercel.app/marketplace',
  },
  openGraph: {
    title: 'Quiz Marketplace | Qyro Arena',
    description: 'Browse community quizzes on any topic. Play, rate, remix — or publish your own.',
    url: 'https://samarpan-quiz.vercel.app/marketplace',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Quiz Marketplace | Qyro Arena',
    description: 'Find the best community quizzes. Filter by topic and difficulty.',
  },
};

export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
