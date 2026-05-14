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

const EditableField = ({ label, children, readOnly, displayValue }: { label: string, children: React.ReactNode, readOnly?: boolean, displayValue?: string }) => (
  <div className="space-y-1">
    <label className="text-[10px] font-medium text-slate-500">{label}</label>
    {readOnly ? (
      <div className="h-7 flex items-center px-2 rounded-md bg-slate-50 border border-slate-100 text-[11px] font-semibold text-slate-800 truncate">
        {displayValue}
      </div>
    ) : (
      <div className="w-full">
        {children}
      </div>
    )}
  </div>
);

const InfoBox = ({ label, value, highlight }: { label: string, value: React.ReactNode, highlight?: boolean }) => (
  <div className="min-w-0 bg-slate-50 border border-slate-100 rounded-md py-1.5 px-2">
    <div className="text-[9px] font-medium text-slate-400 uppercase tracking-wide mb-0.5">{label}</div>
    <div className={cn("text-[11px] font-semibold truncate leading-tight", highlight ? "text-red-600" : "text-slate-800")}>
      {value}
    </div>
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
          <div className="space-y-0.5">
            <div className="text-[11px] font-semibold text-slate-900 truncate">{clienteNome}</div>
            <div className="text-[11px] text-slate-500 truncate">{ticket.cliente_email || 'n/a'}</div>
            {empresaNome !== 'Não vinculada' && (
              <div className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                <Building2 size={11} className="text-slate-400" /> {empresaNome}
              </div>
            )}
          </div>
        </Section>

        {/* Resumo Rápido */}
        <Section title="Resumo rápido">
          <div className="grid grid-cols-2 gap-2">
            <InfoBox label="ID" value={`#${ticket.id}`} />
            <InfoBox label="Anexos" value={attachments.length} />
            <InfoBox label="Criado" value={formatDate(ticket.created_at)} />
            <InfoBox 
              label="SLA" 
              value={ticket.prazo_sla ? `[${getSlaInfo(ticket.prazo_sla, ticket.status).label}]` : 'Sem SLA'} 
              highlight={ticket.prazo_sla ? getSlaInfo(ticket.prazo_sla, ticket.status).label.includes('Vencid') : false} 
            />
          </div>
        </Section>

        {/* Atendimento */}
        <Section title="Atendimento">
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <EditableField 
              label="Status" 
              readOnly={!canManage} 
               displayValue={ticket.status?.replace('_', ' ')}
            >
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
                 buttonClassName="w-full h-7 text-[11px] min-h-0"
               />
            </EditableField>
            
            <EditableField 
              label="Prioridade" 
              readOnly={!canManage} 
              displayValue={ticket.prioridade}
            >
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
                 buttonClassName="w-full h-7 text-[11px] min-h-0"
               />
            </EditableField>

            <EditableField 
              label="Responsável" 
               readOnly={!canManage} 
               displayValue={agents.find(a => a.id === ticket.responsavel_id)?.nome || 'Nenhum'}
            >
               <Select 
                 value={ticket.responsavel_id ? String(ticket.responsavel_id) : ''}
                 onChange={(value) => onUpdate({ responsavel_id: value ? Number(value) : null })}
                 options={[
                   { value: '', label: 'Nenhum' },
                   ...agents.map(a => ({ value: String(a.id), label: a.nome }))
                 ]}
                 size="sm"
                 buttonClassName="w-full h-7 text-[11px] min-h-0"
               />
            </EditableField>

            <EditableField 
              label="Origem" 
              readOnly={!canManage} 
              displayValue={origemLabel}
            >
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
                 buttonClassName="w-full h-7 text-[11px] min-h-0"
               />
            </EditableField>

            <div className="col-span-2">
              <EditableField 
                 label="Categoria" 
                 readOnly={!canManage} 
                 displayValue={categoryLabel}
              >
                 <Select 
                   value={ticket.categoria || categoryOptions[0]?.value || ''}
                   onChange={(value) => onUpdate({ categoria: value })}
                   options={categoryOptions}
                   size="sm"
                   buttonClassName="w-full h-7 text-[11px] min-h-0"
                 />
              </EditableField>
            </div>

            <div className="col-span-2">
              <EditableField 
                 label="Serviço" 
                 readOnly={!canManage} 
                 displayValue={serviceLabel}
              >
                 <Select 
                   value={ticket.servico || serviceOptions[0]?.value || ''}
                   onChange={(value) => onUpdate({ servico: value })}
                   options={serviceOptions}
                   size="sm"
                   buttonClassName="w-full h-7 text-[11px] min-h-0"
                 />
              </EditableField>
            </div>
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
