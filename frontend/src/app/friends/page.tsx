'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, MessageSquare, UserPlus, UserMinus, 
  Trash2, Pin, PinOff, ShieldAlert, Send, 
  Smile, Share2, Search, MoreVertical, 
  Circle, Ghost, Activity, UserX
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import api from '@/lib/axios';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

export default function FriendsPage() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [activeTab, setActiveTab] = useState<'friends' | 'pending' | 'blocked'>('friends');
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const [friends, setFriends] = useState<any[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Fetch Friends
  useEffect(() => {
    if (!user?.id) return;
    loadFriends();
  }, [user]);

  // Presence & Real-time Messages
  useEffect(() => {
    if (!socket) return;

    const handleStatusChange = ({ userId, status }: { userId: string, status: string }) => {
      setOnlineUsers(prev => {
        const next = new Set(prev);
        if (status === 'online') next.add(userId);
        else next.delete(userId);
        return next;
      });
    };

    const handleNewMessage = (msg: any) => {
      if (selectedFriend && (msg.senderId === selectedFriend.id || msg.receiverId === selectedFriend.id)) {
        setMessages(prev => [...prev, msg]);
      }
    };

    socket.on('friend_status_change', handleStatusChange);
    socket.on('new_private_message', handleNewMessage);

    return () => {
      socket.off('friend_status_change', handleStatusChange);
      socket.off('new_private_message', handleNewMessage);
    };
  }, [socket, selectedFriend]);

  const loadFriends = async () => {
    try {
      const res = await api.get(`/api/friends/list/${user?.id}`);
      setFriends(res.data);
    } catch (err) {
      console.error("Load friends failed", err);
    }
  };

  const loadMessages = async (friend: any) => {
    try {
      const res = await api.get(`/api/friends/messages/${user?.id}/${friend.id}`);
      setMessages(res.data);
      setSelectedFriend(friend);
      setMobileView('chat');
    } catch (err) {
      console.error("Load messages failed", err);
    }
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedFriend) return;
    
    const msgData = {
      receiverId: selectedFriend.id,
      content: newMessage,
      type: 'text'
    };

    socket.emit('private_message', msgData);
    setNewMessage('');
  };

  const manageFriend = async (friendId: string, action: string) => {
    try {
      await api.put('/api/friends/manage', { userId: user?.id, friendId, action });
      loadFriends();
    } catch (err) {
      console.error("Action failed", err);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex h-[calc(100vh-64px)] bg-background/50 overflow-hidden font-bold">
      {/* Sidebar: Friends List */}
      <div className={cn(
        "w-full lg:w-80 border-r border-white/5 bg-white/[0.01] flex flex-col backdrop-blur-xl transition-all",
        mobileView === 'chat' ? "hidden lg:flex" : "flex"
      )}>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-black italic flex items-center gap-2">
              <Users size={20} className="text-accent" /> ROSTER
            </h1>
            <div className="flex items-center gap-1">
               <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all text-text-soft">
                  <Activity size={16} />
               </button>
            </div>
          </div>
          
          <div className="flex bg-white/5 p-1 rounded-xl">
            <button 
              onClick={() => setActiveTab('friends')}
              className={cn("flex-1 py-1.5 text-[10px] uppercase font-black tracking-widest rounded-lg transition-all", activeTab === 'friends' ? "bg-accent text-white shadow-lg" : "text-text-soft hover:text-white")}
            >
              Allies
            </button>
            <button 
              onClick={() => setActiveTab('pending')}
              className={cn("flex-1 py-1.5 text-[10px] uppercase font-black tracking-widest rounded-lg transition-all", activeTab === 'pending' ? "bg-accent text-white shadow-lg" : "text-text-soft hover:text-white")}
            >
              Intel
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 space-y-2 pb-6">
          {friends.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 opacity-20 italic">
               <Ghost size={32} className="mb-2" />
               <p className="text-xs">No active links found.</p>
            </div>
          ) : (
            friends.map((f) => (
              <motion.div
                layout
                key={f.id}
                onClick={() => loadMessages(f)}
                className={cn(
                  "group p-3 rounded-2xl border transition-all cursor-pointer relative",
                  selectedFriend?.id === f.id ? "bg-accent/10 border-accent/30 shadow-lg" : "bg-white/[0.02] border-white/5 hover:bg-white/5"
                )}
              >
                {f.isPinned && <Pin size={10} className="absolute top-2 right-2 text-accent" />}
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center overflow-hidden border border-white/5">
                      {f.avatar ? <img src={f.avatar} className="w-full h-full object-cover" /> : f.name.charAt(0).toUpperCase()}
                    </div>
                    {/* Status Dot */}
                    <div className={cn(
                      "absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-background shadow-sm",
                      onlineUsers.has(f.id) ? "bg-emerald-500 animate-pulse" : "bg-red-500/50"
                    )} />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-black truncate leading-none mb-1">{f.name}</p>
                    <p className="text-[10px] text-text-soft tracking-tight">@{f.username}</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={(e) => {e.stopPropagation(); manageFriend(f.id, f.isPinned ? 'unpin' : 'pin')}} className="p-1 hover:text-accent">
                      {f.isPinned ? <PinOff size={14} /> : <Pin size={14} />}
                    </button>
                    <button onClick={(e) => {e.stopPropagation(); manageFriend(f.id, 'remove')}} className="p-1 hover:text-red-400">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Main Content: Chat or Empty State */}
      <div className={cn(
        "flex-1 flex flex-col bg-white/[0.01]",
        mobileView === 'list' ? "hidden lg:flex" : "flex"
      )}>
        {selectedFriend ? (
          <>
            {/* Chat Header */}
            <div className="h-16 border-b border-white/5 px-4 lg:px-6 flex items-center justify-between bg-white/[0.01]">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setMobileView('list')}
                  className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-white/5 text-text-soft"
                >
                  <Users size={18} />
                </button>
                <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-accent/20 flex items-center justify-center overflow-hidden">
                  {selectedFriend.avatar ? <img src={selectedFriend.avatar} className="w-full h-full object-cover" /> : selectedFriend.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xs lg:text-sm font-black leading-none mb-1 uppercase italic tracking-tighter">{selectedFriend.name}</h2>
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", onlineUsers.has(selectedFriend.id) ? "bg-emerald-500" : "bg-red-500/50")} />
                    <span className="text-[9px] lg:text-[10px] text-text-soft uppercase font-black">{onlineUsers.has(selectedFriend.id) ? 'Active' : 'Offline'}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 lg:gap-2 text-[10px]">
                <Button size="sm" variant="outline" className="h-8 lg:h-9 px-2 lg:px-4 gap-2 border-white/10 hover:border-accent">
                  <Share2 size={12} className="lg:w-[14px]" /> <span className="hidden sm:inline">Invite Arena</span>
                </Button>
                <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all">
                  <MoreVertical size={16} lg-size={18} />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
              {messages.map((m, i) => (
                <div key={i} className={cn("flex flex-col max-w-[80%]", m.senderId === user?.id ? "ml-auto items-end" : "items-start")}>
                  <div className={cn(
                    "p-4 rounded-2xl text-xs font-bold shadow-sm leading-relaxed",
                    m.senderId === user?.id 
                      ? "bg-accent text-white rounded-tr-none" 
                      : "bg-white/5 border border-white/10 text-white rounded-tl-none"
                  )}>
                    {m.content}
                  </div>
                  <span className="text-[8px] text-text-soft mt-1 font-black uppercase tracking-widest">
                    {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-6 border-t border-white/5">
              <div className="bg-white/5 rounded-2xl p-2 flex items-center gap-2 border border-white/10 shadow-lg focus-within:border-accent/40 transition-all">
                <button className="p-3 text-text-soft hover:text-white transition-all">
                  <Smile size={20} />
                </button>
                <input 
                  type="text"
                  placeholder="Type a secure message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  className="flex-1 bg-transparent border-none outline-none text-sm font-bold px-2 py-3"
                />
                <button 
                  onClick={sendMessage}
                  className="p-3 bg-accent text-white rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="w-24 h-24 rounded-full bg-accent/5 flex items-center justify-center mb-6 animate-pulse">
              <MessageSquare size={48} className="text-accent/20" />
            </div>
            <h2 className="text-2xl font-black italic mb-3">SELECT AN ALLY</h2>
            <p className="text-text-soft text-sm max-w-sm leading-relaxed">
              Open a secure neural link with any ally from your roster to coordinate and initiate private arenas.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
