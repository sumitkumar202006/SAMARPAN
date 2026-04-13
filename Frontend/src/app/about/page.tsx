'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Target, Users, Zap, Shield, Sparkles, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AboutPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10 lg:py-20">
      <div className="flex flex-col items-center text-center gap-4 mb-20">
        <div className="w-20 h-20 rounded-[32px] bg-gradient-to-tr from-accent to-accent-alt flex items-center justify-center font-bold text-4xl text-white shadow-2xl rotate-6 mb-4">
          S
        </div>
        <h2 className="text-4xl lg:text-7xl font-black tracking-tight text-foreground">Changing the game.</h2>
        <p className="text-text-soft text-lg lg:text-xl max-w-3xl leading-relaxed">
          Samarpan is an AI-powered e-sports style quiz arena designed to transform classroom engagement into a competitive, data-driven experience.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
        {[
          { icon: Sparkles, title: 'AI-Powered', desc: 'Generate high-quality quizzes in seconds using advanced LLMs tailored for educational content.' },
          { icon: Zap, title: 'Real-time Arena', desc: 'Sync questions across dozens of devices instantly with zero lag, ensuring a fair competitive ground.' },
          { icon: Trophy, title: 'Elo Rankings', desc: 'Our dynamic rating system rewards skill and consistency, mirroring professional gaming boards.' },
          { icon: Shield, title: 'Anti-Cheat', desc: 'Built-in protections to ensure integrity in every rated session and tournament round.' },
          { icon: Users, title: 'Team Battles', desc: 'Coordinate with squadmates in 2v2 or 4v4 modes for a collaborative e-sports experience.' },
          { icon: Target, title: 'Deep Analytics', desc: 'Detailed host dashboards provide insights into player performance and question difficulty.' },
        ].map((feat, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={i} 
            className="glass p-8 rounded-[40px] flex flex-col gap-4 border-white/5 bg-gradient-to-br from-bg-soft/50 to-transparent group hover:border-accent transition-all"
          >
            <div className="w-12 h-12 rounded-2xl bg-accent-soft flex items-center justify-center text-accent group-hover:scale-110 group-hover:bg-accent group-hover:text-white transition-all">
              <feat.icon size={24} />
            </div>
            <h3 className="text-xl font-bold">{feat.title}</h3>
            <p className="text-sm text-text-soft leading-relaxed">{feat.desc}</p>
          </motion.div>
        ))}
      </div>

      <div className="glass p-12 lg:p-20 rounded-[64px] relative overflow-hidden text-center lg:text-left bg-gradient-to-tr from-accent/10 to-transparent">
        <div className="relative z-10 max-w-3xl">
          <h3 className="text-3xl lg:text-5xl font-black mb-8 leading-tight">Our mission is to make learning as addictive as gaming.</h3>
          <p className="text-text-soft text-lg mb-10 leading-relaxed">
            Founded by educators and developers, Samarpan bridges the gap between traditional assessment and the high-energy world of modern gaming. We believe that competition, when handled right, is the best catalyst for growth.
          </p>
          <div className="flex flex-wrap gap-12">
            <div>
              <p className="text-4xl font-black text-accent mb-1">10k+</p>
              <p className="text-[10px] uppercase font-black tracking-widest text-text-soft">Questions Generated</p>
            </div>
            <div>
              <p className="text-4xl font-black text-accent-alt mb-1">500+</p>
              <p className="text-[10px] uppercase font-black tracking-widest text-text-soft">Live Battles Hosted</p>
            </div>
            <div>
              <p className="text-4xl font-black text-blue-400 mb-1">99.9%</p>
              <p className="text-[10px] uppercase font-black tracking-widest text-text-soft">Sync Reliability</p>
            </div>
          </div>
        </div>
        
        {/* Abstract shapes */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/20 blur-[150px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      </div>
    </div>
  );
}
