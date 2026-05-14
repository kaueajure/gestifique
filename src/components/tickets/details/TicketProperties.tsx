import React, { useState } from 'react';
import { User, Ticket, TicketAttachment } from '../../../types';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
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
import { formatRelativeTime } from '../../../lib/utils';
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
               <span className="text-slate-500">Status</span>
               <span className="font-medium text-slate-900 capitalize">{ticket.status?.replace('_', ' ')}</span>
            </div>
            <div className="flex items-center justify-between">
               <span className="text-slate-500">Prioridade</span>
               <span className="font-medium text-slate-900 capitalize">{ticket.prioridade}</span>
            </div>
            <div className="flex items-center justify-between">
               <span className="text-slate-500">Responsável</span>
               <span className="font-medium text-slate-900">{agents.find(a => a.id === ticket.responsavel_id)?.nome || 'Nenhum'}</span>
            </div>
            <div className="flex items-center justify-between">
               <span className="text-slate-500">Categoria</span>
               <span className="font-medium text-slate-900 capitalize">{ticket.categoria?.replace('_', ' ')}</span>
            </div>
            <div className="flex items-center justify-between">
               <span className="text-slate-500">Origem</span>
               <span className="font-medium text-slate-900">{origemLabel}</span>
            </div>
          </div>
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
        {ticket.custom_fields && ticket.custom_fields.length > 0 && (
          <div>
             <h3 className="text-xs font-semibold text-slate-800 mb-2.5">Campos adicionais</h3>
             <TicketCustomFields 
                fields={ticket.custom_fields || []}
                onUpdate={onUpdateCustomFields || (() => {})}
                readOnly={!canManage}
             />
          </div>
        )}

        {/* Anexos */}
        {attachments.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-slate-800 mb-2.5">Anexos ({attachments.length})</h3>
            <AttachmentList attachments={attachments} compact />
          </div>
        )}

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
        <div className="p-3 bg-slate-50 border-t border-slate-100 mt-auto shrink-0">
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
