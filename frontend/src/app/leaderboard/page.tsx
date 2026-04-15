'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Star, TrendingUp, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/axios';

const dummyLeaderboard = [
  { rank: 1, name: "MindBreaker", rating: 1842, quizzes: 127, avgScore: "92%", bestRank: "#1" },
  { rank: 2, name: "QuizSniper", rating: 1765, quizzes: 119, avgScore: "89%", bestRank: "#1" },
  { rank: 3, name: "NightCrawler", rating: 1710, quizzes: 102, avgScore: "87%", bestRank: "#2" },
  { rank: 4, name: "RaptorX", rating: 1669, quizzes: 98, avgScore: "85%", bestRank: "#3" },
  { rank: 5, name: "ShadowWizard", rating: 1622, quizzes: 110, avgScore: "84%", bestRank: "#4" },
];

export default function LeaderboardPage() {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const res = await api.get('/leaderboard');
        setData(res.data.scores || []);
      } catch (err) {
        console.error('Failed to fetch leaderboard', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchLeaderboard();
  }, []);

  return (
    <div className="py-10">
      <div className="flex flex-col gap-1 mb-12">
        <h2 className="text-3xl font-bold tracking-tight">Leaderboard & Ratings</h2>
        <p className="text-text-soft">See who’s dominating your quizzes and how ratings are evolving.</p>
      </div>

      <div className="grid lg:grid-cols-[1fr_400px] gap-10">
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex gap-2">
            {['This week', 'This month', 'All-time'].map((filter, i) => (
              <button 
                key={i}
                className={cn(
                  "px-6 py-2 rounded-full text-[11.5px] font-black uppercase tracking-widest transition-all",
                  i === 0 
                    ? "bg-accent text-white shadow-[0_0_20px_rgba(99,102,241,0.3)] ring-1 ring-white/10 scale-105" 
                    : "glass text-text-soft hover:text-white"
                )}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="glass rounded-[32px] overflow-hidden border-white/5">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white/5 text-[10px] uppercase tracking-widest text-text-soft font-black">
                    <th className="px-6 py-4">#</th>
                    <th className="px-6 py-4">Player</th>
                    <th className="px-6 py-4">Rating</th>
                    <th className="px-6 py-4 hidden sm:table-cell">Quizzes</th>
                    <th className="px-6 py-4 hidden md:table-cell">Avg Score</th>
                    <th className="px-6 py-4 hidden lg:table-cell">Best Rank</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-20 text-center animate-pulse text-text-soft">Loading rankings...</td>
                    </tr>
                  ) : (
                    data.map((player, i) => (
                      <motion.tr 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        key={i} 
                        className="hover:bg-white/[0.02] transition-colors group"
                      >
                        <td className="px-6 py-5 font-black text-text-soft text-center w-16">
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1)}
                        </td>
                        <td className="px-6 py-5 font-bold group-hover:text-accent transition-colors">
                          {player.name}
                        </td>
                        <td className="px-6 py-5">
                          <span className="bg-accent/10 text-accent px-3 py-1 rounded-lg font-black text-xs">
                            {player.rating || player.score || 0}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-sm text-text-soft hidden sm:table-cell">{player.quizzes || 0}</td>
                        <td className="px-6 py-5 text-sm text-text-soft hidden md:table-cell">{player.avgScore || '-'}</td>
                        <td className="px-6 py-5 text-sm text-text-soft hidden lg:table-cell">{player.bestRank || '-'}</td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Tactical Divider (Mobile Only) */}
        <div className="lg:hidden h-px w-full bg-gradient-to-r from-transparent via-white/5 to-transparent my-10" />

        {/* Info Cards */}
        <div className="space-y-6">
          <div className="glass p-8 rounded-[32px]">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="text-accent-alt" />
              <h3 className="font-bold text-lg">How ratings work</h3>
            </div>
            <ul className="space-y-4 text-sm text-text-soft leading-relaxed">
              {[
                'Each player starts around 1200 rating.',
                'Win vs higher-rated player → bigger gain.',
                'Win vs similar rating → moderate gain.',
                'Loss vs lower-rated group → bigger loss.',
              ].map((text, i) => (
                <li key={i} className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2 shrink-0" />
                  {text}
                </li>
              ))}
            </ul>
            <p className="mt-8 text-[11px] text-text-soft bg-accent-soft p-4 rounded-2xl border border-accent/20 italic">
              Behind the scenes, an Elo-like formula updates rating based on opponent strength and quiz difficulty.
            </p>
          </div>

          <div className="glass p-8 rounded-[32px] bg-gradient-to-br from-bg-soft/50 to-transparent">
            <div className="flex items-center gap-3 mb-6">
              <Star className="text-yellow-400" />
              <h3 className="font-bold text-lg">Mode-based ratings</h3>
            </div>
            <div className="space-y-6">
              {[
                { title: 'Quiz (Rapid)', desc: 'Standard class quizzes' },
                { title: 'Tournament (Blitz)', desc: 'Fast-paced event games' },
                { title: 'Practice (Casual)', desc: 'Unrated practice mode' },
              ].map((mode, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <span className="font-bold text-sm">{mode.title}</span>
                  <span className="text-[10px] text-text-soft uppercase tracking-widest">{mode.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
