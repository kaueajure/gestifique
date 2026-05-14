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
  ChevronDown, 
  ChevronRight, 
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
  
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    cliente: true,
    responsavel: true,
    tags: true,
    campos: false,
    anexos: false,
    datas: false
  });

  const toggleSection = (id: string) => {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('pt-BR', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const clienteNome = ticket.cliente_nome || 'Cliente não identificado';
  const empresaNome = ticket.empresa_nome || 'Não vinculada';
  const origemLabel = ticket.origem || 'Não inf.';

  const canManage = !!(currentUser.administrador || currentUser.desenvolvedor);

  const SectionHeader = ({ id, label, count }: { id: string, label: string, count?: number }) => (
      <button 
        onClick={() => toggleSection(id)}
        className="flex items-center justify-between w-full py-2 hover:bg-slate-50 transition-colors group"
      >
      <div className="flex items-center gap-2">
        {openSections[id] ? (
          <ChevronDown size={16} className="text-slate-400 group-hover:text-slate-600" />
        ) : (
          <ChevronRight size={16} className="text-slate-400 group-hover:text-slate-600" />
        )}
        <span className="text-sm font-semibold text-slate-800">{label}</span>
        {count !== undefined && count > 0 && (
          <Badge variant="slate" className="text-xs px-1.5 py-0 h-5 border-transparent bg-slate-100 text-slate-600">
            {count}
          </Badge>
        )}
      </div>
    </button>
  );

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col pt-1">
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

      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
         <h2 className="text-sm font-bold text-slate-900">Detalhes do atendimento</h2>
      </div>

      <div className="flex flex-col divide-y divide-slate-100">
        
        {/* Cliente */}
        <div className="px-4">
          <SectionHeader id="cliente" label="Cliente" />
          {openSections['cliente'] && (
            <div className="pb-3 space-y-3 pt-1">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                  <UserIcon size={16} />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-900 truncate">{clienteNome}</div>
                  <div className="text-xs text-slate-500 truncate">{ticket.cliente_email || 'Sem e-mail'}</div>
                </div>
              </div>
              <div className="space-y-2 pt-3 border-t border-slate-50">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Building2 size={16} className="text-slate-400" />
                  <span className="truncate">{empresaNome}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Globe size={16} className="text-slate-400" />
                  <span className="truncate">Origem: {origemLabel}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Responsável */}
        <div className="px-4">
          <SectionHeader id="responsavel" label="Responsável" />
          {openSections['responsavel'] && (
            <div className="pb-3 pt-1">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                  <UserIcon size={16} />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-900 truncate">
                    {agents.find(a => a.id === ticket.responsavel_id)?.nome || 'Não atribuído'}
                  </div>
                  <div className="text-xs text-slate-500 truncate">
                    Para atribuir, vá nas ações.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="px-4">
          <SectionHeader id="tags" label="Tags" count={ticket.tags?.length || 0} />
          {openSections['tags'] && (
            <div className="pb-3 pt-1">
              <TicketTags 
                tags={ticket.tags || []}
                onAdd={(tag) => onUpdateTags?.([...(ticket.tags || []), tag])}
                onRemove={(tag) => onUpdateTags?.((ticket.tags || []).filter(t => t !== tag))}
                readOnly={!canManage}
              />
            </div>
          )}
        </div>

        {/* Campos Adicionais */}
        {ticket.custom_fields && ticket.custom_fields.length > 0 && (
          <div className="px-4">
            <SectionHeader id="campos" label="Campos adicionais" count={ticket.custom_fields?.length || 0} />
            {openSections['campos'] && (
              <div className="pb-3 pt-1">
                <TicketCustomFields 
                  fields={ticket.custom_fields || []}
                  onUpdate={onUpdateCustomFields || (() => {})}
                  readOnly={!canManage}
                />
              </div>
            )}
          </div>
        )}

        {/* Anexos */}
        <div className="px-4">
          <SectionHeader id="anexos" label="Anexos" count={attachments.length} />
          {openSections['anexos'] && (
            <div className="pb-3 pt-1">
              {attachments.length === 0 ? (
                <p className="text-sm text-slate-500 italic">Nenhum anexo</p>
              ) : (
                <AttachmentList attachments={attachments} compact />
              )}
            </div>
          )}
        </div>

        {/* Datas e resolução */}
        <div className="px-4">
          <SectionHeader id="datas" label="Datas e resolução" />
          {openSections['datas'] && (
            <div className="pb-3 pt-1 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 flex items-center gap-2"><Calendar size={14}/> Criado em</span>
                <span className="text-slate-900 font-medium">{formatDate(ticket.created_at)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 flex items-center gap-2"><Clock size={14}/> Última atividade</span>
                <span className="text-slate-900 font-medium">{formatRelativeTime(ticket.updated_at)}</span>
              </div>
            </div>
          )}
        </div>

      </div>

      {canManage && ticket.status !== 'fechado' && (
        <div className="p-3 bg-slate-50 border-t border-slate-100 mt-auto">
          <Button 
            variant="ghost"
            onClick={() => setIsArchiveConfirmOpen(true)}
            className="w-full text-xs font-semibold text-slate-500 hover:text-red-700 hover:bg-red-50 border border-slate-200 hover:border-red-200 transition-colors h-8"
          >
            <Trash2 size={16} className="mr-2" /> 
            Arquivar atendimento
          </Button>
        </div>
      )}
    </div>
  );
};
