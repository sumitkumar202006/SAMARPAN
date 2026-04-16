'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, X, ChevronDown, ChevronUp, 
  Send, Users, Bell, Search, UserPlus, 
  Smile, Share2, Circle, MoreHorizontal, Activity
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import api from '@/lib/axios';
import { cn } from '@/lib/utils';

export const FloatingChat = () => {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const [isOpen, setIsOpen] = useState(false);
  const [activeView, setActiveView] = useState<'roster' | 'chat'>('roster');
  const [friends, setFriends] = useState<any[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load Friends for Floating Menu
  useEffect(() => {
    if (user?.id && isOpen) {
       loadFriends();
    }
  }, [user, isOpen]);

  // Presence & Real-time Listeners
  useEffect(() => {
    if (!socket) return;

    const handleStatus = ({ userId, status }: any) => {
      setOnlineUsers(prev => {
        const next = new Set(prev);
        if (status === 'online') next.add(userId);
        else next.delete(userId);
        return next;
      });
    };

    const handleMsg = (msg: any) => {
      // If we are already chatting with this person in floating view
      if (selectedFriend && (msg.senderId === selectedFriend.id || msg.receiverId === selectedFriend.id)) {
        setMessages(prev => [...prev, msg]);
      }
    };

    socket.on('friend_status_change', handleStatus);
    socket.on('new_private_message', handleMsg);

    return () => {
      socket.off('friend_status_change', handleStatus);
      socket.off('new_private_message', handleMsg);
    };
  }, [socket, selectedFriend]);

  const loadFriends = async () => {
    try {
      const res = await api.get(`/api/friends/list/${user?.id}`);
      setFriends(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const openChat = async (friend: any) => {
    try {
      setSelectedFriend(friend);
      setActiveView('chat');
      const res = await api.get(`/api/friends/messages/${user?.id}/${friend.id}`);
      setMessages(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedFriend) return;
    socket.emit('private_message', {
      receiverId: selectedFriend.id,
      content: newMessage,
      type: 'text'
    });
    setNewMessage('');
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!user) return null;

  return (
    <div className="hidden lg:block fixed bottom-6 right-6 z-[1000] font-bold px-4">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 50, scale: 0.9, filter: 'blur(10px)' }}
            className="w-80 h-[500px] glass rounded-[32px] border border-white/10 shadow-2xl flex flex-col mb-4 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/5 bg-accent/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {activeView === 'chat' && (
                  <button onClick={() => setActiveView('roster')} className="p-1 hover:text-white text-text-soft">
                    <X size={14} />
                  </button>
                )}
                <h3 className="text-xs font-black uppercase tracking-widest italic flex items-center gap-2">
                  <Activity size={12} className="text-accent" /> 
                  {activeView === 'roster' ? 'Neural Network' : selectedFriend?.name}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <div className={cn("w-1.5 h-1.5 rounded-full", isConnected ? "bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,1)]" : "bg-red-500")} />
                <button onClick={() => setIsOpen(false)} className="text-text-soft hover:text-white transition-all">
                   <ChevronDown size={18} />
                </button>
              </div>
            </div>

            {/* Content Switcher */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {activeView === 'roster' ? (
                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                  {friends.map(f => (
                    <button 
                      key={f.id}
                      onClick={() => openChat(f)}
                      className="w-full flex items-center gap-3 p-2 rounded-xl border border-transparent hover:border-white/5 hover:bg-white/5 transition-all text-left group"
                    >
                      <div className="relative">
                        <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center overflow-hidden border border-white/5">
                          {f.avatar ? <img src={f.avatar} className="w-full h-full object-cover" /> : f.name.charAt(0)}
                        </div>
                        <div className={cn("absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background", onlineUsers.has(f.id) ? "bg-emerald-500" : "bg-red-500/50")} />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-xs font-bold truncate leading-none mb-1 uppercase tracking-tighter italic">{f.name}</p>
                        <p className="text-[9px] text-text-soft uppercase font-black tracking-widest">@{f.username}</p>
                      </div>
                      <MessageSquare size={14} className="text-text-soft group-hover:text-accent transition-colors" />
                    </button>
                  ))}
                  {friends.length === 0 && (
                     <div className="h-full flex flex-col items-center justify-center opacity-30 italic py-20 pointer-events-none">
                        <Users size={24} className="mb-2" />
                        <p className="text-[10px]">No allies linked.</p>
                     </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                    {messages.map((m, i) => (
                      <div key={i} className={cn("flex flex-col max-w-[85%]", m.senderId === user.id ? "ml-auto items-end" : "items-start")}>
                        <div className={cn(
                          "px-3 py-2 rounded-xl text-[11px] font-bold shadow-sm",
                          m.senderId === user.id ? "bg-accent text-white rounded-tr-none" : "bg-white/5 text-white rounded-tl-none border border-white/5"
                        )}>
                          {m.content}
                        </div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                  <div className="p-3 border-t border-white/5 flex items-center gap-2">
                     <input 
                        type="text"
                        placeholder="Say something..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] outline-none focus:border-accent/40 transition-all font-bold"
                     />
                     <button onClick={sendMessage} className="p-2 rounded-lg bg-accent text-white shadow-lg hover:scale-105 transition-all">
                        <Send size={12} />
                     </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all relative overflow-hidden group",
          isOpen ? "bg-red-500 text-white" : "bg-gradient-to-tr from-accent to-accent-alt text-white"
        )}
      >
        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-all" />
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
        {/* Notification Badge if needed */}
        <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-400 border-2 border-white rounded-full hidden" />
      </motion.button>
    </div>
  );
};
