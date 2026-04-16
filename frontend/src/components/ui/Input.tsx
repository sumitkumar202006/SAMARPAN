import React from 'react';
import { cn } from '@/lib/utils';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  icon?: React.ReactNode;
}

export const Select: React.FC<SelectProps> = ({ label, icon, className, children, ...props }) => {
  return (
    <div className="flex flex-col gap-2">
      {label && <label className="text-xs font-bold uppercase tracking-widest text-text-soft ml-1">{label}</label>}
      <div className="relative group">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-soft group-focus-within:text-accent transition-colors">
            {icon}
          </div>
        )}
        <select 
          className={cn(
            "w-full bg-bg-soft/50 border border-border-soft rounded-xl p-3 text-sm focus:outline-none focus:border-accent transition-all appearance-none cursor-pointer",
            icon && "pl-11",
            className
          )}
          {...props}
        >
          {children}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-soft">
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    </div>
  );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ label, icon, className, ...props }) => {
  return (
    <div className="flex flex-col gap-2">
      {label && <label className="text-xs font-bold uppercase tracking-widest text-text-soft ml-1">{label}</label>}
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
