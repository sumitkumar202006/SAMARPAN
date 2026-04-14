'use client';

import React, { useState, Suspense, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Mail, Lock, User, ArrowLeft, School, BookOpen, Calendar, Trophy, Shield, Zap } from 'lucide-react';
import { GithubIcon, FacebookIcon, GoogleIcon } from '@/components/ui/BrandIcons';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useAudio } from '@/context/AudioContext';
import api from '@/lib/axios';
import { cn } from '@/lib/utils';

function AuthContent() {
  const searchParams = useSearchParams();
  const [isLogin, setIsLogin] = useState(true);
  
  // Reactive Sync: Update state whenever search params change
  useEffect(() => {
    const mode = searchParams.get('mode');
    setIsLogin(mode !== 'signup');
  }, [searchParams]);
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    password: '',
    college: '',
    course: '',
    dob: ''
  });
  const [status, setStatus] = useState<{ type: 'error' | 'success', msg: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();
  const { setUser } = useAuth();
  const { playAccelerate } = useAudio();

  // Mode-dependent content
  const theme = {
    title: isLogin ? 'Welcome Back' : 'Elite Recruitment',
    subtitle: isLogin ? 'Enter the arena and claim your glory.' : 'Forge your legacy and join the elite ranks.',
    button: isLogin ? 'Secure Entry' : 'Deploy Account',
    glowColor: isLogin ? 'bg-accent/30' : 'bg-accent-alt/30',
    logoGlow: isLogin ? 'from-accent to-accent-alt' : 'from-accent-alt to-emerald-400',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus(null);

    const endpoint = isLogin ? '/api/login' : '/api/signup';
    
    try {
      const res = await api.post(endpoint, formData);
      if (res.status === 200 || res.status === 201) {
        const { token, userId, name, email, avatar, globalRating, xp } = res.data;
        setUser({ token, userId, name, email, avatar, globalRating, xp });
        setStatus({ type: 'success', msg: isLogin ? 'Access Granted. Welcome back!' : 'Recruitment Complete. Welcome Agent!' });
        setTimeout(() => router.push('/dashboard'), 1500);
      }
    } catch (err: any) {
      setStatus({ type: 'error', msg: err.response?.data?.message || 'Authentication failed' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialAuth = (provider: 'google' | 'facebook') => {
    const API_BASE = window.location.hostname === 'samarpan-quiz.vercel.app'
      ? 'https://samarpan-9rt8.onrender.com'
      : 'http://127.0.0.1:5001';
    window.location.href = `${API_BASE}/auth/${provider}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 transition-all duration-700">
      {/* Dynamic Background patterns */}
      <div className="fixed inset-0 z-[-1] overflow-hidden opacity-20 pointer-events-none">
        <motion.div 
          animate={{ backgroundColor: isLogin ? 'rgba(99, 102, 241, 0.3)' : 'rgba(34, 197, 94, 0.3)' }}
          className="absolute top-0 left-0 w-[500px] h-[500px] blur-[150px] rounded-full -translate-x-1/2 -translate-y-1/2 transition-colors duration-700" 
        />
        <motion.div 
          animate={{ backgroundColor: isLogin ? 'rgba(168, 85, 247, 0.2)' : 'rgba(14, 165, 233, 0.2)' }}
          className="absolute bottom-0 right-0 w-[500px] h-[500px] blur-[150px] rounded-full translate-x-1/2 translate-y-1/2 transition-colors duration-700" 
        />
      </div>

      <motion.div 
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "w-full transition-all duration-700 glass rounded-[40px] shadow-2xl relative border-white/5 flex flex-col lg:flex-row overflow-hidden",
          isLogin ? "max-w-md" : "max-w-5xl"
        )}
      >
        {/* Left Side: Form */}
        <div className={cn("flex-1 p-6 sm:p-10 transition-all duration-700", !isLogin && "lg:border-r border-white/5")}>
          <button 
            onClick={() => router.push('/dashboard')}
            className="absolute top-6 left-6 text-text-soft hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="text-center mb-8 mt-4 sm:mt-0">
            <motion.div 
              layout
              className={cn(
                "w-14 h-14 rounded-3xl bg-gradient-to-tr flex items-center justify-center overflow-hidden mx-auto mb-6 shadow-2xl rotate-3 transition-all duration-700",
                theme.logoGlow
              )}
            >
              <img src="/favicon.ico" alt="Samarpan Logo" className="w-full h-full object-cover" />
            </motion.div>
            <h1 className="text-2xl sm:text-3xl font-black mb-2 tracking-tight">{theme.title}</h1>
            <p className="text-text-soft text-xs sm:text-sm italic font-medium">{theme.subtitle}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 mb-6">
            {!isLogin && (
              <>
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative"
                >
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-text-soft" size={16} />
                  <input 
                    type="text" 
                    placeholder="Agent Handle (Full Name)" 
                    className="w-full bg-bg-soft/30 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:border-accent transition-all"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative transition-all duration-300"
                >
                  <School className="absolute left-4 top-1/2 -translate-y-1/2 text-text-soft" size={16} />
                  <input 
                    type="text" 
                    placeholder="College / Institution" 
                    className="w-full bg-bg-soft/30 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:border-accent transition-all"
                    value={formData.college}
                    onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                    required
                  />
                </motion.div>

                <div className="grid grid-cols-2 gap-3">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative"
                  >
                    <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-text-soft" size={16} />
                    <input 
                      type="text" 
                      placeholder="Course / Class" 
                      className="w-full bg-bg-soft/30 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-[13px] focus:outline-none focus:border-accent transition-all"
                      value={formData.course}
                      onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                      required
                    />
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative"
                  >
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-text-soft" size={16} />
                    <input 
                      type="date" 
                      className="w-full bg-bg-soft/30 border border-white/10 rounded-2xl py-3.5 pl-10 pr-2 text-[10px] focus:outline-none focus:border-accent transition-all"
                      value={formData.dob}
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                      required
                    />
                  </motion.div>
                </div>
              </>
            )}
            
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-soft" size={16} />
              <input 
                type="email" 
                placeholder="Secure Email" 
                className="w-full bg-bg-soft/30 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:border-accent transition-all"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-soft" size={16} />
              <input 
                type="password" 
                placeholder="Encrypted Password" 
                className="w-full bg-bg-soft/30 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:border-accent transition-all"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>

            {status && (
              <p className={`text-xs text-center font-bold py-1 ${status.type === 'error' ? 'text-red-400' : 'text-accent-alt'}`}>
                {status.msg}
              </p>
            )}

            <Button isLoading={isLoading} type="submit" className="w-full py-3.5 rounded-2xl tracking-widest font-black text-sm">
              {theme.button}
            </Button>
          </form>

          <div className="relative mb-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5"></div>
            </div>
            <div className="relative inline-block bg-background/50 px-4 text-[9px] uppercase font-black tracking-[0.2em] text-text-soft">
              Security Clearance
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <button 
              type="button"
              onClick={() => { playAccelerate(); handleSocialAuth('google'); }}
              className="flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] transition-all font-bold text-[11px]"
            >
              <GoogleIcon size={16} /> Google
            </button>
            <button 
              type="button"
              onClick={() => { playAccelerate(); handleSocialAuth('facebook'); }}
              className="flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] transition-all font-bold text-[11px]"
            >
              <FacebookIcon size={16} className="text-blue-500" /> Facebook
            </button>
          </div>

          <p className="text-center text-[11px] text-text-soft">
            {isLogin ? "New to the arena?" : "Already part of the elite?"}{' '}
            <button 
              onClick={() => { playAccelerate(); setIsLogin(!isLogin); }}
              className="text-accent font-black hover:underline underline-offset-4 transition-all"
            >
              {isLogin ? 'Join Recruitment' : 'Secure Login'}
            </button>
          </p>
        </div>

        {/* Right Side: Recruitment Briefing (Signup Only) */}
        {!isLogin && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden lg:flex flex-col flex-[0.7] bg-gradient-to-br from-bg-soft/40 to-black/20 p-10 relative overflow-hidden"
          >
            {/* Briefing Overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent-alt/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
            
            <div className="relative z-10 space-y-8">
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase text-accent-alt tracking-[0.3em]">Briefing Document 001</span>
                <h3 className="text-2xl font-black tracking-tight">Recruitment Perks</h3>
                <div className="h-1 w-12 bg-accent-alt rounded-full" />
              </div>

              <div className="space-y-6">
                <div className="flex gap-4 group">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-accent-alt/20 group-hover:border-accent-alt/40 transition-all duration-500">
                    <Trophy className="text-accent-alt" size={20} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm">Starting ELO Package</h4>
                    <p className="text-[11px] text-text-soft leading-relaxed">Begin your journey with <span className="text-white font-bold">1200 Rating Points</span> across all gaming modes.</p>
                  </div>
                </div>

                <div className="flex gap-4 group">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-accent/20 group-hover:border-accent/40 transition-all duration-500">
                    <Shield className="text-accent" size={20} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm">Rookie Tier Pass</h4>
                    <p className="text-[11px] text-text-soft leading-relaxed">Instant access to institutional leaderboards and <span className="text-white font-bold">Level 1 Clearance</span>.</p>
                  </div>
                </div>

                <div className="flex gap-4 group">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-emerald-500/20 group-hover:border-emerald-500/40 transition-all duration-500">
                    <Zap className="text-emerald-400" size={20} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm">AI Forge Integration</h4>
                    <p className="text-[11px] text-text-soft leading-relaxed">Deploy <span className="text-white font-bold">Unlimited AI Quizzes</span> using the GPT-Powered question generator.</p>
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-white/5 mt-auto">
                <p className="text-[10px] text-text-soft font-mono uppercase tracking-widest opacity-60">Scanning Bio-Data... 88% Complete</p>
                <motion.div 
                  animate={{ scaleX: [0, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="h-0.5 w-full bg-gradient-to-r from-transparent via-accent-alt/40 to-transparent mt-2 origin-left"
                />
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-accent border-t-transparent animate-spin" />
      </div>
    }>
      <AuthContent />
    </Suspense>
  );
}
