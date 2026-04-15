'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { QuizEngine } from '@/components/play/QuizEngine';
import { useSocket } from '@/context/SocketContext';
import { Trophy, ArrowLeft, BarChart3, Medal, Target, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import api from '@/lib/axios';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useAuth } from '@/context/AuthContext';
import { useAudio } from '@/context/AudioContext';
import { HostNexus } from '@/components/play/HostNexus';

function LivePlayContent() {
  const { user } = useAuth(); // Added for AuthGuard
  const { playEnter } = useAudio();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pin = searchParams.get('pin');
  const { socket, isConnected } = useSocket();

  const [quiz, setQuiz] = useState<any>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [teamScores, setTeamScores] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isHost, setIsHost] = useState(false);

  const fetchSession = useCallback(async () => {
    if (!pin) return;
    try {
      const res = await api.get(`/api/host/session/${pin}`);
      if (res.data.quiz) {
        setQuiz(res.data.quiz);
        // Determine hosting status - GameSession 'host' is the user ID
        if (user && res.data.host === user.userId) {
          setIsHost(true);
        }
      }
    } catch (err) {
      console.error("Failed to fetch session state", err);
    } finally {
      setLoading(false);
    }
  }, [pin]);

  useEffect(() => {
    if (!isConnected || !socket) return;

    // Fetch initial state in case of late join/refresh
    fetchSession();

    socket.on('game_started', (data: any) => {
      playEnter();
      setQuiz(data.quiz);
    });

    socket.on('quiz_finished', (data: any) => {
      setIsFinished(true);
      if (data.leaderboard) {
        setLeaderboard(data.leaderboard);
      }
      if (data.teamScores) {
        setTeamScores(data.teamScores);
      }
    });

    return () => {
      socket.off('game_started');
      socket.off('quiz_finished');
    };
  }, [isConnected, socket, pin, fetchSession]);

  if (loading && !quiz) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="w-16 h-16 rounded-full border-4 border-accent border-t-transparent animate-spin" />
        <p className="font-bold uppercase tracking-widest text-text-soft">Connecting to arena...</p>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="max-w-md mx-auto mt-20 p-8 glass rounded-3xl text-center space-y-6">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
          <BarChart3 className="text-red-400" size={40} />
        </div>
        <h2 className="text-2xl font-bold">No active quiz found</h2>
        <p className="text-text-soft">We couldn't find a live session for PIN {pin}. It may have ended or been closed.</p>
        <Button onClick={() => router.push('/dashboard')} className="w-full">Back to Dashboard</Button>
      </div>
    );
  }

  if (isFinished) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto px-4 py-20 text-center"
      >
        <Trophy className="mx-auto text-accent mb-6" size={80} />
        <h1 className="text-4xl font-black mb-2 uppercase tracking-tight">Quiz Finished!</h1>
        <p className="text-text-soft mb-8 text-lg">The battle is over. Are you on the podium?</p>

        {teamScores && (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="grid grid-cols-2 gap-4 mb-8"
          >
            <div className={cn(
              "glass p-6 rounded-3xl border-2 flex flex-col items-center justify-center gap-2",
              teamScores['Team A'] > teamScores['Team B'] ? "border-blue-500 bg-blue-500/10" : "border-white/5 opacity-60"
            )}>
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Team A</span>
              <span className="text-3xl font-black text-white">{teamScores['Team A'] || 0}</span>
              {teamScores['Team A'] > teamScores['Team B'] && <span className="text-[10px] font-black bg-blue-500 text-white px-2 py-1 rounded-full">VICTORY</span>}
            </div>
            <div className={cn(
              "glass p-6 rounded-3xl border-2 flex flex-col items-center justify-center gap-2",
              teamScores['Team B'] > teamScores['Team A'] ? "border-red-500 bg-red-500/10" : "border-white/5 opacity-60"
            )}>
              <span className="text-[10px] font-black uppercase tracking-widest text-red-400">Team B</span>
              <span className="text-3xl font-black text-white">{teamScores['Team B'] || 0}</span>
              {teamScores['Team B'] > teamScores['Team A'] && <span className="text-[10px] font-black bg-red-500 text-white px-2 py-1 rounded-full">VICTORY</span>}
            </div>
          </motion.div>
        )}

        <div className="glass p-8 rounded-[32px] mb-12 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
          
          <h3 className="flex items-center justify-center gap-3 font-bold text-xl mb-8">
            <Medal className="text-yellow-400" />
            Final Arena Ranking
          </h3>
          <div className="space-y-3">
            {leaderboard.length > 0 ? leaderboard.map((player, i) => (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                key={i} 
                className={cn(
                  "flex items-center justify-between p-5 rounded-2xl border transition-all",
                  i === 0 ? "bg-accent/10 border-accent/30 shadow-lg" : "bg-background/50 border-white/5"
                )}
              >
                <div className="flex items-center gap-5">
                  <span className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center font-black",
                    i === 0 ? "bg-yellow-400 text-background" : "bg-white/5 text-text-soft"
                  )}>
                    {i === 0 ? '🏆' : `#${i + 1}`}
                  </span>
                  <span className={cn("font-bold text-lg", i === 0 && "text-accent")}>{player.name}</span>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-3">
                    <span className="font-black text-xl text-white">{player.score}</span>
                    <div className="h-4 w-[1px] bg-white/10" />
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] uppercase font-black tracking-tighter text-accent-alt">
                        {player.attemptedCount > 0 ? Math.round((player.correctCount / player.attemptedCount) * 100) : 0}% ACCURACY
                      </span>
                      <span className="text-[8px] uppercase font-bold tracking-widest text-text-soft">{player.streak} STREAK</span>
                    </div>
                  </div>
                  
                  {/* Detailed Stats Row */}
                  <div className="flex items-center gap-3 px-3 py-1 bg-white/5 rounded-full border border-white/5 mt-1 scale-90 origin-right">
                    <div className="flex items-center gap-1.5" title="Correct Answers">
                      <CheckCircle2 size={10} className="text-emerald-400" />
                      <span className="text-[10px] font-bold text-white">{player.correctCount}</span>
                    </div>
                    <div className="flex items-center gap-1.5" title="Incorrect Answers">
                      <XCircle size={10} className="text-rose-400" />
                      <span className="text-[10px] font-bold text-white">{player.incorrectCount}</span>
                    </div>
                    <div className="flex items-center gap-1.5" title="Total Attempted">
                      <Target size={10} className="text-accent" />
                      <span className="text-[10px] font-bold text-white">{player.attemptedCount}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )) : (
              <p className="py-10 text-text-soft italic text-xs">Waiting for host to broadcast rankings...</p>
            )}
          </div>
        </div>

        <Button onClick={() => router.push('/dashboard')} variant="outline" className="border-accent/30 hover:border-accent">
          <ArrowLeft size={18} />
          Back to Terminal
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10">
      {isHost ? (
        <HostNexus 
          quiz={quiz} 
          socket={socket} 
          pin={pin || ''} 
        />
      ) : (
        <QuizEngine 
          quiz={quiz} 
          isLive={true} 
          socket={socket} 
          pin={pin || ''}
          onFinish={(score, total, lb) => {
            setIsFinished(true);
            if (lb) setLeaderboard(lb);
          }}
        />
      )}
    </div>
  );
}

export default function LivePlayPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="w-16 h-16 rounded-full border-4 border-accent border-t-transparent animate-spin" />
        <p className="font-bold uppercase tracking-widest text-text-soft">Loading Battle Terminal...</p>
      </div>
    }>
      <LivePlayContent />
    </Suspense>
  );
}
