'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Share2, Copy, CheckCheck, MessageCircle, 
  Trophy, Zap, Star, X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShareResultCardProps {
  quizTitle: string;
  score: number;
  totalQuestions: number;
  accuracy: number;
  /** e.g. "Solo Practice" | "Live Arena" */
  mode?: string;
  quizId?: string;
}

function getBadge(accuracy: number): { emoji: string; label: string; color: string } {
  if (accuracy >= 90) return { emoji: '🏆', label: 'Legendary', color: 'text-yellow-400' };
  if (accuracy >= 75) return { emoji: '⚡', label: 'Expert', color: 'text-accent' };
  if (accuracy >= 55) return { emoji: '📈', label: 'Solid', color: 'text-emerald-400' };
  return { emoji: '💪', label: 'Warrior', color: 'text-amber-400' };
}

/**
 * Social share panel shown on quiz finish screens.
 * Generates a deep link and supports native share / Twitter / WhatsApp / Copy.
 */
export const ShareResultCard: React.FC<ShareResultCardProps> = ({
  quizTitle,
  score,
  totalQuestions,
  accuracy,
  mode = 'Solo Practice',
  quizId,
}) => {
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const badge = getBadge(accuracy);

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/play/solo?quizId=${quizId || ''}`
    : '';

  const shareText = `🎯 I scored ${score}/${totalQuestions} (${accuracy}% accuracy) on "${quizTitle}" in Samarpan Arena! ${badge.emoji} Can you beat me?`;

  const handleNativeShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Samarpan Quiz Result', text: shareText, url: shareUrl });
      } catch (_) {}
    } else {
      setIsOpen(true);
    }
  }, [shareText, shareUrl]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [shareText, shareUrl]);

  const handleTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="w-full">
      {/* Trigger button */}
      <button
        onClick={handleNativeShare}
        className="flex items-center gap-2 px-6 py-3 rounded-2xl border border-accent/30 bg-accent/5 text-accent text-[10px] font-black uppercase tracking-widest hover:bg-accent/10 transition-all w-full justify-center"
      >
        <Share2 size={14} /> Share Result
      </button>

      {/* Expanded share panel (fallback for non-native) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            className="mt-4 p-6 rounded-[28px] bg-[#080d20] border border-white/10 space-y-5 relative"
          >
            <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 text-text-soft hover:text-white">
              <X size={16} />
            </button>

            {/* Visual result card preview */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-accent/10 via-transparent to-accent-alt/10 border border-white/5 text-center space-y-3">
              <div className="flex items-center justify-center gap-2">
                <Trophy size={18} className="text-accent-alt" />
                <span className="text-[10px] font-black uppercase tracking-widest text-accent">Samarpan Arena</span>
              </div>
              <p className="font-black text-lg truncate max-w-[260px] mx-auto">{quizTitle}</p>
              <div className="flex items-center justify-center gap-6">
                <div className="text-center">
                  <p className="text-2xl font-black">{score}<span className="text-sm opacity-40">/{totalQuestions}</span></p>
                  <p className="text-[9px] uppercase font-black text-text-soft">Score</p>
                </div>
                <div className="text-center">
                  <p className={cn('text-2xl font-black', badge.color)}>{accuracy}%</p>
                  <p className="text-[9px] uppercase font-black text-text-soft">Accuracy</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl">{badge.emoji}</p>
                  <p className={cn('text-[9px] uppercase font-black', badge.color)}>{badge.label}</p>
                </div>
              </div>
              <p className="text-[9px] text-text-soft italic">"{mode}" mode</p>
            </div>

            {/* Share buttons */}
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={handleCopy}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/20 transition-all"
              >
                {copied ? <CheckCheck size={18} className="text-emerald-400" /> : <Copy size={18} className="text-text-soft" />}
                <span className="text-[9px] font-black uppercase tracking-widest text-text-soft">
                  {copied ? 'Copied!' : 'Copy'}
                </span>
              </button>
              <button
                onClick={handleTwitter}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-sky-400/30 hover:bg-sky-400/5 transition-all"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" className="text-sky-400" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                <span className="text-[9px] font-black uppercase tracking-widest text-text-soft">Twitter</span>
              </button>
              <button
                onClick={handleWhatsApp}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-emerald-400/30 hover:bg-emerald-400/5 transition-all"
              >
                <MessageCircle size={18} className="text-emerald-400" />
                <span className="text-[9px] font-black uppercase tracking-widest text-text-soft">WhatsApp</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
