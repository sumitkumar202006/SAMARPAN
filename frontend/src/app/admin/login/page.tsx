'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, User, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import api from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setUser } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/api/login', { email, password });
      
      // We check if the returned user is an admin
      // Note: We'll need to fetch the full profile to be sure or check a specific field if login returns it
      // Let's verify the role by calling a protected admin route immediately
      const token = res.data.token;
      
      const adminCheck = await api.get('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (adminCheck.status === 200) {
        // Success - set user and redirect
        setUser({
          ...res.data,
          role: 'admin',
          token: token
        });
        localStorage.setItem('samarpan_admin_token', token);
        router.push('/admin');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Access Denied. Authorization required.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Visual background elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent-alt/10 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass p-8 md:p-10 rounded-[40px] border-white/5 shadow-2xl space-y-8">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-accent-soft border border-accent/20 flex items-center justify-center mx-auto mb-4 text-accent shadow-[0_0_20px_rgba(99,102,241,0.2)]">
              <Lock size={32} />
            </div>
            <h1 className="text-3xl font-black tracking-tight">Zenith Nexus</h1>
            <p className="text-text-soft text-sm uppercase tracking-[0.2em] font-bold">Administrative Terminal</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <Input
                label="Admin ID"
                icon={<User size={18} />}
                type="email"
                placeholder="commander@samarpan.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <div className="relative">
                <Input
                  label="Security Key"
                  icon={<Lock size={18} />}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 bottom-3 text-text-soft hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400 text-sm font-bold"
              >
                <ShieldAlert size={18} />
                {error}
              </motion.div>
            )}

            <Button 
              type="submit" 
              className="w-full py-4 text-sm font-black tracking-widest"
              isLoading={loading}
            >
              INITIATE AUTHENTICATION
            </Button>
          </form>

          <p className="text-center text-[10px] text-text-soft font-bold uppercase tracking-widest opacity-40">
            Unauthorized access is strictly monitored.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
