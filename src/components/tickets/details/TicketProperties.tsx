import React from 'react';
import { User, Ticket, TicketStatus, TicketPriority, TicketAttachment, TicketCustomField } from '../../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { User as UserIcon, Building2, Tag, Calendar, Trash2, Paperclip, Clock, AlertTriangle, CheckCircle2, XCircle, Activity } from 'lucide-react';
import { ConfirmDialog } from '../../ui/ConfirmDialog';
import { AttachmentList } from '../../ui/AttachmentList';
import { cn, formatRelativeTime } from '../../../lib/utils';
import { TicketTags } from '../TicketTags';
import { TicketCustomFields } from './TicketCustomFields';

interface TicketPropertiesProps {
  ticket: Ticket;
  currentUser: User;
  agents: User[];
  attachments: TicketAttachment[];
  onUpdate: (data: Partial<Ticket>) => void;
  onArchive: () => void;
  onUpdateTags?: (tags: string[]) => void;
  onUpdateCustomFields?: (fields: TicketCustomField[]) => void;
}

type SlaVariant = 'red' | 'amber' | 'blue' | 'emerald' | 'slate';

interface SlaInfo {
  label: string;
  description: string;
  deadlineLabel: string;
  variant: SlaVariant;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

export const TicketProperties = ({ 
  ticket, currentUser, agents, attachments, onUpdate, onArchive, 
  onUpdateTags, onUpdateCustomFields 
}: TicketPropertiesProps) => {
  const [isArchiveConfirmOpen, setIsArchiveConfirmOpen] = React.useState(false);

  const formatDate = (value: string | number | Date) => {
    const date = new Date(value);
    if (isNaN(date.getTime())) return 'Data inválida';
    return date.toLocaleDateString('pt-BR');
  };

  const formatDateTime = (value: string | number | Date) => {
    const date = new Date(value);
    if (isNaN(date.getTime())) return 'Data inválida';
    return date.toLocaleString('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short'
    });
  };

  const getStatusVariant = (status: string) => {
    const map: Record<string, string> = {
      aberto: 'blue', em_andamento: 'indigo', aguardando_cliente: 'amber', resolvido: 'emerald', fechado: 'slate'
    };
    return map[status] || 'slate';
  };

  const getPriorityVariant = (priority: string) => {
    const map: Record<string, string> = {
      baixa: 'blue', media: 'indigo', alta: 'orange', urgente: 'red'
    };
    return map[priority] || 'slate';
  };

