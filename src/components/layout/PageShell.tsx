import React from "react";
import { cn } from "../../lib/utils";

interface PageShellProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  tabs?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  flush?: boolean;
}

export function PageShell({
  title,
  subtitle,
  actions,
  tabs,
  children,
  className,
  contentClassName,
  flush = false,
}: PageShellProps) {
  return (
    <section
      className={cn(
        "w-full rounded-xl border border-slate-200/80 bg-white shadow-sm overflow-hidden",
        className
      )}
    >
      {(title || subtitle || actions) && (
        <header className="flex flex-col gap-4 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-start sm:justify-between bg-white">
          <div>
            {title && (
              <h1 className="text-xl font-bold tracking-tight text-slate-950">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="mt-1 text-sm font-medium text-slate-500">
                {subtitle}
              </p>
            )}
          </div>

          {actions && (
            <div className="flex flex-wrap items-center gap-2">
              {actions}
            </div>
          )}
        </header>
      )}

      {tabs && (
        <div className="border-b border-slate-100 px-5 bg-white">
          {tabs}
        </div>
      )}

      <div
        className={cn(
          flush ? "p-0" : "p-4 sm:p-5",
          "bg-white",
          contentClassName
        )}
      >
        {children}
      </div>
    </section>
  );
}
