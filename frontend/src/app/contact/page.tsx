'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { XIcon, InstagramIcon, GithubIcon, WhatsappIcon } from '@/components/ui/BrandIcons';
import { cn } from '@/lib/utils';
import api from '@/lib/axios';

const INTENT_OPTIONS = [
  'Host a college event',
  'Try in my classroom',
  'Give feedback',
  'Discuss collaboration',
  'Report a bug',
  'Other',
];

type Status = 'idle' | 'sending' | 'success' | 'error';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', intent: INTENT_OPTIONS[0], message: '' });
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setErrorMsg('Please fill in all fields.');
      setStatus('error');
      return;
    }
    setStatus('sending');
    setErrorMsg('');
    try {
      await api.post('/api/contact', {
        name: form.name.trim(),
        email: form.email.trim(),
        intent: form.intent,
        message: form.message.trim(),
      });
      setStatus('success');
      setForm({ name: '', email: '', intent: INTENT_OPTIONS[0], message: '' });
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.error || 'Failed to send. Please email us directly at samarpan.quiz.auth@gmail.com');
      setStatus('error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10 lg:py-20">
      <div className="flex flex-col items-center text-center gap-4 mb-16">
        <h1 className="text-4xl lg:text-6xl font-black tracking-tight">Contact Us</h1>
        <p className="text-text-soft text-lg max-w-2xl leading-relaxed">
          Reach out for collaborations, feedback, or event hosting. We reply within 24 hours on weekdays.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-12 items-start">
        {/* Contact Form */}
        <motion.form
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onSubmit={handleSubmit}
          className="glass p-8 md:p-12 rounded-[40px] space-y-6"
        >
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-widest text-text-soft ml-1">Name *</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Your full name"
              required
              className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-accent transition-all"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-widest text-text-soft ml-1">Email *</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@institute.com"
              required
              className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-accent transition-all"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-widest text-text-soft ml-1">I want to</label>
            <select
              name="intent"
              value={form.intent}
              onChange={handleChange}
              className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-accent transition-all"
            >
              {INTENT_OPTIONS.map(opt => <option key={opt} className="bg-[#020617]">{opt}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-widest text-text-soft ml-1">Message *</label>
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              placeholder="Tell us about your idea or event..."
              required
              className="bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-accent transition-all min-h-[150px] resize-none"
            />
          </div>

          {status === 'success' && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-black">
              <CheckCircle size={18} /> Message sent! We&apos;ll reply within 24 hours.
            </div>
          )}
          {status === 'error' && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              <AlertCircle size={18} className="shrink-0" /> {errorMsg}
            </div>
          )}

          <button
            type="submit"
            id="contact-submit-btn"
            disabled={status === 'sending' || status === 'success'}
            className="w-full py-5 text-lg rounded-2xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-black flex items-center justify-center gap-3 hover:opacity-90 transition-all disabled:opacity-60 shadow-lg shadow-indigo-500/20"
          >
            {status === 'sending' ? (
              <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sending…</>
            ) : status === 'success' ? (
              <><CheckCircle size={20} /> Sent!</>
            ) : (
              <><Send size={20} /> Send Message</>
            )}
          </button>
        </motion.form>

        {/* Contact Info */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-8"
        >
          <div className="glass p-10 rounded-[40px] space-y-8">
            <h3 className="text-2xl font-black">Get in touch</h3>
            <div className="space-y-6">
              {[
                { icon: Mail,   title: 'Email address', value: 'samarpan.quiz.auth@gmail.com', href: 'mailto:samarpan.quiz.auth@gmail.com', color: 'text-accent' },
                { icon: Phone,  title: 'Phone number',  value: '+91 63927 08964',              href: 'tel:+916392708964',                  color: 'text-accent-alt' },
                { icon: MapPin, title: 'Location',       value: 'Kanpur, Uttar Pradesh, India', href: 'https://maps.google.com/?q=Kanpur,India', color: 'text-orange-500' },
              ].map(({ icon: Icon, title, value, href, color }, i) => (
                <a key={i} href={href} target="_blank" rel="noopener noreferrer" className="flex gap-4 group">
                  <div className={cn('w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-white/10 transition-colors', color)}>
                    <Icon size={22} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-black tracking-widest text-text-soft mb-1">{title}</span>
                    <span className="font-bold group-hover:text-white transition-colors">{value}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>

          <div className="glass p-10 rounded-[40px] bg-gradient-to-br from-accent/10 to-transparent">
            <h3 className="font-bold mb-6">Connect with us</h3>
            <div className="flex gap-4">
              {[
                { Icon: WhatsappIcon,  href: 'https://whatsapp.com/channel/0029VbCDJ4M1XquaIIpJFw2b', label: 'WhatsApp' },
                { Icon: InstagramIcon, href: 'https://www.instagram.com/me.aman_2005?igsh=azJhMHpzOWtwOTM3', label: 'Instagram' },
                { Icon: GithubIcon,    href: 'https://github.com/infinity-me', label: 'GitHub' },
                { Icon: XIcon,         href: 'https://x.com', label: 'X (Twitter)' },
              ].map(({ Icon, href, label }, i) => (
                <a
                  key={i}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-accent/10 hover:text-accent hover:border-accent/30 transition-all"
                >
                  <Icon size={20} />
                </a>
              ))}
            </div>
            <div className="mt-8 p-4 rounded-2xl bg-white/5 border border-white/5">
              <p className="text-xs text-text-soft leading-relaxed">
                <span className="font-black text-white">Response time:</span> Within 24 hours on weekdays.
                For institution inquiries, email{' '}
                <a href="mailto:samarpan.quiz.auth@gmail.com" className="text-accent underline underline-offset-2">
                  samarpan.quiz.auth@gmail.com
                </a>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
