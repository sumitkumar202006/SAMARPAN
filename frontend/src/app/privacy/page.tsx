import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | Qyro Arena',
  description: 'Privacy Policy for Qyro Arena — what data we collect and how we use it.',
  alternates: { canonical: 'https://samarpan-quiz.vercel.app/privacy' },
};

const EFFECTIVE_DATE = 'April 27, 2026';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#020617] text-white">
      <div className="max-w-3xl mx-auto px-6 py-20">
        <div className="mb-12">
          <Link href="/" className="text-xs text-[#CC0000] hover:text-red-300 uppercase tracking-widest font-black mb-6 block">← Back to Home</Link>
          <h1 className="text-4xl lg:text-5xl font-black tracking-tight mb-4">Privacy Policy</h1>
          <p className="text-white/40 text-sm">Effective Date: <strong className="text-white/60">{EFFECTIVE_DATE}</strong></p>
        </div>

        <div className="space-y-10 text-white/70 leading-relaxed">

          <section>
            <h2 className="text-xl font-black text-white mb-3">1. What We Collect</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-white">Account information:</strong> Name, email address, username, and optionally a profile photo (via Google OAuth or manual signup).</li>
              <li><strong className="text-white">Usage data:</strong> Quiz history, ELO ratings, XP, win/loss records, and session participation logs.</li>
              <li><strong className="text-white">Payment data:</strong> Processed exclusively by Razorpay. We do not store card numbers or bank details.</li>
              <li><strong className="text-white">Device data:</strong> For trial abuse prevention, we use a browser fingerprint hash (SHA-256 of non-identifying signals). This is not shared.</li>
              <li><strong className="text-white">Contact form:</strong> Name, email, and message submitted via our contact form.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black text-white mb-3">2. How We Use Your Data</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>To operate your account and provide the quiz platform services.</li>
              <li>To process subscription payments and manage plan entitlements.</li>
              <li>To calculate ELO ratings and maintain leaderboards.</li>
              <li>To personalize quiz recommendations in the Explore feed.</li>
              <li>To send you transactional emails (payment confirmations, account notifications).</li>
              <li>To prevent fraud and abuse of free trials.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black text-white mb-3">3. Data Sharing</h2>
            <p>We do not sell your personal data. We share data only with:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong className="text-white">Razorpay</strong> — payment processing (governed by Razorpay&apos;s Privacy Policy)</li>
              <li><strong className="text-white">Groq / Meta (Llama-3)</strong> — AI quiz generation (quiz topics only, no personal data)</li>
              <li><strong className="text-white">Vercel</strong> — hosting and edge delivery</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black text-white mb-3">4. Data Retention</h2>
            <p>We retain your account data for as long as your account is active. You may request deletion by emailing us. Payment records are retained for 7 years as required by Indian tax law.</p>
          </section>

          <section>
            <h2 className="text-xl font-black text-white mb-3">5. Cookies</h2>
            <p>We use essential cookies for authentication (JWT tokens stored in localStorage). We do not use tracking or advertising cookies.</p>
          </section>

          <section>
            <h2 className="text-xl font-black text-white mb-3">6. Children&apos;s Privacy</h2>
            <p>Qyro Arena is not directed at children under 13. If you are under 13, please do not create an account or submit personal information. If we discover a user is under 13, we will delete their account.</p>
          </section>

          <section>
            <h2 className="text-xl font-black text-white mb-3">7. Your Rights</h2>
            <p>You have the right to access, correct, or delete your personal data. To exercise these rights, contact us at{' '}
              <a href="mailto:samarpan.quiz.auth@gmail.com" className="text-[#CC0000] hover:text-red-300 underline">
                samarpan.quiz.auth@gmail.com
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-white mb-3">8. Security</h2>
            <p>We use JWT authentication, bcrypt password hashing, HTTPS/TLS encryption, and Helmet.js security headers. However, no system is 100% secure. Please use a strong, unique password.</p>
          </section>

          <section>
            <h2 className="text-xl font-black text-white mb-3">9. Contact</h2>
            <p>For privacy questions, contact: <a href="mailto:samarpan.quiz.auth@gmail.com" className="text-[#CC0000] hover:text-red-300 underline">samarpan.quiz.auth@gmail.com</a></p>
            <p className="mt-1 text-sm">Qyro Arena, Kanpur, Uttar Pradesh, India</p>
          </section>

          <div className="border-t border-white/10 pt-8 flex flex-wrap gap-4 text-xs text-white/30">
            <Link href="/terms" className="hover:text-white/60 transition-colors">Terms of Service</Link>
            <Link href="/refund" className="hover:text-white/60 transition-colors">Refund Policy</Link>
            <Link href="/contact" className="hover:text-white/60 transition-colors">Contact Us</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
