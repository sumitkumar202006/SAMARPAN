'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sword, Copy, CheckCheck, MessageCircle, X, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChallengeInviteProps {
  quizId: string;
  quizTitle: string;
  challengerName: string;
  score: number;
  accuracy: number;
}

/**
 * Generates a challenge deep-link and presents share options.
 * On the battles page, a banner fires when ?challenge= param is detected.
 */
export const ChallengeInvite: React.FC<ChallengeInviteProps> = ({
  quizId,
  quizTitle,
  challengerName,
  score,
  accuracy,
}) => {
  const [copied, setCopied] = useState(false);

  const challengeUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/play/solo?quizId=${quizId}&challenge=${encodeURIComponent(challengerName)}`
    : '';

  const challengeText = `💥 ${challengerName} scored ${accuracy}% on "${quizTitle}" in Qyro Arena. Think you can beat them? Accept the challenge!`;

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(`${challengeText}\n${challengeUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [challengeText, challengeUrl]);

  const handleTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(challengeText)}&url=${encodeURIComponent(challengeUrl)}`,
      '_blank', 'noopener,noreferrer'
    );
  };

  const handleWhatsApp = () => {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(`${challengeText}\n${challengeUrl}`)}`,
      '_blank', 'noopener,noreferrer'
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-[28px] bg-gradient-to-br from-red-500/5 via-transparent to-accent/5 border border-red-500/20 space-y-4"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
          <Sword size={18} />
        </div>
        <div>
          <p className="font-black text-sm uppercase tracking-tight">Challenge a Friend</p>
          <p className="text-[10px] text-text-soft">Dare them to beat your score</p>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
        <p className="text-[10px] font-black uppercase tracking-widest text-text-soft">Your challenge link</p>
        <p className="text-xs text-accent break-all font-mono truncate">{challengeUrl}</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={handleCopy}
          className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-white/20 transition-all"
        >
          {copied ? <CheckCheck size={16} className="text-[#00D4B4]" /> : <Copy size={16} className="text-text-soft" />}
          <span className="text-[9px] font-black uppercase text-text-soft">{copied ? 'Copied!' : 'Copy'}</span>
        </button>
        <button
          onClick={handleTwitter}
          className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-sky-400/30 hover:bg-[#7B61FF]/5 transition-all"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" className="text-[#7B61FF]" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          <span className="text-[9px] font-black uppercase text-text-soft">Twitter</span>
        </button>
        <button
          onClick={handleWhatsApp}
          className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-[#00D4B4]/30 hover:bg-[#00D4B4]/5 transition-all"
        >
          <MessageCircle size={16} className="text-[#00D4B4]" />
          <span className="text-[9px] font-black uppercase text-text-soft">WhatsApp</span>
        </button>
      </div>
    </motion.div>
  );
};

// ─── Challenge banner (shown on /battles?challenge=X) ────────

interface ChallengeBannerProps {
  challengerName: string;
  quizId: string;
  quizTitle?: string;
  onDismiss: () => void;
  onAccept: () => void;
}

export const ChallengeBanner: React.FC<ChallengeBannerProps> = ({
  challengerName, quizId, quizTitle, onDismiss, onAccept
}) => (
  <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="fixed top-20 left-1/2 -translate-x-1/2 z-[400] w-full max-w-lg px-4"
  >
    <div className="glass p-5 rounded-[28px] border border-red-500/30 bg-red-500/5 shadow-2xl shadow-red-500/10 flex items-center gap-4">
      <div className="w-12 h-12 rounded-2xl bg-red-500/20 flex items-center justify-center text-red-400 shrink-0">
        <Sword size={22} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-black text-sm">
          <span className="text-red-400">{challengerName}</span> challenged you!
        </p>
        {quizTitle && <p className="text-[10px] text-text-soft truncate">"{quizTitle}"</p>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onAccept}
          className="px-4 py-2 rounded-xl bg-red-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-red-400 transition-all"
        >
          Accept
        </button>
        <button onClick={onDismiss} className="text-text-soft hover:text-white p-1">
          <X size={16} />
        </button>
      </div>
    </div>
  </motion.div>
);
