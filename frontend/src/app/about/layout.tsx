import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us | Meet the Team — Samarpan Arena',
  description:
    'Learn about Samarpan Arena — built by students, for students. Meet the founding team of developers and educators who created India\'s most competitive AI quiz platform.',
  alternates: {
    canonical: 'https://samarpan-quiz.vercel.app/about',
  },
  openGraph: {
    title: 'About Samarpan Arena',
    description: 'Built by students, for students. Meet the team behind India\'s AI-powered quiz arena.',
    url: 'https://samarpan-quiz.vercel.app/about',
    type: 'website',
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
