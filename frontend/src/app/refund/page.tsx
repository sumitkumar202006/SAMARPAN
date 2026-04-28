import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Refund Policy | Qyro Arena',
  description: 'Refund and cancellation policy for Qyro Arena subscriptions.',
  alternates: { canonical: 'https://samarpan-quiz.vercel.app/refund' },
};

const EFFECTIVE_DATE = 'April 27, 2026';

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-[#020617] text-white">
      <div className="max-w-3xl mx-auto px-6 py-20">
        <div className="mb-12">
          <Link href="/" className="text-xs text-[#CC0000] hover:text-red-300 uppercase tracking-widest font-black mb-6 block">← Back to Home</Link>
          <h1 className="text-4xl lg:text-5xl font-black tracking-tight mb-4">Refund Policy</h1>
          <p className="text-white/40 text-sm">Effective Date: <strong className="text-white/60">{EFFECTIVE_DATE}</strong></p>
        </div>

        <div className="space-y-10 text-white/70 leading-relaxed">

          {/* Summary card */}
          <div className="p-6 rounded-2xl bg-[#CC0000]/10 border border-[#CC0000]/20 text-sm">
            <p className="font-black text-red-300 mb-2">Quick Summary</p>
            <ul className="space-y-1 text-white/70">
              <li>✓ Cancel anytime — no lock-in</li>
              <li>✓ Access continues until period end after cancellation</li>
              <li>✓ Free trial ₹1 authorization is non-refundable</li>
              <li>✓ Refund requests considered within 7 days of charge</li>
            </ul>
          </div>

          <section>
            <h2 className="text-xl font-black text-white mb-3">1. Subscription Cancellation</h2>
            <p>You may cancel your Qyro Arena subscription at any time from your <Link href="/billing" className="text-[#CC0000] hover:text-red-300 underline">Billing page</Link>. Upon cancellation:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Your paid plan features remain active until the end of the current billing period.</li>
              <li>No further charges will be made after cancellation.</li>
              <li>Your account will automatically downgrade to the free Spark plan at period end.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black text-white mb-3">2. Free Trial — ₹1 Authorization</h2>
            <p>The 30-day free trial requires a ₹1 Razorpay mandate authorization. This ₹1 is charged to verify your payment method and is <strong className="text-white">non-refundable</strong>. It is a one-time authorization fee, not a subscription charge.</p>
            <p className="mt-2">The full plan price is charged automatically only after the 30-day trial ends. You may cancel at any time during the trial to avoid being charged the full amount — no questions asked.</p>
          </section>

          <section>
            <h2 className="text-xl font-black text-white mb-3">3. Refund Eligibility</h2>
            <p>We consider refund requests on a case-by-case basis under the following conditions:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li><strong className="text-white">Within 7 days of charge:</strong> If you were charged in error, or if a technical fault on our end prevented you from accessing paid features, contact us within 7 days for a full refund review.</li>
              <li><strong className="text-white">Duplicate charges:</strong> Any duplicate billing will be refunded in full within 5 business days.</li>
              <li><strong className="text-white">Service outages:</strong> Extended outages (&gt;24 hours of consecutive downtime) may qualify for a prorated credit.</li>
            </ul>
            <p className="mt-3"><strong className="text-white">Non-eligible:</strong> Refunds are not provided for partial months, change-of-mind cancellations, or unused AI generation quota.</p>
          </section>

          <section>
            <h2 className="text-xl font-black text-white mb-3">4. How to Request a Refund</h2>
            <p>Email us at <a href="mailto:samarpan.quiz.auth@gmail.com" className="text-[#CC0000] hover:text-red-300 underline">samarpan.quiz.auth@gmail.com</a> with:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Your registered email address</li>
              <li>Razorpay payment ID (found in your email receipt)</li>
              <li>Reason for the refund request</li>
            </ul>
            <p className="mt-2">We will respond within 2 business days. Approved refunds are processed via Razorpay and typically reflect within 5–7 business days.</p>
          </section>

          <section>
            <h2 className="text-xl font-black text-white mb-3">5. Institution Plan</h2>
            <p>The Institution plan (₹4,999/month) is governed by a separate agreement. Refund terms for institution plans are negotiated during onboarding. Contact us at <a href="mailto:samarpan.quiz.auth@gmail.com" className="text-[#CC0000] hover:text-red-300 underline">samarpan.quiz.auth@gmail.com</a> for institution billing queries.</p>
          </section>

          <section>
            <h2 className="text-xl font-black text-white mb-3">6. Contact</h2>
            <p>Refund and billing support: <a href="mailto:samarpan.quiz.auth@gmail.com" className="text-[#CC0000] hover:text-red-300 underline">samarpan.quiz.auth@gmail.com</a></p>
          </section>

          <div className="border-t border-white/10 pt-8 flex flex-wrap gap-4 text-xs text-white/30">
            <Link href="/terms" className="hover:text-white/60 transition-colors">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-white/60 transition-colors">Privacy Policy</Link>
            <Link href="/contact" className="hover:text-white/60 transition-colors">Contact Us</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
