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
    <div className="space-y-6">
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

      {/* Solicitante */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Solicitante</h3>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
            <UserIcon size={20} />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-slate-900 truncate">{clienteNome}</div>
            <div className="text-xs font-medium text-slate-500 truncate">{ticket.cliente_email || 'Sem e-mail'}</div>
          </div>
        </div>
        <div className="space-y-2 pt-2 border-t border-slate-50">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <Building2 size={14} className="text-slate-300" />
            <span className="truncate">{empresaNome}</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <Globe size={14} className="text-slate-300" />
            <span className="truncate">Origem: {origemLabel}</span>
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tags</h3>
          {ticket.tags && ticket.tags.length > 0 && (
            <Badge variant="slate" className="text-[9px] font-bold px-1.5 py-0">{ticket.tags.length}</Badge>
          )}
        </div>
        <TicketTags 
          tags={ticket.tags || []}
          onAdd={(tag) => onUpdateTags?.([...(ticket.tags || []), tag])}
          onRemove={(tag) => onUpdateTags?.((ticket.tags || []).filter(t => t !== tag))}
          readOnly={!canManage}
        />
      </div>

      {/* Atividade */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Atividade</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
              <Calendar size={14} />
              Criado
            </div>
            <span className="text-xs font-bold text-slate-700">{formatDate(ticket.created_at)}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
              <Clock size={14} />
              Última atividade
            </div>
            <span className="text-xs font-bold text-blue-600">{formatRelativeTime(ticket.updated_at)}</span>
          </div>
        </div>
      </div>

      {/* Campos Personalizados */}
      {ticket.custom_fields && ticket.custom_fields.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Campos Adicionais</h3>
          <TicketCustomFields 
            fields={ticket.custom_fields || []}
            onUpdate={onUpdateCustomFields || (() => {})}
            readOnly={!canManage}
          />
        </div>
      )}

      {/* Anexos */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Anexos</h3>
          {attachments.length > 0 && (
            <Badge variant="slate" className="text-[9px] font-bold px-1.5 py-0">{attachments.length}</Badge>
          )}
        </div>
        {attachments.length === 0 ? (
          <p className="text-[11px] font-medium text-slate-400 italic text-center py-2">Nenhum anexo</p>
        ) : (
          <AttachmentList attachments={attachments} compact />
        )}
      </div>

      {/* Arquivar */}
      {canManage && ticket.status !== 'fechado' && (
        <Button 
          variant="ghost"
          onClick={() => setIsArchiveConfirmOpen(true)}
          className="w-full h-12 text-xs font-bold text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-2xl border border-dashed border-slate-200 hover:border-red-100 transition-all uppercase tracking-widest"
        >
          <Trash2 size={14} className="mr-2" /> 
          Arquivar Chamado
        </Button>
      )}
    </div>
  );
};
