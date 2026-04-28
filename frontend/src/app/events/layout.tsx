import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Quiz Events | Scheduled Live Quiz Competitions — Qyro Arena',
  description:
    'Discover and join scheduled quiz events and tournaments on Qyro Arena. Compete in timed battles, earn bonus XP, and climb the event leaderboard.',
  alternates: {
    canonical: 'https://samarpan-quiz.vercel.app/events',
  },
  openGraph: {
    title: 'Quiz Events | Qyro Arena',
    description: 'Join scheduled quiz tournaments and battles. Earn XP and climb the rankings.',
    url: 'https://samarpan-quiz.vercel.app/events',
    type: 'website',
  },
};

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
