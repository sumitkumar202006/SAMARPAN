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
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ label, icon, className, ...props }) => {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-bold uppercase tracking-widest text-text-soft ml-1">{label}</label>
      <div className="relative group">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-soft group-focus-within:text-accent transition-colors">
            {icon}
          </div>
        )}
        <input 
          className={cn(
            "w-full bg-bg-soft/50 border border-border-soft rounded-xl p-3 text-sm focus:outline-none focus:border-accent transition-all",
            icon && "pl-11",
            className
          )}
          {...props}
        />
      </div>
    </div>
  );
};
