import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service | Qyro Arena',
  description: 'Terms of Service for Qyro Arena — AI-powered live quiz platform.',
  alternates: { canonical: 'https://samarpan-quiz.vercel.app/terms' },
};

const EFFECTIVE_DATE = 'April 27, 2026';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#020617] text-white">
      <div className="max-w-3xl mx-auto px-6 py-20">
        {/* Header */}
        <div className="mb-12">
          <Link href="/" className="text-xs text-[#CC0000] hover:text-red-300 uppercase tracking-widest font-black mb-6 block">← Back to Home</Link>
          <h1 className="text-4xl lg:text-5xl font-black tracking-tight mb-4">Terms of Service</h1>
          <p className="text-white/40 text-sm">Effective Date: <strong className="text-white/60">{EFFECTIVE_DATE}</strong></p>
        </div>

        <div className="prose prose-invert max-w-none space-y-10 text-white/70 leading-relaxed">

          <section>
            <h2 className="text-xl font-black text-white mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using Qyro Arena (&quot;the Platform&quot;, &quot;we&quot;, &quot;us&quot;) at samarpan-quiz.vercel.app, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Platform.</p>
          </section>

          <section>
            <h2 className="text-xl font-black text-white mb-3">2. Description of Service</h2>
            <p>Qyro Arena is an AI-powered live quiz platform that allows users to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Generate quiz questions using AI (powered by Groq/Llama-3)</li>
              <li>Host real-time multiplayer quiz sessions</li>
              <li>Compete in ELO-ranked battles</li>
              <li>Browse and remix community quizzes via the Marketplace</li>
              <li>Participate in events and tournaments</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black text-white mb-3">3. User Accounts</h2>
            <p>You must provide accurate information when creating an account. You are responsible for maintaining the confidentiality of your account credentials. You must be at least 13 years of age to use this Platform. Accounts found to be used for cheating, harassment, or abuse will be terminated without notice.</p>
          </section>

          <section>
            <h2 className="text-xl font-black text-white mb-3">4. Subscriptions and Payments</h2>
            <p>Qyro Arena offers free and paid subscription plans. Paid plans are processed via Razorpay and are subject to the following:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong className="text-white">Auto-pay:</strong> Paid plans use recurring auto-pay via Razorpay subscription mandates.</li>
              <li><strong className="text-white">Free Trial:</strong> The 30-day free trial requires a ₹1 authorization (mandate) via Razorpay. The full plan price is charged only after the trial period ends.</li>
              <li><strong className="text-white">Cancellation:</strong> You may cancel at any time. Your access continues until the end of the current billing period.</li>
              <li><strong className="text-white">Refunds:</strong> See our <Link href="/refund" className="text-[#CC0000] hover:text-red-300 underline">Refund Policy</Link>.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black text-white mb-3">5. Content and Intellectual Property</h2>
            <p>AI-generated quiz content is provided as-is and may contain errors. Qyro Arena does not guarantee the accuracy of AI-generated questions. User-uploaded content (quizzes, PDFs) remains the property of the uploader. By publishing content to the Marketplace, you grant Qyro Arena a non-exclusive license to display and distribute that content on the Platform.</p>
          </section>

          <section>
            <h2 className="text-xl font-black text-white mb-3">6. Anti-Cheat Policy</h2>
            <p>The Platform employs tab-switch detection, IP-based monitoring, and strike systems in rated matches. Violations may result in ELO penalties, temporary suspension, or permanent ban at our sole discretion.</p>
          </section>

          <section>
            <h2 className="text-xl font-black text-white mb-3">7. Disclaimer of Warranties</h2>
            <p>The Platform is provided &quot;as is&quot; without warranties of any kind. We do not guarantee uninterrupted or error-free service. Qyro Arena is not liable for any loss of data, ELO rating, or subscription access due to technical failures.</p>
          </section>

          <section>
            <h2 className="text-xl font-black text-white mb-3">8. Governing Law</h2>
            <p>These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in Kanpur, Uttar Pradesh, India.</p>
          </section>

          <section>
            <h2 className="text-xl font-black text-white mb-3">9. Contact</h2>
            <p>For questions about these Terms, please contact us at{' '}
              <a href="mailto:samarpan.quiz.auth@gmail.com" className="text-[#CC0000] hover:text-red-300 underline">
                samarpan.quiz.auth@gmail.com
              </a>.
            </p>
          </section>

          <div className="border-t border-white/10 pt-8 flex flex-wrap gap-4 text-xs text-white/30">
            <Link href="/privacy" className="hover:text-white/60 transition-colors">Privacy Policy</Link>
            <Link href="/refund" className="hover:text-white/60 transition-colors">Refund Policy</Link>
            <Link href="/contact" className="hover:text-white/60 transition-colors">Contact Us</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
