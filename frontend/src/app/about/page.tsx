'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Target, Users, Zap, Shield, Sparkles, Trophy } from 'lucide-react';
import { GithubIcon as Github, InstagramIcon as Instagram, LinkedinIcon as Linkedin } from '@/components/ui/BrandIcons';
import { cn } from '@/lib/utils';

export default function AboutPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10 lg:py-20">
      <div className="flex flex-col items-center text-center gap-4 mb-20">
        <div className="w-20 h-20 rounded-[32px] bg-gradient-to-tr from-accent to-accent-alt flex items-center justify-center font-bold text-4xl text-white shadow-2xl rotate-6 mb-4">
          S
        </div>
        <h1 className="text-4xl lg:text-7xl font-black tracking-tight text-foreground">Changing the game.</h1>
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

      <div className="mb-32">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-5xl font-black mb-4">Meet the Team</h2>
          <p className="text-text-soft">The visionaries behind the arena.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            {
              name: "Aman Maurya",
              role: "Founder",
              edu: "BTech CSE 2024-2028",
              img: "https://media.licdn.com/dms/image/v2/D4D03AQG31OWQCIq-dw/profile-displayphoto-scale_200_200/B4DZj1lhjwIgAg-/0/1756466914900?e=2147483647&v=beta&t=sdXKvgbR_CrvNG9t-MFVHvWg93auozy8XE5iMwynrZ4",
              github: "https://github.com/infinity-me",
              insta: "https://www.instagram.com/me.aman_2005/",
              link: "https://www.linkedin.com/in/maurya-aman-satyendra-a19835368/"
            },
            {
              name: "Sumit Kumar",
              role: "Founder",
              edu: "BTech CSE 2024-2028",
              img: "https://media.licdn.com/dms/image/v2/D5603AQGicv6YGa619w/profile-displayphoto-scale_400_400/B56ZwZCWS7H0Ag-/0/1769946574615?e=1778112000&v=beta&t=8gE0iG5WUSd2BxoG2Nlm8v5xFNMCr95z8OdY63fxRJY",
              github: "https://github.com/sumitkumar202006",
              insta: "https://www.instagram.com/ska_0770/",
              link: "https://www.linkedin.com/in/sumit-kumar-122671322/"
            },
            {
              name: "Anuneet Gupta",
              role: "Founder",
              edu: "BCA 2024-2027",
              img: "https://media.licdn.com/dms/image/v2/D5603AQG-4yjbRagcLQ/profile-displayphoto-crop_800_800/B56Z2sgod7GoAI-/0/1776715733435?e=1778716800&v=beta&t=BW91bEQq9zGMCOj-W0v2-xCYxk04Yci0AOyACzuyL6E",
              github: "https://github.com/anuneetgupta",
              insta: "https://www.instagram.com/anuneet_gupta/",
              link: "https://www.linkedin.com/in/anuneet-gupta-57898631a/"
            },
            {
              name: "Janvi Sahu",
              role: "Founder",
              edu: "BCA 2024-2027",
              img: "https://media.licdn.com/dms/image/v2/D5603AQEhutmluG8uZQ/profile-displayphoto-scale_400_400/B56ZtL3peHLAAk-/0/1766504440204?e=1778112000&v=beta&t=48rTvYQ6lsnwPWyqgwTn6XeejRoQ32sMdB9JSZ_sL0w",
              github: "https://github.com/janvi3ssj",
              insta: "https://www.instagram.com/janvi_sahu93/",
              link: "https://www.linkedin.com/in/janvi-sahu-0968b8329/"
            }
          ].map((member, i) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              key={i}
              className="glass p-8 rounded-[40px] flex flex-col items-center text-center group hover:border-accent transition-all duration-500"
            >
              <div className="relative w-32 h-32 mb-6 pointer-events-none">
                {/* Background Circle */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-accent/20 to-accent-alt/20 group-hover:scale-110 transition-transform duration-500" />
                {/* Profile Image with pop-out effect */}
                <img
                  src={member.img}
                  alt={`${member.name}, ${member.role} at Qyro Arena`}
                  referrerPolicy="no-referrer"
                  width={128}
                  height={128}
                  className="relative z-10 w-full h-full rounded-full object-cover border-4 border-white/10 group-hover:border-accent group-hover:-translate-y-6 group-hover:scale-110 transition-all duration-500 shadow-2xl"
                />
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-[10px] uppercase font-black tracking-widest mb-4">
                <Sparkles size={10} />
                {member.role}
              </div>

              <h3 className="text-xl font-bold mb-1">{member.name}</h3>
              <p className="text-xs text-text-soft mb-6">{member.edu}</p>

              <div className="flex gap-4">
                <a href={member.link} target="_blank" rel="noopener noreferrer" aria-label={`${member.name} on LinkedIn`} className="p-2 rounded-xl bg-white/5 hover:bg-accent hover:text-white transition-all">
                  <Linkedin size={18} />
                </a>
                <a href={member.github} target="_blank" rel="noopener noreferrer" aria-label={`${member.name} on GitHub`} className="p-2 rounded-xl bg-white/5 hover:bg-black hover:text-white transition-all">
                  <Github size={18} />
                </a>
                <a href={member.insta} target="_blank" rel="noopener noreferrer" aria-label={`${member.name} on Instagram`} className="p-2 rounded-xl bg-white/5 hover:bg-gradient-to-tr hover:from-[#f9ce34] hover:via-[#ee2a7b] hover:to-[#6228d7] hover:text-white transition-all">
                  <Instagram size={18} />
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="glass p-12 lg:p-20 rounded-[64px] relative overflow-hidden text-center lg:text-left bg-gradient-to-tr from-accent/10 to-transparent">
        <div className="relative z-10 max-w-3xl">
          <h3 className="text-3xl lg:text-5xl font-black mb-8 leading-tight">Our mission is to make learning as addictive as gaming.</h3>
          <p className="text-text-soft text-lg mb-10 leading-relaxed">
            Founded by educators and developers, Samarpan bridges the gap between traditional assessment and the high-energy world of modern gaming. We believe that competition, when handled right, is the best catalyst for growth.
          </p>
          <div className="flex flex-wrap gap-12">
            <div>
              <p className="text-4xl font-black text-accent mb-1">50k+</p>
              <p className="text-[10px] uppercase font-black tracking-widest text-text-soft">Quizzes Generated</p>
            </div>
            <div>
              <p className="text-4xl font-black text-accent-alt mb-1">10,000+</p>
              <p className="text-[10px] uppercase font-black tracking-widest text-text-soft">Active Learners</p>
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
