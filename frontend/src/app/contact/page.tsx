'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, MessageSquare, Globe } from 'lucide-react';
import { XIcon as Twitter, InstagramIcon as Instagram, WhatsappIcon as WhatsApp, GithubIcon as GitHub } from '@/components/ui/BrandIcons';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export default function ContactPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10 lg:py-20">
      <div className="flex flex-col items-center text-center gap-4 mb-16">
        <h2 className="text-4xl lg:text-6xl font-black tracking-tight text-foreground">Contact Us</h2>
        <p className="text-text-soft text-lg max-w-2xl leading-relaxed">
          Reach out for collaborations, feedback, or event hosting. We're here to help you scale your quiz experience.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-12 items-start">
        {/* Contact Form */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass p-8 md:p-12 rounded-[40px] space-y-6"
        >
          <div className="space-y-4">
            <Input label="Name" placeholder="Your full name" />
            <Input label="Email" type="email" placeholder="you@institute.com" />
            <Select label="I want to">
              <option>Host a college event</option>
              <option>Try in my classroom</option>
              <option>Give feedback</option>
              <option>Discuss collaboration</option>
            </Select>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-widest text-text-soft ml-1">Message</label>
              <textarea 
                className="bg-bg-soft/50 border border-border-soft rounded-2xl p-4 text-sm focus:outline-none focus:border-accent transition-all min-h-[150px]"
                placeholder="Tell us about your idea or event..."
              />
            </div>
          </div>
          <Button className="w-full py-5 text-lg">
            <Send size={20} />
            Send Message
          </Button>
        </motion.div>

        {/* Contact Info */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-8"
        >
          <div className="glass p-10 rounded-[40px] space-y-8">
            <h3 className="text-2xl font-black">Get in touch</h3>
            
            <div className="space-y-6">
              {[
                { icon: Mail, title: 'Email address', value: 'samarpan.quiz.auth@gmail.com', color: 'text-accent' },
                { icon: Phone, title: 'Phone number', value: '+91 63927 08964', color: 'text-accent-alt' },
                { icon: MapPin, title: 'Main office', value: 'Somewhere on Earth', color: 'text-orange-500' },
              ].map(({ icon: Icon, title, value, color }, i) => (
                <div key={i} className="flex gap-4">
                   <div className={cn("w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center shrink-0", color)}>
                     <Icon size={22} />
                   </div>
                   <div className="flex flex-col">
                     <span className="text-[10px] uppercase font-black tracking-widest text-text-soft mb-1">{title}</span>
                     <span className="font-bold">{value}</span>
                   </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass p-10 rounded-[40px] bg-gradient-to-br from-accent/10 to-transparent">
            <h3 className="font-bold mb-6">Connect with us</h3>
            <div className="flex gap-4">
              {[
                { icon: WhatsApp, href: 'https://whatsapp.com/channel/0029VbCDJ4M1XquaIIpJFw2b' },
                { icon: Instagram, href: 'https://www.instagram.com/me.aman_2005?igsh=azJhMHpzOWtwOTM3' },
                { icon: GitHub, href: 'https://github.com/infinity-me' },
              ].map((social, i) => (
                <a 
                  key={i} 
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-accent-soft hover:text-accent transition-all"
                >
                  <social.icon size={20} />
                </a>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
