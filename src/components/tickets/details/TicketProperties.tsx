import React from 'react';
import { Ticket, User, TicketStatus, TicketPriority, TicketAttachment } from '../../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { User as UserIcon, Building2, Tag, Calendar, Trash2, Paperclip } from 'lucide-react';
import { ConfirmDialog } from '../../ui/ConfirmDialog';
import { AttachmentList } from '../../ui/AttachmentList';

interface TicketPropertiesProps {
  ticket: Ticket;
  currentUser: User;
  agents: User[];
  attachments: TicketAttachment[];
  onUpdate: (data: Partial<Ticket>) => void;
  onArchive: () => void;
}

export const TicketProperties = ({ ticket, currentUser, agents, attachments, onUpdate, onArchive }: TicketPropertiesProps) => {
  const [isArchiveConfirmOpen, setIsArchiveConfirmOpen] = React.useState(false);

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

  const clienteNome = ticket.cliente_nome || 'Não informado';
  const empresaNome = ticket.empresa_nome || 'Empresa não vinculada';
  const origemLabel = ticket.origem || 'Não informado';

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
             {!!(currentUser.administrador || currentUser.desenvolvedor) ? (
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
                   <span className="text-xs font-semibold text-slate-500">Categoria</span>
                   <div className="flex items-center gap-3">
                      <Tag size={14} className="text-slate-300" />
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">{(ticket.categoria || 'Não informada').replace('_', ' ')}</span>
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

             <div className="space-y-3 pt-4 border-t border-slate-50">
                <div className="flex justify-between items-center text-xs font-medium">
                   <span className="text-slate-500">Aberto em</span>
                   <span className="text-slate-800 font-semibold">{new Date(ticket.created_at).toLocaleDateString()}</span>
                </div>
                {ticket.updated_at && ticket.updated_at !== ticket.created_at && (
                  <div className="flex justify-between items-center text-xs font-medium">
                     <span className="text-slate-500">Atualizado</span>
                     <span className="text-slate-800 font-semibold">{new Date(ticket.updated_at).toLocaleDateString()}</span>
                  </div>
                )}
                {ticket.prazo_sla && (
                  <div className="flex justify-between items-center text-xs font-medium">
                     <span className="text-slate-500">Prazo SLA</span>
                     <span className="text-amber-600 font-bold">{new Date(ticket.prazo_sla).toLocaleDateString()}</span>
                  </div>
                )}
                {ticket.status === 'fechado' && (ticket.finalizado_em || ticket.updated_at) && (
                  <div className="flex justify-between items-center text-xs font-medium">
                     <span className="text-slate-500">Finalizado</span>
                     <span className="text-emerald-600 font-bold">{new Date(ticket.finalizado_em || ticket.updated_at).toLocaleDateString()}</span>
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
