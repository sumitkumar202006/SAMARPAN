'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  Pin, 
  Image as ImageIcon,
  Calendar,
  Tag,
  AlertCircle,
  CheckCircle2,
  X
} from 'lucide-react';
import api from '@/lib/axios';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

export default function NewsManagementPage() {
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'General',
    image: '',
    isPinned: false
  });

  useEffect(() => {
    fetchNews();
  }, []);

  async function fetchNews() {
    try {
      setLoading(true);
      const res = await api.get('/api/admin/news');
      setNews(res.data.news);
    } catch (err) {
      console.error("Failed to load news", err);
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.put(`/api/admin/news/${editingItem._id}`, formData);
      } else {
        await api.post('/api/admin/news', formData);
      }
      setShowCreateModal(false);
      setEditingItem(null);
      setFormData({ title: '', content: '', category: 'General', image: '', isPinned: false });
      fetchNews();
    } catch (err) {
      alert("Failed to save news item");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return;
    try {
      await api.delete(`/api/admin/news/${id}`);
      setNews(news.filter(n => n._id !== id));
    } catch (err) {
      alert("Failed to delete news");
    }
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      content: item.content,
      category: item.category,
      image: item.image || '',
      isPinned: item.isPinned
    });
    setShowCreateModal(true);
  };

  const filteredNews = news.filter(n => 
    n.title.toLowerCase().includes(search.toLowerCase()) || 
    n.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-1">Nexus Broadcasts</h1>
          <p className="text-text-soft text-sm">Managing global platform updates and intelligence reports.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-soft group-focus-within:text-accent transition-colors" />
            <input 
              type="text" 
              placeholder="Filter broadcasts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white/5 border border-white/5 rounded-2xl py-3 pl-12 pr-6 text-sm outline-none focus:ring-1 focus:ring-accent w-64 transition-all font-medium"
            />
          </div>
          <Button 
            onClick={() => {
              setEditingItem(null);
              setFormData({ title: '', content: '', category: 'General', image: '', isPinned: false });
              setShowCreateModal(true);
            }}
            className="rounded-2xl px-6 py-3 flex items-center gap-2 font-black uppercase tracking-widest text-[10px]"
          >
            <Plus size={16} />
            Dispatch Update
          </Button>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredNews.map((item, i) => (
            <motion.div 
              key={item._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.05 }}
              className="glass p-6 rounded-[32px] border-white/5 flex flex-col group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform pointer-events-none">
                 <Zap size={100} />
              </div>

              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-accent/10 border border-accent/20 text-accent">
                    {item.isPinned ? <Pin size={20} fill="currentColor" /> : <Zap size={20} />}
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-accent-alt mb-1 block">
                      {item.category}
                    </span>
                    <h3 className="text-xl font-black tracking-tight leading-none group-hover:text-accent transition-colors">
                      {item.title}
                    </h3>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleEdit(item)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-text-soft hover:text-white transition-all"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(item._id)}
                    className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all border border-red-500/10"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <p className="text-sm text-text-soft leading-relaxed flex-1 mb-6 line-clamp-3">
                {item.content}
              </p>

              <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-text-soft">
                    <Calendar size={12} className="text-accent" />
                    {new Date(item.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-text-soft">
                    <Tag size={12} className="text-accent-alt" />
                    {item.author?.name || 'System'}
                  </div>
                </div>
                {item.isPinned && (
                  <span className="px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-[9px] font-black uppercase tracking-widest text-accent">
                    Featured Update
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredNews.length === 0 && !loading && (
          <div className="col-span-full py-32 glass rounded-[40px] border-white/5 border-dashed flex flex-col items-center justify-center text-text-soft">
            <Zap size={48} className="opacity-10 mb-4" />
            <p className="text-sm font-bold uppercase tracking-widest opacity-30 italic">Silence on the network.</p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={() => setShowCreateModal(false)} />
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass max-w-2xl w-full p-8 rounded-[40px] border-white/5 relative z-10 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                      {editingItem ? <Edit3 size={24} /> : <Plus size={24} />}
                   </div>
                   <div>
                      <h2 className="text-2xl font-black tracking-tight">{editingItem ? 'Edit Protocol' : 'Deploy Update'}</h2>
                      <p className="text-xs text-text-soft font-medium">Broadcast new intelligence across the Nexus.</p>
                   </div>
                </div>
                <button onClick={() => setShowCreateModal(false)} className="p-2 rounded-xl hover:bg-white/5 text-text-soft transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <Input 
                    label="Announcement Title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="E.g., System Maintenance Level 2"
                    required
                  />
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-soft ml-2">Channel Category</label>
                    <select 
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full bg-background/20 border border-white/5 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-1 focus:ring-accent appearance-none cursor-pointer"
                    >
                      <option value="General">Global Broadcast</option>
                      <option value="Update">Patch Protocol</option>
                      <option value="Event">Arena Event</option>
                      <option value="Security">Security Notice</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-soft ml-2">Transmission Content</label>
                  <textarea 
                    value={formData.content}
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                    placeholder="Enter detailed intelligence report..."
                    className="w-full h-32 bg-background/20 border border-white/5 rounded-2xl p-4 text-sm font-medium outline-none focus:ring-1 focus:ring-accent resize-none"
                    required
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                   <div className="flex items-center gap-3">
                      <Pin size={18} className={cn(formData.isPinned ? "text-accent" : "text-text-soft")} />
                      <div>
                         <p className="text-xs font-black tracking-tight">Pin to Nexus Home</p>
                         <p className="text-[10px] text-text-soft">Priority broadcast status</p>
                      </div>
                   </div>
                   <button 
                      type="button"
                      onClick={() => setFormData({...formData, isPinned: !formData.isPinned})}
                      className={cn(
                        "w-12 h-6 rounded-full transition-all relative",
                        formData.isPinned ? "bg-accent shadow-[0_0_15px_rgba(99,102,241,0.4)]" : "bg-white/10"
                      )}
                   >
                       <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-all", formData.isPinned ? "left-7" : "left-1")} />
                   </button>
                </div>

                <div className="pt-4 flex gap-4">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest"
                  >
                    Abort Dispatch
                  </Button>
                  <Button 
                    type="submit"
                    className="flex-[2] py-4 text-xs font-black uppercase tracking-widest shadow-[0_0_20px_rgba(99,102,241,0.3)]"
                  >
                    Authorize Dispatch
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
