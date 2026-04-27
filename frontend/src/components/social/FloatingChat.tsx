'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, X, ChevronDown,
  Send, Users, Activity, CheckCheck,
  MoreVertical, Eraser
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
  const [mounted, setMounted] = useState(false);
  const [unreadTotal, setUnreadTotal] = useState(0);
  // Per-friend unread counts (while on roster view)
  const [unreadPerFriend, setUnreadPerFriend] = useState<Record<string, number>>({});
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [showChatMenu, setShowChatMenu]       = useState(false);
  const [confirmClear, setConfirmClear]       = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Load friends + unread counts when panel opens
  useEffect(() => {
    if (mounted && user?.id && isOpen) {
      loadFriends();
      fetchUnreadCount();
    }
  }, [user, isOpen, mounted]);

  // Poll unread count every 30s while closed
  useEffect(() => {
    if (!mounted || !user?.id) return;
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [mounted, user?.id]);

  const fetchUnreadCount = async () => {
    if (!user?.id) return;
    try {
      const res = await api.get(`/api/friends/unread/${user.id}`);
      setUnreadTotal(res.data.unread || 0);
    } catch {}
  };

  // Presence & Real-time Listeners
  useEffect(() => {
    if (!mounted || !socket) return;

    const handleStatus = ({ userId, status }: any) => {
      setOnlineUsers(prev => {
        const next = new Set(prev);
        if (status === 'online') next.add(userId); else next.delete(userId);
        return next;
      });
    };

    const handleMsg = (msg: any) => {
      // Update per-friend unread if not in that chat
      if (!selectedFriend || (msg.senderId !== selectedFriend.id && msg.receiverId !== selectedFriend.id)) {
        const senderId = msg.senderId;
        setUnreadPerFriend(prev => ({ ...prev, [senderId]: (prev[senderId] || 0) + 1 }));
        setUnreadTotal(prev => prev + 1);
        return;
      }

      // Add to current chat
      if (selectedFriend && (msg.senderId === selectedFriend.id || msg.receiverId === selectedFriend.id)) {
        setMessages(prev => {
          if (msg.id && prev.some(p => p.id === msg.id)) return prev;
          const isSender = msg.senderId === user?.id;
          if (isSender) {
            const existingTemp = prev.find(p => String(p.id).startsWith('temp-') && p.content === msg.content);
            if (existingTemp) return prev.map(p => p.id === existingTemp.id ? msg : p);
          }
          if (!isSender) {
            const last = prev[prev.length - 1];
            if (last?.senderId === msg.senderId && last?.content === msg.content) return prev;
          }
          return [...prev, msg];
        });
        // Mark as read since the chat is open
        markRead(selectedFriend.id);
      }
    };

    socket.on('friend_status_change', handleStatus);
    socket.on('new_private_message', handleMsg);
    return () => {
      socket.off('friend_status_change', handleStatus);
      socket.off('new_private_message', handleMsg);
    };
  }, [socket, selectedFriend, user?.id, mounted]);

  const markRead = async (friendId: string) => {
    if (!user?.id || !friendId) return;
    try {
      await api.post('/api/friends/messages/mark-read', { userId: user.id, friendId });
      setUnreadPerFriend(prev => {
        const next = { ...prev };
        const cleared = next[friendId] || 0;
        delete next[friendId];
        setUnreadTotal(t => Math.max(0, t - cleared));
        return next;
      });
    } catch {}
  };

  const loadFriends = async () => {
    try {
      const res = await api.get(`/api/friends/list/${user?.id}`);
      setFriends(res.data);
    } catch {}
  };

  const openChat = async (friend: any) => {
    try {
      setSelectedFriend(friend);
      setActiveView('chat');
      const res = await api.get(`/api/friends/messages/${user?.id}/${friend.id}`);
      setMessages(res.data);
      markRead(friend.id);
    } catch {}
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedFriend || !socket) return;
    const tempMsg = { id: `temp-${Date.now()}`, senderId: user?.id, receiverId: selectedFriend.id, content: newMessage, type: 'text' };
    setMessages(prev => [...prev, tempMsg]);
    socket.emit('private_message', { receiverId: selectedFriend.id, content: newMessage, type: 'text' });
    setNewMessage('');
  };

  const clearChat = async () => {
    if (!selectedFriend) return;
    try {
      await api.delete(`/api/friends/messages/${selectedFriend.id}`);
      setMessages([]);
      setConfirmClear(false);
      setShowChatMenu(false);
    } catch {}
  };

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  if (!mounted || !user) return null;

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
                  <button onClick={() => { setActiveView('roster'); setSelectedFriend(null); setShowChatMenu(false); setConfirmClear(false); }} className="p-1 hover:text-white text-text-soft">
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
                {/* Three-dot menu — only shown in chat view */}
                {activeView === 'chat' && (
                  <div className="relative">
                    <button
                      onClick={() => { setShowChatMenu(v => !v); setConfirmClear(false); }}
                      className={cn(
                        "p-1 rounded-lg transition-all",
                        showChatMenu ? "bg-white/10 text-white" : "text-text-soft hover:text-white"
                      )}
                    >
                      <MoreVertical size={14} />
                    </button>
                    <AnimatePresence>
                      {showChatMenu && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9, y: 6 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9, y: 6 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 top-full mt-1 w-44 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl p-1.5 z-50"
                        >
                          <button
                            onClick={() => { setShowChatMenu(false); setConfirmClear(true); }}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-orange-500/10 text-text-soft hover:text-orange-400 transition-all text-[9px] font-black uppercase tracking-widest"
                          >
                            <Eraser size={12} /> Clear Chat
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
                <button onClick={() => setIsOpen(false)} className="text-text-soft hover:text-white transition-all">
                  <ChevronDown size={18} />
                </button>
              </div>
            </div>

            {/* Confirm Clear Banner */}
            <AnimatePresence>
              {confirmClear && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="bg-orange-500/10 border-b border-orange-500/20 px-4 py-3 flex items-center justify-between gap-2">
                    <p className="text-[9px] font-black uppercase text-orange-400 tracking-wide leading-tight">
                      Delete all messages permanently?
                    </p>
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        onClick={() => setConfirmClear(false)}
                        className="px-2 py-1 text-[8px] font-black uppercase tracking-widest rounded-lg bg-white/5 text-text-soft hover:bg-white/10 transition-all"
                      >
                        No
                      </button>
                      <button
                        onClick={clearChat}
                        className="px-2 py-1 text-[8px] font-black uppercase tracking-widest rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-all"
                      >
                        Yes, clear
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Content */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {activeView === 'roster' ? (
                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                  {friends.map(f => {
                    const unread = unreadPerFriend[f.id] || 0;
                    return (
                      <button key={f.id} onClick={() => openChat(f)}
                        className="w-full flex items-center gap-3 p-2 rounded-xl border border-transparent hover:border-white/5 hover:bg-white/5 transition-all text-left group">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center overflow-hidden border border-white/5">
                            {f.avatar ? <img src={f.avatar} className="w-full h-full object-cover" alt={f.name} /> : f.name.charAt(0)}
                          </div>
                          <div className={cn("absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background",
                            onlineUsers.has(f.id) ? "bg-emerald-500" : "bg-red-500/50")} />
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <p className="text-xs font-bold truncate leading-none mb-1 uppercase tracking-tighter italic">{f.name}</p>
                          <p className="text-[9px] text-text-soft uppercase font-black tracking-widest">@{f.username}</p>
                        </div>
                        {unread > 0 && (
                          <span className="w-5 h-5 rounded-full bg-accent flex items-center justify-center text-[9px] font-black text-white shadow-[0_0_8px_rgba(99,102,241,0.6)]">
                            {unread > 9 ? '9+' : unread}
                          </span>
                        )}
                        {unread === 0 && <MessageSquare size={14} className="text-text-soft group-hover:text-accent transition-colors" />}
                      </button>
                    );
                  })}
                  {friends.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center opacity-30 italic py-20 pointer-events-none">
                      <Users size={24} className="mb-2" />
                      <p className="text-[10px]">No allies linked.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                    {messages.map((m, i) => {
                      const isMine = m.senderId === user.id;
                      const isLast = i === messages.length - 1;
                      return (
                        <div key={m.id || i} className={cn("flex flex-col max-w-[85%]", isMine ? "ml-auto items-end" : "items-start")}>
                          <div className={cn(
                            "px-3 py-2 rounded-xl text-[11px] font-bold shadow-sm",
                            isMine ? "bg-accent text-white rounded-tr-none" : "bg-white/5 text-white rounded-tl-none border border-white/5"
                          )}>
                            {m.content}
                          </div>
                          {/* Read receipt — show ✓✓ on last sent message if read */}
                          {isMine && isLast && (
                            <div className="flex items-center gap-0.5 mt-0.5 pr-0.5">
                              <CheckCheck size={10} className={m.isRead ? "text-accent" : "text-text-soft/40"} />
                            </div>
                          )}
                        </div>
                      );
                    })}
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

      {/* FAB */}
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
        {/* Unread badge */}
        {!isOpen && unreadTotal > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 border-2 border-background text-[9px] font-black text-white flex items-center justify-center shadow-[0_0_8px_rgba(239,68,68,0.8)]">
            {unreadTotal > 99 ? '99+' : unreadTotal}
          </span>
        )}
      </motion.button>
    </div>
  );
};
