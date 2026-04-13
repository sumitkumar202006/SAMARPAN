import React from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, description, className }) => {
  return (
    <div className={cn("glass p-6 rounded-2xl flex flex-col gap-2", className)}>
      <h4 className="text-xs font-bold uppercase tracking-widest text-text-soft">{title}</h4>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-xs text-text-soft">{description}</p>
    </div>
  );
};
