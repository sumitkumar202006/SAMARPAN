import type { Metadata } from 'next';
import Link from 'next/link';
import AuthRedirect from '@/components/AuthRedirect';
import {
  Zap, Trophy, Users, Brain, Shield, Star,
  ArrowRight, Play, ChevronRight, Globe, Award, TrendingUp
} from 'lucide-react';

// ─── SSG: Page-level metadata (overrides root layout defaults) ─────────────────
export const metadata: Metadata = {
  title: 'Samarpan Arena | AI-Powered Live Quiz Platform — Free to Start',
  description:
    'Host live multiplayer quizzes in seconds with AI-generated questions. Battle friends, climb global leaderboards, and earn rank badges. Free plan available.',
  alternates: {
    canonical: 'https://samarpan-quiz.vercel.app/',
  },
  openGraph: {
    title: 'Samarpan Arena | AI-Powered Live Quiz — Free to Start',
    description:
      'Create an AI quiz room in seconds. Real-time squad battles, global leaderboards, ELO ranking. Join 10,000+ learners.',
    url: 'https://samarpan-quiz.vercel.app/',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Samarpan Arena hero' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Samarpan Arena | AI-Powered Live Quiz — Free to Start',
    description: 'Create an AI quiz room in seconds. Real-time squad battles, global leaderboards.',
    images: ['/og-image.png'],
  },
};

// ─── Static data (SSG — zero server cost) ─────────────────────────────────────
const STATS = [
  { value: '10,000+', label: 'Active Learners' },
  { value: '50,000+', label: 'Quizzes Generated' },
  { value: '200+',    label: 'Concurrent Players/Room' },
  { value: '< 2s',    label: 'AI Quiz Generation' },
];

const FEATURES = [
  {
    icon: Brain,
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10 border-indigo-500/20',
    title: 'AI Quiz Generation',
    desc: 'Generate 10 custom questions on any topic in under 2 seconds — powered by Llama-3.',
  },
  {
    icon: Zap,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
    title: 'Live Arena Battles',
    desc: 'Host real-time multiplayer sessions with up to 200 players, countdowns, and instant scoring.',
  },
  {
    icon: Trophy,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
    title: 'ELO Global Rankings',
    desc: 'Earn rank badges, climb global leaderboards, and challenge players matched to your skill level.',
  },
  {
    icon: Users,
    color: 'text-sky-400',
    bg: 'bg-sky-500/10 border-sky-500/20',
    title: 'Squad Battles & Teams',
    desc: 'Organize 2-team battles, assign players to slots, and track team performance in real time.',
  },
  {
    icon: Shield,
    color: 'text-rose-400',
    bg: 'bg-rose-500/10 border-rose-500/20',
    title: 'Anti-Cheat Matrix',
    desc: 'Tab-switch detection, IP-lock flags, strike system, and strict-focus mode keep every session fair.',
  },
  {
    icon: Globe,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/20',
    title: 'Marketplace & Events',
    desc: 'Share quizzes publicly, schedule events, remix community content, and earn creator XP.',
  },
];

const TESTIMONIALS = [
  {
    name: 'Priya S.',
    role: 'College Educator',
    quote: 'I created a 10-question quiz on the Indian Constitution in 2 seconds. My students were stunned.',
    rating: 5,
  },
  {
    name: 'Arjun M.',
    role: 'Competitive Learner',
    quote: 'The ELO ranking system actually makes me want to study more. I\'m addicted to climbing the leaderboard.',
    rating: 5,
  },
  {
    name: 'Nisha K.',
    role: 'Quiz Club Organiser',
    quote: 'Ran a 150-person live quiz for our college fest. Zero lag, zero crashes. Unreal.',
    rating: 5,
  },
];

const TRUST_LOGOS = ['IIT', 'NIT', 'DU', 'BITS', 'VIT'];

