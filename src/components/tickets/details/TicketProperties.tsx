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
  const { activeCategories, activeServices, loading } = useTicketOptions();

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
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col h-full overflow-y-auto">
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

      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 shrink-0">
         <h2 className="text-sm font-bold text-slate-900">Painel do ticket</h2>
      </div>

      <div className="flex flex-col flex-1 p-4 gap-5 text-sm">
        
        {/* Cliente */}
        <div>
          <h3 className="text-xs font-semibold text-slate-800 mb-2.5">Cliente</h3>
          <div className="flex flex-col gap-1">
            <div className="font-semibold text-slate-900">{clienteNome}</div>
            <div className="text-slate-500 text-xs">{ticket.cliente_email || 'n/a'}</div>
            {empresaNome !== 'Não vinculada' && (
              <div className="text-slate-600 mt-1 flex items-center gap-1.5 align-middle text-xs">
                <Building2 size={13} className="text-slate-400" />
                 {empresaNome}
              </div>
            )}
          </div>
        </div>

        {/* Atendimento */}
        <div>
          <h3 className="text-xs font-semibold text-slate-800 mb-2.5">Atendimento</h3>
          <div className="flex flex-col gap-2 text-xs">
            <div className="flex items-center justify-between">
               <span className="text-slate-500 shrink-0 mr-2">Status</span>
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
                   buttonClassName="w-[140px]"
                 />
               ) : (
                 <span className="font-medium text-slate-900 capitalize truncate">{ticket.status?.replace('_', ' ')}</span>
               )}
            </div>
            <div className="flex items-center justify-between mt-0.5">
               <span className="text-slate-500 shrink-0 mr-2">Prioridade</span>
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
                   buttonClassName="w-[140px]"
                 />
               ) : (
                 <span className="font-medium text-slate-900 capitalize truncate">{ticket.prioridade}</span>
               )}
            </div>
            <div className="flex items-center justify-between mt-0.5">
               <span className="text-slate-500 shrink-0 mr-2">Responsável</span>
               {canManage ? (
                 <Select 
                   value={ticket.responsavel_id ? String(ticket.responsavel_id) : ''}
                   onChange={(value) => onUpdate({ responsavel_id: value ? Number(value) : null })}
                   options={[
                     { value: '', label: 'Nenhum' },
                     ...agents.map(a => ({ value: String(a.id), label: a.nome }))
                   ]}
                   size="sm"
                   buttonClassName="w-[140px]"
                 />
               ) : (
                 <span className="font-medium text-slate-900 truncate">{agents.find(a => a.id === ticket.responsavel_id)?.nome || 'Nenhum'}</span>
               )}
            </div>
            <div className="flex items-center justify-between mt-0.5">
               <span className="text-slate-500 shrink-0 mr-2">Categoria</span>
               {canManage ? (
                 <Select 
                   value={ticket.categoria || categoryOptions[0]?.value || ''}
                   onChange={(value) => onUpdate({ categoria: value })}
                   options={categoryOptions}
                   size="sm"
                   buttonClassName="w-[140px]"
                 />
               ) : (
                 <span className="font-medium text-slate-900 capitalize truncate">{categoryLabel}</span>
               )}
            </div>
            <div className="flex items-center justify-between mt-0.5">
               <span className="text-slate-500 shrink-0 mr-2">Serviço</span>
               {canManage ? (
                 <Select 
                   value={ticket.servico || serviceOptions[0]?.value || ''}
                   onChange={(value) => onUpdate({ servico: value })}
                   options={serviceOptions}
                   size="sm"
                   buttonClassName="w-[140px]"
                 />
               ) : (
                 <span className="font-medium text-slate-900 capitalize truncate">{serviceLabel}</span>
               )}
            </div>
            <div className="flex items-center justify-between mt-0.5">
               <span className="text-slate-500 shrink-0 mr-2">Origem</span>
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
                   buttonClassName="w-[140px]"
                 />
               ) : (
                 <span className="font-medium text-slate-900 truncate">{origemLabel}</span>
               )}
            </div>
          </div>
        </div>

        {/* SLA */}
        <div>
          <h3 className="text-xs font-semibold text-slate-800 mb-2.5">SLA</h3>
          {ticket.prazo_sla ? (
            <div className="flex flex-col gap-1 text-xs">
              <span className={cn(
                "font-semibold",
                getSlaInfo(ticket.prazo_sla, ticket.status).color.replace('bg-', 'text-').replace('text-white', 'text-slate-900')
              )}>
                {getSlaInfo(ticket.prazo_sla, ticket.status).label}
              </span>
              <span className="text-slate-500">
                Prazo: {formatDate(ticket.prazo_sla)}
              </span>
            </div>
          ) : (
             <span className="text-slate-500 text-xs italic">Sem SLA definido</span>
          )}
        </div>

        {/* Tags */}
        <div>
          <h3 className="text-xs font-semibold text-slate-800 mb-2.5">Tags</h3>
          {ticket.tags && ticket.tags.length > 0 ? (
            <TicketTags 
              tags={ticket.tags || []}
              onAdd={(tag) => onUpdateTags?.([...(ticket.tags || []), tag])}
              onRemove={(tag) => onUpdateTags?.((ticket.tags || []).filter(t => t !== tag))}
              readOnly={!canManage}
            />
          ) : (
            <div className="flex flex-col gap-2 items-start">
              <span className="text-slate-400 text-xs italic">Nenhuma tag</span>
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
        </div>

        {/* Campos Adicionais */}
        <div>
           <h3 className="text-xs font-semibold text-slate-800 mb-2.5">Campos adicionais</h3>
           {ticket.custom_fields && ticket.custom_fields.length > 0 ? (
             <TicketCustomFields 
                fields={ticket.custom_fields || []}
                onUpdate={onUpdateCustomFields || (() => {})}
                readOnly={!canManage}
             />
           ) : (
             <span className="text-slate-400 text-xs italic">Nenhum campo adicional</span>
           )}
        </div>

        {/* Resumo */}
        <div>
          <h3 className="text-xs font-semibold text-slate-800 mb-2.5">Resumo</h3>
          <div className="flex flex-col gap-2 text-xs">
            <div className="flex items-center justify-between">
               <span className="text-slate-500">ID</span>
               <span className="font-semibold text-slate-900">#{ticket.id}</span>
            </div>
            <div className="flex items-center justify-between">
               <span className="text-slate-500">Anexos</span>
               <span className="font-medium text-slate-900">{attachments.length}</span>
            </div>
            <div className="flex items-center justify-between">
               <span className="text-slate-500">Atualização</span>
               <span className="font-medium text-slate-900">{formatRelativeTime(ticket.updated_at)}</span>
            </div>
          </div>
        </div>

        {/* Resolução */}
        {(ticket.status === 'resolvido' || ticket.status === 'fechado') && ticket.finalizado_em && (
          <div>
            <h3 className="text-xs font-semibold text-slate-800 mb-2.5">Resolução</h3>
            <div className="flex flex-col gap-2 text-xs">
              <div className="flex items-center justify-between">
                 <span className="text-slate-500">Motivo</span>
                 <span className="font-medium text-slate-900 capitalize">{ticket.resolucao_motivo?.replace('_', ' ') || 'Não inf.'}</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                 <span className="text-slate-500">Finalizado em</span>
                 <span className="font-medium text-slate-900">{formatDate(ticket.finalizado_em)}</span>
              </div>
              {ticket.resolucao_observacao && (
                <div className="flex flex-col gap-1 mt-1">
                   <span className="text-slate-500">Observação</span>
                   <span className="text-slate-900 border-l-2 border-slate-200 pl-2 text-[11px] leading-relaxed break-words">{ticket.resolucao_observacao}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reabertura */}
        {ticket.reaberto_em && (
          <div>
            <h3 className="text-xs font-semibold text-slate-800 mb-2.5">Reabertura</h3>
            <div className="flex flex-col gap-2 text-xs">
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
          </div>
        )}

        {/* Anexos */}
        <div>
          <h3 className="text-xs font-semibold text-slate-800 mb-2.5">Anexos</h3>
          {attachments.length > 0 ? (
            <AttachmentList attachments={attachments} compact />
          ) : (
            <span className="text-slate-400 text-xs italic">Nenhum anexo</span>
          )}
        </div>

        {/* Datas */}
        <div>
          <h3 className="text-xs font-semibold text-slate-800 mb-2.5">Datas</h3>
          <div className="flex flex-col gap-2 text-xs">
            <div className="flex items-center justify-between">
               <span className="text-slate-500">Criado em</span>
               <span className="font-medium text-slate-900">{formatDate(ticket.created_at)}</span>
            </div>
            <div className="flex items-center justify-between">
               <span className="text-slate-500">Atualizado em</span>
               <span className="font-medium text-slate-900">{formatRelativeTime(ticket.updated_at)}</span>
            </div>
          </div>
        </div>
      </div>

      {canManage && ticket.status !== 'fechado' && (
        <div className="p-3 bg-slate-50 border-t border-slate-100 mt-2 shrink-0">
          <Button 
            variant="ghost"
            onClick={() => setIsArchiveConfirmOpen(true)}
            className="w-full text-xs font-semibold text-slate-500 hover:text-red-700 hover:bg-red-50 border border-slate-200 hover:border-red-200 transition-colors h-8"
          >
            <Trash2 size={15} className="mr-2" /> 
            Arquivar
          </Button>
        </div>
      )}
    </div>
  );
};
