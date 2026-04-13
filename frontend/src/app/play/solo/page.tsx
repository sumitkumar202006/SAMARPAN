'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { QuizEngine } from '@/components/play/QuizEngine';
import { Trophy, ArrowLeft, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import api from '@/lib/axios';

function SoloPlayContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const quizId = searchParams.get('quiz');

  const [quiz, setQuiz] = useState<any>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuiz = async () => {
      if (!quizId) return;
      try {
        setLoading(true);
        const res = await api.get(`/api/quizzes/${quizId}`);
        setQuiz(res.data);
      } catch (err) {
        console.error("Failed to fetch quiz for solo play", err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [quizId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="w-16 h-16 rounded-full border-4 border-accent border-t-transparent animate-spin" />
        <p className="font-bold uppercase tracking-widest text-text-soft">Initializing Solo Arena...</p>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="max-w-md mx-auto mt-20 p-8 glass rounded-3xl text-center space-y-6">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
          <BarChart3 className="text-red-400" size={40} />
        </div>
        <h2 className="text-2xl font-bold">Quiz Not Found</h2>
        <p className="text-text-soft">We couldn't retrieve the quiz data from the hub. It may have been deleted.</p>
        <Button onClick={() => router.push('/dashboard')} className="w-full">Back to Dashboard</Button>
      </div>
    );
  }

  if (isFinished) {
    const accuracy = Math.round((score / totalQuestions) * 100);
    
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto px-4 py-20 text-center"
      >
        <Trophy className="mx-auto text-accent-alt mb-6 shadow-[0_0_30px_rgba(34,197,94,0.3)]" size={80} />
        <h1 className="text-4xl font-black mb-2 uppercase tracking-tight">Practice Complete!</h1>
        <p className="text-text-soft mb-12 text-lg">You've finished your solo run through “{quiz.title}”.</p>

        <div className="grid grid-cols-2 gap-4 mb-12">
          <div className="glass p-8 rounded-3xl">
            <p className="text-[10px] uppercase font-black tracking-widest text-text-soft mb-2">Final Score</p>
            <p className="text-4xl font-black text-white">{score} <span className="text-lg opacity-40">/ {totalQuestions}</span></p>
          </div>
          <div className="glass p-8 rounded-3xl">
            <p className="text-[10px] uppercase font-black tracking-widest text-text-soft mb-2">Accuracy</p>
            <p className="text-4xl font-black text-accent-alt">{accuracy}%</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={() => window.location.reload()} className="px-8">
            Try Again
          </Button>
          <Button onClick={() => router.push('/dashboard')} variant="outline" className="px-8 border-white/10">
            <ArrowLeft size={18} /> Back to Terminal
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10">
      <QuizEngine 
        quiz={quiz} 
        isLive={false} 
        onFinish={(finalScore, total) => {
          setScore(finalScore);
          setTotalQuestions(total);
          setIsFinished(true);
        }}
      />
    </div>
  );
}

export default function SoloPlayPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="w-16 h-16 rounded-full border-4 border-accent border-t-transparent animate-spin" />
        <p className="font-bold uppercase tracking-widest text-text-soft">Loading Solo Arena...</p>
      </div>
    }>
      <SoloPlayContent />
    </Suspense>
  );
}
