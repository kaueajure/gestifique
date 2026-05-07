import React from 'react';
import { cn } from '../../lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from './Card';

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
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    red: 'bg-red-50 text-red-600 border-red-100',
    slate: 'bg-slate-50 text-slate-600 border-slate-200',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    orange: 'bg-orange-50 text-orange-700 border-orange-100',
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-5">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg bg-slate-100"></div>
            <div className="w-12 h-4 bg-slate-100 rounded"></div>
          </div>
          <div className="w-24 h-8 bg-slate-100 rounded mb-2"></div>
          <div className="w-32 h-4 bg-slate-100 rounded"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:border-slate-300 transition-colors">
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-3">
          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center border", colors[color])}>
            {icon}
          </div>
          {trend && (
            <div className={cn(
              "flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full border",
              trend.positive ? "text-emerald-700 bg-emerald-50 border-emerald-100" : "text-red-700 bg-red-50 border-red-100"
            )}>
              {trend.positive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
              {trend.value}
            </div>
          )}
        </div>
        <div>
          <div className="text-2xl font-semibold text-slate-950 tracking-tight leading-none mb-2">{value}</div>
          <div className="text-xs text-slate-500 font-medium">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
};
