'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Play, 
  Plus, 
  Trophy, 
  Users, 
  Target, 
  Zap,
  BookOpen,
  ArrowRight
} from 'lucide-react';
import { UpdatesStrip } from '@/components/dashboard/UpdatesStrip';
import { StatCard } from '@/components/ui/StatCard';
import { QuizCard } from '@/components/ui/QuizCard';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import api from '@/lib/axios';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { getLocalQuizzes, clearLocalQuizzes, deleteLocalQuiz } from '@/lib/storage';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function Dashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Fetch Cloud Quizzes
        let cloudQuizzes = [];
        if (user?.email) {
          const [profileRes, quizzesRes] = await Promise.all([
            api.get(`/api/profile/${user.email}`),
            api.get(`/api/quizzes/user/${user.email}`)
          ]);
          setStats(profileRes.data);
          cloudQuizzes = quizzesRes.data.quizzes || [];
        } else {
          const res = await api.get('/api/quizzes/public');
          cloudQuizzes = res.data.quizzes || [];
        }

        // 2. Fetch Local Practice Quizzes
        const localQuizzes = getLocalQuizzes();

        // 3. Merge (Local First for recent practice)
        setQuizzes([...localQuizzes, ...cloudQuizzes]);
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    if (!authLoading) fetchData();
  }, [user, authLoading]);

  const filteredQuizzes = quizzes.filter(q => {
    const title = q.title?.toLowerCase() || '';
    const topic = q.topic?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    return title.includes(query) || topic.includes(query);
  });

  const handleSyncToCloud = async (q: any) => {
    try {
      setLoading(true);
      const res = await api.post('/api/quizzes', {
        title: q.title,
        topic: q.topic,
        authorId: user?.email,
        questions: q.questions,
        aiGenerated: q.aiGenerated,
        tags: q.tags
      });
      return res.data.quizId;
    } catch (err) {
      console.error("Sync error:", err);
      throw new Error("Failed to sync quiz.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 lg:py-10">
      <UpdatesStrip />

      <div className="flex flex-col gap-1 mb-8">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-text-soft">Your quick overview of tools, recent quizzes, rating and activity.</p>
      </div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-10"
      >
        {/* Hero Section */}
        <motion.section variants={item} className="grid xl:grid-cols-[1fr_350px] gap-10">
          <div className="flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-soft border border-accent/30 text-accent font-bold text-[10px] uppercase tracking-wider mb-4 w-fit">
              Samarpan Arena
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 leading-tight">
              Host. Compete. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-accent-alt">Rank up.</span>
            </h1>
            <p className="text-text-soft text-lg max-w-xl mb-8 leading-relaxed">
              Turn your classroom into an e-sports style arena. Create quizzes,
              host live battles and watch players climb the leaderboard.
            </p>

            <div className="flex flex-wrap gap-4 mb-8">
              <Link href="/battles" className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-tr from-accent to-accent-alt text-white font-bold shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:scale-105 transition-all">
                <Zap size={20} fill="currentColor" />
                Start a battle
              </Link>
              <Link href="/create" className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-bg-soft/50 border border-border-soft text-white font-bold hover:bg-bg-soft transition-all">
                <Plus size={20} />
                Create new quiz
              </Link>
            </div>

            <div className="flex flex-wrap gap-x-8 gap-y-4">
              <div className="flex flex-col">
                <span className="text-[10px] text-text-soft uppercase font-bold tracking-widest mb-1">Quizzes hosted</span>
                <span className="text-2xl font-black">{stats?.quizzesCount || 0}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-text-soft uppercase font-bold tracking-widest mb-1">XP Points</span>
                <span className="text-2xl font-black">{stats?.xp || 0}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-text-soft uppercase font-bold tracking-widest mb-1">Global Rating</span>
                <span className="text-2xl font-black text-accent-alt">{stats?.globalRating || user?.globalRating || 1200}</span>
              </div>
            </div>

            {!user && (
              <div className="mt-8 p-4 rounded-2xl bg-accent-soft border border-accent/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm font-medium">Sync your stats and save your quizzes across terminals.</p>
                <Link href="/auth" className="px-6 py-2 rounded-xl bg-accent text-white text-xs font-bold uppercase tracking-widest whitespace-nowrap">
                  Login & Sync
                </Link>
              </div>
            )}
          </div>

          <div className="hidden lg:block relative">
            <div className="glass p-8 rounded-[32px] relative overflow-hidden group">
              {/* Background gradient glow */}
              <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-accent/20 blur-[100px] rounded-full group-hover:bg-accent/30 transition-all" />
              
              <p className="text-[10px] font-bold uppercase tracking-widest text-text-soft mb-8">Host Profile</p>
              
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-accent-alt to-accent flex items-center justify-center font-bold text-4xl mb-8 shadow-2xl relative z-10 mx-auto">
                {user?.name?.charAt(0) || 'A'}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8 relative z-10">
                <div>
                  <p className="text-[10px] text-text-soft uppercase font-bold mb-1">Global Rating</p>
                  <p className="text-2xl font-black">{stats?.globalRating || 1200}</p>
                </div>
                <div>
                  <p className="text-[10px] text-text-soft uppercase font-bold mb-1">Games Hosted</p>
                  <p className="text-2xl font-black">{stats?.quizzesCount || 0}</p>
                </div>
              </div>

              <div className="space-y-2 mb-8 relative z-10">
                <div className="h-2 w-full bg-bg-soft rounded-full overflow-hidden">
                  <div className="h-full w-[65%] bg-gradient-to-r from-accent to-accent-alt rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                </div>
                <p className="text-[10px] text-text-soft font-bold text-right">
                  Next tier: <span className="text-accent-alt">Pro Host</span>
                </p>
              </div>

              <p className="text-[10px] text-text-soft italic text-center opacity-60">
                Tip: Use <strong className="text-accent underline">AI quizzes</strong> for fast tournament setups.
              </p>
            </div>
          </div>
        </motion.section>

        {/* Dashboard Grid */}
        <motion.section variants={item} className="grid lg:grid-cols-[400px_1fr] gap-8">
          {/* Toolbar */}
          <div className="glass p-6 rounded-[24px] flex flex-col gap-6">
            <h3 className="font-bold text-lg">Toolbar</h3>
            <div className="space-y-3">
              {[
                { title: 'Create Quiz', sub: 'Build your own questions', icon: Plus, href: '/create' },
                { title: 'Create Quiz (AI)', sub: 'Upload notes / PDFs, let AI work', icon: Zap, href: '/create' },
                { title: 'Live Tournaments', sub: 'Host multi-round events', icon: Trophy, href: '/host' },
                { title: 'Learn', sub: 'View guides, tips & practices', icon: BookOpen, href: '/about' },
              ].map((tool, i) => (
                <Link key={i} href={tool.href} className="flex items-center gap-4 p-4 rounded-2xl bg-background/50 border border-border-soft border-dashed hover:border-accent/50 hover:bg-background transition-all cursor-pointer group">
                  <div className="w-10 h-10 rounded-xl bg-accent-soft flex items-center justify-center text-accent group-hover:scale-110 transition-all">
                    <tool.icon size={20} />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-sm tracking-tight">{tool.title}</span>
                    <span className="text-[11px] text-text-soft">{tool.sub}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Quizzes History */}
          <div className="glass p-6 rounded-[24px] flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <h3 className="font-bold text-lg">{user ? 'Practice Hub / History' : 'Featured Arena Quizzes'}</h3>
                  <span className="text-[10px] text-accent font-bold uppercase tracking-widest">LocalStorage Enabled</span>
                </div>
                <div className="flex items-center gap-4">
                  {quizzes.some(q => q.isLocal) && (
                    <button 
                      onClick={() => {
                        if(confirm('Wipe all local practice quizzes?')) {
                          clearLocalQuizzes();
                          window.location.reload();
                        }
                      }}
                      className="text-[10px] font-bold text-red-400 hover:text-red-300 uppercase tracking-widest transition-colors"
                    >
                      Clear Practice Hub
                    </button>
                  )}
                  <Link href="/explore" className="text-xs font-bold text-accent uppercase tracking-wider flex items-center gap-1 hover:gap-2 transition-all">
                    View all <ArrowRight size={14} />
                  </Link>
                </div>
              </div>

              {/* Local Search Bar */}
              <div className="relative group">
                <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-soft group-focus-within:text-accent transition-colors" />
                <input 
                  type="text"
                  placeholder="Search your vault (Topic, Title...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-background/50 border border-border-soft rounded-xl py-3 pl-10 pr-4 text-xs focus:ring-1 focus:ring-accent outline-none transition-all"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 flex-1">
              {loading ? (
                <div className="col-span-2 flex items-center justify-center h-40 text-text-soft animate-pulse">
                  Loading your history...
                </div>
              ) : filteredQuizzes.length > 0 ? (
                filteredQuizzes.map((q) => {
                  const isRecent = (new Date().getTime() - new Date(q.createdAt).getTime()) < 15 * 60 * 1000;
                  return (
                    <QuizCard 
                      key={q._id}
                      title={q.title} 
                      isLocal={q.isLocal}
                      description={`${q.questions.length} questions • ${q.isLocal ? 'Local Vault' : (q.aiGenerated ? 'AI' : 'Elite Cloud')}`}
                      lastPlayed={isRecent ? 'Just Created ✨' : (q.isLocal ? 'Practice Mode' : new Date(q.createdAt).toLocaleDateString())}
                      onPlay={async () => {
                        if (q.isLocal) {
                          try {
                            const cloudId = await handleSyncToCloud(q);
                            router.push(`/play/solo?quiz=${cloudId}`);
                          } catch (err) {
                            alert("Sign in to play solo sessions.");
                          }
                        } else {
                          router.push(`/play/solo?quiz=${q._id}`);
                        }
                      }}
                      onHost={async () => {
                        if (q.isLocal) {
                          try {
                            const cloudId = await handleSyncToCloud(q);
                            router.push(`/host?quiz=${cloudId}`);
                          } catch (err) {
                            alert("Sign in to host multiplayer sessions.");
                          }
                        } else {
                          router.push(`/host?quiz=${q._id}`);
                        }
                      }}
                    />
                  );
                })
              ) : (
                <div className="col-span-2 flex flex-col items-center justify-center h-40 text-text-soft border border-dashed border-border-soft rounded-3xl">
                  <BookOpen size={30} className="mb-2 opacity-20" />
                  <p className="text-sm">No quizzes found. Create your first one!</p>
                </div>
              )}
            </div>

            {/* Inline Rating Block */}
            <div className="bg-bg-soft/50 rounded-2xl p-4 border border-accent/20">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs text-text-soft font-bold uppercase tracking-widest">Global Rating</span>
                <span className="text-lg font-black text-accent-alt">{stats?.globalRating || 1200}</span>
              </div>
              <div className="h-2 w-full bg-background rounded-full overflow-hidden mb-2">
                <div className="h-full w-[70%] bg-accent-alt rounded-full shadow-[0_0_10px_rgba(34,197,94,0.4)]" />
              </div>
              <p className="text-[10px] text-text-soft">Experience: {stats?.xp || 0} XP</p>
            </div>
          </div>
        </motion.section>

        {/* Stats Row */}
        <motion.section variants={item} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard 
            title="Total Quizzes" 
            value={stats?.quizzesCount || 0} 
            description="Across classrooms, labs & events."
          />
          <StatCard 
            title="XP Earned" 
            value={stats?.xp || 0} 
            description="Progression points for your profile."
          />
          <StatCard 
            title="Global Rank" 
            value="N/A" 
            description="Your position in the world arena."
          />
        </motion.section>

        {/* Activity Card */}
        <motion.section variants={item} className="glass p-6 rounded-[24px]">
          <h3 className="font-bold text-lg mb-6">Recent Activity</h3>
          <div className="space-y-4">
            {quizzes.slice(0, 4).map((q, i) => (
              <div key={i} className="flex items-center gap-4 text-sm text-text-soft group">
                <div className={cn("w-2 h-2 rounded-full shrink-0 group-hover:scale-150 transition-all", q.aiGenerated ? "bg-accent" : "bg-accent-alt")} />
                <span className="group-hover:text-white transition-colors">
                  You {q.aiGenerated ? 'generated' : 'created'} “{q.title}” on {new Date(q.createdAt).toLocaleDateString()}.
                </span>
              </div>
            ))}
            {quizzes.length === 0 && <p className="text-sm text-text-soft italic">No recent activity found.</p>}
          </div>
        </motion.section>
      </motion.div>
    </div>
  );
}
