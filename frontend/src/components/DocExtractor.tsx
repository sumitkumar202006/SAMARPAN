'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileUp, X, Check, Trash2, ChevronDown, ChevronUp,
  Pencil, Save, AlertCircle, Loader2, ArrowRight, RotateCcw, FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/axios';
import { toast } from '@/lib/toast';

interface Question {
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

interface Props {
  /** Called when user confirms the (edited) question list — merges into manual editor */
  onImport: (questions: Question[]) => void;
}

type Step = 'upload' | 'extracting' | 'review' | 'done';

export default function DocExtractor({ onImport }: Props) {
  const [step, setStep]             = useState<Step>('upload');
  const [docFile, setDocFile]       = useState<File | null>(null);
  const [extracted, setExtracted]   = useState<Question[]>([]);
  const [editIdx, setEditIdx]       = useState<number | null>(null);
  const [expandIdx, setExpandIdx]   = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Inline edit buffer ──────────────────────────────────────────────────────
  const [draft, setDraft] = useState<Question | null>(null);

  const startEdit = (idx: number) => {
    setDraft({ ...extracted[idx] });
    setEditIdx(idx);
    setExpandIdx(idx);
  };

  const saveDraft = () => {
    if (editIdx === null || !draft) return;
    if (!draft.question.trim()) { toast.warn('Question text cannot be empty.'); return; }
    if (draft.options.some(o => !o.trim())) { toast.warn('All 4 options must be filled.'); return; }
    setExtracted(prev => prev.map((q, i) => i === editIdx ? draft : q));
    setDraft(null);
    setEditIdx(null);
  };

  const deleteQ = (idx: number) => {
    setExtracted(prev => prev.filter((_, i) => i !== idx));
    if (editIdx === idx) { setDraft(null); setEditIdx(null); }
  };

  // ── Extraction ──────────────────────────────────────────────────────────────
  const handleExtract = async () => {
    if (!docFile) { toast.warn('Please select a PDF or DOCX file.'); return; }
    setStep('extracting');
    try {
      const form = new FormData();
      form.append('doc', docFile);
      const res = await api.post('/api/ai/extract-quiz', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const qs: Question[] = (res.data.questions || []).map((q: any) => {
        const rawOpts: string[] = Array.isArray(q.options) ? q.options.map(String) : [];
        // Guarantee exactly 4 options — pad with empty strings if AI returned fewer
        const options = [...rawOpts, '', '', '', ''].slice(0, 4);
        const correctIndex = typeof q.correctIndex === 'number'
          ? Math.max(0, Math.min(3, q.correctIndex))
          : 0;
        return {
          question:    q.question    || '',
          options,
          correctIndex,
          explanation: q.explanation || '',
        };
      });
      if (qs.length === 0) {
        toast.warn('No questions found in the document. Check that it contains Q&A content.');
        setStep('upload');
        return;
      }
      setExtracted(qs);
      setStep('review');
    } catch (err: any) {
      const msg = err.response?.data?.details || err.response?.data?.error || err.message;
      toast.error(msg || 'Extraction failed. Try a different file.');
      setStep('upload');
    }
  };

  const handleImport = () => {
    if (extracted.length === 0) { toast.warn('No questions to import.'); return; }
    onImport(extracted);
    setStep('done');
    toast.success(`${extracted.length} question${extracted.length > 1 ? 's' : ''} imported into your editor!`);
  };

  const reset = () => {
    setStep('upload');
    setDocFile(null);
    setExtracted([]);
    setDraft(null);
    setEditIdx(null);
  };

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* ── STEP: Upload ──────────────────────────────────────────────────── */}
      {step === 'upload' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20">
            <AlertCircle size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-blue-300 leading-relaxed">
              Upload a <span className="font-black text-white">PDF or DOCX</span> that already has quiz questions written in it.
              The AI will extract them <strong>exactly as written</strong> so you can review and edit before saving.
              Works with any Q&A format (numbered, lettered, MCQ, etc.) — max 10 MB.
            </p>
          </div>

          <input ref={fileRef} type="file" accept=".pdf,.docx,.doc" className="hidden"
            onChange={(e) => setDocFile(e.target.files?.[0] || null)} />

          <button onClick={() => fileRef.current?.click()}
            className={cn(
              "w-full py-10 rounded-3xl border-2 border-dashed transition-all flex flex-col items-center gap-3 group",
              docFile
                ? "border-[#00D4B4]/50 bg-[#00D4B4]/5"
                : "border-white/10 hover:border-[#CC0000]/40 hover:bg-white/5"
            )}>
            <div className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center transition-all",
              docFile ? "bg-[#00D4B4]/20 text-[#00D4B4]" : "bg-white/5 text-text-soft group-hover:bg-[#CC0000]/10 group-hover:text-[#CC0000]"
            )}>
              <FileUp size={26} />
            </div>
            {docFile ? (
              <div className="text-center">
                <p className="text-sm font-black text-[#00D4B4]">{docFile.name}</p>
                <p className="text-[9px] text-text-soft mt-0.5">{(docFile.size / 1024).toFixed(0)} KB · Click to change</p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-sm font-black text-white">Click to select file</p>
                <p className="text-[9px] text-text-soft mt-0.5">PDF or DOCX · Max 10 MB</p>
              </div>
            )}
          </button>

