'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Input, Select } from '@/components/ui/Input';
import { Target, Shield, Clock, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';
import { useAudio } from '@/context/AudioContext';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Button } from '@/components/ui/Button';

function HostContent() {
  const { user, isLoading: authLoading } = useAuth();
  const { playEnter } = useAudio();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuiz, setSelectedQuiz] = useState(searchParams.get('quiz') || '');
  const [mode, setMode] = useState('battle');
  const [battleType, setBattleType] = useState('2v2');
  const [timer, setTimer] = useState(30);
  const [isRated, setIsRated] = useState(true);
  const [status, setStatus] = useState<string | null>(null);

  const isFriendly = searchParams.get('friendly') === 'true';

  useEffect(() => {
    const fetchQuizzes = async () => {
      if (!user?.email) return;
      setLoading(true);
      try {
        const res = await api.get(`/api/quizzes/user/${user.email}`);
        setQuizzes(res.data.quizzes || []);
      } catch (err) {
        console.error("Failed to fetch quizzes", err);
      } finally {
        setLoading(false);
      }
    };
    if (!authLoading) fetchQuizzes();

    // Handle Friendly Preset
    if (isFriendly) {
      setMode('battle');
      setIsRated(false);
      setBattleType('1v1'); // Default to 1v1 for friendly battles
    } else {
      setIsRated(true);
    }
  }, [user, authLoading, searchParams, isFriendly]);

  const handleHost = async () => {
    if (!selectedQuiz) {
      alert("Please select a quiz first!");
      return;
    }
    
    playEnter(); // Impactful Arena Start
    setStatus("Generating room...");
    try {
      const res = await api.post('/api/host/start', {
        quizId: selectedQuiz,
        hostEmail: user?.email,
        mode,
        battleType,
        timerSeconds: timer,
        rated: isRated
      });
      
      setStatus('Room created! Redirecting to lobby...');
      // Pass role=host so the lobby knows to emit host_join
      router.push(`/lobby/${res.data.pin}?role=host`);
    } catch (err: any) {
      console.error("Failed to host quiz", err);
      setStatus(err.response?.data?.error || "Failed to create session. Try again.");
    }
  };


  return (
    <AuthGuard>
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10">
      <div className="flex flex-col gap-1 mb-8">
        <div className="flex items-center gap-3">
          <h2 className={cn("text-3xl font-bold tracking-tight", isFriendly && "text-emerald-400")}>
            {isFriendly ? "Casual Arena Setup" : "Host a Quiz"}
          </h2>
          {isFriendly && (
            <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black tracking-widest uppercase rounded-full">
              CASUAL MODE
            </span>
          )}
        </div>
        <p className="text-text-soft">
          {isFriendly 
            ? "Practice with friends without any rating pressure. Streaks still preserved!" 
            : "Pick a quiz, set mode and start a rated session."}
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-8">
        {/* Host Form */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className={cn(
            "glass p-8 rounded-[32px] space-y-6 border-2 transition-colors",
            isFriendly ? "border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.05)]" : "border-transparent"
          )}
        >
          <div className="space-y-4">
            <Select 
              label="Select Quiz" 
              value={selectedQuiz} 
              onChange={(e) => setSelectedQuiz(e.target.value)}
            >
              <option value="">-- Choose a quiz --</option>
              {quizzes.map((q) => (
                <option key={q._id} value={q._id}>{q.title} ({q.questions.length}Q)</option>
              ))}
              {loading && <option disabled>Loading your quizzes...</option>}
            </Select>

            <Select 
              label="Mode" 
              value={mode} 
              onChange={(e) => setMode(e.target.value)}
            >
              <option value="rapid">Quiz (Rapid)</option>
              <option value="blitz">Tournament (Blitz)</option>
              <option value="battle">Squad Battle</option>
              <option value="casual">Practice (Casual – unrated)</option>
            </Select>

            {mode === 'battle' && (
              <Select 
                label="Battle Format" 
                value={battleType} 
                onChange={(e) => setBattleType(e.target.value)}
              >
                <option value="1v1">1v1 Duel</option>
                <option value="2v2">2v2 Squad</option>
                <option value="3v3">3v3 Team</option>
                <option value="4v4">4v4 Mega Battle</option>
              </Select>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <Input 
                label="Timer per question" 
                type="number" 
                value={timer} 
                onChange={(e) => setTimer(parseInt(e.target.value))} 
              />
              <Select 
                label="Rated Session"
                value={isRated ? "true" : "false"}
                onChange={(e) => setIsRated(e.target.value === "true")}
                disabled={isFriendly}
                className={cn(isFriendly && "opacity-50 cursor-not-allowed")}
              >
                <option value="true">Yes, update ratings</option>
                <option value="false">No, casual only</option>
              </Select>
              {!loading && quizzes.length === 0 && (
                <div className="mt-2 text-xs text-text-soft flex items-center gap-2">
                  <span>No quizzes found.</span>
                  <Link href="/create" className="text-accent underline font-bold">Create one now</Link>
                </div>
              )}
            </div>

            <Input label="Room password (optional)" placeholder="Leave blank for open room" />
          </div>

          <button 
            onClick={handleHost}
            disabled={!selectedQuiz || !!status}
            className={cn(
              "w-full py-4 rounded-2xl text-white font-bold text-lg transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none",
              isFriendly 
                ? "bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)]" 
                : "bg-accent shadow-[0_0_20px_rgba(99,102,241,0.4)]"
            )}
          >
            {status || (isFriendly ? "Create Friendly Room" : "Generate game PIN & start")}
          </button>
          
          {isFriendly ? (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-400 leading-relaxed italic">
              Casual matches don't affect your global rating. They are perfect for teaching, fun matches with friends, or 
              training for the next big tournament. Enjoy the game!
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/20 text-[11px] text-orange-200/60 leading-relaxed italic">
              For rated sessions, your rating will increase or decrease based on
              players’ scores and average rating—similar to chess-style matchmaking.
            </div>
          )}
        </motion.div>

        {/* Sidebar Info */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          {isFriendly ? (
            <div className="glass p-8 rounded-[32px] border-emerald-500/30">
              <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-emerald-400">
                <Shield className="text-emerald-400" size={20} />
                Casual Play Advantages
              </h3>
              <ul className="space-y-4">
                {[
                  { label: 'Daily Streaks', value: 'PRESERVED', icon: '🔥' },
                  { label: 'XP Points', value: 'EARNED', icon: '✨' },
                  { label: 'Global Rating', value: 'FROZEN', icon: '❄️' },
                  { label: 'Team Practice', value: 'ENABLED', icon: '🤝' },
                ].map((item, i) => (
                  <li key={i} className="flex justify-between items-center text-sm pb-3 border-b border-white/5 last:border-0">
                    <span className="text-text-soft flex items-center gap-2">
                       <span className="text-xs">{item.icon}</span> {item.label}
                    </span>
                    <span className="font-bold text-emerald-400 text-[10px] tracking-widest uppercase">
                      {item.value}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-8 text-[11px] text-text-soft bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/20 italic">
                Focus on the fun! Casual matches help you master quizzes before taking on the ranked ladder.
              </p>
            </div>
          ) : (
            <div className="glass p-8 rounded-[32px]">
              <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                <TrendingUp className="text-accent-alt" size={20} />
                Expected Rating Impact
              </h3>
              <ul className="space-y-4">
                {[
                  { label: 'Win vs higher-rated group', impact: '+10 to +18' },
                  { label: 'Win vs similar rating', impact: '+6 to +10' },
                  { label: 'Win vs lower-rated group', impact: '+1 to +4' },
                  { label: 'Loss vs lower-rated group', impact: '-10 to -18' },
                ].map((item, i) => (
                  <li key={i} className="flex justify-between items-center text-sm pb-3 border-b border-white/5 last:border-0">
                    <span className="text-text-soft">{item.label}</span>
                    <span className={cn("font-bold", item.impact.startsWith('+') ? "text-accent-alt" : "text-red-400")}>
                      {item.impact}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-8 text-[11px] text-text-soft bg-accent-soft p-4 rounded-2xl border border-accent/20">
                The system uses a dynamic rating & ranking model (XP, badges, levels + AI-powered analytics).
              </p>
            </div>
          )}

          {/* Quick Tips */}
          <div className="glass p-8 rounded-[32px] bg-gradient-to-br from-bg-soft to-background">
            <h3 className="font-bold text-lg mb-4">Hosting Tips</h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <Shield className="text-accent shrink-0" size={18} />
                <p className="text-xs text-text-soft">Require passwords for private classroom competitive matches.</p>
              </div>
              <div className="flex gap-3">
                <Clock className="text-accent shrink-0" size={18} />
                <p className="text-xs text-text-soft">Use 15-20s timers for faster "Blitz" style tournament rounds.</p>
              </div>
              <div className="flex gap-3">
                <Target className="text-accent shrink-0" size={18} />
                <p className="text-xs text-text-soft">AI-generated quizzes are recommended for practice sessions.</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
    </AuthGuard>
  );
}

export default function HostPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 rounded-full border-4 border-accent border-t-transparent animate-spin" />
      </div>
    }>
      <HostContent />
    </Suspense>
  );
}
