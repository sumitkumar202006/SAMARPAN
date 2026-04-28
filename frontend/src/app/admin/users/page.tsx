'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Search, 
  Filter, 
  MoreVertical, 
  Ban, 
  ShieldCheck, 
  Mail, 
  History,
  Trash2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import api from '@/lib/axios';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export default function UserManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchUsers();
  }, [search, statusFilter]);

  async function fetchUsers() {
    try {
      setLoading(true);
      const res = await api.get('/api/admin/users', {
        params: { q: search, status: statusFilter === 'all' ? undefined : statusFilter }
      });
      setUsers(res.data.users);
    } catch (err) {
      console.error("Failed to load users", err);
    } finally {
      setLoading(false);
    }
  }

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'banned' : 'active';
    try {
      await api.put(`/api/admin/users/${userId}/status`, { status: newStatus });
      setUsers(users.map(u => u._id === userId ? { ...u, status: newStatus } : u));
    } catch (err) {
      alert("Failed to update status");
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-1">User Directory</h1>
          <p className="text-text-soft text-sm">Managing {users.length} active arena subjects.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-soft group-focus-within:text-accent transition-colors" />
            <input 
              type="text" 
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white/5 border border-white/5 rounded-2xl py-3 pl-12 pr-6 text-sm outline-none focus:ring-1 focus:ring-accent w-64 lg:w-80 transition-all font-medium"
            />
          </div>
          
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white/5 border border-white/5 rounded-2xl p-3 text-sm font-bold uppercase tracking-widest outline-none focus:ring-1 focus:ring-accent cursor-pointer"
          >
            <option value="all">Total Population</option>
            <option value="active">Active Verified</option>
            <option value="banned">Banned/Blacklisted</option>
          </select>
        </div>
      </div>

      {/* User Table Card */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-[40px] border-white/5 overflow-hidden shadow-2xl"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-text-soft">User Profile</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-text-soft">Specialization</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-text-soft">Global Rating</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-text-soft">Status</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-text-soft text-right">Directives</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <AnimatePresence mode="popLayout">
                {users.map((user) => (
                  <motion.tr 
                    key={user._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="hover:bg-white/[0.02] transition-all group"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-accent/20 to-accent-alt/20 flex items-center justify-center font-black text-white border border-white/5">
                          {user.avatar ? (
                            <img src={user.avatar} className="w-full h-full object-cover rounded-2xl" />
                          ) : (
                            user.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-black tracking-tight">{user.name}</span>
                          <span className="text-[10px] text-text-soft font-bold flex items-center gap-1">
                            <Mail size={10} />
                            {user.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                       <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-white/5 border border-white/5 text-text-soft group-hover:text-accent transition-colors">
                         {user.preferredField || 'Generalist'}
                       </span>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-2">
                         <ShieldCheck size={14} className="text-accent" />
                         <span className="font-black text-lg tracking-tighter">{user.globalRating}</span>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className={cn(
                         "inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                         user.status === 'active' ? "bg-[#00D4B4]/10 text-[#00D4B4]" : "bg-red-500/10 text-red-400"
                       )}>
                         <div className={cn("w-1.5 h-1.5 rounded-full", user.status === 'active' ? "bg-[#00D4B4]" : "bg-red-400")} />
                         {user.status}
                       </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className={cn(
                              "rounded-xl border-white/5",
                              user.status === 'active' ? "hover:border-red-500/30 hover:text-red-400" : "hover:border-[#00D4B4]/30 hover:text-[#00D4B4]"
                            )}
                            onClick={() => handleToggleStatus(user._id, user.status)}
                          >
                            {user.status === 'active' ? <Ban size={14} /> : <ShieldCheck size={14} />}
                            {user.status === 'active' ? 'Ban User' : 'Revoke Ban'}
                          </Button>
                          <Button variant="ghost" size="sm" className="rounded-xl p-2 hover:bg-red-500/10 hover:text-red-400 transition-colors">
                             <Trash2 size={16} />
                          </Button>
                       </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer */}
        <div className="p-6 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
           <p className="text-[10px] font-bold text-text-soft uppercase tracking-widest">Showing {users.length} results of total population</p>
           <div className="flex gap-2">
              <Button variant="outline" size="sm" className="w-10 h-10 p-0 rounded-xl border-white/5 opacity-50"><ChevronLeft size={16}/></Button>
              <Button variant="outline" size="sm" className="w-10 h-10 p-0 rounded-xl border-white/5"><ChevronRight size={16}/></Button>
           </div>
        </div>
      </motion.div>
    </div>
  );
}
