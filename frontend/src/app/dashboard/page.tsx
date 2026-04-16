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
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Activity,
  Settings,
  Shield
} from 'lucide-react';
import { UpdatesStrip } from '@/components/dashboard/UpdatesStrip';
import { CollapsibleCard } from '@/components/ui/CollapsibleCard';
import { StatCard } from '@/components/ui/StatCard';
import { QuizCard } from '@/components/ui/QuizCard';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import api from '@/lib/axios';
import Link from 'next/link';
import { Search } from 'lucide-react';

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

export default function DashboardPage() {
  const { user, isLoading: authLoading, profileCompletion } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let cloudQuizzes = [];
        if (user?.email) {
          try {
            const profileRes = await api.get(`/api/profile/${user.email}`);
            setStats(profileRes.data);
          } catch (profileErr) {
            console.warn("Profile fetch failed", profileErr);
          }

          try {
            const quizzesRes = await api.get(`/api/quizzes/user/${user.email}`);
            cloudQuizzes = quizzesRes.data.quizzes || [];
          } catch (quizErr) {
            console.warn("Quiz fetch failed", quizErr);
          }
        } else {
          const res = await api.get('/api/quizzes/public');
          cloudQuizzes = res.data.quizzes || [];
        }
        setQuizzes(cloudQuizzes);
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

  return (
    <div className="py-2 lg:py-10 space-y-12">
      <UpdatesStrip />

      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl lg:text-4xl font-black tracking-tight uppercase italic">Arena Nexus</h1>
          <p className="text-text-soft text-xs lg:text-sm">Strategic oversight of your combat history and neural assets.</p>
        </div>
        
        {/* Rapid Deployment Buttons */}
        <div className="flex gap-3">
           <Link href="/battles" className="px-6 py-3 rounded-xl bg-gradient-to-tr from-accent to-accent-alt text-white font-black text-[10px] uppercase tracking-widest shadow-lg hover:scale-105 transition-all">
              <Zap size={14} className="inline mr-2" /> Quick Battle
           </Link>
           <Link href="/create" className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-black text-[10px] uppercase tracking-widest hover:border-accent/40 transition-all">
              <Plus size={14} className="inline mr-2" /> Create Asset
           </Link>
        </div>
      </div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid lg:grid-cols-3 gap-8 items-start"
      >
        {/* Track 1: Pilot Identity & Stats */}
        <div className="space-y-8">
           <div className="flex items-center gap-3 px-2">
            <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center text-accent text-[10px]">1</div>
            <h2 className="text-xs font-black uppercase tracking-widest text-text-soft italic">Biological Status</h2>
          </div>

          <div className="glass p-8 rounded-[40px] relative overflow-hidden group border-white/5 shadow-2xl">
              <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-accent/10 blur-[120px] rounded-full group-hover:bg-accent/20 transition-all" />
              
              <div className="relative z-10 space-y-8">
                <div className="flex items-center justify-between">
                   <p className="text-[10px] font-black uppercase tracking-widest text-text-soft italic">Nexus Profile</p>
                   <div className="flex items-center gap-2 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[8px] font-black uppercase">
                      Operational
                   </div>
                </div>
                
                <div className="flex flex-col items-center gap-4">
                  <div className="relative group/avatar">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-accent to-accent-alt p-1 relative z-10 transition-transform group-hover/avatar:scale-105">
                       <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden border-2 border-background">
                         <img src={user?.avatar || '/favicon.ico'} className="w-full h-full object-cover" />
                       </div>
                    </div>
                    {/* Completion Ring Minimal */}
                    <div className="absolute -inset-2 border-2 border-accent/20 rounded-full border-dashed animate-[spin_10s_linear_infinite]" />
                  </div>
                  
                  <div className="text-center">
                    <h3 className="text-xl font-black uppercase italic tracking-tighter">{user?.name || 'GUEST_USER'}</h3>
                    <p className="text-[10px] text-accent font-black tracking-widest uppercase mt-1">@{user?.username || 'nexus_id'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                      <p className="text-[9px] text-text-soft uppercase font-black mb-1">Global Rating</p>
                      <p className="text-2xl font-black text-accent-alt">{stats?.globalRating || 1200}</p>
                   </div>
                   <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                      <p className="text-[9px] text-text-soft uppercase font-black mb-1">XP Points</p>
                      <p className="text-2xl font-black">{stats?.xp || 0}</p>
                   </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-[9px] font-black uppercase text-text-soft">
                     <span>Sync Strength</span>
                     <span className="text-accent">{profileCompletion}%</span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                    <div 
                      className="h-full bg-accent rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(99,102,241,0.5)]" 
                      style={{ width: `${profileCompletion}%` }}
                    />
                  </div>
                  <p className="text-[8px] text-text-soft text-center italic opacity-60">Sync profile in settings for precision bonuses.</p>
                </div>
              </div>
          </div>

          <StatCard 
            title="Arena Rating" 
            value={stats?.globalRating || 1200}
            description="Your current weight in global tournaments."
            className="rounded-[32px] p-8"
          />
        </div>

        {/* Track 2: Combat Record & History */}
        <div className="space-y-8 lg:mt-0">
          <div className="flex items-center gap-3 px-2">
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 text-[10px]">2</div>
            <h2 className="text-xs font-black uppercase tracking-widest text-text-soft italic">Match history</h2>
          </div>

          <CollapsibleCard 
            title="History Vault" 
            icon={BookOpen}
            className="border-white/10"
            headerAction={
               <div className="relative group/search">
                 <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-soft group-focus-within/search:text-accent transition-colors" />
                 <input 
                   type="text"
                   placeholder="Filter vault..."
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   className="h-8 w-32 bg-white/5 border border-white/10 rounded-lg pl-8 pr-2 text-[10px] outline-none focus:w-48 transition-all font-bold"
                 />
               </div>
            }
          >
            <div className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center h-64 text-text-soft animate-pulse">
                  Decrypting vault data...
                </div>
              ) : filteredQuizzes.length > 0 ? (
                <div className="space-y-4">
                  {filteredQuizzes.map((q) => {
                    const isRecent = (new Date().getTime() - new Date(q.createdAt).getTime()) < 15 * 60 * 1000;
                    return (
                      <QuizCard 
                        key={q._id}
                        title={q.title} 
                        description={`${q.questions.length} Questions • ${q.aiGenerated ? 'AI Neural' : 'Manual Asset'}`}
                        lastPlayed={isRecent ? 'Recently Decrypted ✨' : new Date(q.createdAt).toLocaleDateString()}
                        onPlay={() => router.push(`/play/solo?quiz=${q._id}`)}
                        onHost={() => router.push(`/host?quiz=${q._id}`)}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-text-soft border border-dashed border-white/5 rounded-3xl">
                  <BookOpen size={24} className="mb-2 opacity-20" />
                  <p className="text-xs italic">No match logs discovered in the cloud.</p>
                </div>
              )}
            </div>
          </CollapsibleCard>

          <CollapsibleCard title="Recent Intel / Activity" icon={Activity} isDefaultExpanded={false}>
             <div className="space-y-4 pt-2">
                {quizzes.slice(0, 5).map((q, i) => (
                  <div key={i} className="flex flex-col gap-1 p-3 rounded-xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-all">
                    <p className="text-[11px] font-bold text-white tracking-tight leading-tight">
                       Asset "{q.title}" {q.aiGenerated ? 'Neural Generated' : 'Manual Upload'}
                    </p>
                    <p className="text-[9px] text-text-soft uppercase font-black">{new Date(q.createdAt).toLocaleString()}</p>
                  </div>
                ))}
                {quizzes.length === 0 && <p className="text-xs text-text-soft italic text-center py-4">No recent intelligence logs.</p>}
             </div>
          </CollapsibleCard>
        </div>

        {/* Track 3: Nexus Operations */}
        <div className="space-y-8">
           <div className="flex items-center gap-3 px-2">
            <div className="w-5 h-5 rounded-full bg-accent-alt/20 flex items-center justify-center text-accent-alt text-[10px]">3</div>
            <h2 className="text-xs font-black uppercase tracking-widest text-text-soft italic">Nexus Operations</h2>
          </div>

          <div className="glass p-8 rounded-[40px] border-white/5 space-y-8">
            <div className="flex items-center justify-between border-b border-white/5 pb-6">
               <h3 className="font-black text-sm uppercase tracking-[0.2em] italic">Tactical Toolbar</h3>
               <Link href="/explore" className="text-[10px] font-black text-accent-alt uppercase tracking-widest">Global Vault</Link>
            </div>
            
            <div className="space-y-4">
              {[
                { title: 'Battle Arena', sub: 'Host Competitive Tournament', icon: Trophy, href: '/battles', color: 'accent' },
                { title: 'Neural Forge', sub: 'AI Automated Generation', icon: Zap, href: '/create', color: 'accent-alt' },
                { title: 'Training Grounds', sub: 'Friendly/Solo Practice', icon: Users, href: '/host?friendly=true', color: 'emerald-500' },
                { title: 'Command Center', sub: 'Account & Neural Config', icon: Settings, href: '/settings', color: 'white' },
              ].map((tool, i) => (
                <Link key={i} href={tool.href} className="flex items-center gap-4 p-5 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-white/20 hover:bg-white/5 transition-all group overflow-hidden relative">
                   {/* Mini glow element */}
                  <div className={cn("absolute -right-4 -top-4 w-12 h-12 blur-2xl opacity-0 group-hover:opacity-40 transition-all", `bg-${tool.color}`)} />

                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-all",
                    i % 2 === 0 ? "bg-accent/10 text-accent" : "bg-accent-alt/10 text-accent-alt"
                  )}>
                    <tool.icon size={22} strokeWidth={2.5} />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-black text-sm tracking-tight uppercase italic">{tool.title}</span>
                    <span className="text-[10px] text-text-soft font-medium uppercase tracking-widest">{tool.sub}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Elite Sync Incentive */}
          {!user && (
            <div className="p-8 rounded-[40px] bg-gradient-to-br from-accent/20 to-transparent border border-accent/30 space-y-4 text-center">
              <Shield className="text-accent mx-auto" size={32} />
              <h4 className="font-black italic uppercase text-sm">Neural Cloud Sync Required</h4>
              <p className="text-[11px] text-text-soft leading-relaxed italic px-4">Initialize your cloud identity to persist combat ratings and unlock the AI Forge.</p>
              <Link href="/auth" className="block w-full py-4 rounded-2xl bg-accent text-white font-black uppercase text-[10px] tracking-[0.3em] hover:scale-[1.02] transition-all">
                Sync Now
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
