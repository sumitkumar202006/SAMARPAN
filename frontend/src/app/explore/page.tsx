'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Compass, Flame, Calendar, GraduationCap, 
  Calculator, Globe, Trophy, Zap, Star, LayoutGrid, Gamepad2, PlayCircle, Plus, Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/axios';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Skeleton } from '@/components/ui/Skeleton';

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
      <AuthGuard>
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10 space-y-12">
          {/* Header skeleton */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <Skeleton className="h-10 w-72" />
              <Skeleton className="h-4 w-56" />
            </div>
          </div>
          {/* 3-column grid skeleton */}
          <div className="grid lg:grid-cols-3 gap-8 items-start">
            {/* Trending column */}
            <div className="space-y-6">
              <Skeleton className="h-4 w-24" />
              <div className="glass p-8 rounded-[40px] space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-3xl bg-white/5">
                    <Skeleton className="w-10 h-10 rounded-2xl shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-2 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Recommended column */}
            <div className="space-y-6">
              <Skeleton className="h-4 w-28" />
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="glass p-6 rounded-[32px] space-y-3">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                ))}
              </div>
            </div>
            {/* Events column */}
            <div className="space-y-6">
              <Skeleton className="h-4 w-24" />
              <div className="space-y-4">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="glass p-6 rounded-[32px] space-y-3">
                    <Skeleton className="h-5 w-32 rounded-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10 space-y-12">

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl lg:text-4xl font-black tracking-tight text-white uppercase italic flex items-center gap-4">
            {isSearching ? <Search className="text-accent" /> : <Compass className="text-accent" />}
            {isSearching ? `Results for "${query || categoryFilter}"` : "Arena Explorer"}
          </h2>
          <p className="text-text-soft text-xs lg:text-sm">
            {isSearching ? `Identified ${searchResults.length} compatible neural assets.` : "Discover top-tier tactical modules and live battlefields."}
          </p>
        </div>
        
        {isSearching && (
          <button 
            onClick={() => router.push('/explore')}
            className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-[10px] font-black uppercase tracking-widest italic"
          >
            Reset Scanner
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {isSearching ? (
          <motion.div 
            key="search"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {searchResults.length > 0 ? searchResults.map((quiz, i) => (
              <div 
                key={quiz._id} 
                onClick={() => handlePlaySolo(quiz._id)}
                className="glass p-8 rounded-[40px] group cursor-pointer hover:border-accent/50 transition-all flex flex-col justify-between h-56 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 blur-[40px] rounded-full group-hover:bg-accent/10 transition-all" />
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <span className="text-[9px] font-black uppercase tracking-widest text-accent bg-accent/10 px-3 py-1.5 rounded-xl border border-accent/20">
                      {quiz.difficulty || 'CALIBRATED'}
                    </span>
                    <PlayCircle className="text-white/20 group-hover:text-accent transition-all group-hover:scale-110" size={24} />
                  </div>
                  <h3 className="font-black text-lg leading-tight mb-2 group-hover:text-accent transition-all uppercase italic">{quiz.title}</h3>
                  <p className="text-[10px] text-text-soft flex items-center gap-2 uppercase tracking-tighter">
                    <LayoutGrid size={12} /> {quiz.topic}
                  </p>
                </div>
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5 relative z-10">
                  <span className="text-[9px] text-text-soft font-black uppercase tracking-widest">
                    {quiz.questions?.length} Modules • {quiz.playCount || 0} Synced
                  </span>
                  <span className="text-[10px] font-black text-white group-hover:translate-x-1 transition-all uppercase italic">Infiltrate →</span>
                </div>
              </div>
            )) : (
              <div className="col-span-full py-24 text-center glass rounded-[50px] border-dashed border-white/10">
                <p className="text-text-soft italic font-black uppercase tracking-widest text-xs">No neural assets matched your signature. Expand search parameters.</p>
              </div>
            )}
          </motion.div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8 items-start">
            
            {/* Track 1: Hot Sync (Trending) */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 px-2">
                <div className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500 text-[10px]">1</div>
                <h2 className="text-xs font-black uppercase tracking-widest text-text-soft italic">Hot Sync</h2>
              </div>
              
              <div className="glass p-8 rounded-[40px] border-white/5 space-y-6">
                 {trending.length > 0 ? trending.slice(0, 5).map((quiz) => (
                   <div 
                     key={quiz._id} 
                     onClick={() => handlePlaySolo(quiz._id)}
                     className="flex items-center gap-4 p-4 rounded-3xl bg-white/5 border border-white/5 hover:border-orange-500/40 hover:bg-white/10 transition-all cursor-pointer group"
                   >
                     <div className="w-10 h-10 rounded-2xl bg-orange-500/20 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-all shadow-inner">
                        <Flame size={18} />
                     </div>
                     <div className="flex flex-col min-w-0">
                       <span className="font-black text-xs uppercase italic truncate group-hover:text-orange-400 transition-all">{quiz.title}</span>
                       <span className="text-[8px] text-text-soft uppercase font-black tracking-widest">
                         {quiz.questions?.length} Qs • {quiz.playCount || 0} PLAYS
                       </span>
                     </div>
                   </div>
                 )) : (
                   <div className="text-center py-10 opacity-30 text-[10px] font-black uppercase tracking-widest italic">Syncing trends...</div>
                 )}
              </div>
            </div>

            {/* Track 2: Tactical Feed (Recommended) */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 px-2">
                <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center text-accent text-[10px]">2</div>
                <h2 className="text-xs font-black uppercase tracking-widest text-text-soft italic">Tactical Feed</h2>
              </div>

              <div className="space-y-4">
                 {recommended.length > 0 ? recommended.slice(0, 4).map((quiz) => (
                    <div 
                      key={quiz._id} 
                      onClick={() => handlePlaySolo(quiz._id)}
                      className="glass p-6 rounded-[32px] border-white/5 hover:border-accent/40 bg-gradient-to-br from-white/5 to-transparent transition-all cursor-pointer group flex flex-col gap-4"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                           <Star className="text-yellow-400" size={16} />
                           <span className={cn(
                             "text-[8px] font-black px-2 py-1 rounded bg-white/5 border uppercase tracking-widest",
                             quiz.difficulty === 'hard' ? 'border-red-500/30 text-red-400' : 'border-emerald-500/30 text-emerald-400'
                           )}>
                             {quiz.difficulty || 'MEDIUM'}
                           </span>
                        </div>
                        <PlayCircle size={18} className="text-white/20 group-hover:text-accent transition-all" />
                      </div>
                      <h4 className="font-black text-sm uppercase italic leading-tight group-hover:text-accent transition-all">{quiz.title}</h4>
                      <p className="text-[9px] text-text-soft font-black uppercase tracking-widest border-t border-white/5 pt-3">
                         {quiz.topic} • AI OPTIMIZED
                      </p>
                    </div>
                 )) : (
                    <div className="text-center py-12 glass rounded-[40px] opacity-30 text-[10px] font-black uppercase tracking-widest italic">Personalizing feed...</div>
                 )}
              </div>
            </div>

            {/* Track 3: Live Theaters (Events) */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 px-2">
                <div className="w-5 h-5 rounded-full bg-accent-alt/20 flex items-center justify-center text-accent-alt text-[10px]">3</div>
                <h2 className="text-xs font-black uppercase tracking-widest text-text-soft italic">Live Theaters</h2>
              </div>

              <div className="space-y-4">
                 {events.length > 0 ? events.map((session) => (
                   <div 
                     key={session._id} 
                     onClick={() => handleJoinEvent(session.pin)}
                     className="glass p-6 rounded-[32px] border-accent-alt/30 bg-accent-alt/[0.03] hover:bg-accent-alt/[0.08] transition-all cursor-pointer group relative overflow-hidden"
                   >
                     <div className="flex justify-between items-start mb-4">
                        <span className="text-[10px] font-black text-accent-alt animate-pulse flex items-center gap-2 bg-accent-alt/10 px-3 py-1 rounded-full border border-accent-alt/20">
                          <Activity size={10} /> LIVE ENGAGEMENT
                        </span>
                        <span className="text-[14px] font-black text-white italic tracking-widest">{session.pin}</span>
                     </div>
                     <h4 className="font-black text-sm group-hover:text-white transition-all uppercase italic mb-1">{session.quiz?.title || "Classified Operation"}</h4>
                     <p className="text-[9px] text-accent-alt font-black uppercase tracking-[0.2em]">
                        {session.mode} DEPLOYMENT
                     </p>
                     <div className="absolute top-0 right-0 w-1.5 h-full bg-accent-alt/20" />
                   </div>
                 )) : (
                   <div className="glass p-10 rounded-[40px] text-center space-y-4 border-dashed border-white/10">
                      <p className="text-[10px] font-black text-text-soft uppercase tracking-widest italic">No active theaters discovered.</p>
                      <button 
                        onClick={() => router.push('/host')}
                        className="px-6 py-3 rounded-2xl bg-accent-alt text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-accent-alt/10"
                      >
                        Initialize Arena
                      </button>
                   </div>
                 )}

                 <div className="p-8 rounded-[40px] bg-white/5 border border-white/5 space-y-4">
                    <div className="flex items-center gap-3">
                       <Zap className="text-yellow-400" size={18} />
                       <h4 className="text-[10px] font-black uppercase tracking-widest italic">Rapid Action</h4>
                    </div>
                    <p className="text-[9px] text-text-soft leading-relaxed italic border-l-2 border-white/10 pl-4">
                       Join a live battle by entering the 6-digit theater PIN in the main console or selecting an active engagement above.
                    </p>
                 </div>
              </div>
            </div>

          </div>
        )}
      </AnimatePresence>

      <div className="space-y-8 pt-10 border-t border-white/5">
        <h3 className="text-xl font-black px-1 flex items-center gap-4 italic uppercase">
          <LayoutGrid className="text-accent" size={24} />
          Theater Categories
          <span className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {[
            { name: 'Computation', id: 'Computer Science', icon: Zap, color: 'text-blue-400', bg: 'bg-blue-500/10' },
            { name: 'Logistics', id: 'Aptitude', icon: Calculator, color: 'text-accent-alt', bg: 'bg-accent-alt/10' },
            { name: 'Gateway', id: 'GATE', icon: Trophy, color: 'text-orange-400', bg: 'bg-orange-500/10' },
            { name: 'Calculus', id: 'Math', icon: Compass, color: 'text-purple-400', bg: 'bg-purple-500/10' },
            { name: 'Global Intel', id: 'General Knowledge', icon: Globe, color: 'text-accent', bg: 'bg-accent/10' },
          ].map(({ name, id, icon: Icon, color, bg }, i) => (
            <motion.div 
              whileHover={{ y: -8, scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              key={i} 
              onClick={() => router.push(`/explore?category=${encodeURIComponent(id)}`)}
              className="glass p-8 rounded-[40px] flex flex-col items-center text-center gap-5 cursor-pointer hover:border-accent group relative overflow-hidden transition-all"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-all" />
              <div className={cn("w-16 h-16 rounded-[24px] flex items-center justify-center transition-all group-hover:scale-110 group-hover:rotate-12 shadow-2xl relative z-10", bg, color)}>
                <Icon size={32} />
              </div>
              <div className="space-y-1 relative z-10">
                <span className="font-black text-xs block group-hover:text-accent transition-all uppercase italic tracking-tighter">{name}</span>
                <span className="text-[8px] text-text-soft uppercase font-black tracking-[0.3em] opacity-40 group-hover:opacity-100 transition-all">INFILTRATE</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      </div>
    </AuthGuard>
  );
}




export default function ExplorePage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="w-16 h-16 rounded-full border-4 border-accent border-t-transparent animate-spin" />
        <p className="font-black uppercase tracking-[0.3em] text-text-soft text-[10px]">Scanning Neural Network...</p>
      </div>
    }>
      <ExploreContent />
    </Suspense>
  );
}
