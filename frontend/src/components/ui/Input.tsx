import React from 'react';
import { cn } from '@/lib/utils';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
}

export const Select: React.FC<SelectProps> = ({ label, className, children, ...props }) => {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-bold uppercase tracking-widest text-text-soft ml-1">{label}</label>
      <select 
        className={cn(
          "bg-bg-soft/50 border border-border-soft rounded-xl p-3 text-sm focus:outline-none focus:border-accent transition-all appearance-none cursor-pointer",
          className
        )}
        {...props}
      >
        {children}
      </select>
    </div>
  );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const Input: React.FC<InputProps> = ({ label, className, ...props }) => {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-bold uppercase tracking-widest text-text-soft ml-1">{label}</label>
      <input 
        className={cn(
          "bg-bg-soft/50 border border-border-soft rounded-xl p-3 text-sm focus:outline-none focus:border-accent transition-all",
          className
        )}
        {...props}
      />
    </div>
  );
};
