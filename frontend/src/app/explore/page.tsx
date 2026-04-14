'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Compass, Flame, Calendar, GraduationCap, 
  Calculator, Globe, Trophy, Zap, Star, LayoutGrid, Gamepad2, PlayCircle, Plus 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/axios';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function ExploreContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q');
  const categoryFilter = searchParams.get('category');

  const [trending, setTrending] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [recommended, setRecommended] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (query || categoryFilter) {
          setIsSearching(true);
          const res = await api.get(`/api/quizzes/search?q=${encodeURIComponent(query || categoryFilter || '')}`);
          setSearchResults(res.data.quizzes || []);
        } else {
          setIsSearching(false);
          const res = await api.get('/api/explore/home');
          setTrending(res.data.trending || []);
          setEvents(res.data.events || []);
          setRecommended(res.data.recommended || []);
        }
      } catch (err) {
        console.error("Failed to fetch explore data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [query, categoryFilter]);

  const handlePlaySolo = (quizId: string) => {
    router.push(`/play/solo?quiz=${quizId}`);
  };

  const handleJoinEvent = (pin: string) => {
    router.push(`/lobby/${pin}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="w-16 h-16 rounded-full border-4 border-accent border-t-transparent animate-spin" />
        <p className="font-bold uppercase tracking-widest text-text-soft">Scouting the Arena...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            {isSearching ? <Search className="text-accent" /> : <Compass className="text-accent" />}
            {isSearching ? `Results for "${query || categoryFilter}"` : "Explore Arena"}
          </h2>
          <p className="text-text-soft">
            {isSearching ? `Found ${searchResults.length} matches in the cloud.` : "Discover top-tier quizzes and live battlefields."}
          </p>
        </div>
        
        {isSearching && (
          <button 
            onClick={() => router.push('/explore')}
            className="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 transition-all text-xs font-bold uppercase tracking-widest"
          >
            Clear Search
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {isSearching ? (
          <motion.div 
            key="search"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16"
          >
            {searchResults.length > 0 ? searchResults.map((quiz, i) => (
              <div 
                key={quiz._id} 
                onClick={() => handlePlaySolo(quiz._id)}
                className="glass p-6 rounded-3xl group cursor-pointer hover:border-accent/50 transition-all flex flex-col justify-between h-48"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-accent bg-accent/10 px-2 py-1 rounded-lg">
                      {quiz.difficulty || 'Medium'}
                    </span>
                    <PlayCircle className="text-white/20 group-hover:text-accent transition-all" size={20} />
                  </div>
                  <h3 className="font-bold text-lg leading-tight mb-2 group-hover:text-accent transition-all uppercase">{quiz.title}</h3>
                  <p className="text-xs text-text-soft line-clamp-1 italic">Topic: {quiz.topic}</p>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-[10px] text-text-soft uppercase tracking-tighter">
                    {quiz.questions?.length} Questions • {quiz.playCount || 0} PLAYS
                  </span>
                  <span className="text-xs font-black text-white group-hover:translate-x-1 transition-all">PLAY →</span>
                </div>
              </div>
            )) : (
              <div className="col-span-full py-20 text-center glass rounded-[40px] border-dashed">
                <p className="text-text-soft italic">No results found for your search. Try another topic!</p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="home"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16"
          >
            {/* Trending Section */}
            <div className="glass p-6 rounded-[32px] flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <Flame className="text-orange-500" />
                <h3 className="font-bold text-lg">Trending</h3>
              </div>
              <div className="space-y-3 flex-1">
                {trending.length > 0 ? trending.map((quiz) => (
                  <div 
                    key={quiz._id} 
                    onClick={() => handlePlaySolo(quiz._id)}
                    className="flex flex-col p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-accent/30 transition-all cursor-pointer group"
                  >
                    <span className="font-bold text-sm mb-1 group-hover:text-accent transition-all uppercase leading-tight">{quiz.title}</span>
                    <span className="text-[10px] text-text-soft uppercase tracking-widest leading-none">
                      {quiz.questions?.length} Qs • {quiz.topic}
                    </span>
                  </div>
                )) : (
                  <div className="text-center py-10 opacity-30 text-xs italic">No trending quizzes</div>
                )}
              </div>
            </div>

            {/* Upcoming Events Section (Live Lobbies) */}
            <div className="glass p-6 rounded-[32px] flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <Calendar className="text-accent-alt" />
                <h3 className="font-bold text-lg italic">Live Battles</h3>
              </div>
              <div className="space-y-3 flex-1">
                {events.length > 0 ? events.map((session) => (
                  <div 
                    key={session._id} 
                    onClick={() => handleJoinEvent(session.pin)}
                    className="flex flex-col p-4 rounded-2xl bg-accent-alt/10 border border-accent-alt/20 hover:bg-accent-alt/20 transition-all cursor-pointer group relative overflow-hidden"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-sm group-hover:text-white transition-all uppercase leading-tight">Join Live: {session.quiz?.title || "Game"}</span>
                      <span className="text-[10px] font-black text-accent-alt animate-pulse">LIVE</span>
                    </div>
                    <span className="text-[10px] text-white/60 uppercase tracking-widest leading-none">
                      PIN: {session.pin} • {session.mode} MODE
                    </span>
                    <div className="absolute top-0 right-0 w-2 h-full bg-accent-alt/30" />
                  </div>
                )) : (
                  <div className="text-center py-10 flex flex-col items-center gap-4 opacity-50">
                    <p className="text-xs italic">No live events right now.</p>
                    <button 
                      onClick={() => router.push('/host')}
                      className="px-4 py-2 rounded-xl border border-white/5 bg-white/5 hover:bg-accent-alt/20 hover:border-accent-alt/30 text-[10px] font-black uppercase transition-all"
                    >
                      Host One Yourself
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Recommended Section */}
            <div className="glass p-6 rounded-[32px] flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <Star className="text-yellow-400" />
                <h3 className="font-bold text-lg">Recommended</h3>
              </div>
              <div className="space-y-3 flex-1">
                {recommended.length > 0 ? recommended.map((quiz) => (
                  <div 
                    key={quiz._id} 
                    onClick={() => handlePlaySolo(quiz._id)}
                    className="flex flex-col p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-yellow-400/30 transition-all cursor-pointer group"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-sm group-hover:text-yellow-400 transition-all uppercase leading-tight">{quiz.title}</span>
                      <span className={cn(
                        "text-[9px] font-black px-1.5 py-0.5 rounded border uppercase",
                        quiz.difficulty === 'hard' ? 'border-red-500/30 text-red-400' : 'border-accent-alt/30 text-accent-alt'
                      )}>
                        {quiz.difficulty || 'medium'}
                      </span>
                    </div>
                    <span className="text-[10px] text-text-soft uppercase tracking-widest leading-none">Special Training Feed</span>
                  </div>
                )) : (
                  <div className="text-center py-10 opacity-30 text-xs italic">Personalizing your arena...</div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-8">
        <h3 className="text-xl font-bold px-1 flex items-center gap-3 italic">
          <LayoutGrid className="text-accent" size={24} />
          Browse by Arena
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {[
            { name: 'Computer Science', id: 'Computer Science', icon: Zap, color: 'text-blue-400', bg: 'bg-blue-500/10' },
            { name: 'Aptitude', id: 'Aptitude', icon: Calculator, color: 'text-accent-alt', bg: 'bg-accent-alt/10' },
            { name: 'GATE / JEE', id: 'GATE', icon: Trophy, color: 'text-orange-400', bg: 'bg-orange-500/10' },
            { name: 'Mathematics', id: 'Math', icon: Compass, color: 'text-purple-400', bg: 'bg-purple-500/10' },
            { name: 'General Awareness', id: 'General Knowledge', icon: Globe, color: 'text-accent', bg: 'bg-accent/10' },
          ].map(({ name, id, icon: Icon, color, bg }, i) => (
            <motion.div 
              whileHover={{ y: -5, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              key={i} 
              onClick={() => router.push(`/explore?category=${encodeURIComponent(id)}`)}
              className="glass p-6 rounded-[32px] flex flex-col items-center text-center gap-4 cursor-pointer hover:border-accent transition-all group"
            >
              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 group-hover:rotate-6 shadow-xl", bg, color)}>
                <Icon size={28} />
              </div>
              <div className="space-y-1">
                <span className="font-bold text-xs block group-hover:text-accent transition-all">{name}</span>
                <span className="text-[9px] text-text-soft uppercase font-black tracking-widest">ENTER →</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="w-16 h-16 rounded-full border-4 border-accent border-t-transparent animate-spin" />
        <p className="font-bold uppercase tracking-widest text-text-soft">Scouting the Arena...</p>
      </div>
    }>
      <ExploreContent />
    </Suspense>
  );
}
