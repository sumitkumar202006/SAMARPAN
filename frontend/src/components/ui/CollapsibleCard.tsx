'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CollapsibleCardProps {
  title: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  isDefaultExpanded?: boolean;
  className?: string;
  headerAction?: React.ReactNode;
  badge?: string;
}

export const CollapsibleCard: React.FC<CollapsibleCardProps> = ({
  title,
  icon: Icon,
  children,
  isDefaultExpanded = true,
  className,
  headerAction,
  badge
}) => {
  const [isExpanded, setIsExpanded] = useState(isDefaultExpanded);

  return (
    <div className={cn(
      "glass rounded-[32px] overflow-hidden border-white/5 transition-all duration-500",
      className
    )}>
      {/* Header */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-8 py-6 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-4">
          {Icon && (
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
              <Icon size={20} />
            </div>
          )}
          <div>
            <div className="flex items-center gap-3">
              <h3 className="font-black text-lg tracking-tight uppercase italic">{title}</h3>
              {badge && (
                <span className="px-2 py-0.5 rounded-full bg-accent/20 text-accent text-[8px] font-black uppercase tracking-widest border border-accent/20">
                  {badge}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {headerAction && <div onClick={(e) => e.stopPropagation()}>{headerAction}</div>}
          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-text-soft transition-all group-hover:bg-white/10">
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
          >
            <div className="px-8 pb-8 pt-2">
              <div className="h-px w-full bg-gradient-to-r from-transparent via-white/5 to-transparent mb-6" />
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
