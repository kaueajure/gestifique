import React, { useState } from 'react';
import { User, Ticket, TicketAttachment } from '../../../types';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Select } from '../../ui/Select';
import { cn, formatRelativeTime, getSlaInfo } from '../../../lib/utils';
import { 
  User as UserIcon, 
  Building2, 
  Calendar, 
  Trash2, 
  Clock, 
  Globe
} from 'lucide-react';
import { ConfirmDialog } from '../../ui/ConfirmDialog';
import { AttachmentList } from '../../ui/AttachmentList';
import { TicketTags } from '../TicketTags';
import { TicketCustomFields } from './TicketCustomFields';
import { useTicketOptions } from '../../../hooks/useTicketOptions';

const FieldRow = ({ label, children }: { label: string, children: React.ReactNode }) => (
  <div className="flex items-center justify-between gap-2 min-h-7">
    <span className="text-[11px] text-slate-500 shrink-0">{label}</span>
    <div className="min-w-0">{children}</div>
  </div>
);

const InfoItem = ({ label, value }: { label: string, value: React.ReactNode }) => (
  <div className="min-w-0">
    <div className="text-[10px] text-slate-400 leading-tight mb-0.5">{label}</div>
    <div className="text-[11px] font-semibold text-slate-800 truncate leading-tight">{value}</div>
  </div>
);

const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <div className="border-t border-slate-100 pt-3 first:border-t-0 first:pt-0">
    <h3 className="text-[11px] font-semibold text-slate-800 mb-2">{title}</h3>
    {children}
  </div>
);

interface TicketPropertiesProps {
  ticket: Ticket;
  currentUser: User;
  agents: User[];
  attachments: TicketAttachment[];
  onUpdate: (data: Partial<Ticket>) => void;
  onArchive: () => void;
  onUpdateTags?: (tags: string[]) => void;
  onUpdateCustomFields?: (fields: any[]) => void;
}

