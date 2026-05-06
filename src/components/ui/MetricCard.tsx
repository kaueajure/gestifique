import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: string;
    positive: boolean;
  };
  color?: 'blue' | 'emerald' | 'amber' | 'red' | 'slate' | 'indigo' | 'orange';
  loading?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({ label, value, icon, trend, color = 'blue', loading }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
    slate: 'bg-slate-50 text-slate-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm animate-pulse">
        <div className="flex justify-between items-start mb-4">
          <div className="w-10 h-10 rounded-2xl bg-slate-100"></div>
          <div className="w-12 h-4 bg-slate-100 rounded"></div>
        </div>
        <div className="w-24 h-8 bg-slate-100 rounded mb-2"></div>
        <div className="w-32 h-4 bg-slate-100 rounded"></div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 group"
    >
      <div className="flex justify-between items-start mb-4">
        <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110", colors[color])}>
          {icon}
        </div>
        {trend && (
          <div className={cn(
            "flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border",
            trend.positive ? "text-emerald-600 bg-emerald-50 border-emerald-100" : "text-red-600 bg-red-50 border-red-100"
          )}>
            {trend.positive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {trend.value}
          </div>
        )}
      </div>
      <div className="text-3xl font-black text-slate-900 tracking-tight mb-1">{value}</div>
      <div className="text-xs text-slate-400 font-medium">{label}</div>
    </motion.div>
  );
};
