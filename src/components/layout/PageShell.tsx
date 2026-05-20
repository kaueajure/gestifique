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
  fixedHeight?: boolean;
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
  fixedHeight = true,
}: PageShellProps) {
  return (
    <section
      className={cn(
        "w-full overflow-hidden border border-slate-200/90 bg-white",
        "shadow-[0_8px_30px_rgba(15,23,42,0.08)] rounded-lg",
        fixedHeight && "h-full min-h-0 flex flex-col",
        className,
      )}
    >
      {(title || subtitle || actions) && (
        <header className="shrink-0 flex flex-col gap-4 border-b border-slate-200/70 px-5 py-4 sm:flex-row sm:items-start sm:justify-between bg-white">
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
            <div className="flex flex-wrap items-center gap-2">{actions}</div>
          )}
        </header>
      )}

      {tabs && (
        <div className="shrink-0 border-b border-slate-200/70 px-5 bg-white">
          {tabs}
        </div>
      )}

      <div
        className={cn(
          "min-h-0",
          fixedHeight && "flex-1 overflow-y-auto custom-scrollbar",
          flush ? "p-0" : "p-4 sm:p-5",
          "bg-white",
          contentClassName,
        )}
      >
        {children}
      </div>
    </section>
  );
}
