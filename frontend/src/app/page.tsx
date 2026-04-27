import type { Metadata } from 'next';
import Link from 'next/link';
import AuthRedirect from '@/components/AuthRedirect';
import { LandingMobileMenu } from '@/components/layout/LandingMobileMenu';
import { XIcon, GithubIcon, InstagramIcon } from '@/components/ui/BrandIcons';
import {
  Zap, Trophy, Users, Brain, Shield, Star,
  ArrowRight, Play, ChevronRight, Globe, Award, TrendingUp,
  MessageSquare
} from 'lucide-react';

// ─── SSG: Page-level metadata (overrides root layout defaults) ─────────────────
export const metadata: Metadata = {
  title: 'Qyro — Build. Compete. Dominate. | AI-Powered Quiz Arena',
  description:
    'Forge AI quizzes in seconds, battle opponents live, climb global ELO rankings. Free forever for students.',
  alternates: {
    canonical: 'https://samarpan-quiz.vercel.app/',
  },
  openGraph: {
    title: 'Qyro — Build. Compete. Dominate.',
    description:
      'AI-powered competitive quiz arena. Forge quizzes, battle live, dominate the leaderboard.',
    url: 'https://samarpan-quiz.vercel.app/',
    type: 'website',
    images: [{ url: '/qyro-logo.png', width: 1200, height: 630, alt: 'Qyro Arena' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Qyro — Build. Compete. Dominate.',
    description: 'AI-powered quiz battles. Forge. Fight. Dominate the leaderboard.',
    images: ['/qyro-logo.png'],
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
    color: 'text-red-400',
    bg: 'bg-red-500/10 border-red-500/20',
    title: 'Neural Forge — AI Engine',
    desc: 'Forge 10 custom questions on any topic in under 2 seconds — powered by Llama-3 70B.',
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
    color: 'text-[#00D4B4]',
    bg: 'bg-[#00D4B4]/10 border-[#00D4B4]/20',
    title: 'ELO Global Rankings',
    desc: 'Earn rank badges, climb global leaderboards, and challenge players matched to your skill level.',
  },
  {
    icon: Users,
    color: 'text-[#7B61FF]',
    bg: 'bg-[#7B61FF]/10 border-[#7B61FF]/20',
    title: 'Squad Battles & Teams',
    desc: 'Organize 2-team battles, assign players to slots, and track team performance in real time.',
  },
  {
    icon: Shield,
    color: 'text-red-400',
    bg: 'bg-red-500/10 border-red-500/20',
    title: 'Anti-Cheat Matrix',
    desc: 'Tab-switch detection, IP-lock flags, strike system, and strict-focus mode keep every session fair.',
  },
  {
    icon: Globe,
    color: 'text-[#FFB800]',
    bg: 'bg-[#FFB800]/10 border-[#FFB800]/20',
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
    quote: 'Ran a 150-person live quiz for our college fest. Zero lag, zero crashes. Pretty impressive.',
    rating: 4,
  },
  {
    name: 'Rahul D.',
    role: 'BTech Student, BITS Pilani',
    quote: 'The anti-cheat system actually works. We used it for an internal department competition and nobody could game it.',
    rating: 5,
  },
];

const TRUST_LOGOS = [
  { abbr: 'IIT', full: 'IIT Delhi' },
  { abbr: 'NIT', full: 'NIT Trichy' },
  { abbr: 'DU',  full: 'Delhi Univ.' },
  { abbr: 'BITS', full: 'BITS Pilani' },
  { abbr: 'VIT', full: 'VIT Vellore' },
];

// ─── Page (Server Component — SSG) ────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white overflow-x-hidden font-sans antialiased">

      {/* Redirect logged-in users to dashboard — runs client-side, invisible to SSG/SEO */}
      <AuthRedirect />

      {/* ── Structured Data (JSON-LD) — App + Reviews ── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'Qyro',
              applicationCategory: 'EducationApplication',
              operatingSystem: 'Web',
              url: 'https://samarpan-quiz.vercel.app',
              offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
              aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.9', ratingCount: '1240', bestRating: '5' },
              description: 'AI-powered competitive quiz arena for students, educators, and learners.',
            },
            ...TESTIMONIALS.map(t => ({
              '@context': 'https://schema.org',
              '@type': 'Review',
              reviewBody: t.quote,
              reviewRating: { '@type': 'Rating', ratingValue: String(t.rating), bestRating: '5' },
              author: { '@type': 'Person', name: t.name },
              itemReviewed: { '@type': 'SoftwareApplication', name: 'Qyro' },
            })),
          ]),
        }}
      />

      {/* ── Ambient Background ── */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-red-600/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#7B61FF]/6 rounded-full blur-[100px]" />
      </div>

      {/* ══════════════════════════════════════════════════════
          NAV
      ══════════════════════════════════════════════════════ */}
      <header className="relative z-50 border-b border-white/5 backdrop-blur-xl bg-[#0D0D0D]/80">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl overflow-hidden shadow-lg shadow-red-500/20">
              <img src="/qyro-logo.png" alt="Qyro" className="w-full h-full object-cover" />
            </div>
            <span className="font-black text-lg tracking-tight uppercase italic">QYRO</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8" aria-label="Main navigation">
            <Link href="/marketplace" className="text-sm text-white/60 hover:text-white transition-colors font-semibold">Marketplace</Link>
            <Link href="/leaderboard"  className="text-sm text-white/60 hover:text-white transition-colors font-semibold">Leaderboard</Link>
            <Link href="/pricing"      className="text-sm text-white/60 hover:text-white transition-colors font-semibold">Pricing</Link>
            <Link href="/blog"         className="text-sm text-white/60 hover:text-white transition-colors font-semibold">Blog</Link>
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
              className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#CC0000] text-white font-black text-sm shadow-lg shadow-red-600/25 hover:shadow-red-600/40 hover:scale-105 active:scale-95 transition-all"
            >
              Get Started Free
              <ArrowRight size={14} />
            </Link>
            {/* Mobile hamburger — only visible below md breakpoint */}
            <LandingMobileMenu />
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
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-black uppercase tracking-widest mb-8">
          <span className="w-2 h-2 rounded-full bg-[#00D4B4] animate-pulse" />
          Trusted by students at IIT, NIT, DU &amp; 50+ institutions
        </div>

        <h1
          id="hero-heading"
          className="max-w-4xl mx-auto text-4xl sm:text-5xl lg:text-7xl font-black leading-[1.05] tracking-tight mb-6"
        >
          Build. Compete.<br />
          <span className="bg-gradient-to-r from-[#CC0000] via-[#FF2222] to-[#FF4444] bg-clip-text text-transparent">
            Dominate.
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-lg sm:text-xl text-white/60 font-medium leading-relaxed mb-10">
          Generate AI quiz rooms in&nbsp;<strong className="text-white">2 seconds</strong>, battle
          up to&nbsp;<strong className="text-white">200 players</strong>&nbsp;live, and climb a
          global ELO leaderboard. Free forever for students.
        </p>

        {/* Primary CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
          <Link
            href="/auth?mode=signup"
            id="cta-hero-primary"
            className="group inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-[#CC0000] text-white font-black text-base shadow-2xl shadow-red-600/30 hover:shadow-red-600/50 hover:scale-105 active:scale-95 transition-all"
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

        {/* Pricing nudge */}
        <p className="text-xs text-white/30 mb-10">
          Free plan includes 50 AI quiz generations/month ·{' '}
          <Link href="/pricing" className="underline underline-offset-2 hover:text-white/60 transition-colors">See all plans →</Link>
        </p>

        {/* ── Product UI Mockup ── */}
        <div className="relative max-w-3xl mx-auto rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-red-600/10 mb-14">
          {/* Browser chrome */}
          <div className="bg-[#0D0D0D] border-b border-white/5 flex items-center gap-2 px-4 py-3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/50" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
            </div>
            <span className="text-[11px] text-white/20 font-mono ml-2 truncate">qyro.app/battles</span>
          </div>
          {/* Simulated quiz UI */}
          <div className="bg-[#1A1A2E] p-5 sm:p-8">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] text-emerald-400 font-black uppercase tracking-widest">Live · 47 players</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-white/40">
                <span className="font-black text-amber-400">Q3</span>
                <span>/ 10</span>
                <div className="w-16 h-1.5 bg-white/10 rounded-full ml-2 overflow-hidden">
                  <div className="h-full w-[30%] bg-gradient-to-r from-[#CC0000] to-[#FF2222] rounded-full" />
                </div>
              </div>
            </div>
            <div className="text-center mb-6">
              <p className="text-white font-black text-base sm:text-lg leading-snug">
                Which data structure uses LIFO order?
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[['Queue','border-white/5 bg-white/[0.02]'], ['Stack','border-[#CC0000]/50 bg-[#CC0000]/10 text-red-300'], ['Heap','border-white/5 bg-white/[0.02]'], ['Graph','border-white/5 bg-white/[0.02]']].map(([label, cls]) => (
                <div key={label} className={`rounded-xl border px-4 py-3 text-sm font-black text-center ${cls} transition-all`}>{label}</div>
              ))}
            </div>
            <div className="mt-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {['Arjun M.', 'Priya S.', 'Rahul K.'].map((name, i) => (
                  <div key={name} className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#CC0000] to-[#FF2222] flex items-center justify-center text-[9px] font-black">{name[0]}</div>
                    <span className="text-[9px] text-white/40 hidden sm:block">{name}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1 text-amber-400">
                <Trophy size={12} />
                <span className="text-[10px] font-black">2,840 pts</span>
              </div>
            </div>
          </div>
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
          <span>Loved by students across India 🇮🇳</span>
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
          {TRUST_LOGOS.map(({ abbr, full }) => (
            <div key={abbr} className="flex flex-col items-center gap-0.5 group">
              <span className="text-sm font-black text-white/20 group-hover:text-white/60 transition-colors tracking-widest uppercase">
                {abbr}
              </span>
              <span className="text-[9px] text-white/10 group-hover:text-white/30 transition-colors font-medium">
                {full}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FEATURE GRID
      ══════════════════════════════════════════════════════ */}
      <section className="py-20 lg:py-28 px-5 lg:px-8" aria-labelledby="features-heading">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs text-red-400 font-black uppercase tracking-[0.3em] mb-3">Platform Features</p>
            <h2 id="features-heading" className="text-3xl lg:text-5xl font-black tracking-tight mb-4">
              Everything you need to<br className="hidden lg:block" />{' '}
              <span className="text-[#CC0000]">dominate the arena</span>
            </h2>
            <p className="text-white/50 max-w-xl mx-auto">
              From neural forge to live analytics — Qyro covers the entire battle lifecycle.
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
          <p className="text-xs text-[#00D4B4] font-black uppercase tracking-[0.3em] mb-3">How It Works</p>
          <h2 id="how-heading" className="text-3xl lg:text-5xl font-black tracking-tight mb-14">
            Live in <span className="text-[#00D4B4]">3 steps</span>
          </h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Generate', desc: 'Type any topic — AI creates 10 questions in under 2 seconds.' },
              { step: '02', title: 'Share PIN', desc: 'Players join your room with a 6-digit PIN. No account needed to play.' },
              { step: '03', title: 'Battle', desc: 'Run the quiz live, watch real-time scores, and see the leaderboard.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#CC0000]/20 to-[#FF2222]/20 border border-white/10 flex items-center justify-center font-black text-xl text-red-400 mb-4">
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
            <p className="text-xs text-red-400 font-black uppercase tracking-[0.3em] mb-3">User Stories</p>
            <h2 id="testimonials-heading" className="text-3xl lg:text-4xl font-black">
              What learners say
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TESTIMONIALS.map(({ name, role, quote, rating }) => (
              <blockquote
                key={name}
                className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all flex flex-col"
              >
                <div className="flex items-center gap-0.5 mb-4" aria-label={`${rating} out of 5 stars`}>
                  {[1,2,3,4,5].map((s) => (
                    <Star
                      key={s}
                      size={12}
                      className={s <= rating ? 'text-amber-400' : 'text-white/10'}
                      fill={s <= rating ? '#f59e0b' : 'transparent'}
                    />
                  ))}
                  <span className="ml-1.5 text-[10px] text-white/40 font-bold">{rating}/5</span>
                </div>
                <p className="text-sm text-white/70 leading-relaxed mb-4 italic flex-1">&ldquo;{quote}&rdquo;</p>
                <footer className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center text-xs font-black text-red-300">
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
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00D4B4]/10 border border-[#00D4B4]/20 text-[#00D4B4] text-xs font-black uppercase tracking-widest mb-8">
            <Award size={12} />
            Free plan — no credit card needed
          </div>
          <h2 id="final-cta-heading" className="text-3xl lg:text-5xl font-black tracking-tight mb-6">
            Ready to host your<br />first arena?
          </h2>
          <p className="text-white/50 mb-10 leading-relaxed">
            Join 10,000+ students and educators already using Qyro to make learning
            competitive, engaging, and measurable.
          </p>
          <Link
            href="/auth?mode=signup"
            id="cta-final-signup"
            className="group inline-flex items-center gap-3 px-10 py-5 rounded-2xl bg-[#CC0000] text-white font-black text-lg shadow-2xl shadow-red-600/30 hover:shadow-red-600/50 hover:scale-105 active:scale-95 transition-all"
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
                <div className="w-7 h-7 rounded-lg overflow-hidden">
                  <img src="/qyro-logo.png" alt="Qyro" className="w-full h-full object-cover" />
                </div>
                <span className="font-black text-base tracking-tight uppercase italic">QYRO</span>
              </Link>
              <p className="text-xs text-white/30 leading-relaxed">
                AI-powered competitive quiz arena. Build. Compete. Dominate.
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
            <p className="text-xs text-white/20">© {new Date().getFullYear()} Qyro. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <p className="text-xs text-white/20">Made with ❤️ in India</p>
              <div className="flex items-center gap-3">
                <a href="https://twitter.com/qyro_arena" target="_blank" rel="noopener noreferrer" aria-label="Twitter / X" className="text-white/20 hover:text-white/60 transition-colors"><XIcon size={14} /></a>
                <a href="https://instagram.com/qyro_arena" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-white/20 hover:text-white/60 transition-colors"><InstagramIcon size={14} /></a>
                <a href="https://github.com/infinity-me" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="text-white/20 hover:text-white/60 transition-colors"><GithubIcon size={14} /></a>
                <a href="https://discord.gg/qyro" target="_blank" rel="noopener noreferrer" aria-label="Discord" className="text-white/20 hover:text-white/60 transition-colors"><MessageSquare size={14} /></a>
              </div>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
