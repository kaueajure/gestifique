import React from 'react';
import { User, Ticket, TicketStatus, TicketPriority, TicketAttachment, TicketCustomField } from '../../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { User as UserIcon, Building2, Tag, Calendar, Trash2, Paperclip, Clock, AlertTriangle, CheckCircle2, XCircle, Activity, ChevronDown, ChevronRight } from 'lucide-react';
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
  const [openSections, setOpenSections] = React.useState<Record<string, boolean>>({
    customer: true,
    tags: true,
    custom: true,
    history: false,
    attachments: false
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

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
          label: 'Vencido',
          description: `Há ${formatDuration(diff)}`,
          deadlineLabel: `Prazo: ${formatDateTime(deadline)}`,
          variant: 'red',
          icon: XCircle
        };
      } else if (diff < 2 * 60 * 60 * 1000) {
        return {
          label: 'Breve',
          description: `Em ${formatDuration(diff)}`,
          deadlineLabel: `Prazo: ${formatDateTime(deadline)}`,
          variant: 'amber',
          icon: AlertTriangle
        };
      } else {
        return {
          label: 'No Prazo',
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
          label: 'Indisponível',
          description: 'Calculo falhou',
          deadlineLabel: `Prazo: ${formatDateTime(deadline)}`,
          variant: 'slate',
          icon: Clock
        };
      }

      const diff = deadline - finishedAt;
      if (diff >= 0) {
        return {
          label: 'OK',
          description: 'No prazo',
          deadlineLabel: `Prazo: ${formatDateTime(deadline)}`,
          variant: 'emerald',
          icon: CheckCircle2
        };
      } else {
        return {
          label: 'Atrasado',
          description: `${formatDuration(diff)}`,
          deadlineLabel: `Prazo era: ${formatDateTime(deadline)}`,
          variant: 'red',
          icon: XCircle
        };
      }
    }
  };

  const slaInfo = getSlaInfo();

  const clienteNome = ticket.cliente_nome || 'Não informado';
  const empresaNome = ticket.empresa_nome || 'Não vinculada';
  const origemLabel = ticket.origem || 'Não inf.';

  const canManage = !!(currentUser.administrador || currentUser.desenvolvedor);

  const SectionHeader = ({ id, label, icon: Icon, count }: { id: string, label: string, icon: any, count?: number }) => (
    <button 
      onClick={() => toggleSection(id)}
      className="flex items-center justify-between w-full py-2 hover:bg-slate-50 transition-colors rounded-lg px-2 -mx-2"
    >
      <div className="flex items-center gap-2">
        <Icon size={12} className="text-slate-400" />
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</span>
        {count !== undefined && <Badge variant="slate" className="text-[8px] px-1 py-0 h-3.5 border-none bg-slate-100 text-slate-400 min-w-[16px] flex items-center justify-center font-bold">{count}</Badge>}
      </div>
      {openSections[id] ? <ChevronDown size={12} className="text-slate-300" /> : <ChevronRight size={12} className="text-slate-300" />}
    </button>
  );

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

      <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
          <CardHeader className="py-2 px-4 border-b border-slate-50 bg-slate-50/20">
             <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-500">Detalhes do Chamado</CardTitle>
          </CardHeader>
          <CardContent className="p-2.5 space-y-3">
             {/* Core Fields */}
             <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-50">
                <div className="space-y-1">
                   <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Status</span>
                   {canManage ? (
                     <select 
                       value={ticket.status || 'aberto'}
                       onChange={(e) => onUpdate({ status: e.target.value as TicketStatus })}
                       className="w-full h-8 px-2 bg-slate-50 border border-slate-100 rounded text-[10px] font-bold text-slate-600 outline-none focus:ring-1 focus:ring-blue-100 transition-all cursor-pointer hover:bg-slate-100"
                     >
                        <option value="aberto">ABERTO</option>
                        <option value="em_andamento">EM ANDAMENTO</option>
                        <option value="aguardando_cliente">PAGAMENTO</option>
                        <option value="resolvido">RESOLVIDO</option>
                        <option value="fechado">FECHADO</option>
                     </select>
                   ) : (
                     <div><Badge variant={getStatusVariant(ticket.status || 'aberto') as any} className="uppercase text-[8px] font-bold h-4">{(ticket.status || 'aberto').replace('_', ' ')}</Badge></div>
                   )}
                </div>
                <div className="space-y-1">
                   <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Prioridade</span>
                   {canManage ? (
                     <select 
                       value={ticket.prioridade || 'media'}
                       onChange={(e) => onUpdate({ prioridade: e.target.value as TicketPriority })}
                       className="w-full h-8 px-2 bg-slate-50 border border-slate-100 rounded text-[10px] font-bold text-slate-600 outline-none focus:ring-1 focus:ring-blue-100 transition-all cursor-pointer hover:bg-slate-100"
                     >
                        <option value="baixa">BAIXA</option>
                        <option value="media">MÉDIA</option>
                        <option value="alta">ALTA</option>
                        <option value="urgente">URGENTE</option>
                     </select>
                   ) : (
                     <div><Badge variant={getPriorityVariant(ticket.prioridade || 'media') as any} className="uppercase text-[8px] font-bold h-4">{ticket.prioridade || 'media'}</Badge></div>
                   )}
                </div>
             </div>

             {/* SLA Compact */}
             {slaInfo && (
                <div className={cn(
                  "p-2 rounded-lg border flex items-center justify-between transition-all",
                  slaInfo.variant === 'red' && "bg-red-50/50 border-red-100",
                  slaInfo.variant === 'amber' && "bg-amber-50/50 border-amber-100",
                  slaInfo.variant === 'blue' && "bg-blue-50/50 border-blue-100",
                  slaInfo.variant === 'emerald' && "bg-emerald-50/50 border-emerald-100",
                  slaInfo.variant === 'slate' && "bg-slate-50/50 border-slate-200"
                )}>
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={cn(
                      "w-6 h-6 rounded-md flex items-center justify-center shrink-0 shadow-sm",
                      slaInfo.variant === 'red' && "bg-red-500 text-white",
                      slaInfo.variant === 'amber' && "bg-amber-500 text-white",
                      slaInfo.variant === 'blue' && "bg-blue-500 text-white",
                      slaInfo.variant === 'emerald' && "bg-emerald-500 text-white",
                      slaInfo.variant === 'slate' && "bg-slate-400 text-white"
                    )}>
                       <slaInfo.icon size={12} />
                    </div>
                    <div className="min-w-0">
                       <div className={cn(
                         "text-[9px] font-black truncate uppercase tracking-tight",
                         slaInfo.variant === 'red' && "text-red-700",
                         slaInfo.variant === 'amber' && "text-amber-700",
                         slaInfo.variant === 'blue' && "text-blue-700",
                         slaInfo.variant === 'emerald' && "text-emerald-700",
                         slaInfo.variant === 'slate' && "text-slate-600"
                       )}>
                         {slaInfo.label}: {slaInfo.description}
                       </div>
                       <div className="text-[8px] font-bold text-slate-400 truncate tracking-tight uppercase">
                         {slaInfo.deadlineLabel}
                       </div>
                    </div>
                  </div>
                </div>
             )}

             {/* Responsável */}
             {canManage && (
                <div className="space-y-1">
                   <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Atribuído para</span>
                   <select 
                     value={ticket.responsavel_id || ''}
                     onChange={(e) => onUpdate({ responsavel_id: e.target.value ? parseInt(e.target.value) : null })}
                     className="w-full h-8 px-2 bg-slate-50 border border-slate-100 rounded text-[10px] font-bold text-slate-600 outline-none focus:ring-1 focus:ring-blue-100 transition-all cursor-pointer hover:bg-slate-100"
                   >
                      <option value="">Sem responsável</option>
                      {agents.map(agent => (
                        <option key={agent.id} value={agent.id}>{agent.nome || 'Usuário'}</option>
                      ))}
                   </select>
                </div>
             )}

             {/* Seções Colapsáveis */}
             <div className="space-y-1">
                {/* Solicitante */}
                <div>
                   <SectionHeader id="customer" label="Solicitante" icon={UserIcon} />
                   {openSections.customer && (
                     <div className="space-y-2 py-2 animate-in slide-in-from-top-1 duration-200">
                        <div className="flex items-center gap-3 bg-slate-50/50 p-2 rounded-lg border border-slate-100/50">
                           <div className="w-7 h-7 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                              <UserIcon size={12} />
                           </div>
                           <div className="min-w-0">
                              <div className="text-[11px] font-bold text-slate-900 truncate">{clienteNome}</div>
                              <div className="text-[9px] font-medium text-slate-400 truncate tracking-tight uppercase">{ticket.cliente_email || 's/ email'}</div>
                           </div>
                        </div>
                        <div className="flex items-center gap-2 px-1">
                           <Building2 size={10} className="text-slate-300" />
                           <span className="text-[10px] font-bold text-slate-500 truncate">{empresaNome}</span>
                        </div>
                        <div className="flex items-center gap-2 px-1">
                           <Calendar size={10} className="text-slate-300" />
                           <span className="text-[10px] font-bold text-slate-500 truncate">{origemLabel}</span>
                        </div>
                     </div>
                   )}
                </div>

                {/* Tags */}
                <div className="border-t border-slate-50 pt-1">
                   <SectionHeader id="tags" label="Tags" icon={Tag} count={ticket.tags?.length || 0} />
                   {openSections.tags && (
                     <div className="py-2 animate-in slide-in-from-top-1 duration-200">
                        <TicketTags 
                          tags={ticket.tags || []}
                          onAdd={(tag) => onUpdateTags?.([...(ticket.tags || []), tag])}
                          onRemove={(tag) => onUpdateTags?.((ticket.tags || []).filter(t => t !== tag))}
                          readOnly={!canManage}
                        />
                     </div>
                   )}
                </div>

                {/* Campos Personalizados */}
                <div className="border-t border-slate-50 pt-1">
                   <SectionHeader id="custom" label="Personalizados" icon={Activity} count={ticket.custom_fields?.length || 0} />
                   {openSections.custom && (
                     <div className="py-2 animate-in slide-in-from-top-1 duration-200">
                        <TicketCustomFields 
                          fields={ticket.custom_fields || []}
                          onUpdate={onUpdateCustomFields || (() => {})}
                          readOnly={!canManage}
                        />
                     </div>
                   )}
                </div>

                {/* Datas e Histórico */}
                <div className="border-t border-slate-50 pt-1">
                   <SectionHeader id="history" label="Histórico" icon={Clock} />
                   {openSections.history && (
                     <div className="py-2 space-y-2 animate-in slide-in-from-top-1 duration-200">
                        <div className="flex justify-between items-center text-[10px] font-bold px-1">
                           <span className="text-slate-400 uppercase">Criado</span>
                           <span className="text-slate-700 tracking-tight">{formatDate(ticket.created_at)}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-bold px-1">
                           <span className="text-slate-400 uppercase">Atividade</span>
                           <span className="text-blue-600 uppercase tracking-tighter">{formatRelativeTime(ticket.updated_at)}</span>
                        </div>
                        {['resolvido', 'fechado'].includes(ticket.status) && (
                          <div className="bg-slate-50 p-2 rounded border border-slate-100 mt-2">
                             <div className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">Solução Aplicada</div>
                             <div className="text-[10px] font-bold text-slate-700">{ticket.resolucao_motivo?.replace(/_/g, ' ') || 'Não inf.'}</div>
                             {ticket.resolucao_observacao && (
                               <div className="text-[9px] text-slate-500 italic mt-1 border-t border-slate-100 pt-1 line-clamp-2">
                                 "{ticket.resolucao_observacao}"
                               </div>
                             )}
                          </div>
                        )}
                     </div>
                   )}
                </div>

                {/* Anexos */}
                <div className="border-t border-slate-50 pt-1">
                   <SectionHeader id="attachments" label="Anexos" icon={Paperclip} count={attachments.length} />
                   {openSections.attachments && (
                     <div className="py-2 animate-in slide-in-from-top-1 duration-200">
                        {attachments.length === 0 ? (
                           <div className="text-[9px] font-bold text-slate-400 uppercase text-center py-2 italic">Nenhum arquivo</div>
                        ) : (
                           <AttachmentList 
                             attachments={attachments} 
                             compact 
                             className="gap-2"
                           />
                        )}
                     </div>
                   )}
                </div>
             </div>

             {!!(currentUser.administrador || currentUser.desenvolvedor) && ticket.status !== 'fechado' && (
               <div className="pt-2">
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => setIsArchiveConfirmOpen(true)}
                    className="w-full h-8 border-slate-100 text-slate-400 hover:text-red-500 hover:bg-red-50 hover:border-red-100 transition-all text-[9px] font-bold uppercase tracking-widest rounded shadow-none"
                  >
                     <Trash2 size={10} className="mr-2" /> Arquivar Chamado
                  </Button>
               </div>
             )}
          </CardContent>
       </Card>
    </>
  );
};