// ─── Page (Server Component — SSG) ────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#020617] text-white overflow-x-hidden font-sans antialiased">

      {/* Redirect logged-in users to dashboard — runs client-side, invisible to SSG/SEO */}
      <AuthRedirect />

      {/* ── Structured Data (JSON-LD) ── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'Samarpan Arena',
            applicationCategory: 'EducationApplication',
            operatingSystem: 'Web',
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
            aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.9', ratingCount: '1240' },
            description: 'AI-powered live quiz platform for students, educators, and competitive learners.',
          }),
        }}
      />

      {/* ── Ambient Background ── */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-emerald-500/8 rounded-full blur-[100px]" />
      </div>

      {/* ══════════════════════════════════════════════════════
          NAV
      ══════════════════════════════════════════════════════ */}
      <header className="relative z-50 border-b border-white/5 backdrop-blur-xl bg-[#020617]/80">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Zap size={16} fill="white" className="text-white" />
            </div>
            <span className="font-black text-lg tracking-tight uppercase italic">Samarpan</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8" aria-label="Main navigation">
            <Link href="/marketplace" className="text-sm text-white/60 hover:text-white transition-colors font-semibold">Marketplace</Link>
            <Link href="/leaderboard"  className="text-sm text-white/60 hover:text-white transition-colors font-semibold">Leaderboard</Link>
            <Link href="/pricing"      className="text-sm text-white/60 hover:text-white transition-colors font-semibold">Pricing</Link>
            <Link href="/about"        className="text-sm text-white/60 hover:text-white transition-colors font-semibold">About</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/auth"
              className="hidden sm:inline-flex text-sm font-black text-white/60 hover:text-white transition-colors px-4 py-2"
            >
              Log in
            </Link>
            <Link
              href="/auth?mode=signup"
              id="cta-nav-signup"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-black text-sm shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-105 active:scale-95 transition-all"
            >
              Get Started Free
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════
          HERO — Above the fold, trust signals + primary CTA
      ══════════════════════════════════════════════════════ */}
      <section
        className="relative pt-24 pb-20 lg:pt-32 lg:pb-28 px-5 lg:px-8 text-center"
        aria-labelledby="hero-heading"
      >
        {/* Trust badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-black uppercase tracking-widest mb-8">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Trusted by students at IIT, NIT, DU &amp; 50+ institutions
        </div>

        <h1
          id="hero-heading"
          className="max-w-4xl mx-auto text-4xl sm:text-5xl lg:text-7xl font-black leading-[1.05] tracking-tight mb-6"
        >
          The Quiz Platform<br />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">
            Built for Winners
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-lg sm:text-xl text-white/60 font-medium leading-relaxed mb-10">
          Generate AI quiz rooms in&nbsp;<strong className="text-white">2 seconds</strong>, battle
          up to&nbsp;<strong className="text-white">200 players</strong>&nbsp;live, and climb a
          global ELO leaderboard. Free forever for students.
        </p>

        {/* Primary CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
          <Link
            href="/auth?mode=signup"
            id="cta-hero-primary"
            className="group inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-black text-base shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-105 active:scale-95 transition-all"
          >
            <Play size={18} fill="white" />
            Start Free — No Card Required
            <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/marketplace"
            id="cta-hero-secondary"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl border border-white/10 bg-white/5 text-white font-black text-base hover:bg-white/10 hover:border-white/20 transition-all backdrop-blur-sm"
          >
            Browse Quiz Library
          </Link>
        </div>

        {/* Social proof — star rating */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-white/50">
          <div className="flex items-center gap-1" aria-label="4.9 out of 5 stars">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={14} className="text-amber-400" fill="#f59e0b" />
            ))}
            <span className="ml-1.5 font-bold text-white/70">4.9</span>
            <span className="ml-1">(1,240 reviews)</span>
          </div>
          <span className="hidden sm:block text-white/20">•</span>
          <span>Rated #1 EdTech Quiz Tool in India</span>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          STATS BAR
      ══════════════════════════════════════════════════════ */}
      <section className="relative py-10 border-y border-white/5 bg-white/[0.01]" aria-label="Platform statistics">
        <div className="max-w-5xl mx-auto px-5 grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          {STATS.map(({ value, label }) => (
            <div key={label}>
              <p className="text-3xl lg:text-4xl font-black text-white mb-1">{value}</p>
              <p className="text-xs text-white/40 font-semibold uppercase tracking-widest">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          TRUST LOGOS
      ══════════════════════════════════════════════════════ */}
      <section className="py-10 px-5 text-center" aria-label="Trusted institutions">
        <p className="text-xs text-white/30 font-black uppercase tracking-[0.3em] mb-6">Used by students from</p>
        <div className="flex flex-wrap items-center justify-center gap-6 lg:gap-10">
          {TRUST_LOGOS.map((name) => (
            <span
              key={name}
              className="text-sm font-black text-white/20 hover:text-white/50 transition-colors tracking-widest uppercase"
            >
              {name}
            </span>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FEATURE GRID
      ══════════════════════════════════════════════════════ */}
      <section className="py-20 lg:py-28 px-5 lg:px-8" aria-labelledby="features-heading">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs text-indigo-400 font-black uppercase tracking-[0.3em] mb-3">Platform Features</p>
            <h2 id="features-heading" className="text-3xl lg:text-5xl font-black tracking-tight mb-4">
              Everything you need to<br className="hidden lg:block" />{' '}
              <span className="text-indigo-400">run elite quiz sessions</span>
            </h2>
            <p className="text-white/50 max-w-xl mx-auto">
              From AI generation to live analytics — Samarpan covers the entire quiz lifecycle.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, color, bg, title, desc }) => (
              <article
                key={title}
                className={`p-6 rounded-2xl border bg-white/[0.02] hover:bg-white/[0.04] transition-all group ${bg}`}
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${bg}`}>
                  <Icon size={20} className={color} />
                </div>
                <h3 className="font-black text-base mb-2">{title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════════════════ */}
      <section className="py-20 px-5 lg:px-8 bg-white/[0.01] border-y border-white/5" aria-labelledby="how-heading">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs text-emerald-400 font-black uppercase tracking-[0.3em] mb-3">How It Works</p>
          <h2 id="how-heading" className="text-3xl lg:text-5xl font-black tracking-tight mb-14">
            Live in <span className="text-emerald-400">3 steps</span>
          </h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Generate', desc: 'Type any topic — AI creates 10 questions in under 2 seconds.' },
              { step: '02', title: 'Share PIN', desc: 'Players join your room with a 6-digit PIN. No account needed to play.' },
              { step: '03', title: 'Battle', desc: 'Run the quiz live, watch real-time scores, and see the leaderboard.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-emerald-500/20 border border-white/10 flex items-center justify-center font-black text-xl text-indigo-400 mb-4">
                  {step}
                </div>
                <h3 className="font-black text-lg mb-2">{title}</h3>
                <p className="text-sm text-white/50">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          TESTIMONIALS
      ══════════════════════════════════════════════════════ */}
      <section className="py-20 lg:py-28 px-5 lg:px-8" aria-labelledby="testimonials-heading">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs text-indigo-400 font-black uppercase tracking-[0.3em] mb-3">User Stories</p>
            <h2 id="testimonials-heading" className="text-3xl lg:text-4xl font-black">
              What learners say
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {TESTIMONIALS.map(({ name, role, quote, rating }) => (
              <blockquote
                key={name}
                className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all"
              >
                <div className="flex items-center gap-0.5 mb-4" aria-label={`${rating} stars`}>
                  {[...Array(rating)].map((_, i) => (
                    <Star key={i} size={12} className="text-amber-400" fill="#f59e0b" />
                  ))}
                </div>
                <p className="text-sm text-white/70 leading-relaxed mb-4 italic">&ldquo;{quote}&rdquo;</p>
                <footer className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-xs font-black text-indigo-300">
                    {name[0]}
                  </div>
                  <div>
                    <cite className="not-italic font-black text-sm text-white">{name}</cite>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest font-semibold">{role}</p>
                  </div>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════════════════════ */}
      <section className="py-24 px-5 text-center" aria-labelledby="final-cta-heading">
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-black uppercase tracking-widest mb-8">
            <Award size={12} />
            Free plan — no credit card needed
          </div>
          <h2 id="final-cta-heading" className="text-3xl lg:text-5xl font-black tracking-tight mb-6">
            Ready to host your<br />first arena?
          </h2>
          <p className="text-white/50 mb-10 leading-relaxed">
            Join 10,000+ students and educators already using Samarpan to make learning
            competitive, engaging, and measurable.
          </p>
          <Link
            href="/auth?mode=signup"
            id="cta-final-signup"
            className="group inline-flex items-center gap-3 px-10 py-5 rounded-2xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-black text-lg shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-105 active:scale-95 transition-all"
          >
            Create Your Free Account
            <TrendingUp size={20} className="group-hover:translate-y-[-2px] transition-transform" />
          </Link>
          <p className="mt-5 text-xs text-white/30">Free plan includes 50 AI quiz generations/month · No card required</p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════════ */}
      <footer className="border-t border-white/5 py-12 px-5 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-emerald-500 flex items-center justify-center">
                  <Zap size={13} fill="white" className="text-white" />
                </div>
                <span className="font-black text-base tracking-tight uppercase italic">Samarpan</span>
              </Link>
              <p className="text-xs text-white/30 leading-relaxed">
                AI-powered quiz platform for competitive learners, educators, and quiz enthusiasts.
              </p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-4">Product</p>
              <div className="space-y-2.5">
                {[['Marketplace', '/marketplace'], ['Leaderboard', '/leaderboard'], ['Pricing', '/pricing'], ['Events', '/events']].map(([label, href]) => (
                  <Link key={label} href={href} className="block text-sm text-white/50 hover:text-white transition-colors">{label}</Link>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-4">Company</p>
              <div className="space-y-2.5">
                {[['About', '/about'], ['Contact', '/contact'], ['Privacy', '/privacy'], ['Terms', '/terms']].map(([label, href]) => (
                  <Link key={label} href={href} className="block text-sm text-white/50 hover:text-white transition-colors">{label}</Link>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-4">Play Now</p>
              <div className="space-y-2.5">
                {[['Sign Up Free', '/auth?mode=signup'], ['Login', '/auth'], ['Host a Quiz', '/host'], ['Join Arena', '/battles']].map(([label, href]) => (
                  <Link key={label} href={href} className="block text-sm text-white/50 hover:text-white transition-colors">{label}</Link>
                ))}
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-white/20">© {new Date().getFullYear()} Samarpan Arena. All rights reserved.</p>
            <p className="text-xs text-white/20">Made with ❤️ in India</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
