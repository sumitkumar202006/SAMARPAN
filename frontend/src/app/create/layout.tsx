import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create a Quiz | AI Quiz Generator — Samarpan Arena',
  description:
    'Generate a custom 10-question quiz on any topic in under 2 seconds using AI. Upload a PDF to auto-create questions, or build manually. Free plan available.',
  alternates: {
    canonical: 'https://samarpan-quiz.vercel.app/create',
  },
  openGraph: {
    title: 'Create a Quiz | Samarpan Arena',
    description: 'AI quiz generator — type a topic, get 10 questions in 2 seconds. Or upload a PDF.',
    url: 'https://samarpan-quiz.vercel.app/create',
    type: 'website',
  },
};

export default function CreateLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
