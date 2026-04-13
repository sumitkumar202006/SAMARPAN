'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Compass, Flame, Calendar, BookOpen, GraduationCap, Calculator, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

const categories = [
  { name: 'Computer Science', icon: GraduationCap, quizzes: 124, color: 'text-blue-400' },
  { name: 'Aptitude', icon: Calculator, quizzes: 86, color: 'text-accent-alt' },
  { name: 'GATE / JEE', icon: Trophy, color: 'text-orange-400' }, // Wait, Trophy wasn't imported yet
  { name: 'Maths', icon: Calculator, quizzes: 52, color: 'text-purple-400' },
  { name: 'General Knowledge', icon: Globe, quizzes: 93, color: 'text-accent' },
];

import { Trophy, Zap, Star } from 'lucide-react';
import api from '@/lib/axios';

export default function ExplorePage() {
  const [trending, setTrending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPublic = async () => {
      try {
        const res = await api.get('/api/quizzes/public');
        setTrending(res.data.quizzes || []);
      } catch (err) {
        console.error("Failed to fetch public quizzes", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPublic();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10">
      <div className="flex flex-col gap-1 mb-12">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Explore Arena</h2>
        <p className="text-text-soft">Browse public quizzes or join upcoming live events.</p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16"
      >
        <div className="glass p-8 rounded-[32px] space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <Flame className="text-orange-500" />
            <h3 className="font-bold text-lg">Trending Quizzes</h3>
          </div>
          <div className="space-y-4">
            {loading ? (
              <div className="py-10 text-center text-text-soft text-xs animate-pulse uppercase tracking-widest font-black">Loading trending...</div>
            ) : trending.length > 0 ? (
              trending.slice(0, 5).map((quiz, i) => (
                <div key={i} className="flex flex-col p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-accent/30 transition-all cursor-pointer group">
                  <span className="font-bold text-sm mb-1 group-hover:text-accent transition-all uppercase">{quiz.title}</span>
                  <span className="text-[10px] text-text-soft uppercase tracking-widest leading-none">{quiz.questions?.length} Questions • {quiz.topic}</span>
                </div>
              ))
            ) : (
              <div className="py-10 text-center text-text-soft text-xs italic">No quizzes found yet.</div>
            )}
          </div>
        </div>

        <div className="glass p-8 rounded-[32px] space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="text-accent-alt" />
            <h3 className="font-bold text-lg">Upcoming Events</h3>
          </div>
          <div className="space-y-4">
            {[
              { name: 'National Quiz Finale', date: 'Tomorrow, 5 PM', prize: '$500' },
              { name: 'Tech Trivia Night', date: 'Fri, 8 PM', prize: 'Exclusive Badge' },
              { name: 'Math Blitz 2026', date: 'Sun, 10 AM', prize: 'Premium Rank' },
            ].map((event, i) => (
              <div key={i} className="flex flex-col p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-accent-alt/30 transition-all cursor-pointer group">
                <span className="font-bold text-sm mb-1 group-hover:text-accent-alt transition-all">{event.name}</span>
                <span className="text-[10px] text-text-soft uppercase tracking-widest leading-none">{event.date} • Prize: {event.prize}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass p-8 rounded-[32px] space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <Star className="text-yellow-400" />
            <h3 className="font-bold text-lg">Recommended for You</h3>
          </div>
          <div className="space-y-4">
            {[
              { name: 'Operating Systems - Advanced', level: 'Hard' },
              { name: 'Data Structures - Trees', level: 'Medium' },
              { name: 'Python for Beginners', level: 'Easy' },
            ].map((quiz, i) => (
              <div key={i} className="flex flex-col p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-yellow-400/30 transition-all cursor-pointer group">
                <span className="font-bold text-sm mb-1 group-hover:text-yellow-400 transition-all">{quiz.name}</span>
                <span className={cn(
                  "text-[10px] uppercase tracking-widest font-black leading-none",
                  quiz.level === 'Hard' ? 'text-red-400' : quiz.level === 'Medium' ? 'text-yellow-400' : 'text-accent-alt'
                )}>{quiz.level} Difficulty</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      <div className="space-y-8">
        <h3 className="text-xl font-bold px-1">Browse by Category</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {[
            { name: 'Computer Science', icon: Zap, color: 'text-blue-400', bg: 'bg-blue-500/10' },
            { name: 'Aptitude', icon: Calculator, color: 'text-accent-alt', bg: 'bg-accent-alt/10' },
            { name: 'GATE / JEE', icon: Trophy, color: 'text-orange-400', bg: 'bg-orange-500/10' },
            { name: 'Mathematics', icon: Compass, color: 'text-purple-400', bg: 'bg-purple-500/10' },
            { name: 'General Knowledge', icon: Globe, color: 'text-accent', bg: 'bg-accent/10' },
          ].map(({ name, icon: Icon, color, bg }, i) => (
            <motion.div 
              whileHover={{ y: -5 }}
              key={i} 
              className="glass p-8 rounded-[32px] flex flex-col items-center text-center gap-4 cursor-pointer hover:border-accent transition-all group"
            >
              <div className={cn("w-16 h-16 rounded-3xl flex items-center justify-center transition-all group-hover:scale-110 group-hover:rotate-6", bg, color)}>
                <Icon size={32} />
              </div>
              <div className="space-y-1">
                <span className="font-bold text-sm block">{name}</span>
                <span className="text-[10px] text-text-soft uppercase tracking-widest">40+ Quizzes</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
