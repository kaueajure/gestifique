import React from 'react';
import { cn } from '../../lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: 'blue' | 'emerald' | 'amber' | 'red' | 'slate' | 'indigo' | 'orange';
  className?: string;
}

export const Badge = ({ children, variant = 'slate', className, ...props }: BadgeProps) => {
  const variants = {
    blue: 'bg-blue-50/50 text-blue-700 border-blue-100/50',
    emerald: 'bg-emerald-50/50 text-emerald-700 border-emerald-100/50',
    amber: 'bg-amber-50/50 text-amber-700 border-amber-100/50',
    red: 'bg-red-50/50 text-red-700 border-red-100/50',
    slate: 'bg-slate-50/50 text-slate-600 border-slate-200/50',
    indigo: 'bg-indigo-50/50 text-indigo-700 border-indigo-100/50',
    orange: 'bg-orange-50/50 text-orange-700 border-orange-100/50',
  };

  return (
    <span 
      className={cn(
        "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border inline-flex items-center justify-center transition-all",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
