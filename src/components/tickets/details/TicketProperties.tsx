import React from 'react';
import { User, Ticket, TicketAttachment, TicketCustomField } from '../../../types';
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

type SectionId = 'customer' | 'tags' | 'custom' | 'history' | 'attachments';

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

  const clienteNome = ticket.cliente_nome || 'Não informado';
  const empresaNome = ticket.empresa_nome || 'Não vinculada';
  const origemLabel = ticket.origem || 'Não inf.';

  const canManage = !!(currentUser.administrador || currentUser.desenvolvedor);

  const SectionHeader = ({ id, label, icon: Icon, count }: { id: string, label: string, icon: any, count?: number }) => (
    <button 
      onClick={() => toggleSection(id)}
      className="flex items-center justify-between w-full py-2.5 hover:bg-slate-50 transition-colors rounded-xl px-3 -mx-1"
    >
      <div className="flex items-center gap-2.5">
        <Icon size={14} className="text-slate-400" />
        <span className="text-[11px] font-black uppercase tracking-wider text-slate-600">{label}</span>
        {count !== undefined && <Badge variant="slate" className="text-[10px] px-2 py-0.5 h-5 border-none bg-slate-100 text-slate-500 min-w-[20px] flex items-center justify-center font-bold">{count}</Badge>}
      </div>
      {openSections[id] ? <ChevronDown size={14} className="text-slate-300" /> : <ChevronRight size={14} className="text-slate-300" />}
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

      <Card className="border-slate-200 shadow-sm overflow-hidden bg-white rounded-2xl">
          <CardHeader className="py-3 px-5 border-b border-slate-50 bg-slate-50/30">
             <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-500">DADOS TÉCNICOS</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
             {/* Seções Colapsáveis */}
             <div className="space-y-1">
                {/* Solicitante */}
                <div>
                   <SectionHeader id="customer" label="Solicitante" icon={UserIcon} />
                   {openSections.customer && (
                     <div className="space-y-1.5 py-1.5 animate-in slide-in-from-top-1 duration-200">
                        <div className="flex items-center gap-2 bg-slate-50/50 p-1.5 rounded-lg border border-slate-100/50">
                           <div className="w-6 h-6 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                               <UserIcon size={11} />
                           </div>
                           <div className="min-w-0">
                              <div className="text-[10px] font-black text-slate-800 truncate leading-tight uppercase">{clienteNome}</div>
                              <div className="text-[8px] font-bold text-slate-400 truncate tracking-tight uppercase leading-none mt-0.5">{ticket.cliente_email || 's/ email'}</div>
                           </div>
                        </div>
                        <div className="flex items-center gap-2 px-1">
                           <Building2 size={9} className="text-slate-300" />
                           <span className="text-[9px] font-black text-slate-500 truncate uppercase tracking-tighter">{empresaNome}</span>
                        </div>
                        <div className="flex items-center gap-2 px-1">
                           <Calendar size={9} className="text-slate-300" />
                           <span className="text-[9px] font-black text-slate-500 truncate uppercase tracking-tighter">{origemLabel}</span>
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
               <div className="pt-4 mt-2">
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => setIsArchiveConfirmOpen(true)}
                    className="w-full h-10 border-slate-200 text-slate-400 hover:text-red-500 hover:bg-red-50 hover:border-red-100 transition-all text-[10px] font-bold uppercase tracking-widest rounded-xl shadow-none"
                  >
                     <Trash2 size={12} className="mr-2" /> Arquivar Chamado
                  </Button>
               </div>
             )}
          </CardContent>
       </Card>
    </>
  );
};
