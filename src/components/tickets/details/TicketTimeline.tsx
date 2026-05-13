import React from 'react';
import { TicketTimelineItem } from '../../../types';
import { 
  PlusCircle, 
  MessageCircle, 
  Lock, 
  RefreshCw, 
  UserCheck, 
  Paperclip, 
  CheckCircle,
  Activity,
  History
} from 'lucide-react';
import { cn, formatRelativeTime } from '../../../lib/utils';

interface TicketTimelineProps {
  timeline: TicketTimelineItem[];
  loading?: boolean;
}

const getIcon = (iconName?: string) => {
  switch (iconName) {
    case 'plus-circle': return PlusCircle;
    case 'message-circle': return MessageCircle;
    case 'lock': return Lock;
    case 'refresh-cw': return RefreshCw;
    case 'user-check': return UserCheck;
    case 'paperclip': return Paperclip;
    case 'check-circle': return CheckCircle;
    default: return Activity;
  }
};

const getEventColor = (type: string) => {
  switch (type) {
    case 'creation': return 'text-blue-500 bg-blue-50 border-blue-100';
    case 'response': return 'text-slate-500 bg-slate-50 border-slate-100';
    case 'internal_note': return 'text-amber-500 bg-amber-50 border-amber-100';
    case 'completion': return 'text-emerald-500 bg-emerald-50 border-emerald-100';
    case 'system': return 'text-indigo-500 bg-indigo-50 border-indigo-100';
    default: return 'text-slate-400 bg-slate-50 border-slate-100';
  }
};

export const TicketTimeline = ({ timeline, loading }: TicketTimelineProps) => {
  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <RefreshCw size={24} className="text-blue-500 animate-spin" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Carregando linha do tempo...</p>
      </div>
    );
  }

  if (timeline.length === 0) {
    return (
      <div className="py-20 text-center flex flex-col items-center">
        <div className="w-12 h-12 bg-slate-50 text-slate-200 rounded-xl flex items-center justify-center mb-3 border border-slate-100">
          <History size={24} />
        </div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nenhuma atividade registrada.</p>
      </div>
    );
  }

  return (
    <div className="p-6 relative">
      {/* Vertical Line */}
      <div className="absolute left-[33px] top-6 bottom-6 w-px bg-slate-100" />
      
      <div className="space-y-8 relative">
        {timeline.map((item, index) => {
          const Icon = getIcon(item.icon);
          const colorClasses = getEventColor(item.type);
          
          return (
            <div key={index} className="flex gap-4 group">
              <div className={cn(
                "w-9 h-9 rounded-full border flex items-center justify-center shrink-0 z-10 transition-transform group-hover:scale-110",
                colorClasses
              )}>
                <Icon size={16} />
              </div>
              
              <div className="flex-1 pt-1.5">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{item.author}</span>
                    <span className="text-[10px] font-medium text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                      {item.type === 'internal_note' ? 'Nota Interna' : 
                       item.type === 'system' ? 'Sistema' : 
                       item.type === 'response' ? 'Resposta' : 
                       item.type === 'creation' ? 'Abertura' : 'Finalização'}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight" title={new Date(item.date).toLocaleString()}>
                    {formatRelativeTime(item.date)}
                  </span>
                </div>
                
                <div className={cn(
                  "text-sm font-medium leading-relaxed",
                  item.type === 'internal_note' ? "text-amber-800" : "text-slate-600"
                )}>
                  {item.description}
                </div>
                
                {item.action && (
                   <div className="mt-1 text-[10px] font-bold text-blue-500 uppercase tracking-widest">
                     {item.action}
                   </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
