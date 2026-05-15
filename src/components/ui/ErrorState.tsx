import React from "react";
import { cn } from "../../lib/utils";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "./Button";

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
  compact?: boolean;
}

export const ErrorState = ({
  title = "Ocorreu um erro",
  message,
  onRetry,
  className,
  compact,
}: ErrorStateProps) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "p-4" : "p-8",
        className,
      )}
    >
      <div
        className={cn(
          "bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-3",
          compact ? "w-8 h-8" : "w-10 h-10",
        )}
      >
        <AlertTriangle size={compact ? 16 : 20} />
      </div>
      <h3
        className={cn(
          "font-medium text-slate-800",
          compact ? "text-[13px] mb-0.5" : "text-sm mb-1",
        )}
      >
        {title}
      </h3>
      <p
        className={cn(
          "text-slate-500 max-w-sm",
          compact ? "text-[11px]" : "text-[13px]",
        )}
      >
        {message}
      </p>
      {onRetry && (
        <Button
          variant="outline"
          size={compact ? "xs" : "sm"}
          onClick={onRetry}
          className="mt-4 gap-1.5"
        >
          <RefreshCw size={12} />
          Tentar Novamente
        </Button>
      )}
    </div>
  );
};
