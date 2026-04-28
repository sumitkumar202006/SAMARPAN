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
import { GuestGuard } from '@/components/auth/GuestGuard';

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
    username: '',
    email: '', 
    password: '',
    confirmPassword: '',
    college: '',
    course: '',
    dob: '',
    preferredField: 'General',
    avatar: ''
  });
  const [status, setStatus] = useState<{ type: 'error' | 'success', msg: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [validation, setValidation] = useState({
    username: { status: 'idle' as 'idle' | 'checking' | 'available' | 'taken', msg: '' },
    email: { status: 'idle' as 'idle' | 'checking' | 'available' | 'taken', msg: '' },
    passwordStrength: 0, // 0 to 4
  });
  const [isForgotPass, setIsForgotPass] = useState(false);
  const [resetStep, setResetStep] = useState<'email' | 'otp' | 'password'>('email');
  
  const router = useRouter();
  const { setUser } = useAuth();
  const { playAccelerate } = useAudio();

  // Debounced Validation for Username
  useEffect(() => {
    if (isLogin || !formData.username || formData.username.length < 3) {
      setValidation(v => ({ ...v, username: { status: 'idle', msg: '' } }));
      return;
    }

    const timer = setTimeout(async () => {
      setValidation(v => ({ ...v, username: { ...v.username, status: 'checking' } }));
      try {
        const res = await api.get(`/api/auth/check-username?username=${formData.username}`);
        setValidation(v => ({ 
          ...v, 
          username: { 
            status: res.data.available ? 'available' : 'taken', 
            msg: res.data.available ? 'Username available!' : 'Username already taken' 
          } 
        }));
      } catch (err) {
        setValidation(v => ({ ...v, username: { status: 'idle', msg: '' } }));
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.username, isLogin]);

  // Debounced Validation for Email
  useEffect(() => {
    if (isLogin || !formData.email || !formData.email.includes('@')) {
      setValidation(v => ({ ...v, email: { status: 'idle', msg: '' } }));
      return;
    }

    const timer = setTimeout(async () => {
      setValidation(v => ({ ...v, email: { ...v.email, status: 'checking' } }));
      try {
        const res = await api.get(`/api/auth/check-email?email=${formData.email}`);
        setValidation(v => ({ 
          ...v, 
          email: { 
            status: res.data.available ? 'available' : 'taken', 
            msg: res.data.available ? 'Email available!' : 'Email already registered' 
          } 
        }));
      } catch (err) {
        setValidation(v => ({ ...v, email: { status: 'idle', msg: '' } }));
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.email, isLogin]);

  // Password Strength Calculator
  useEffect(() => {
    const pass = formData.password;
    if (!pass) {
      setValidation(v => ({ ...v, passwordStrength: 0 }));
      return;
    }
    let strength = 0;
    if (pass.length >= 6) strength++;
    if (pass.length >= 10) strength++;
    if (/[0-9]/.test(pass)) strength++;
    if (/[!@#$%^&*]/.test(pass)) strength++;
    setValidation(v => ({ ...v, passwordStrength: strength }));
  }, [formData.password]);

  // Auto-suggest Username
  const suggestUsername = () => {
    if (!formData.name) return;
    const base = formData.name.toLowerCase().replace(/\s+/g, '');
    const suggested = `${base}${Math.floor(Math.random() * 1000)}`;
    setFormData({ ...formData, username: suggested });
  };

  // Avatar Generator
  useEffect(() => {
    if (!isLogin && formData.username) {
      setFormData(prev => ({ 
        ...prev, 
        avatar: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${formData.username}` 
      }));
    }
  }, [formData.username, isLogin]);

  // Mode-dependent content
  const theme = {
    title: isForgotPass ? 'Reset Password' : (isLogin ? 'Welcome Back' : 'Elite Recruitment'),
    subtitle: isForgotPass ? 'Verify your identity to regain access.' : (isLogin ? 'Enter the arena and claim your glory.' : 'Forge your legacy and join the elite ranks.'),
    button: isForgotPass ? (resetStep === 'email' ? 'Send OTP' : resetStep === 'otp' ? 'Verify OTP' : 'Reset Password') : (isLogin ? 'Secure Entry' : 'Deploy Account'),
    glowColor: isLogin ? 'bg-accent/30' : 'bg-accent-alt/30',
    logoGlow: isLogin ? 'from-accent to-accent-alt' : 'from-accent-alt to-[#00D4B4]',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus(null);

    if (isForgotPass) {
      await handlePasswordReset();
      setIsLoading(false);
      return;
    }

    if (!isLogin) {
      if (formData.password !== formData.confirmPassword) {
        setStatus({ type: 'error', msg: 'Passwords do not match' });
        setIsLoading(false);
        return;
      }
      if (validation.username.status === 'taken') {
        setStatus({ type: 'error', msg: 'Please choose a unique username' });
        setIsLoading(false);
        return;
      }
    }

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
    const payload = isLogin 
      ? { identifier: formData.email, password: formData.password }
      : formData;
    
    try {
      const res = await api.post(endpoint, payload);
      if (res.status === 200 || res.status === 201) {
        const { token, user } = res.data;
        setUser({ token, ...user });
        setStatus({ type: 'success', msg: isLogin ? 'Access Granted. Welcome back!' : 'Recruitment Complete. Welcome Agent!' });
        setTimeout(() => router.push('/dashboard'), 1500);
      }
    } catch (err: any) {
      setStatus({ type: 'error', msg: err.response?.data?.error || 'Authentication failed' });
    } finally {
      setIsLoading(false);
    }
  };

  const [otp, setOtp] = useState('');
  const handlePasswordReset = async () => {
    try {
      if (resetStep === 'email') {
        await api.post('/api/auth/forgot-password', { email: formData.email });
        setResetStep('otp');
        setStatus({ type: 'success', msg: 'OTP sent to your email' });
      } else if (resetStep === 'otp') {
        // Verify OTP with backend before advancing — prevents client-side bypass
        if (!otp || otp.length !== 6) {
          setStatus({ type: 'error', msg: 'Please enter the 6-digit OTP' });
          return;
        }
        await api.post('/api/auth/verify-otp', { email: formData.email, otp });
        setResetStep('password');
        setStatus({ type: 'success', msg: 'OTP verified. Set your new password.' });
      } else {
        await api.post('/api/auth/reset-password', { 
          email: formData.email, 
          otp, 
          newPassword: formData.password 
        });
        setStatus({ type: 'success', msg: 'Password reset successful. Please login.' });
        setTimeout(() => {
          setIsForgotPass(false);
          setResetStep('email');
          setIsLogin(true);
        }, 2000);
      }
    } catch (err: any) {
      setStatus({ type: 'error', msg: err.response?.data?.error || 'Action failed' });
    }
  };

  const handleSocialAuth = (provider: 'google' | 'facebook') => {
    // Use the same env var as axios.ts — works on localhost, staging, and production
    const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL ||
      (process.env.NODE_ENV === 'production'
        ? 'https://samarpan-9rt8.onrender.com'
        : 'http://localhost:5001');
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
            {!isLogin && !isForgotPass && (
              <>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-text-soft group-focus-within:text-accent transition-colors" size={16} />
                  <input 
                    type="text" 
                    placeholder="Agent Handle (Full Name)" 
                    className="w-full bg-bg-soft/30 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:border-accent transition-all"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="relative group">
                  <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-text-soft group-focus-within:text-accent transition-colors" size={16} />
                  <input 
                    type="text" 
                    placeholder="Unique Username" 
                    className={cn(
                      "w-full bg-bg-soft/30 border rounded-2xl py-3.5 pl-12 pr-24 text-sm focus:outline-none transition-all",
                      validation.username.status === 'available' ? "border-[#00D4B4]/50" : 
                      validation.username.status === 'taken' ? "border-red-500/50" : "border-white/10"
                    )}
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '') })}
                    required
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {validation.username.status === 'checking' && <div className="w-4 h-4 border-2 border-accent border-t-transparent animate-spin rounded-full" />}
                    <button 
                      type="button"
                      onClick={suggestUsername}
                      className="text-[10px] font-black uppercase text-accent hover:text-white transition-colors"
                    >
                      Suggest
                    </button>
                  </div>
                  {validation.username.msg && (
                    <p className={cn("text-[10px] mt-1 ml-4 font-bold", validation.username.status === 'available' ? "text-[#00D4B4]" : "text-red-400")}>
                      {validation.username.msg}
                    </p>
                  )}
                </motion.div>

                <div className="grid grid-cols-2 gap-3">
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="relative group">
                    <School className="absolute left-4 top-1/2 -translate-y-1/2 text-text-soft group-focus-within:text-accent transition-colors" size={16} />
                    <input 
                      type="text" 
                      placeholder="College (Optional)" 
                      className="w-full bg-bg-soft/30 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-[13px] focus:outline-none focus:border-accent transition-all"
                      value={formData.college}
                      onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                    />
                  </motion.div>

                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="relative group">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-text-soft group-focus-within:text-accent transition-colors" size={16} />
                    <input 
                      type="date" 
                      className="w-full bg-bg-soft/30 border border-white/10 rounded-2xl py-3.5 pl-10 pr-2 text-[10px] focus:outline-none focus:border-accent transition-all"
                      value={formData.dob}
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    />
                  </motion.div>
                </div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="relative group">
                  <Zap className="absolute left-4 top-1/2 -translate-y-1/2 text-text-soft group-focus-within:text-accent transition-colors" size={16} />
                  <select 
                    className="w-full bg-bg-soft/30 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:border-accent transition-all appearance-none text-text-soft"
                    value={formData.preferredField}
                    onChange={(e) => setFormData({ ...formData, preferredField: e.target.value })}
                  >
                    <option value="General">General Category</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="General Knowledge">General Knowledge</option>
                    <option value="Science">Science & Tech</option>
                    <option value="History">History & Culture</option>
                  </select>
                </motion.div>
              </>
            )}
            
            {!isForgotPass || resetStep !== 'otp' ? (
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-soft group-focus-within:text-accent transition-colors" size={16} />
                <input 
                  type="email" 
                  placeholder="Secure Email" 
                  className={cn(
                    "w-full bg-bg-soft/30 border rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:outline-none transition-all",
                    !isLogin && validation.email.status === 'taken' ? "border-red-500/50" : "border-white/10"
                  )}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={isForgotPass && resetStep !== 'email'}
                />
                {!isLogin && validation.email.msg && (
                  <p className={cn("text-[10px] mt-1 ml-4 font-bold", validation.email.status === 'available' ? "text-[#00D4B4]" : "text-red-400")}>
                    {validation.email.msg}
                  </p>
                )}
              </div>
            ) : (
              <div className="relative group">
                <Zap className="absolute left-4 top-1/2 -translate-y-1/2 text-text-soft group-focus-within:text-accent transition-colors" size={16} />
                <input 
                  type="text" 
                  placeholder="Enter 6-digit OTP" 
                  className="w-full bg-bg-soft/30 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:border-accent transition-all tracking-[0.5em] font-black text-center"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                  required
                />
              </div>
            )}

            {(!isForgotPass || resetStep === 'password') && (
              <>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-soft group-focus-within:text-accent transition-colors" size={16} />
                  <input 
                    type="password" 
                    placeholder={isForgotPass ? "New Password" : "Encrypted Password"} 
                    className="w-full bg-bg-soft/30 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:border-accent transition-all"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                  {!isLogin && formData.password && (
                    <div className="mt-2 px-1 space-y-1">
                      <div className="flex gap-1 h-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div 
                            key={i} 
                            className={cn(
                              "flex-1 rounded-full transition-all duration-500",
                              validation.passwordStrength >= i 
                                ? (validation.passwordStrength <= 2 ? "bg-red-500" : validation.passwordStrength === 3 ? "bg-yellow-500" : "bg-[#00D4B4]")
                                : "bg-white/10"
                            )} 
                          />
                        ))}
                      </div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-text-soft text-right">
                        Strength: {validation.passwordStrength <= 1 ? 'Weak' : validation.passwordStrength === 2 ? 'Fair' : validation.passwordStrength === 3 ? 'Good' : 'Elite'}
                      </p>
                    </div>
                  )}
                </div>

                {!isLogin && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative group">
                    <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-text-soft group-focus-within:text-accent transition-colors" size={16} />
                    <input 
                      type="password" 
                      placeholder="Confirm Password" 
                      className={cn(
                        "w-full bg-bg-soft/30 border rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:outline-none transition-all",
                        formData.confirmPassword && formData.password !== formData.confirmPassword ? "border-red-500/50" : "border-white/10"
                      )}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      required
                    />
                  </motion.div>
                )}
              </>
            )}

            {isLogin && !isForgotPass && (
              <div className="flex justify-end px-1">
                <button 
                  type="button"
                  onClick={() => { setIsForgotPass(true); setResetStep('email'); setStatus(null); }}
                  className="text-[10px] font-bold text-accent hover:underline decoration-accent/30 underline-offset-4"
                >
                  Forgot your encryption key?
                </button>
              </div>
            )}

            {status && (
              <p className={cn(
                "text-xs text-center font-bold py-2 px-4 rounded-xl",
                status.type === 'error' ? 'text-red-400 bg-red-400/10' : 'text-accent-alt bg-accent-alt/10'
              )}>
                {status.msg}
              </p>
            )}

            <Button isLoading={isLoading} type="submit" className="w-full py-3.5 rounded-2xl tracking-widest font-black text-sm mt-2 shadow-xl shadow-accent/10 hover:shadow-accent/20 transition-all">
              {theme.button}
            </Button>

            {isForgotPass && (
              <button 
                type="button"
                onClick={() => { setIsForgotPass(false); setStatus(null); }}
                className="w-full text-center text-[10px] font-black uppercase tracking-widest text-text-soft hover:text-white transition-colors"
               >
                 Back to Security Clearance
               </button>
            )}
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
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-[#00D4B4]/20 group-hover:border-[#00D4B4]/40 transition-all duration-500">
                    <Zap className="text-[#00D4B4]" size={20} />
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
    <GuestGuard>
      <Suspense fallback={
        <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-background">
          <div className="w-16 h-16 rounded-full border-4 border-accent border-t-transparent animate-spin shadow-[0_0_15px_rgba(99,102,241,0.3)]" />
          <p className="font-black uppercase tracking-[0.3em] text-text-soft text-xs animate-pulse italic">Initalizing Security Nexus...</p>
        </div>
      }>
        <AuthContent />
      </Suspense>
    </GuestGuard>
  );
}

