'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, Menu, User as UserIcon, LogOut, Settings, BarChart, Volume2, VolumeX, Shield, Users, X, Sparkles } from 'lucide-react';
import { useAudio } from '@/context/AudioContext';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import api from '@/lib/axios';
import { UserPlus, UserCheck, CheckCircle2, XCircle, ChevronLeft, CreditCard } from 'lucide-react';
import { useSocket } from '@/context/SocketContext';
import { PlanBadge, planRingClass } from '@/components/ui/PlanBadge';
import { NotificationBell } from '@/components/ui/NotificationBell';
import { AvatarFrame } from '@/components/ui/AvatarFrame';

export const Topbar = ({ onOpenMobileMenu, isMatchOrLobby = false }: { onOpenMobileMenu?: () => void, isMatchOrLobby?: boolean }) => {
  const router = useRouter();
  const { user, logout, profileCompletion } = useAuth();
  const { isMuted, toggleMute, playAccelerate, playHorn } = useAudio();
  const { socket } = useSocket();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [currentToast, setCurrentToast] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };

    if (isDropdownOpen || isNotificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen, isNotificationsOpen]);

  // Social & Notifications Logic
  useEffect(() => {
    if (!user?.id) return;

    loadPendingRequests();

    if (socket) {
      socket.on('new_notification', (data: any) => {
        if (data.type === 'friend_request') {
          loadPendingRequests();
          setUnreadNotifications(prev => prev + 1);
          
          // Show Toast
          setCurrentToast(data);
          setTimeout(() => setCurrentToast(null), 5000);

          // Play notification sound if possible
          if (!isMuted) playAccelerate(); 
        }
      });
    }

    return () => {
      if (socket) socket.off('new_notification');
    };
  }, [user?.id, socket, isMuted]);

  const loadPendingRequests = async () => {
    try {
      const res = await api.get(`/api/friends/pending/${user?.id}`);
      setPendingRequests(res.data);
      setUnreadNotifications(res.data.length);
    } catch (err) {
      console.error("Failed to load notifications", err);
    }
  };

  // ── Unread message count (poll every 30s) ──────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;
    const fetchUnread = async () => {
      try {
        const res = await api.get(`/api/friends/unread/${user.id}`);
        setUnreadMessages(res.data.unread ?? 0);
      } catch { /* silent */ }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30_000);
    return () => clearInterval(interval);
  }, [user?.id]);

  // Clear unread dot when on /friends page
  const pathname = usePathname();
  useEffect(() => {
    if (pathname === '/friends') setUnreadMessages(0);
  }, [pathname]);

  const handleAcceptRequest = async (friendId: string) => {
    try {
      await api.put('/api/friends/manage', { userId: user?.id, friendId, action: 'accept' });
      loadPendingRequests();
      // Optionally notify the other user via socket (backend handles status broadcast)
    } catch (err) {
      console.error("Accept failed", err);
    }
  };

  const handleClearAll = async () => {
    setPendingRequests([]);
    setUnreadNotifications(0);
    // Logic to clear on backend if we had a notifications table, 
    // but for now we just handle pending friendships individually.
  };

  const handleSearch = async (val: string) => {
    setSearchQuery(val);
    if (val.trim().length > 2) {
      setIsSearching(true);
      try {
        const res = await api.get(`/api/friends/search?username=${val.replace('@', '')}&userId=${user?.id}`);
        setSearchResults(res.data);
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setIsSearching(false);
      }
    } else {
      setSearchResults([]);
    }
  };

  return (
    <header className="sticky top-0 z-[100] w-full bg-background/80 backdrop-blur-3xl border-b border-white/5">
      {/* Real-time Intel Toast */}
      <AnimatePresence>
        {currentToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 10, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] w-full max-w-sm"
          >
            <div className="mx-4 p-4 glass rounded-2xl border border-accent/20 shadow-[0_0_30px_rgba(99,102,241,0.2)] flex items-center gap-4 bg-background/60 backdrop-blur-xl">
              <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center text-accent shrink-0">
                <UserPlus size={20} />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-accent mb-1">New Neural Link</p>
                <p className="text-xs font-bold truncate pr-4">{currentToast.message}</p>
              </div>
              <button onClick={() => setCurrentToast(null)} className="text-text-soft hover:text-white transition-colors">
                <XCircle size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="px-4 lg:px-12 h-16 flex items-center justify-between gap-4">
        
        {/* MATCH/LOBBY MINIMAL HEADER */}
        {isMatchOrLobby ? (
          <>
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="flex items-center gap-2 group shrink-0" title="Return to Base">
                <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-accent/20 flex items-center justify-center border border-accent/30 group-hover:bg-accent/30 transition-all overflow-hidden">
                  <img src="/favicon.ico" alt="Samarpan" className="w-full h-full object-cover" />
                </div>
                <span className="hidden sm:block text-base lg:text-xl font-black tracking-tighter uppercase italic">SAMARPAN</span>
              </Link>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={toggleMute}
                className="p-2 lg:p-2.5 rounded-lg lg:rounded-xl bg-white/5 hover:bg-white/10 text-text-soft hover:text-white transition-all outline-none"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              
              <button 
                onClick={() => {
                  if (confirm("⚠️ CAUTION: Aborting the arena will forfeit all progress and XP. Are you sure you want to retreat?")) {
                    router.push('/dashboard');
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white transition-all font-black text-xs uppercase tracking-widest shadow-lg"
              >
                <ChevronLeft size={16} /> Retreat
              </button>
            </div>
          </>
        ) : (
          /* STANDARD FULL HEADER */
          <>
            {/* Left: Branding & Search */}
            <div className="flex items-center gap-2 lg:gap-8 flex-1">
          <div className="flex items-center gap-2">
            <button 
              onClick={onOpenMobileMenu}
              className="lg:hidden p-2 rounded-lg bg-white/5 text-text-soft hover:text-white transition-all active:scale-95"
            >
              <Menu size={20} />
            </button>
            <Link 
              href="/dashboard"
              className="p-2 rounded-lg bg-white/5 text-text-soft hover:text-accent hover:bg-accent/10 transition-all"
              title="Home Dashboard"
            >
              <BarChart size={20} />
            </Link>
          </div>
          
          <Link href="/dashboard" className="flex items-center gap-2 group shrink-0">
            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-accent/20 flex items-center justify-center border border-accent/30 group-hover:bg-accent/30 transition-all overflow-hidden">
              <img src="/favicon.ico" alt="Samarpan" className="w-full h-full object-cover" />
            </div>
            <span className="hidden sm:block text-base lg:text-xl font-black tracking-tighter uppercase italic">SAMARPAN</span>
          </Link>
          
          <div className="hidden lg:block h-6 w-px bg-white/5" />
          
          <div className="hidden md:flex items-center max-w-xs w-full relative" ref={searchRef}>
            <Search className="absolute left-3 text-text-soft" size={14} />
            <input 
              type="text" 
              placeholder="Search vault or @username..." 
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/5 rounded-xl py-1.5 pl-9 pr-4 text-xs focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 transition-all"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  router.push(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
                  setSearchResults([]);
                }
              }}
            />
            
            {/* Search Results Dropdown */}
            <AnimatePresence>
              {searchResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="absolute top-full left-0 w-full mt-2 glass rounded-2xl p-2 shadow-2xl border border-white/5 z-50 overflow-hidden"
                >
                  <p className="text-[10px] font-black uppercase tracking-widest text-text-soft px-3 py-2 border-b border-white/5 mb-1">Users Found</p>
                  <div className="max-h-60 overflow-y-auto custom-scrollbar">
                    {searchResults.map((u) => (
                      <div key={u.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-all group/user">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center overflow-hidden">
                            {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : <UserIcon size={12} />}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold leading-none">{u.name}</span>
                            <span className="text-[10px] text-text-soft">@{u.username}</span>
                          </div>
                        </div>
                        {u.status === 'accepted' ? (
                          <div className="flex items-center gap-1 text-emerald-500 text-[10px] font-black uppercase tracking-widest px-2">
                             <CheckCircle2 size={12} /> Allies
                          </div>
                        ) : u.status === 'pending' ? (
                          u.isRequester ? (
                            <div className="flex items-center gap-1 text-accent text-[10px] font-black uppercase tracking-widest px-2">
                               <UserCheck size={12} /> Sent
                            </div>
                          ) : (
                            <button 
                              onClick={() => handleAcceptRequest(u.id)}
                              className="flex items-center gap-1 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border border-emerald-500/20"
                            >
                               <CheckCircle2 size={12} /> Add Back
                            </button>
                          )
                        ) : (
                          <button 
                            onClick={async () => {
                              try {
                                await api.post('/api/friends/request', { userId: user?.id, friendId: u.id });
                                // Emit socket event for real-time alert
                                if (socket) socket.emit('friend_request', { senderId: user?.id, receiverId: u.id, senderName: user?.name });
                                // Refresh search results to show status change
                                const res = await api.get(`/api/friends/search?username=${searchQuery.replace('@', '')}&userId=${user?.id}`);
                                setSearchResults(res.data);
                              } catch (err) {
                                console.error("Friend request failed", err);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-accent/10 text-accent hover:bg-accent hover:text-white transition-all scale-90 group-hover:scale-100"
                            title="Add Friend"
                          >
                            <UserPlus size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Mobile Search Overlay */}
        <AnimatePresence>
          {isMobileSearchOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute inset-x-0 top-0 h-16 bg-background z-[110] flex items-center px-4 gap-3 lg:hidden"
            >
               <button onClick={() => { setIsMobileSearchOpen(false); setSearchResults([]); }} className="p-2 -ml-2 text-text-soft">
                  <ChevronLeft size={20} />
               </button>
               <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-soft" size={14} />
                  <input 
                    autoFocus
                    type="text" 
                    placeholder="Search vault or @username..." 
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-xs focus:outline-none focus:border-accent/40 transition-all font-bold"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && searchQuery.trim()) {
                        router.push(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
                        setIsMobileSearchOpen(false);
                        setSearchResults([]);
                      }
                    }}
                  />
                  {/* Results list... */}
                  <AnimatePresence>
                    {searchResults.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute top-full left-0 w-full mt-2 glass rounded-2xl p-2 shadow-2xl border border-white/5 z-50 max-h-[60vh] overflow-y-auto"
                      >
                         {searchResults.map((u) => (
                           <div key={u.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-all">
                              <div className="flex items-center gap-3" onClick={() => { router.push(`/profile/${u.username}`); setIsMobileSearchOpen(false); }}>
                                <div className="w-9 h-9 rounded-lg bg-accent/20 flex items-center justify-center overflow-hidden">
                                  {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : <UserIcon size={14} />}
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-xs font-bold leading-none">{u.name}</span>
                                  <span className="text-[10px] text-text-soft">@{u.username}</span>
                                </div>
                              </div>
                              {/* Actions copy-pasted from desktop search for consistency */}
                              {u.status === 'accepted' ? (
                                <CheckCircle2 size={16} className="text-emerald-500 mr-2" />
                              ) : u.status === 'pending' ? (
                                <UserCheck size={16} className="text-accent mr-2" />
                              ) : (
                                <button className="p-2 bg-accent/10 rounded-lg text-accent" onClick={async () => {
                                  await api.post('/api/friends/request', { userId: user?.id, friendId: u.id });
                                  if (socket) socket.emit('friend_request', { senderId: user?.id, receiverId: u.id, senderName: user?.name });
                                  setIsMobileSearchOpen(false);
                                }}>
                                  <UserPlus size={16} />
                                </button>
                              )}
                           </div>
                         ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
               </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Right: Actions & Identity */}
        <div className="flex items-center gap-2 lg:gap-4 font-bold uppercase tracking-tighter">
          {/* Mobile Search Trigger */}
          <button 
            onClick={() => setIsMobileSearchOpen(true)}
            className="md:hidden p-2 rounded-lg bg-white/5 hover:bg-white/10 text-text-soft transition-all"
            title="Search"
          >
            <Search size={18} />
          </button>

          <button 
            onClick={toggleMute}
            className="p-2 lg:p-2.5 rounded-lg lg:rounded-xl bg-white/5 hover:bg-white/10 text-text-soft hover:text-white transition-all outline-none"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          
          <Link
            href="/friends"
            className="p-2 lg:p-2.5 rounded-lg lg:rounded-xl bg-white/5 hover:bg-white/10 text-text-soft hover:text-white transition-all relative outline-none"
            title="Friends Hub"
          >
            <Users size={18} />
            {unreadMessages > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full shadow-[0_0_6px_rgba(239,68,68,0.9)] animate-pulse" />
            )}
          </Link>

          {/* Notification Bell — Real API-backed */}
          <NotificationBell />

          {/* ── Premium Button (only for free/unauthenticated users) ── */}
          {user && (user.plan === 'free' || !user.plan) && (
            <Link
              href="/pricing"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-md shadow-indigo-500/30 shrink-0"
            >
              <Sparkles size={11} />
              <span className="hidden md:inline">Go Pro</span>
            </Link>
          )}

          <div className="h-6 w-px bg-white/5" />

          {/* User Profile Hook */}
          <div className="relative" ref={dropdownRef}>
            {user ? (
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 lg:gap-3 p-1 rounded-xl lg:rounded-2xl hover:bg-white/5 transition-all outline-none group/profile"
              >
                <AvatarFrame
                  src={user?.avatar}
                  name={user?.name}
                  size="sm"
                  frame={(user as any)?.avatarFrame}
                  plan={user?.plan}
                  className="shrink-0"
                />
                
                <div className="hidden md:flex flex-col items-start leading-none gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black tracking-tight">{user?.name || 'Guest User'}</span>
                    {profileCompletion === 100 && <Shield size={10} className="text-emerald-400 fill-emerald-400/20" />}
                  </div>
                  <PlanBadge plan={user?.plan || 'free'} size="xs" />
                </div>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <Link 
                  href="/auth"
                  className="px-4 py-2 rounded-xl bg-accent text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                >
                  Join Arena
                </Link>
              </div>
            )}

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-56 glass rounded-2xl p-2 shadow-2xl overflow-hidden z-50 border border-white/5"
                >
                  <div className="px-3 py-3 border-b border-white/5 mb-1 bg-white/5 rounded-t-xl">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-bold text-sm text-white">{user?.name || 'Guest User'}</p>
                      <PlanBadge plan={user?.plan || 'free'} size="xs" />
                    </div>
                    <p className="text-[10px] text-text-soft truncate tracking-tight">{user?.email || 'Anonymous Session'}</p>
                  </div>

                  <div className="p-1 space-y-1">
                    <Link 
                      href={user?.email ? "/profile" : "/auth?redirect=/profile"}
                      onClick={() => setIsDropdownOpen(false)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm hover:bg-white/5 transition-all group/it"
                    >
                      <div className="flex items-center gap-3">
                        <BarChart size={16} className="text-white/60 group-hover/it:text-accent transition-colors" />
                        <span className="font-medium">My Performance</span>
                      </div>
                      {!user?.email && <Shield size={10} className="text-orange-400" />}
                    </Link>
                    
                    <Link 
                      href={user?.email ? "/settings" : "/auth?redirect=/settings"}
                      onClick={() => setIsDropdownOpen(false)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm hover:bg-white/5 transition-all group/it"
                    >
                      <div className="flex items-center gap-3">
                        <Settings size={16} className="text-white/60 group-hover/it:text-accent transition-colors" />
                        <span className="font-medium">Command Center</span>
                      </div>
                      {!user?.email && <Shield size={10} className="text-orange-400" />}
                    </Link>
                    
                    <div className="h-px bg-white/5 my-1 mx-2" />

                    {/* Billing link */}
                    <Link
                      href="/billing"
                      onClick={() => setIsDropdownOpen(false)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm hover:bg-white/5 transition-all group/it"
                    >
                      <div className="flex items-center gap-3">
                        <CreditCard size={16} className="text-white/60 group-hover/it:text-accent transition-colors" />
                        <span className="font-medium">Subscription</span>
                      </div>
                      <PlanBadge plan={user?.plan || 'free'} size="xs" showLabel={false} />
                    </Link>

                    <div className="h-px bg-white/5 my-1 mx-2" />
                    
                    <button 
                      onClick={logout}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm hover:bg-red-500/10 text-red-400 transition-all font-medium"
                    >
                      <LogOut size={16} />
                      <span>Terminate Session</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        </>
        )}
      </div>
    </header>
  );
};
