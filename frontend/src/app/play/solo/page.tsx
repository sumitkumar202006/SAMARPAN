'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { QuizEngine } from '@/components/play/QuizEngine';
import { QuizIntro } from '@/components/play/QuizIntro';
import { AnswerReview, ReviewAnswer } from '@/components/play/AnswerReview';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { Trophy, ArrowLeft, BarChart3, RefreshCw, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import api from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';
import { ShareResultCard } from '@/components/ui/ShareResultCard';
import { ChallengeInvite } from '@/components/ui/ChallengeInvite';

// Session state persisted to localStorage so refresh doesn't wipe progress
const SESSION_KEY = 'samarpan_solo_session';

function SoloPlayContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const quizId = searchParams.get('quiz');
  const { user } = useAuth();

  const [quiz, setQuiz] = useState<any>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Pre-quiz intro gate — shown before the engine starts
  const [showIntro, setShowIntro] = useState(true);

  // Answer review mode
  const [showReview, setShowReview] = useState(false);
  const [reviewAnswers, setReviewAnswers] = useState<ReviewAnswer[]>([]);

  const fetchQuiz = useCallback(async () => {
    if (!quizId) {
      setError('No quiz ID provided. Please navigate from the dashboard.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/api/quizzes/${quizId}`);
      setQuiz(res.data);
    } catch (err: any) {
      const msg = err?.response?.status === 404
        ? 'Quiz not found. It may have been deleted.'
        : 'Failed to load quiz. Check your connection and try again.';
      setError(msg);
      console.error('[SoloPlay] fetchQuiz error:', err);
    } finally {
      setLoading(false);
    }
  }, [quizId, retryCount]);

  useEffect(() => {
    fetchQuiz();
  }, [fetchQuiz]);

  // ── Restore persisted session on mount (survives refresh) ──────────
  useEffect(() => {
    if (!quizId || loading || !quiz) return;
    try {
      const raw = localStorage.getItem(`${SESSION_KEY}_${quizId}`);
      if (!raw) return;
      const saved = JSON.parse(raw);
      // Only restore if quiz matches and session isn't finished
      if (saved.quizId === quizId && !saved.finished) {
        if (saved.score !== undefined) setScore(saved.score);
        if (saved.totalQuestions !== undefined) setTotalQuestions(saved.totalQuestions);
        if (saved.reviewAnswers?.length > 0) setReviewAnswers(saved.reviewAnswers);
        // Skip intro if they were already in the quiz
        if (saved.started) setShowIntro(false);
      }
    } catch { /* ignore corrupt storage */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quiz, quizId]);

  // ── Persist session state on every change ─────────────────────────
  useEffect(() => {
    if (!quizId || !quiz || showIntro) return;
    try {
      localStorage.setItem(`${SESSION_KEY}_${quizId}`, JSON.stringify({
        quizId,
        score,
        totalQuestions,
        reviewAnswers,
        started: true,
        finished: isFinished,
        savedAt: Date.now()
      }));
    } catch { /* quota exceeded — non-critical */ }
  }, [quizId, score, totalQuestions, reviewAnswers, isFinished, quiz, showIntro]);

  // ── Loading ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-2 border-accent/20" />
          <div className="absolute inset-0 w-16 h-16 rounded-full border-2 border-accent border-t-transparent animate-spin" />
        </div>
        <p className="font-bold uppercase tracking-widest text-text-soft text-sm">Initializing Solo Arena...</p>
      </div>
    );
  }

  // ── Error with retry ─────────────────────────────────
  if (error || !quiz) {
    return (
      <div className="max-w-md mx-auto mt-20 p-8 glass rounded-3xl text-center space-y-6">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
          <BarChart3 className="text-red-400" size={40} />
        </div>
        <h2 className="text-2xl font-bold">Quiz Not Found</h2>
        <p className="text-text-soft">{error || 'We couldn\'t retrieve the quiz data. It may have been deleted.'}</p>
        <div className="flex flex-col gap-3">
          <Button
            onClick={() => setRetryCount(c => c + 1)}
            className="w-full flex items-center justify-center gap-2"
          >
            <RefreshCw size={16} /> Retry
          </Button>
          <Button onClick={() => router.push('/dashboard')} variant="outline" className="w-full border-white/10">
            <ArrowLeft size={16} /> Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // ── Quiz Intro Screen ────────────────────────────────
  if (showIntro) {
    return (
      <QuizIntro
        quiz={quiz}
        timerSeconds={30}
        timerMode="per-question"
        isLive={false}
        onStart={() => setShowIntro(false)}
      />
    );
  }

  // ── Finished + Review ────────────────────────────────
  if (isFinished) {
    const accuracy = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto px-4 py-12"
      >
        <AnimatePresence mode="wait">
          {showReview ? (
            <motion.div key="review" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-black uppercase tracking-tight">Answer Review</h2>
                <button
                  onClick={() => setShowReview(false)}
                  className="text-[10px] font-black uppercase tracking-widest text-text-soft hover:text-accent transition-colors"
                >
                  ← Back to Results
                </button>
              </div>
              <AnswerReview answers={reviewAnswers} onClose={() => setShowReview(false)} />
            </motion.div>
          ) : (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
              <Trophy className="mx-auto text-accent-alt mb-6 shadow-[0_0_30px_rgba(34,197,94,0.3)]" size={80} />
              <h1 className="text-4xl font-black mb-2 uppercase tracking-tight">Practice Complete!</h1>
              <p className="text-text-soft mb-10 text-lg">
                You've finished your solo run through "{quiz.title}".
              </p>

              {/* Score cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10">
                <div className="glass p-6 rounded-3xl space-y-2">
                  <p className="text-[10px] uppercase font-black tracking-widest text-text-soft">Final Score</p>
                  <p className="text-4xl font-black text-white">{score} <span className="text-lg opacity-40">/ {totalQuestions}</span></p>
                </div>
                <div className="glass p-6 rounded-3xl space-y-2">
                  <p className="text-[10px] uppercase font-black tracking-widest text-text-soft">Accuracy</p>
                  <p className={cn("text-4xl font-black", accuracy >= 80 ? "text-[#00D4B4]" : accuracy >= 50 ? "text-amber-400" : "text-red-400")}>
                    {accuracy}%
                  </p>
                </div>
                <div className="glass p-6 rounded-3xl space-y-2 col-span-2 sm:col-span-1">
                  <p className="text-[10px] uppercase font-black tracking-widest text-text-soft">Performance</p>
                  <p className="text-2xl font-black text-white">
                    {accuracy >= 90 ? '🏆 Excellent' : accuracy >= 70 ? '⚡ Good' : accuracy >= 50 ? '📈 Average' : '💪 Keep Going'}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={() => {
                    if (quizId) localStorage.removeItem(`${SESSION_KEY}_${quizId}`);
                    setIsFinished(false);
                    setShowIntro(true);
                    setScore(0);
                    setTotalQuestions(0);
                    setReviewAnswers([]);
                  }}
                  className="px-8 flex items-center gap-2"
                >
                  <RefreshCw size={16} /> Play Again
                </Button>
                {reviewAnswers.length > 0 && (
                  <Button
                    onClick={() => setShowReview(true)}
                    variant="outline"
                    className="px-8 border-accent/30 text-accent hover:bg-accent/10 flex items-center gap-2"
                  >
                    <ClipboardList size={16} /> Review Answers
                  </Button>
                )}
                <Button onClick={() => router.push('/dashboard')} variant="outline" className="px-8 border-white/10 flex items-center gap-2">
                  <ArrowLeft size={18} /> Dashboard
                </Button>
              </div>

              {/* Growth: Share + Challenge */}
              <div className="mt-8 grid sm:grid-cols-2 gap-4 text-left">
                <ShareResultCard
                  quizTitle={quiz.title}
                  score={score}
                  totalQuestions={totalQuestions}
                  accuracy={accuracy}
                  mode="Solo Practice"
                  quizId={quizId || ''}
                />
                <ChallengeInvite
                  quizId={quizId || ''}
                  quizTitle={quiz.title}
                  challengerName={user?.name || 'Player'}
                  score={score}
                  accuracy={accuracy}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  // ── Active Quiz ──────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10">
      <ErrorBoundary onReset={() => setRetryCount(c => c + 1)}>
        <QuizEngine
          quiz={quiz}
          isLive={false}
          onFinish={(finalScore, total, _lb, answersLog) => {
            setScore(finalScore);
            setTotalQuestions(total);
            if (answersLog) setReviewAnswers(answersLog);
            setIsFinished(true);
          }}
        />
      </ErrorBoundary>
    </div>
  );
}

export default function SoloPlayPage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
          <div className="w-16 h-16 rounded-full border-4 border-accent border-t-transparent animate-spin" />
          <p className="font-bold uppercase tracking-widest text-text-soft">Loading Solo Arena...</p>
        </div>
      }>
        <SoloPlayContent />
      </Suspense>
    </ErrorBoundary>
  );
}
