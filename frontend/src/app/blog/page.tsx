import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Clock, User, Tag } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Blog | Samarpan Arena — Quiz Tips, Study Guides & Platform Updates',
  description:
    'Read the Samarpan Arena blog for competitive learning tips, quiz strategies, ELO ranking guides, and platform announcements.',
  alternates: { canonical: 'https://samarpan-quiz.vercel.app/blog' },
  openGraph: {
    title: 'Samarpan Arena Blog',
    description: 'Quiz tips, ELO strategy, and study guides from the Samarpan Arena team.',
    type: 'website',
  },
};

// ─── Blog Posts (Static — add new posts here) ──────────────────────────────────
const POSTS = [
  {
    slug: 'how-elo-ranking-works',
    title: 'How ELO Ranking Works in Samarpan Arena',
    excerpt:
      'Learn how the ELO system calculates your rank after every battle, why losing to a lower-ranked player hurts more, and how to climb the leaderboard faster.',
    category: 'Guide',
    author: 'Samarpan Team',
    date: 'April 20, 2026',
    readTime: '5 min read',
    featured: true,
  },
  {
    slug: 'ai-quiz-generation-tips',
    title: '5 Tips to Get Better AI Quiz Questions',
    excerpt:
      'The AI quiz generator responds to your prompt. Use specific topics, add difficulty modifiers, and learn how to get the most accurate questions from Llama-3.',
    category: 'How-to',
    author: 'Samarpan Team',
    date: 'April 15, 2026',
    readTime: '4 min read',
    featured: false,
  },
  {
    slug: 'hosting-college-quiz-events',
    title: 'How to Host a 200-Player Live Quiz for Your College Fest',
    excerpt:
      'A step-by-step walkthrough: creating the quiz, setting up the room PIN, enabling anti-cheat, and projecting the leaderboard on screen during your event.',
    category: 'Tutorial',
    author: 'Samarpan Team',
    date: 'April 10, 2026',
    readTime: '7 min read',
    featured: false,
  },
  {
    slug: 'anti-cheat-how-it-works',
    title: "Samarpan's Anti-Cheat System Explained",
    excerpt:
      'Tab-switch detection, IP-lock, strike system, strict-focus mode. Here is a full breakdown of how we keep every ranked battle fair.',
    category: 'Technical',
    author: 'Samarpan Team',
    date: 'April 5, 2026',
    readTime: '6 min read',
    featured: false,
  },
  {
    slug: 'gate-exam-quiz-preparation',
    title: 'Using AI Quizzes for GATE CSE Preparation',
    excerpt:
      'How BTech students are using Samarpan Arena to create topic-specific GATE practice quizzes, track weak areas via analytics, and compete on leaderboards.',
    category: 'Study Guide',
    author: 'Samarpan Team',
    date: 'March 28, 2026',
    readTime: '8 min read',
    featured: false,
  },
  {
    slug: 'marketplace-remixing-guide',
    title: 'Remix Any Quiz in the Marketplace in 30 Seconds',
    excerpt:
      'The Remix feature lets you fork any public quiz, edit questions, and publish your version. Ideal for teachers who want to customise existing content.',
    category: 'How-to',
    author: 'Samarpan Team',
    date: 'March 22, 2026',
    readTime: '3 min read',
    featured: false,
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  Guide:       'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  'How-to':    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Tutorial:    'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Technical:   'bg-rose-500/10 text-rose-400 border-rose-500/20',
  'Study Guide': 'bg-sky-500/10 text-sky-400 border-sky-500/20',
};

export default function BlogPage() {
  const featured = POSTS.find(p => p.featured);
  const rest      = POSTS.filter(p => !p.featured);

  return (
    <div className="min-h-screen bg-[#020617] text-white">
      {/* Header */}
      <div className="border-b border-white/5 py-16 px-6">
        <div className="max-w-5xl mx-auto text-center space-y-4">
          <span className="text-xs uppercase tracking-widest font-black text-indigo-400 border border-indigo-500/20 bg-indigo-500/10 px-4 py-1.5 rounded-full inline-block">
            Samarpan Blog
          </span>
          <h1 className="text-4xl lg:text-6xl font-black tracking-tight">
            Study Smarter.<br className="hidden lg:block" /> Play Better.
          </h1>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">
            Quiz strategies, platform guides, ELO deep-dives, and study tips from the Samarpan Arena team.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-16 space-y-16">

        {/* Featured Post */}
        {featured && (
          <section>
            <p className="text-xs uppercase tracking-widest font-black text-white/30 mb-6">Featured Post</p>
            <Link href={`/blog/${featured.slug}`} className="block group">
              <div className="rounded-[32px] border border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent p-10 hover:border-indigo-500/40 transition-all">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${CATEGORY_COLORS[featured.category]}`}>
                    {featured.category}
                  </span>
                  <span className="text-white/30 text-xs flex items-center gap-1"><Clock size={12} /> {featured.readTime}</span>
                </div>
                <h2 className="text-2xl lg:text-3xl font-black tracking-tight mb-3 group-hover:text-indigo-300 transition-colors">
                  {featured.title}
                </h2>
                <p className="text-white/50 leading-relaxed mb-6 max-w-2xl">{featured.excerpt}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-white/30">
                    <User size={12} /> {featured.author} · {featured.date}
                  </div>
                  <span className="flex items-center gap-1 text-indigo-400 font-black text-sm group-hover:gap-2 transition-all">
                    Read article <ArrowRight size={14} />
                  </span>
                </div>
              </div>
            </Link>
          </section>
        )}

        {/* All Posts Grid */}
        <section>
          <p className="text-xs uppercase tracking-widest font-black text-white/30 mb-6">All Articles</p>
          <div className="grid sm:grid-cols-2 gap-6">
            {rest.map(post => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="block group">
                <article className="h-full rounded-[24px] border border-white/5 bg-white/[0.02] p-8 hover:border-white/10 hover:bg-white/[0.04] transition-all flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${CATEGORY_COLORS[post.category] || 'bg-white/5 text-white/40 border-white/10'}`}>
                      {post.category}
                    </span>
                    <span className="text-white/25 text-[10px] flex items-center gap-1"><Clock size={10} /> {post.readTime}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-black text-lg leading-tight mb-2 group-hover:text-indigo-300 transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-white/40 text-sm leading-relaxed">{post.excerpt}</p>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <span className="text-[10px] text-white/25">{post.date}</span>
                    <span className="text-[11px] font-black text-indigo-400 flex items-center gap-1 group-hover:gap-2 transition-all">
                      Read <ArrowRight size={11} />
                    </span>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-[32px] border border-white/5 bg-gradient-to-r from-indigo-500/5 to-transparent p-10 text-center space-y-4">
          <h3 className="text-2xl font-black">Ready to compete?</h3>
          <p className="text-white/50">Create your first AI quiz in 2 seconds — free forever for students.</p>
          <Link href="/auth?mode=signup" className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-black hover:opacity-90 transition-all shadow-lg shadow-indigo-500/20">
            Start Free <ArrowRight size={16} />
          </Link>
        </section>

      </div>
    </div>
  );
}
