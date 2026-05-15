import React, { useState } from 'react';
import { User, Ticket, TicketAttachment, TicketStatus } from '../../../types';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Select } from '../../ui/Select';
import { cn, formatRelativeTime, getSlaInfo, getFirstResponseSlaInfo } from '../../../lib/utils';
import { 
  User as UserIcon, 
  Building2, 
  Calendar, 
  Trash2, 
  Clock, 
  Globe,
  Zap,
  Layers,
  ShieldCheck,
  Tag as TagIcon,
  Briefcase,
  Paperclip,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { ConfirmDialog } from '../../ui/ConfirmDialog';
import { AttachmentList } from '../../ui/AttachmentList';
import { TicketTags } from '../TicketTags';
import { TicketCustomFields } from './TicketCustomFields';
import { useTicketOptions } from '../../../hooks/useTicketOptions';
import { hasPermission } from '../../../lib/permissions';

const PropertyRow = ({ label, icon: Icon, children, className }: { label: string, icon?: any, children: React.ReactNode, className?: string }) => (
  <div className={cn("flex flex-col gap-1 py-1.5 first:pt-0", className)}>
    <div className="flex items-center gap-1 text-[9px] font-semibold text-slate-500 uppercase tracking-wider leading-none">
       {Icon && <Icon size={10} />}
       {label}
    </div>
    <div className="w-full">
      {children}
    </div>
  </div>
);

const Section = ({ title, icon: Icon, children, badge }: { title: string, icon?: any, children: React.ReactNode, badge?: React.ReactNode }) => (
  <div className="bg-white border text-sm border-slate-200 rounded-lg overflow-hidden shadow-sm">
    <div className="px-2.5 py-1.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
      <h3 className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
        {Icon && <Icon size={12} className="text-slate-500" />}
        {title}
      </h3>
      {badge}
    </div>
    <div className="p-2 space-y-0 divide-y divide-slate-100">
      {children}
    </div>
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

  const statusColors: Record<TicketStatus, string> = {
    aberto: "bg-blue-600",
    em_andamento: "bg-indigo-600",
    aguardando_cliente: "bg-amber-600",
    resolvido: "bg-emerald-600",
    fechado: "bg-slate-600",
  };

  const canManage = hasPermission(currentUser, 'tickets.editar');

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

  const slaInfo = getSlaInfo(ticket.prazo_sla, ticket.status);
  const firstResponseSla = getFirstResponseSlaInfo(ticket);

  return (
    <div className="flex flex-col gap-4">
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

      {/* Seção 1: Atendimento Central */}
      <Section title="Propriedades" icon={ShieldCheck}>
        <PropertyRow label="Status" icon={Clock}>
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
             buttonClassName="w-full h-7 text-[11px] font-semibold bg-white border-slate-200 rounded text-slate-700"
             disabled={!canManage}
           />
        </PropertyRow>
        
        <PropertyRow label="Responsável" icon={UserIcon}>
           <Select 
             value={ticket.responsavel_id ? String(ticket.responsavel_id) : ''}
             onChange={(value) => onUpdate({ responsavel_id: value ? Number(value) : null })}
             options={[
               { value: '', label: 'Nenhum Atribuído' },
               ...agents.map(a => ({ value: String(a.id), label: a.nome }))
             ]}
             buttonClassName="w-full h-7 text-[11px] font-semibold bg-white border-slate-200 rounded text-slate-700"
             disabled={!canManage}
           />
        </PropertyRow>

        <PropertyRow label="Prioridade" icon={Zap}>
           <Select 
             value={ticket.prioridade || 'media'}
             onChange={(value) => onUpdate({ prioridade: value as any })}
             options={[
               { value: 'baixa', label: 'Baixa' },
               { value: 'media', label: 'Média' },
               { value: 'alta', label: 'Alta' },
               { value: 'urgente', label: 'Urgente' }
             ]}
             buttonClassName="w-full h-7 text-[11px] font-semibold bg-white border-slate-200 rounded text-slate-700"
             disabled={!canManage}
           />
        </PropertyRow>
      </Section>

      {/* Seção 2: SLA & Prazos */}
      <Section 
        title="Controle de SLA" 
        icon={Clock}
        badge={
          <div className={cn(
            "text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider",
            slaInfo.status === 'vencido' ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"
          )}>
            {slaInfo.label}
          </div>
        }
      >
        <div className="space-y-1.5 py-1">
          {/* Primeira Resposta */}
          <div className="flex items-center justify-between gap-2 p-2 rounded-md bg-slate-50 border border-slate-100">
             <div className="flex flex-col">
                <span className="text-[10px] font-medium text-slate-500 mb-0.5">Resposta Inicial</span>
                <span className="text-xs font-semibold text-slate-700">
                  {ticket.prazo_primeira_resposta ? formatDate(ticket.prazo_primeira_resposta) : 'Não definido'}
                </span>
             </div>
             <Badge 
               variant={firstResponseSla.status === 'finalizado' ? 'emerald' : firstResponseSla.status === 'vencido' ? 'red' : 'amber'}
               className="text-[9px] px-1.5 py-0 rounded"
             >
               {firstResponseSla.label}
             </Badge>
          </div>

          {/* Resolução Final */}
          <div className="flex items-center justify-between gap-2 p-2 rounded-md bg-slate-50 border border-slate-100">
             <div className="flex flex-col">
                <span className="text-[10px] font-medium text-slate-500 mb-0.5">Resolução SLA</span>
                <span className="text-xs font-semibold text-slate-700">
                  {ticket.prazo_sla ? formatDate(ticket.prazo_sla) : 'Não definido'}
                </span>
             </div>
             <Badge 
               variant={slaInfo.status === 'vencido' ? 'red' : slaInfo.status === 'finalizado' ? 'emerald' : 'amber'}
               className="text-[9px] px-1.5 py-0 rounded"
             >
               {slaInfo.label}
             </Badge>
          </div>

          {ticket.primeira_resposta_em && (
             <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium px-1 mt-1">
                <CheckCircle2 size={12} className="text-emerald-500" />
                <span>Interação às {new Date(ticket.primeira_resposta_em).toLocaleTimeString()}</span>
             </div>
          )}
        </div>
      </Section>

      {/* Seção 3: Cliente & Origem */}
      <Section title="Informações do Cliente" icon={Globe}>
        <PropertyRow label="Solicitante">
           <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <div className="text-sm font-semibold text-slate-900 mb-0.5">{ticket.cliente_nome || 'Desconhecido'}</div>
              <div className="text-[11px] text-slate-500 truncate">{ticket.cliente_email || 'n/a'}</div>
              {ticket.empresa_nome && (
                <div className="flex items-center gap-1 mt-2 text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 w-fit">
                  <Building2 size={10} /> {ticket.empresa_nome}
                </div>
              )}
           </div>
        </PropertyRow>
        
        <PropertyRow label="Canal de Origem">
           <Select 
             value={ticket.origem || 'portal'}
             onChange={(value) => onUpdate({ origem: value })}
             options={[
               { value: 'portal', label: 'Portal' },
               { value: 'email', label: 'E-mail' },
               { value: 'whatsapp', label: 'WhatsApp' },
               { value: 'chat', label: 'Chat' },
               { value: 'manual', label: 'Manual' }
             ]}
             buttonClassName="w-full h-7 text-[11px] font-semibold bg-white border-slate-200 rounded text-slate-700"
             disabled={!canManage}
           />
        </PropertyRow>
      </Section>

      {/* Seção 4: Classificação */}
      <Section title="Classificação" icon={Layers}>
        <PropertyRow label="Categoria">
           <Select 
             value={ticket.categoria || ''}
             onChange={(value) => onUpdate({ categoria: value })}
             options={categoryOptions}
             buttonClassName="w-full h-7 text-[11px] font-semibold bg-white border-slate-200 rounded text-slate-700"
             disabled={!canManage}
           />
        </PropertyRow>
        <PropertyRow label="Serviço / Produto">
           <Select 
             value={ticket.servico || ''}
             onChange={(value) => onUpdate({ servico: value })}
             options={serviceOptions}
             buttonClassName="w-full h-7 text-[11px] font-semibold bg-white border-slate-200 rounded text-slate-700"
             disabled={!canManage}
           />
        </PropertyRow>

        <PropertyRow label="Tags / Etiquetas" icon={TagIcon}>
           <TicketTags 
              tags={ticket.tags || []}
              onAdd={(tag) => onUpdateTags?.([...(ticket.tags || []), tag])}
              onRemove={(tag) => onUpdateTags?.((ticket.tags || []).filter(t => t !== tag))}
              readOnly={!canManage}
            />
        </PropertyRow>
      </Section>

      {/* Seção 5: Extras & Anexos */}
      <Section title="Atributos Extras" icon={Briefcase}>
        <PropertyRow label="Dados Adicionais">
           <TicketCustomFields 
             fields={ticket.custom_fields || []}
             onUpdate={onUpdateCustomFields || (() => {})}
             readOnly={!canManage}
           />
        </PropertyRow>
        <PropertyRow label="Documentos em Anexo" icon={Paperclip}>
           {attachments.length > 0 ? (
             <AttachmentList attachments={attachments} compact />
           ) : (
             <div className="flex flex-col items-center justify-center p-4 bg-slate-50/50 border border-slate-200 border-dashed rounded-lg text-slate-400">
                <Paperclip size={16} className="mb-1 opacity-50" />
                <span className="text-[10px] font-medium">Nenhum anexo</span>
             </div>
           )}
        </PropertyRow>
      </Section>

      {/* Seção 6: Resolução info se finalizado */}
      {(ticket.status === 'resolvido' || ticket.status === 'fechado') && (
        <Section title="Conclusão" icon={CheckCircle2}>
           <div className="space-y-3 py-1">
              <div className="flex flex-col px-1">
                 <span className="text-[10px] font-semibold text-slate-500 mb-0.5">Motivo</span>
                 <span className="text-xs font-semibold text-slate-900">{ticket.resolucao_motivo?.replace('_', ' ') || 'Não inf.'}</span>
              </div>
              <div className="flex flex-col px-1">
                 <span className="text-[10px] font-semibold text-slate-500 mb-0.5">Observação</span>
                 <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-lg text-xs text-emerald-900">
                    "{ticket.resolucao_observacao || 'Nenhuma observação registrada.'}"
                 </div>
              </div>
           </div>
        </Section>
      )}

      {/* Seção 7: Arquivar */}
      {canManage && ticket.status !== 'fechado' && (
        <div className="pt-2">
           <Button 
             variant="outline"
             size="sm"
             onClick={() => setIsArchiveConfirmOpen(true)}
             className="w-full h-8 text-xs font-semibold text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 rounded-md transition-all shadow-sm"
           >
             <Trash2 size={14} className="mr-1.5" /> 
             Encerrar Definitivamente
           </Button>
        </div>
      )}
    </div>
  );
};
