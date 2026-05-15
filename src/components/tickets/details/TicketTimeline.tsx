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
  History,
  Tag,
  Settings,
  ArrowUpCircle,
  FileText,
  Clock,
  ShieldCheck,
  RotateCcw,
  Zap
} from 'lucide-react';
import { cn, formatRelativeTime } from '../../../lib/utils';

interface TicketTimelineProps {
  timeline: TicketTimelineItem[];
  loading?: boolean;
}

const getIcon = (type: string) => {
  switch (type) {
    case 'creation': return History;
    case 'response': return MessageCircle;
    case 'internal_note': return Lock;
    case 'completion': return CheckCircle;
    case 'reopen': return RotateCcw;
    case 'system': return ShieldCheck;
    case 'tag_change': return Tag;
    case 'custom_field': return FileText;
    default: return Activity;
  }
};

const getEventColor = (type: string) => {
  switch (type) {
    case 'creation': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    case 'response': return 'bg-blue-50 text-blue-600 border-blue-100/50';
    case 'internal_note': return 'bg-amber-50 text-amber-600 border-amber-100/50';
    case 'completion': return 'bg-slate-900 text-white border-slate-900';
    case 'reopen': return 'bg-orange-50 text-orange-600 border-orange-100';
    case 'system': return 'bg-slate-50 text-slate-500 border-slate-100';
    case 'tag_change': return 'bg-rose-50 text-rose-600 border-rose-100';
    case 'custom_field': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
    default: return 'bg-slate-50 text-slate-400 border-slate-100';
  }
};

export const TicketTimeline = ({ timeline, loading }: TicketTimelineProps) => {
  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
           <RefreshCw size={24} className="text-blue-500 animate-spin" />
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Carregando histórico...</p>
      </div>
    );
  }

  if (!timeline || timeline.length === 0) {
    return (
      <div className="py-20 text-center flex flex-col items-center">
        <div className="w-16 h-16 bg-slate-50 text-slate-200 rounded-[2rem] flex items-center justify-center mb-6 border border-slate-100 shadow-sm">
          <History size={32} />
        </div>
        <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-1">Timeline Vazia</h4>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Nenhuma atividade registrada neste ticket.</p>
      </div>
    );
  }

  return (
    <div className="relative pl-5">
      {/* Vertical Track */}
      <div className="absolute left-[9px] top-4 bottom-4 w-px bg-slate-100" />
      
      <div className="space-y-4 relative">
        {timeline.map((item, index) => {
          const Icon = getIcon(item.type);
          const colorClasses = getEventColor(item.type);
          const date = new Date(item.date);
          
          return (
            <div key={index} className="relative group animate-in fade-in slide-in-from-left-4 duration-500">
              {/* Event Marker */}
              <div className={cn(
                "absolute -left-[24px] top-1 w-5 h-5 rounded-md border-2 border-white shadow-sm flex items-center justify-center z-10 transition-transform group-hover:scale-110",
                colorClasses
              )}>
                <Icon size={10} />
              </div>
              
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-slate-800 tracking-tight">
                       {item.type === 'internal_note' ? 'Nota Interna' : 
                        item.type === 'system' ? 'Sistema' : 
                        item.type === 'response' ? 'Resposta' : 
                        item.type === 'creation' ? 'Abertura' : 
                        item.type === 'reopen' ? 'Reabertura' :
                        item.type === 'tag_change' ? 'Tags' :
                        item.type === 'custom_field' ? 'Campo Extra' : 'Conclusão'}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                    <span className="text-[10px] font-medium text-slate-500">
                       {item.author}
                    </span>
                  </div>
                  <time className="text-[10px] font-medium text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded-sm border border-slate-100 shrink-0">
                    {date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </time>
                </div>
                
                <div className={cn(
                  "text-xs font-medium leading-relaxed pr-4",
                  item.type === 'internal_note' ? "text-amber-700 italic" : "text-slate-600"
                )}>
                  {item.description}
                </div>
                
                {item.action && (
                   <div className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 w-fit">
                     <Zap size={10} />
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
