import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Global Leaderboard | Top ELO Rankings — Qyro Arena',
  description:
    'See the top-ranked players on Qyro Arena. Filter by weekly, monthly, or all-time standings across subjects like CS, Maths, Science, History, and Geography.',
  alternates: {
    canonical: 'https://samarpan-quiz.vercel.app/leaderboard',
  },
  openGraph: {
    title: 'Global Leaderboard | Qyro Arena',
    description: 'Real-time ELO rankings of the best quiz players in India. Climb the Hall of Fame.',
    url: 'https://samarpan-quiz.vercel.app/leaderboard',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Global Leaderboard | Qyro Arena',
    description: 'See who\'s top-ranked. Compete and climb the ELO leaderboard.',
  },
};

export default function LeaderboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
