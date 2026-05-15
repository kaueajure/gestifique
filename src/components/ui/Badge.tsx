import React from "react";
import { cn } from "../../lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?:
    | "blue"
    | "emerald"
    | "amber"
    | "red"
    | "slate"
    | "indigo"
    | "orange"
    | "purple";
  className?: string;
}

export const Badge = ({
  children,
  variant = "slate",
  className,
  ...props
}: BadgeProps) => {
  const variants = {
    blue: "bg-blue-50 text-blue-700 border-blue-200/60",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
    amber: "bg-amber-50 text-amber-700 border-amber-200/60",
    red: "bg-red-50 text-red-700 border-red-200/60",
    slate: "bg-slate-100 text-slate-700 border-slate-200/60",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200/60",
    orange: "bg-orange-50 text-orange-700 border-orange-200/60",
    purple: "bg-purple-50 text-purple-700 border-purple-200/60",
  };

  return (
    <span
      className={cn(
        "px-2 py-0.5 rounded-md text-[11px] font-semibold tracking-wide border inline-flex items-center justify-center whitespace-nowrap",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
};
