import React from 'react';
import { cn } from '../../lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const PageHeader = ({ title, description, action, className }: PageHeaderProps) => {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6", className)}>
      <div>
        <h1 className="text-xl font-semibold text-slate-900 tracking-tight">{title}</h1>
        {description && (
          <p className="text-sm text-slate-500 font-medium mt-1">{description}</p>
        )}
      </div>
      {action && (
        <div className="flex items-center gap-2">
          {action}
        </div>
      )}
    </div>
  );
};

export const SectionTitle = ({ title, className }: { title: string; className?: string }) => (
  <h2 className={cn("text-base font-semibold text-slate-900 mb-4", className)}>
    {title}
  </h2>
);