export const TicketProperties = ({ 
  ticket, 
  currentUser, 
  agents,
  attachments,
  onUpdate,
  onArchive,
  onUpdateTags,
  onUpdateCustomFields
}: TicketPropertiesProps) => {
  const [isArchiveConfirmOpen, setIsArchiveConfirmOpen] = useState(false);
  const companyId = ticket.empresa_id ? String(ticket.empresa_id) : undefined;
  const { activeCategories, activeServices } = useTicketOptions(companyId);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const clienteNome = ticket.cliente_nome || 'Cliente não identificado';
  const empresaNome = ticket.empresa_nome || 'Não vinculada';
  const origemLabel = ticket.origem || 'Não inf.';

  const canManage = !!(currentUser.administrador || currentUser.desenvolvedor);

  // Fallbacks if empty
  const defaultCategories = [
    { value: 'suporte_tecnico', label: 'Suporte Técnico' },
    { value: 'financeiro', label: 'Financeiro' },
    { value: 'recursos_humanos', label: 'RH' },
    { value: 'comercial', label: 'Comercial' },
    { value: 'outros', label: 'Outros' }
  ];
  
  const defaultServices = [
    { value: 'suporte', label: 'Suporte' },
    { value: 'implantacao', label: 'Implantação' },
    { value: 'treinamento', label: 'Treinamento' },
    { value: 'outros', label: 'Outros' }
  ];

  const categoryOptions = activeCategories.length > 0 
    ? activeCategories.map(c => ({ value: c.valor, label: c.nome }))
    : defaultCategories;

  const serviceOptions = activeServices.length > 0 
    ? activeServices.map(s => ({ value: s.valor, label: s.nome }))
    : defaultServices;

  const categoryLabel = categoryOptions.find(c => c.value === ticket.categoria)?.label || ticket.categoria || 'Não inf.';
  const serviceLabel = serviceOptions.find(s => s.value === ticket.servico)?.label || ticket.servico || 'Não inf.';

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col h-full overflow-hidden">
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

      <div className="px-3 py-2.5 border-b border-slate-100 bg-slate-50/50 shrink-0">
         <h2 className="text-xs font-bold text-slate-900">Painel do ticket</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 text-sm">
        
        {/* Cliente */}
        <Section title="Cliente">
          <div className="flex flex-col gap-0.5">
            <div className="font-semibold text-slate-900 text-[11px]">{clienteNome}</div>
            <div className="text-slate-500 text-[11px]">{ticket.cliente_email || 'n/a'}</div>
            {empresaNome !== 'Não vinculada' && (
              <div className="text-slate-600 mt-1 flex items-center gap-1.5 align-middle text-[11px]">
                <Building2 size={12} className="text-slate-400" />
                 {empresaNome}
              </div>
            )}
          </div>
        </Section>

        {/* Atendimento */}
        <Section title="Atendimento">
          <div className="flex flex-col gap-0.5 text-[11px]">
            <FieldRow label="Status">
               {canManage ? (
                 <Select 
                   value={ticket.status || 'aberto'}
                   onChange={(value) => onUpdate({ status: value as any })}
                   options={[
                     { value: 'aberto', label: 'Aberto' },
                     { value: 'em_andamento', label: 'Em andamento' },
                     { value: 'aguardando_cliente', label: 'Aguard. cliente' },
                     { value: 'resolvido', label: 'Resolvido' },
                     { value: 'fechado', label: 'Fechado' }
                   ]}
                   size="sm"
                   buttonClassName="w-[132px] h-7 text-[11px] min-h-0"
                 />
               ) : (
                 <span className="font-medium text-slate-900 capitalize truncate">{ticket.status?.replace('_', ' ')}</span>
               )}
            </FieldRow>
            
            <FieldRow label="Prioridade">
               {canManage ? (
                 <Select 
                   value={ticket.prioridade || 'media'}
                   onChange={(value) => onUpdate({ prioridade: value as any })}
                   options={[
                     { value: 'baixa', label: 'Baixa' },
                     { value: 'media', label: 'Média' },
                     { value: 'alta', label: 'Alta' },
                     { value: 'urgente', label: 'Urgente' }
                   ]}
                   size="sm"
                   buttonClassName="w-[132px] h-7 text-[11px] min-h-0"
                 />
               ) : (
                 <span className="font-medium text-slate-900 capitalize truncate">{ticket.prioridade}</span>
               )}
            </FieldRow>

            <FieldRow label="Responsável">
               {canManage ? (
                 <Select 
                   value={ticket.responsavel_id ? String(ticket.responsavel_id) : ''}
                   onChange={(value) => onUpdate({ responsavel_id: value ? Number(value) : null })}
                   options={[
                     { value: '', label: 'Nenhum' },
                     ...agents.map(a => ({ value: String(a.id), label: a.nome }))
                   ]}
                   size="sm"
                   buttonClassName="w-[132px] h-7 text-[11px] min-h-0"
                 />
               ) : (
                 <span className="font-medium text-slate-900 truncate">{agents.find(a => a.id === ticket.responsavel_id)?.nome || 'Nenhum'}</span>
               )}
            </FieldRow>

            <FieldRow label="Categoria">
               {canManage ? (
                 <Select 
                   value={ticket.categoria || categoryOptions[0]?.value || ''}
                   onChange={(value) => onUpdate({ categoria: value })}
                   options={categoryOptions}
                   size="sm"
                   buttonClassName="w-[132px] h-7 text-[11px] min-h-0"
                 />
               ) : (
                 <span className="font-medium text-slate-900 capitalize truncate">{categoryLabel}</span>
               )}
            </FieldRow>

            <FieldRow label="Serviço">
               {canManage ? (
                 <Select 
                   value={ticket.servico || serviceOptions[0]?.value || ''}
                   onChange={(value) => onUpdate({ servico: value })}
                   options={serviceOptions}
                   size="sm"
                   buttonClassName="w-[132px] h-7 text-[11px] min-h-0"
                 />
               ) : (
                 <span className="font-medium text-slate-900 capitalize truncate">{serviceLabel}</span>
               )}
            </FieldRow>

            <FieldRow label="Origem">
               {canManage ? (
                 <Select 
                   value={ticket.origem || 'portal'}
                   onChange={(value) => onUpdate({ origem: value })}
                   options={[
                     { value: 'portal', label: 'Portal' },
                     { value: 'email', label: 'E-mail' },
                     { value: 'whatsapp', label: 'WhatsApp' },
                     { value: 'chat', label: 'Chat' },
                     { value: 'manual', label: 'Manual' },
                     { value: 'outros', label: 'Outros' }
                   ]}
                   size="sm"
                   buttonClassName="w-[132px] h-7 text-[11px] min-h-0"
                 />
               ) : (
                 <span className="font-medium text-slate-900 truncate">{origemLabel}</span>
               )}
            </FieldRow>
          </div>
        </Section>

        {/* SLA */}
        <Section title="SLA">
          {ticket.prazo_sla ? (
             <div className="text-[11px] flex gap-1 items-center">
               <span className={cn(
                 "font-semibold",
                 getSlaInfo(ticket.prazo_sla, ticket.status).color.replace('bg-', 'text-').replace('text-white', 'text-slate-900')
               )}>
                 [{getSlaInfo(ticket.prazo_sla, ticket.status).label}]
               </span>
               <span className="text-slate-500">
                 {formatDate(ticket.prazo_sla)}
               </span>
             </div>
          ) : (
             <span className="text-slate-500 text-[11px] italic">Sem SLA definido</span>
          )}
        </Section>

        {/* Resumo */}
        <Section title="Resumo">
          <div className="grid grid-cols-2 gap-y-2 gap-x-2">
            <InfoItem label="ID" value={`#${ticket.id}`} />
            <InfoItem label="Anexos" value={attachments.length} />
            <InfoItem label="Criado" value={formatDate(ticket.created_at)} />
            <InfoItem label="Atualizado" value={formatRelativeTime(ticket.updated_at)} />
          </div>
        </Section>

        {/* Tags */}
        <Section title="Tags">
          {ticket.tags && ticket.tags.length > 0 ? (
            <TicketTags 
              tags={ticket.tags || []}
              onAdd={(tag) => onUpdateTags?.([...(ticket.tags || []), tag])}
              onRemove={(tag) => onUpdateTags?.((ticket.tags || []).filter(t => t !== tag))}
              readOnly={!canManage}
            />
          ) : (
            <div className="flex gap-2 items-center flex-wrap">
              <span className="text-slate-400 text-[11px] italic">Nenhuma tag</span>
              {canManage && (
                <TicketTags 
                  tags={[]}
                  onAdd={(tag) => onUpdateTags?.([tag])}
                  onRemove={() => {}}
                  readOnly={false}
                />
              )}
            </div>
          )}
        </Section>

        {/* Extras */}
        <Section title="Extras">
           <div className="flex flex-col gap-2.5">
             <div>
               <div className="text-[10px] text-slate-400 mb-0.5">Campos adicionais</div>
               {ticket.custom_fields && ticket.custom_fields.length > 0 ? (
                 <TicketCustomFields 
                    fields={ticket.custom_fields || []}
                    onUpdate={onUpdateCustomFields || (() => {})}
                    readOnly={!canManage}
                 />
               ) : (
                 <div className="text-slate-700 text-[11px] font-medium">Nenhum</div>
               )}
             </div>

             <div>
               <div className="text-[10px] text-slate-400 mb-0.5">Anexos</div>
               {attachments.length > 0 ? (
                 <AttachmentList attachments={attachments} compact />
               ) : (
                 <div className="text-slate-700 text-[11px] font-medium">Nenhum</div>
               )}
             </div>
           </div>
        </Section>

        {/* Resolução */}
        {(ticket.status === 'resolvido' || ticket.status === 'fechado') && ticket.finalizado_em && (
          <Section title="Resolução">
            <div className="flex flex-col gap-1.5 text-[11px]">
               <div className="flex items-center justify-between">
                 <span className="text-slate-500">Motivo</span>
                 <span className="font-medium text-slate-900 capitalize">{ticket.resolucao_motivo?.replace('_', ' ') || 'Não inf.'}</span>
               </div>
               <div className="flex items-center justify-between">
                 <span className="text-slate-500">Finalizado em</span>
                 <span className="font-medium text-slate-900">{formatDate(ticket.finalizado_em)}</span>
               </div>
               {ticket.resolucao_observacao && (
                 <div className="flex flex-col gap-0.5 mt-0.5">
                    <span className="text-slate-500">Observação</span>
                    <span className="text-slate-900 border-l-2 border-slate-200 pl-2 leading-relaxed break-words line-clamp-3">{ticket.resolucao_observacao}</span>
                 </div>
               )}
            </div>
          </Section>
        )}

        {/* Reabertura */}
        {ticket.reaberto_em && (
          <Section title="Reabertura">
            <div className="flex flex-col gap-1.5 text-[11px]">
               <div className="flex items-center justify-between">
                 <span className="text-slate-500">Reaberto em</span>
                 <span className="font-medium text-slate-900">{formatDate(ticket.reaberto_em)}</span>
               </div>
               {ticket.reaberto_por && (
                  <div className="flex items-center justify-between">
                     <span className="text-slate-500">Por</span>
                     <span className="font-medium text-slate-900">{agents.find(a => a.id === ticket.reaberto_por)?.nome || 'Não inf.'}</span>
                  </div>
               )}
            </div>
          </Section>
        )}
      </div>

      {canManage && ticket.status !== 'fechado' && (
        <div className="px-3 py-2 border-t border-slate-100 bg-slate-50/60 shrink-0">
          <Button 
            variant="ghost"
            onClick={() => setIsArchiveConfirmOpen(true)}
            className="w-full text-[11px] font-semibold text-slate-500 hover:text-red-700 hover:bg-red-50 border border-slate-200 hover:border-red-200 transition-colors h-7 px-0"
          >
            <Trash2 size={13} className="mr-1.5" /> 
            Arquivar
          </Button>
        </div>
      )}
    </div>
  );
};
