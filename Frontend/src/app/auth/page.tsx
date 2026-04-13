'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Globe, Mail, Lock, User, ArrowLeft } from 'lucide-react';
import { GithubIcon, FacebookIcon } from '@/components/ui/BrandIcons';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [status, setStatus] = useState<{ type: 'error' | 'success', msg: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();
  const { setUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus(null);

    const endpoint = isLogin ? '/api/login' : '/api/signup';
    
    try {
      const res = await api.post(endpoint, formData);
      if (res.status === 200 || res.status === 201) {
        // Backend returns { token, userId, name, email, ... } directly (no .user wrapper)
        const { token, userId, name, email, avatar, globalRating, xp } = res.data;
        setUser({ token, userId, name, email, avatar, globalRating, xp });
        setStatus({ type: 'success', msg: isLogin ? 'Welcome back!' : 'Account created successfully!' });
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
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Background patterns */}
      <div className="fixed inset-0 z-[-1] overflow-hidden opacity-20 pointer-events-none">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-accent/30 blur-[150px] rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-accent-alt/20 blur-[150px] rounded-full translate-x-1/2 translate-y-1/2" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass p-10 rounded-[40px] shadow-2xl relative"
      >
        <button 
          onClick={() => router.push('/dashboard')}
          className="absolute top-6 left-6 text-text-soft hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-accent to-accent-alt flex items-center justify-center font-bold text-3xl mx-auto mb-6 shadow-2xl rotate-3">
            S
          </div>
          <h1 className="text-3xl font-black mb-2">{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
          <p className="text-text-soft text-sm">Join the most premium quiz arena available.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mb-8">
          {!isLogin && (
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-text-soft" size={18} />
              <input 
                type="text" 
                placeholder="Full Name" 
                className="w-full bg-bg-soft/50 border border-border-soft rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-accent transition-all"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
          )}
          
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-soft" size={18} />
            <input 
              type="email" 
              placeholder="Email Address" 
              className="w-full bg-bg-soft/50 border border-border-soft rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-accent transition-all"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-soft" size={18} />
            <input 
              type="password" 
              placeholder="Password" 
              className="w-full bg-bg-soft/50 border border-border-soft rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-accent transition-all"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>

          {status && (
            <p className={`text-xs text-center font-bold pb-2 ${status.type === 'error' ? 'text-red-400' : 'text-accent-alt'}`}>
              {status.msg}
            </p>
          )}

          <Button isLoading={isLoading} type="submit" className="w-full py-4 rounded-2xl">
            {isLogin ? 'Login Now' : 'Create Account'}
          </Button>
        </form>

        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest text-text-soft">
            <span className="bg-background px-4">Or continue with</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-10">
          <button 
            type="button"
            onClick={() => handleSocialAuth('google')}
            className="flex items-center justify-center gap-2 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-bold text-xs"
          >
            <Globe size={18} className="text-red-400" /> Google
          </button>
          <button 
            type="button"
            onClick={() => handleSocialAuth('facebook')}
            className="flex items-center justify-center gap-2 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-bold text-xs"
          >
            <FacebookIcon size={18} className="text-blue-500" /> Facebook
          </button>
        </div>

        <p className="text-center text-xs text-text-soft">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-accent font-black hover:underline transition-all"
          >
            {isLogin ? 'Sign up' : 'Login'}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