  const formatDuration = (ms: number) => {
    const absMs = Math.abs(ms);
    const minutes = Math.floor(absMs / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}min`;
    return `${minutes}min`;
  };

  const getSlaInfo = (): SlaInfo | null => {
    if (!ticket.prazo_sla) return null;

    const deadline = new Date(ticket.prazo_sla).getTime();
    if (isNaN(deadline)) return null;

    const now = new Date().getTime();
    const isFinished = ['resolvido', 'fechado'].includes(ticket.status);

    if (!isFinished) {
      const diff = deadline - now;
      if (diff < 0) {
        return {
          label: 'SLA vencido',
          description: `Vencido há ${formatDuration(diff)}`,
          deadlineLabel: `Prazo: ${formatDateTime(deadline)}`,
          variant: 'red',
          icon: XCircle
        };
      } else if (diff < 2 * 60 * 60 * 1000) {
        return {
          label: 'Vence em breve',
          description: `Vence em ${formatDuration(diff)}`,
          deadlineLabel: `Prazo: ${formatDateTime(deadline)}`,
          variant: 'amber',
          icon: AlertTriangle
        };
      } else {
        return {
          label: 'Dentro do SLA',
          description: `Restam ${formatDuration(diff)}`,
          deadlineLabel: `Prazo: ${formatDateTime(deadline)}`,
          variant: 'blue',
          icon: Clock
        };
      }
    } else {
      const finishedAt = new Date(ticket.finalizado_em || ticket.updated_at).getTime();
      
      if (isNaN(finishedAt)) {
        return {
          label: 'SLA indisponível',
          description: 'Não foi possível calcular o encerramento',
          deadlineLabel: `Prazo era: ${formatDateTime(deadline)}`,
          variant: 'slate',
          icon: Clock
        };
      }

      const diff = deadline - finishedAt;
      if (diff >= 0) {
        return {
          label: 'Finalizado dentro do SLA',
          description: 'Concluído no prazo',
          deadlineLabel: `Prazo era: ${formatDateTime(deadline)}`,
          variant: 'emerald',
          icon: CheckCircle2
        };
      } else {
        return {
          label: 'Finalizado com atraso',
          description: `Atrasou ${formatDuration(diff)}`,
          deadlineLabel: `Prazo era: ${formatDateTime(deadline)}`,
          variant: 'red',
          icon: XCircle
        };
      }
    }
  };

  const slaInfo = getSlaInfo();

  const clienteNome = ticket.cliente_nome || 'Não informado';
  const empresaNome = ticket.empresa_nome || 'Empresa não vinculada';
  const origemLabel = ticket.origem || 'Não informado';

  const canManage = !!(currentUser.administrador || currentUser.desenvolvedor);

  return (
    <>
      <ConfirmDialog 
        isOpen={isArchiveConfirmOpen}
        onClose={() => setIsArchiveConfirmOpen(false)}
        onConfirm={() => {
            setIsArchiveConfirmOpen(false);
            onArchive();
        }}
        title="Arquivar Atendimento?"
        description="O atendimento será fechado e continuará disponível para consulta."
        confirmLabel="Arquivar"
        cancelLabel="Cancelar"
        variant="danger"
      />

      <Card>
          <CardHeader className="py-2.5 px-5 border-b border-slate-50">
             <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Propriedades</CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-6">
             {/* Status & Prioridade para Admin */}
             {canManage ? (
               <div className="space-y-4">
                  <div className="space-y-1.5">
                     <span className="text-xs font-semibold text-slate-500">Status</span>
                     <select 
                       value={ticket.status || 'aberto'}
                       onChange={(e) => onUpdate({ status: e.target.value as TicketStatus })}
                       className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer hover:bg-slate-50"
                     >
                        <option value="aberto">Aberto</option>
                        <option value="em_andamento">Em Andamento</option>
                        <option value="aguardando_cliente">Aguardando Cliente</option>
                        <option value="resolvido">Resolvido</option>
                        <option value="fechado">Fechado</option>
                     </select>
                  </div>
                  <div className="space-y-1.5">
                     <span className="text-xs font-semibold text-slate-500">Prioridade</span>
                     <select 
                       value={ticket.prioridade || 'media'}
                       onChange={(e) => onUpdate({ prioridade: e.target.value as TicketPriority })}
                       className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer hover:bg-slate-50"
                     >
                        <option value="baixa">Baixa</option>
                        <option value="media">Média</option>
                        <option value="alta">Alta</option>
                        <option value="urgente">Urgente</option>
                     </select>
                  </div>
                  <div className="space-y-1.5">
                     <span className="text-xs font-semibold text-slate-500">Responsável</span>
                     <select 
                       value={ticket.responsavel_id || ''}
                       onChange={(e) => onUpdate({ responsavel_id: e.target.value ? parseInt(e.target.value) : null })}
                       className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer hover:bg-slate-50"
                     >
                        <option value="">Sem responsável</option>
                        {agents.map(agent => (
                          <option key={agent.id} value={agent.id}>{agent.nome || 'Usuário'}</option>
                        ))}
                     </select>
                  </div>
               </div>
             ) : (
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                     <span className="text-xs font-semibold text-slate-500">Status</span>
                     <div className="pt-1">
                        <Badge variant={getStatusVariant(ticket.status || 'aberto') as any} className="uppercase text-[9px] font-bold border-none">{(ticket.status || 'aberto').replace('_', ' ')}</Badge>
                     </div>
                  </div>
                  <div className="space-y-1">
                     <span className="text-xs font-semibold text-slate-500">Prioridade</span>
                     <div className="pt-1">
                        <Badge variant={getPriorityVariant(ticket.prioridade || 'media') as any} className="uppercase text-[9px] font-bold border-none">{ticket.prioridade || 'media'}</Badge>
                     </div>
                  </div>
               </div>
             )}

             <div className="space-y-4 pt-4 border-t border-slate-50">
                {/* Tags Integration */}
                <div className="space-y-2">
                   <div className="flex items-center gap-2 mb-1">
                      <Tag size={12} className="text-slate-400" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Tags do Chamado</span>
                   </div>
                   <TicketTags 
                     tags={ticket.tags || []}
                     onAdd={(tag) => onUpdateTags?.([...(ticket.tags || []), tag])}
                     onRemove={(tag) => onUpdateTags?.((ticket.tags || []).filter(t => t !== tag))}
                     readOnly={!canManage}
                   />
                </div>

                <div className="space-y-2">
                   <span className="text-xs font-semibold text-slate-500">Solicitante</span>
                   <div className="flex items-center gap-3 bg-slate-50/50 p-2 rounded-lg border border-slate-100/50">
                      <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                         <UserIcon size={14} />
                      </div>
                      <div className="min-w-0">
                         <div className="text-xs font-bold text-slate-900 truncate">{clienteNome}</div>
                         <div className="text-[10px] font-medium text-slate-400 truncate mt-0.5">{ticket.cliente_email || 'Email não disponível'}</div>
                      </div>
                   </div>
                </div>

                <div className="space-y-2">
                   <span className="text-xs font-semibold text-slate-500">Empresa</span>
                   <div className="flex items-center gap-3">
                      <Building2 size={14} className="text-slate-300" />
                      <span className="text-xs font-bold text-slate-600 truncate">{empresaNome}</span>
                   </div>
                </div>

                <div className="space-y-2">
                   <span className="text-xs font-semibold text-slate-500">Origem</span>
                   <div className="flex items-center gap-3">
                      <Calendar size={14} className="text-slate-300" />
                      <span className="text-xs font-bold text-slate-600">{origemLabel}</span>
                   </div>
                </div>
             </div>

             {/* Custom Fields Integration */}
             <div className="pt-4 border-t border-slate-50">
                <TicketCustomFields 
                  fields={ticket.custom_fields || []}
                  onUpdate={onUpdateCustomFields || (() => {})}
                  readOnly={!canManage}
                />
             </div>

             <div className="space-y-3 pt-4 border-t border-slate-50">
                <div className="flex justify-between items-center text-xs font-medium">
                   <span className="text-slate-500">Aberto em</span>
                   <span className="text-slate-800 font-semibold">{formatDate(ticket.created_at)}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-medium">
                   <span className="text-slate-500">Atividade</span>
                   <span className="text-blue-600 font-bold flex items-center gap-1 uppercase tracking-tighter">
                     <Activity size={10} /> {formatRelativeTime(ticket.updated_at)}
                   </span>
                </div>
                {ticket.updated_at && ticket.updated_at !== ticket.created_at && (
                  <div className="flex justify-between items-center text-xs font-medium">
                     <span className="text-slate-500">Atualizado</span>
                     <span className="text-slate-800 font-semibold">{formatDate(ticket.updated_at)}</span>
                  </div>
                )}
                {['resolvido', 'fechado'].includes(ticket.status) && (ticket.finalizado_em || ticket.updated_at) && (
                  <div className="flex justify-between items-center text-xs font-medium">
                     <span className="text-slate-500">Finalizado</span>
                     <span className="text-slate-800 font-semibold">{formatDate(ticket.finalizado_em || ticket.updated_at)}</span>
                  </div>
                )}

                {slaInfo ? (
                  <div className={cn(
                    "mt-4 p-3 rounded-xl border flex flex-col gap-2 transition-all",
                    slaInfo.variant === 'red' && "bg-red-50/50 border-red-100",
                    slaInfo.variant === 'amber' && "bg-amber-50/50 border-amber-100",
                    slaInfo.variant === 'blue' && "bg-blue-50/50 border-blue-100",
                    slaInfo.variant === 'emerald' && "bg-emerald-50/50 border-emerald-100",
                    slaInfo.variant === 'slate' && "bg-slate-50/50 border-slate-200"
                  )}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Prazos e SLA</span>
                      <Badge variant={slaInfo.variant} className="text-[9px] px-1.5 py-0.5 border-none uppercase font-bold">
                        {slaInfo.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className={cn(
                         "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                         slaInfo.variant === 'red' && "bg-red-100 text-red-600",
                         slaInfo.variant === 'amber' && "bg-amber-100 text-amber-600",
                         slaInfo.variant === 'blue' && "bg-blue-100 text-blue-600",
                         slaInfo.variant === 'emerald' && "bg-emerald-100 text-emerald-600",
                         slaInfo.variant === 'slate' && "bg-slate-100 text-slate-500"
                       )}>
                          <slaInfo.icon size={14} />
                       </div>
                       <div className="min-w-0">
                          <div className={cn(
                            "text-xs font-bold truncate",
                            slaInfo.variant === 'red' && "text-red-700",
                            slaInfo.variant === 'amber' && "text-amber-700",
                            slaInfo.variant === 'blue' && "text-blue-700",
                            slaInfo.variant === 'emerald' && "text-emerald-700",
                            slaInfo.variant === 'slate' && "text-slate-600"
                          )}>
                            {slaInfo.description}
                          </div>
                          <div className="text-[10px] font-medium text-slate-400 truncate mt-0.5">
                            {slaInfo.deadlineLabel}
                          </div>
                       </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 p-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/30 flex items-center gap-3">
                    <Clock size={14} className="text-slate-300" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight italic">SLA não definido</span>
                  </div>
                )}
             </div>

             <Card className="mt-6 border-slate-200 border-dashed shadow-none bg-slate-50/20">
                <CardHeader className="py-2.5 px-5 border-b border-slate-100 flex flex-row items-center justify-between bg-white rounded-t-xl">
                   <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Arquivos do Chamado</CardTitle>
                   <Paperclip size={12} className="text-slate-300" />
                </CardHeader>
                <CardContent className="p-4">
                   {attachments.length === 0 ? (
                     <div className="text-center py-4">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight italic">Nenhum anexo</p>
                     </div>
                   ) : (
                     <AttachmentList 
                       attachments={attachments} 
                       compact 
                       className="gap-2"
                     />
                   )}
                </CardContent>
             </Card>

             {!!(currentUser.administrador || currentUser.desenvolvedor) && ticket.status !== 'fechado' && (
               <div className="pt-2">
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => setIsArchiveConfirmOpen(true)}
                    className="w-full h-9 border-slate-200 text-slate-400 hover:text-red-600 hover:bg-red-50 hover:border-red-100 transition-all text-[10px] font-bold uppercase tracking-widest rounded-lg"
                  >
                     <Trash2 size={12} className="mr-2" /> Arquivar Atendimento
                  </Button>
               </div>
             )}
          </CardContent>
       </Card>
    </>
  );
};