          {docFile && (
            <div className="flex gap-3">
              <button onClick={() => setDocFile(null)}
                className="flex items-center gap-1.5 text-[9px] text-red-400 hover:text-red-300 transition-colors font-black uppercase tracking-widest">
                <X size={10} /> Remove
              </button>
            </div>
          )}

          <button
            onClick={handleExtract}
            disabled={!docFile}
            className="w-full py-5 bg-[#CC0000] font-black text-white text-xs uppercase tracking-[0.3em] rounded-3xl hover:scale-[1.02] transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:scale-100"
          >
            <FileText size={16} />
            Extract Questions from File
          </button>
        </motion.div>
      )}

      {/* ── STEP: Extracting ──────────────────────────────────────────────── */}
      {step === 'extracting' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="py-16 flex flex-col items-center gap-5 text-center">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full bg-[#CC0000]/10 animate-ping" />
            <div className="w-16 h-16 rounded-full bg-[#CC0000]/20 border border-[#CC0000]/30 flex items-center justify-center">
              <Loader2 size={28} className="text-[#CC0000] animate-spin" />
            </div>
          </div>
          <div>
            <p className="font-black text-white text-sm">Analysing document…</p>
            <p className="text-[10px] text-text-soft mt-1">Extracting questions, options and answers via AI</p>
          </div>
          <div className="flex gap-1.5">
            {[0, 1, 2].map(i => (
              <span key={i} className="w-1.5 h-1.5 rounded-full bg-[#CC0000] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </motion.div>
      )}

      {/* ── STEP: Review ──────────────────────────────────────────────────── */}
      {step === 'review' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black text-white">
                {extracted.length} question{extracted.length !== 1 ? 's' : ''} extracted
              </p>
              <p className="text-[9px] text-text-soft">Review, edit or delete before importing</p>
            </div>
            <button onClick={reset} className="flex items-center gap-1.5 text-[9px] text-text-soft hover:text-white transition-colors font-black uppercase tracking-widest">
              <RotateCcw size={10} /> New file
            </button>
          </div>

          {/* Question list */}
          <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
            <AnimatePresence>
              {extracted.map((q, idx) => (
                <motion.div key={idx}
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }}
                  transition={{ delay: idx * 0.03 }}
                  className={cn(
                    "rounded-2xl border transition-all overflow-hidden",
                    editIdx === idx
                      ? "border-[#CC0000]/40 bg-[#CC0000]/5"
                      : "border-white/5 bg-white/3 hover:bg-white/5"
                  )}
                >
                  {/* Card header */}
                  <div className="flex items-center gap-3 p-3 cursor-pointer"
                    onClick={() => setExpandIdx(expandIdx === idx ? null : idx)}>
                    <span className="w-6 h-6 rounded-lg bg-[#CC0000]/20 text-[#CC0000] text-[9px] font-black flex items-center justify-center flex-shrink-0">
                      {idx + 1}
                    </span>
                    <p className="flex-1 text-[11px] font-bold text-white leading-snug line-clamp-2">{q.question}</p>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="px-2 py-0.5 rounded-lg bg-[#00D4B4]/10 border border-[#00D4B4]/20 text-[#00D4B4] text-[8px] font-black uppercase">
                        {['A', 'B', 'C', 'D'][q.correctIndex] || '?'}
                      </span>
                      <button onClick={(e) => { e.stopPropagation(); startEdit(idx); }}
                        className="w-6 h-6 rounded-lg bg-white/5 hover:bg-[#CC0000]/20 hover:text-[#CC0000] flex items-center justify-center transition-all text-text-soft">
                        <Pencil size={10} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); deleteQ(idx); }}
                        className="w-6 h-6 rounded-lg bg-white/5 hover:bg-red-500/20 hover:text-red-400 flex items-center justify-center transition-all text-text-soft">
                        <Trash2 size={10} />
                      </button>
                      {expandIdx === idx ? <ChevronUp size={12} className="text-text-soft" /> : <ChevronDown size={12} className="text-text-soft" />}
                    </div>
                  </div>

                  {/* Expanded view / inline editor */}
                  <AnimatePresence>
                    {expandIdx === idx && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-3 pb-4 space-y-3 border-t border-white/5 pt-3">
                          {editIdx === idx && draft ? (
                            /* ── EDIT MODE ─────────────────────────────────── */
                            <div className="space-y-3">
                              <textarea
                                value={draft.question}
                                onChange={e => setDraft({ ...draft, question: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-[#CC0000]/60 transition-all resize-none min-h-[72px]"
                                placeholder="Question text…"
                              />
                              <div className="grid grid-cols-2 gap-2">
                                {draft.options.map((opt, oi) => (
                                  <div key={oi} className="flex gap-1.5">
                                    <button
                                      onClick={() => setDraft({ ...draft, correctIndex: oi })}
                                      className={cn(
                                        "w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-black transition-all flex-shrink-0",
                                        draft.correctIndex === oi
                                          ? "bg-[#00D4B4] text-white shadow-lg shadow-[#00D4B4]/20"
                                          : "bg-white/5 text-text-soft hover:bg-white/10"
                                      )}
                                    >
                                      {['A', 'B', 'C', 'D'][oi]}
                                    </button>
                                    <input
                                      value={opt}
                                      onChange={e => {
                                        const opts = [...draft.options];
                                        opts[oi] = e.target.value;
                                        setDraft({ ...draft, options: opts });
                                      }}
                                      className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-[10px] text-white outline-none focus:border-[#CC0000]/60 transition-all"
                                      placeholder={`Option ${['A', 'B', 'C', 'D'][oi]}`}
                                    />
                                  </div>
                                ))}
                              </div>
                              <textarea
                                value={draft.explanation || ''}
                                onChange={e => setDraft({ ...draft, explanation: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-[10px] text-text-soft outline-none focus:border-[#CC0000]/40 transition-all resize-none min-h-[48px]"
                                placeholder="Explanation (optional)…"
                              />
                              <div className="flex gap-2">
                                <button onClick={saveDraft}
                                  className="flex-1 py-2.5 rounded-xl bg-[#00D4B4] text-white font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5 hover:bg-emerald-600 transition-all">
                                  <Save size={11} /> Save
                                </button>
                                <button onClick={() => { setDraft(null); setEditIdx(null); }}
                                  className="px-4 py-2.5 rounded-xl bg-white/5 text-text-soft font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all">
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* ── READ MODE ─────────────────────────────────── */
                            <div className="space-y-2">
                              {q.options.map((opt, oi) => (
                                <div key={oi} className={cn(
                                  "flex items-center gap-2.5 px-3 py-2 rounded-xl text-[10px] transition-all",
                                  oi === q.correctIndex
                                    ? "bg-[#00D4B4]/10 border border-[#00D4B4]/20 text-emerald-300 font-black"
                                    : "bg-white/3 text-text-soft"
                                )}>
                                  <span className={cn(
                                    "w-5 h-5 rounded-md flex items-center justify-center text-[8px] font-black flex-shrink-0",
                                    oi === q.correctIndex ? "bg-[#00D4B4] text-white" : "bg-white/10 text-text-soft"
                                  )}>
                                    {oi === q.correctIndex ? <Check size={9} /> : ['A', 'B', 'C', 'D'][oi]}
                                  </span>
                                  {opt || <span className="opacity-30 italic">Empty option</span>}
                                </div>
                              ))}
                              {q.explanation && (
                                <p className="text-[9px] text-text-soft italic border-l-2 border-white/10 pl-3 mt-1">
                                  {q.explanation}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>

            {extracted.length === 0 && (
              <div className="py-8 text-center text-text-soft text-[10px]">
                All questions deleted. <button onClick={reset} className="text-[#CC0000] underline">Start over</button>
              </div>
            )}
          </div>

          {/* Import CTA */}
          {extracted.length > 0 && (
            <button onClick={handleImport}
              className="w-full py-5 bg-gradient-to-r from-[#CC0000] to-violet-500 font-black text-white text-xs uppercase tracking-[0.3em] rounded-3xl hover:scale-[1.02] transition-all shadow-xl flex items-center justify-center gap-3">
              <ArrowRight size={16} />
              Import {extracted.length} Question{extracted.length > 1 ? 's' : ''} into Editor
            </button>
          )}
        </motion.div>
      )}

      {/* ── STEP: Done ────────────────────────────────────────────────────── */}
      {step === 'done' && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="py-10 flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#00D4B4]/10 border border-[#00D4B4]/20 flex items-center justify-center text-[#00D4B4]">
            <Check size={28} />
          </div>
          <div>
            <p className="font-black text-white text-sm">Questions imported!</p>
            <p className="text-[10px] text-text-soft mt-1">They've been added to your manual editor above. Review and save.</p>
          </div>
          <button onClick={reset} className="flex items-center gap-1.5 text-[9px] text-[#CC0000] hover:text-red-300 transition-colors font-black uppercase tracking-widest">
            <RotateCcw size={10} /> Import another file
          </button>
        </motion.div>
      )}
    </div>
  );
}
