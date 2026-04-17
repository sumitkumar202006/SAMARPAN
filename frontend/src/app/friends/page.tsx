'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, MessageSquare, UserPlus, UserMinus, 
  Trash2, Pin, PinOff, ShieldAlert, Send, 
  Smile, Share2, Search, MoreVertical, 
  Circle, Ghost, Activity, UserX, X,
  ChevronDown, LogOut, Ban, Check, AlertTriangle
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
  const [isSending, setIsSending] = useState(false);
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: 'remove' | 'block', friend: any } | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);

  // Close options dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (optionsRef.current && !optionsRef.current.contains(event.target as Node)) {
        setShowOptionsMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch Friends
  useEffect(() => {
    if (!user?.id) return;
    loadFriends();
  }, [user, activeTab]);

  // Presence & Real-time Messages
  useEffect(() => {
    if (!socket) return;

    const handleInitialOnline = (ids: string[]) => {
      console.log("[Social] Received initial online list:", ids);
      setOnlineUsers(new Set(ids));
    };

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
        setMessages(prev => {
          if (prev.find(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
    };

    socket.on('initial_online_friends', handleInitialOnline);
    socket.on('friend_status_change', handleStatusChange);
    socket.on('new_private_message', handleNewMessage);

    // Re-request online list just in case
    socket.emit('social_connect', { userId: user?.id });

    return () => {
      socket.off('initial_online_friends', handleInitialOnline);
      socket.off('friend_status_change', handleStatusChange);
      socket.off('new_private_message', handleNewMessage);
    };
  }, [socket, selectedFriend, user]);

  const loadFriends = async () => {
    try {
      let endpoint = `/api/friends/list/${user?.id}`;
      if (activeTab === 'pending') endpoint = `/api/friends/pending/${user?.id}`;
      // if (activeTab === 'blocked') endpoint = `/api/friends/blocked/${user?.id}`; // Implement if backend supports
      
      const res = await api.get(endpoint);
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

  const sendMessage = (contentOverride?: string) => {
    const textToSend = contentOverride || newMessage;
    if (!textToSend.trim() || !selectedFriend || isSending) return;
    
    setIsSending(true);
    const msgData = {
      receiverId: selectedFriend.id,
      content: textToSend,
      type: 'text'
    };

    socket.emit('private_message', msgData);
    if (!contentOverride) setNewMessage('');
    setTimeout(() => setIsSending(false), 300);
  };

  const sendInvite = () => {
    if (!selectedFriend) return;
    const inviteMsg = "System: Tactical Arena Invitation Issued. Join the neural link to begin combat operations.";
    sendMessage(inviteMsg);
  };

  const manageFriend = async (friendId: string, action: string) => {
    try {
      await api.put('/api/friends/manage', { userId: user?.id, friendId, action });
      if (selectedFriend?.id === friendId && (action === 'remove' || action === 'block')) {
        setSelectedFriend(null);
      }
      loadFriends();
      setConfirmAction(null);
    } catch (err) {
      console.error("Action failed", err);
    }
  };

  const filteredFriends = friends.filter(f => {
    if (showOnlineOnly) return onlineUsers.has(f.id);
    return true;
  });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const closeChat = () => {
    setSelectedFriend(null);
    setMobileView('list');
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-background/50 overflow-hidden font-bold relative">
      
      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmAction && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-black/60"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-sm bg-zinc-900 border border-white/10 rounded-3xl p-8 shadow-2xl"
            >
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-6 text-red-500 mx-auto">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-black text-center mb-2 uppercase italic tracking-tighter">
                {confirmAction.type === 'remove' ? 'Sever Neural Link?' : 'Blacklist Protocol?'}
              </h3>
              <p className="text-text-soft text-center text-xs mb-8 leading-relaxed px-4">
                Are you sure you want to {confirmAction.type} <span className="text-white font-bold">@{confirmAction.friend.username}</span>? 
                {confirmAction.type === 'block' ? ' This user will be permanently restricted from contacting you.' : ' This will remove them from your active roster.'}
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setConfirmAction(null)}
                  className="rounded-xl border-white/5 hover:bg-white/5 uppercase text-[10px] tracking-widest font-black"
                >
                  Abstain
                </Button>
                <Button 
                  className={cn("rounded-xl uppercase text-[10px] tracking-widest font-black shadow-lg", confirmAction.type === 'remove' ? 'bg-red-500 hover:bg-red-600' : 'bg-zinc-800 hover:bg-red-500')}
                  onClick={() => manageFriend(confirmAction.friend.id, confirmAction.type)}
                >
                  Execute
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
               <button 
                 onClick={() => setShowOnlineOnly(!showOnlineOnly)}
                 className={cn(
                   "p-2 rounded-lg transition-all",
                   showOnlineOnly ? "bg-accent text-white shadow-lg shadow-accent/20" : "bg-white/5 text-text-soft hover:bg-white/10"
                 )}
               >
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
          {filteredFriends.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 opacity-20 italic">
               <Ghost size={32} className="mb-2" />
               <p className="text-xs">No active links found.</p>
            </div>
          ) : (
            filteredFriends.map((f) => (
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
                    <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center overflow-hidden border border-white/5 font-black text-xs">
                      {f.avatar ? <img src={f.avatar} className="w-full h-full object-cover" /> : (f.username || f.name).charAt(0).toUpperCase()}
                    </div>
                    {/* Status Dot */}
                    <div className={cn(
                      "absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-background shadow-sm",
                      onlineUsers.has(f.id) ? "bg-emerald-500 animate-pulse" : "bg-red-500/50"
                    )} />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-black truncate leading-none mb-1 text-white/90">{f.name}</p>
                    <p className="text-[10px] text-text-soft tracking-tight">@{f.username || 'unknown'}</p>
                  </div>
                  {activeTab === 'friends' && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={(e) => {e.stopPropagation(); manageFriend(f.id, f.isPinned ? 'unpin' : 'pin')}} className="p-1 hover:text-accent">
                        {f.isPinned ? <PinOff size={14} /> : <Pin size={14} />}
                      </button>
                      <button onClick={(e) => {e.stopPropagation(); setConfirmAction({ type: 'remove', friend: f })}} className="p-1 hover:text-red-400">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                  {activeTab === 'pending' && (
                    <button 
                      onClick={(e) => {e.stopPropagation(); manageFriend(f.id, 'accept')}}
                      className="p-2 bg-accent/20 text-accent rounded-lg hover:bg-accent hover:text-white transition-all"
                    >
                      <UserPlus size={14} />
                    </button>
                  )}
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
            <div className="h-16 border-b border-white/5 px-4 lg:px-6 flex items-center justify-between bg-zinc-950/50 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setMobileView('list')}
                  className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-white/5 text-text-soft"
                >
                  <Users size={18} />
                </button>
                <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-accent/20 flex items-center justify-center overflow-hidden border border-white/5">
                  {selectedFriend.avatar ? <img src={selectedFriend.avatar} className="w-full h-full object-cover" /> : selectedFriend.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xs lg:text-sm font-black leading-none mb-1 uppercase italic tracking-tighter text-white">{selectedFriend.name}</h2>
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", onlineUsers.has(selectedFriend.id) ? "bg-emerald-500" : "bg-red-500/50")} />
                    <span className="text-[9px] lg:text-[10px] text-text-soft uppercase font-black">{onlineUsers.has(selectedFriend.id) ? 'Neural Link Active' : 'Link Offline'}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 lg:gap-2 text-[10px]">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={sendInvite}
                  className="h-8 lg:h-9 px-2 lg:px-4 gap-2 border-white/10 hover:border-accent hover:bg-accent/10 text-white/80 hover:text-white"
                >
                  <Share2 size={12} className="lg:w-[14px]" /> <span className="hidden sm:inline uppercase italic tracking-widest font-black">Invite Arena</span>
                </Button>
                
                <div className="relative" ref={optionsRef}>
                  <button 
                    onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                    className={cn(
                      "p-2 rounded-lg transition-all",
                      showOptionsMenu ? "bg-white/10 text-white" : "bg-white/5 hover:bg-white/10 text-text-soft"
                    )}
                  >
                    <MoreVertical size={18} />
                  </button>
                  
                  <AnimatePresence>
                    {showOptionsMenu && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="absolute right-0 top-full mt-2 w-48 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl p-2 z-50 overflow-hidden"
                      >
                        <button 
                          onClick={() => { setShowOptionsMenu(false); setConfirmAction({ type: 'block', friend: selectedFriend }); }}
                          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-500/10 text-text-soft hover:text-red-500 transition-all text-[10px] font-black uppercase tracking-widest"
                        >
                          <Ban size={14} /> Blacklist
                        </button>
                        <button 
                          onClick={() => { setShowOptionsMenu(false); setConfirmAction({ type: 'remove', friend: selectedFriend }); }}
                          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-500/10 text-text-soft hover:text-red-500 transition-all text-[10px] font-black uppercase tracking-widest border-t border-white/5 mt-1 pt-3"
                        >
                          <UserX size={14} /> Sever Link
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                <button 
                  onClick={closeChat}
                  className="p-2 ml-1 rounded-lg bg-white/5 hover:bg-red-500/20 hover:text-red-500 text-text-soft transition-all"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6 bg-transparent relative">
              {/* Background Glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />
              
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-30 italic">
                  <Ghost size={48} className="mb-4 animate-float" />
                  <p className="text-xs uppercase font-black tracking-widest text-white">Neural stream is quiet.</p>
                </div>
              ) : (
                messages.map((m) => (
                  <div key={m.id || Math.random()} className={cn("flex flex-col max-w-[85%] sm:max-w-[75%]", m.senderId === user?.id ? "ml-auto items-end" : "items-start")}>
                    <div className={cn(
                      "p-4 rounded-2xl text-[13px] font-bold shadow-sm leading-relaxed border",
                      m.senderId === user?.id 
                        ? "bg-accent/90 backdrop-blur-md text-white rounded-tr-none border-white/10" 
                        : "bg-zinc-900/80 backdrop-blur-md border-white/5 text-white/90 rounded-tl-none"
                    )}>
                      {m.content}
                    </div>
                    <span className="text-[8px] text-text-soft mt-1.5 font-black uppercase tracking-widest flex items-center gap-1.5">
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {m.senderId === user?.id && <Check size={8} className="text-accent" />}
                    </span>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-6 bg-zinc-950/20 backdrop-blur-xl border-t border-white/5">
              <div className="bg-white/5 rounded-2xl p-2 flex items-center gap-2 border border-white/10 shadow-2xl focus-within:border-accent/40 focus-within:bg-white/[0.08] transition-all">
                <button 
                  onClick={() => setNewMessage(prev => prev + '🎮')}
                  className="p-3 text-text-soft hover:text-white transition-all hover:bg-white/5 rounded-xl"
                >
                  <Smile size={20} />
                </button>
                <input 
                  type="text"
                  placeholder="Type a secure neural message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  className="flex-1 bg-transparent border-none outline-none text-sm font-bold px-2 py-3 text-white placeholder:text-white/20"
                />
                <button 
                  onClick={() => sendMessage()}
                  disabled={isSending || !newMessage.trim()}
                  className={cn(
                    "p-3 rounded-xl shadow-lg transition-all",
                    isSending || !newMessage.trim() 
                      ? "bg-white/5 text-white/20 cursor-not-allowed" 
                      : "bg-accent text-white hover:scale-105 active:scale-95 shadow-accent/20"
                  )}
                >
                  <Send size={20} className={cn(isSending && "animate-pulse")} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-accent/2 max-w-xl max-h-xl rounded-full blur-[100px] pointer-events-none" />
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="relative z-10"
            >
              <div className="w-24 h-24 rounded-3xl bg-accent/5 flex items-center justify-center mb-10 mx-auto relative group">
                <div className="absolute inset-0 bg-accent/20 blur-xl opacity-0 group-hover:opacity-100 transition-all rounded-3xl" />
                <MessageSquare size={48} className="text-accent/40 group-hover:text-accent group-hover:scale-110 transition-all" />
              </div>
              <h2 className="text-3xl font-black italic mb-4 tracking-tighter text-white uppercase italic">SELECT AN ALLY</h2>
              <p className="text-text-soft text-xs max-w-xs mx-auto leading-relaxed font-black uppercase tracking-widest opacity-60">
                Open a secure neural link with any ally from your roster to coordinate and initiate private arenas.
              </p>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
