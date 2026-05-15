import React from "react";
import { cn } from "../../lib/utils";
import { FileQuestion, Inbox } from "lucide-react";
import { Button } from "./Button";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  compact?: boolean;
}

export const EmptyState = ({
  title,
  description,
  icon,
  action,
  className,
  compact,
}: EmptyStateProps) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "p-6" : "p-12",
        className,
      )}
    >
      <div
        className={cn(
          "bg-slate-50 rounded-full flex items-center justify-center text-slate-400 mb-3 border border-slate-100",
          compact ? "w-10 h-10" : "w-12 h-12",
        )}
      >
        {icon || (compact ? <FileQuestion size={18} /> : <Inbox size={24} />)}
      </div>
      <h3
        className={cn(
          "font-semibold text-slate-900 tracking-tight",
          compact ? "text-[13px] mb-0.5" : "text-sm mb-1",
        )}
      >
        {title}
      </h3>
      <p
        className={cn(
          "text-slate-500 max-w-[250px]",
          compact ? "text-[11px] leading-relaxed" : "text-xs leading-relaxed",
        )}
      >
        {description}
      </p>
      {action && (
        <Button
          variant="outline"
          size={compact ? "xs" : "sm"}
          onClick={action.onClick}
          className={cn("mt-4 text-slate-600", compact ? "" : "font-medium")}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
};
