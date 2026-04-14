'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit3, Check, X, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface HostQuestionEditorProps {
  questions: any[];
  onSave: (updatedQuestions: any[]) => void;
  onClose: () => void;
}

export const HostQuestionEditor: React.FC<HostQuestionEditorProps> = ({ questions, onSave, onClose }) => {
  const [editedQuestions, setEditedQuestions] = useState([...questions]);
  const [editIndex, setEditIndex] = useState<number | null>(null);

  const handleUpdateQuestion = (index: number, field: string, value: any) => {
    const next = [...editedQuestions];
    next[index] = { ...next[index], [field]: value };
    setEditedQuestions(next);
  };

  const handleUpdateOption = (qIndex: number, oIndex: number, value: string) => {
    const next = [...editedQuestions];
    const newOptions = [...next[qIndex].options];
    newOptions[oIndex] = value;
    next[qIndex] = { ...next[qIndex], options: newOptions };
    setEditedQuestions(next);
  };

  const handleRemoveQuestion = (index: number) => {
    if (editedQuestions.length <= 1) return;
    setEditedQuestions(editedQuestions.filter((_, i) => i !== index));
    if (editIndex === index) setEditIndex(null);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-4xl glass max-h-[90vh] flex flex-col rounded-[32px] overflow-hidden border-accent/20 shadow-2xl"
      >
        {/* Header */}
        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-accent/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center text-accent">
              <Edit3 size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight">Content Forge</h2>
              <p className="text-text-soft text-[10px] font-bold uppercase tracking-widest">In-Memory Session Patching</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 rounded-xl hover:bg-white/5 text-text-soft transition-all">
            <X size={24} />
          </button>
        </div>

        {/* Question List */}
        <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar">
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 mb-6">
            <AlertTriangle size={18} />
            <p className="text-xs font-bold leading-relaxed">
              Modifying content here only affects this specific live session. The original quiz template remains unchanged.
            </p>
          </div>

          {editedQuestions.map((q, qIdx) => (
            <div key={qIdx} className={cn(
              "p-6 rounded-2xl border transition-all",
              editIndex === qIdx ? "bg-accent/5 border-accent/30 shadow-lg" : "bg-white/5 border-white/5 hover:border-white/10"
            )}>
              {editIndex === qIdx ? (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-soft flex items-center justify-between">
                      Question Text
                      <span className="text-accent underline cursor-pointer" onClick={() => setEditIndex(null)}>Save Draft</span>
                    </label>
                    <textarea 
                      className="w-full bg-background/50 border border-white/10 rounded-xl p-4 text-sm focus:outline-none focus:border-accent transition-all min-h-[80px]"
                      value={q.question}
                      onChange={(e) => handleUpdateQuestion(qIdx, 'question', e.target.value)}
                    />
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    {q.options.map((opt: string, oIdx: number) => (
                      <div key={oIdx} className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-soft flex items-center justify-between">
                          Option {String.fromCharCode(65 + oIdx)}
                          <input 
                            type="radio" 
                            name={`correct-${qIdx}`} 
                            checked={q.correctIndex === oIdx}
                            onChange={() => handleUpdateQuestion(qIdx, 'correctIndex', oIdx)}
                            className="accent-accent-alt"
                          />
                        </label>
                        <input 
                          type="text" 
                          className="w-full bg-background/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent transition-all"
                          value={opt}
                          onChange={(e) => handleUpdateOption(qIdx, oIdx, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                     <Button size="sm" variant="ghost" onClick={() => handleRemoveQuestion(qIdx)} className="text-red-400 hover:bg-red-500/10 gap-2">
                        <Trash2 size={14} /> Remove
                     </Button>
                     <Button size="sm" onClick={() => setEditIndex(null)} className="gap-2">
                        <Check size={14} /> Update Question
                     </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-6">
                   <div className="flex-1">
                      <span className="text-[10px] font-black tracking-widest text-accent-alt uppercase block mb-1">Question {qIdx + 1}</span>
                      <p className="font-bold text-sm line-clamp-1">{q.question}</p>
                   </div>
                   <div className="flex items-center gap-3">
                      <button onClick={() => setEditIndex(qIdx)} className="p-2 rounded-lg hover:bg-white/5 text-text-soft transition-all">
                        <Edit3 size={18} />
                      </button>
                      <button onClick={() => handleRemoveQuestion(qIdx)} className="p-2 rounded-lg hover:bg-red-500/10 text-red-400/50 hover:text-red-400 transition-all">
                        <Trash2 size={18} />
                      </button>
                   </div>
                </div>
              )}
            </div>
          ))}

          <Button 
            variant="outline" 
            className="w-full border-dashed border-white/10 hover:border-accent/40 bg-transparent py-8 gap-3 text-text-soft hover:text-accent"
            onClick={() => {
              setEditedQuestions([...editedQuestions, { question: 'New Question', options: ['A', 'B', 'C', 'D'], correctIndex: 0 }]);
              setEditIndex(editedQuestions.length);
            }}
          >
            <Plus size={20} /> Add Next Tactical Query
          </Button>
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-white/5 flex justify-end gap-4 bg-background/50">
           <Button variant="ghost" onClick={onClose} className="hover:bg-white/5">Cancel Changes</Button>
           <Button onClick={() => onSave(editedQuestions)} className="px-10 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
             Save Session Patch
           </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};
