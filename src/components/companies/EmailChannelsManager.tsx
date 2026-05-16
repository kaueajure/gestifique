import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { 
  Mail, Trash2, RefreshCw, Copy, Check, Plus, AlertCircle, 
  Send, Clock, History, ExternalLink, Info, ShieldCheck
} from 'lucide-react';
import { cn, formatRelativeTime } from '../../lib/utils';
import { Modal } from '../ui/Modal';
import { Card } from '../ui/Card';

interface EmailChannel {
  id: number;
  empresa_id: number;
  nome?: string;
  email_publico: string;
  inbound_address: string;
  status: 'pendente' | 'verificado' | 'ativo' | 'erro';
  ultimo_erro?: string;
  last_received_at?: string;
  verified_at?: string;
}

interface EmailChannelsManagerProps {
  empresaId: number;
}

export const EmailChannelsManager = ({ empresaId }: EmailChannelsManagerProps) => {
  const [channels, setChannels] = useState<EmailChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isCreating, setIsCreating] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newNome, setNewNome] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const fetchChannels = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<EmailChannel[]>(`/companies/${empresaId}/email-channels`);
      setChannels(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar canais');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChannels();
  }, [empresaId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) return;
    try {
      setSubmitting(true);
      await api.post(`/companies/${empresaId}/email-channels`, {
        email_publico: newEmail,
        nome: newNome
      });
      setNewEmail('');
      setNewNome('');
      setIsCreating(false);
      fetchChannels();
    } catch (err: any) {
      alert(err.message || 'Erro ao criar canal');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Remover este canal de e-mail? Nenhum novo ticket será recebido por este endereço técnico.')) return;
    try {
      await api.delete(`/companies/${empresaId}/email-channels/${id}`);
      fetchChannels();
    } catch (err: any) {
      alert(err.message || 'Erro ao remover canal');
    }
  };

  const handleRegenerate = async (id: number) => {
    if (!confirm('Regerar o endereço de encaminhamento? O endereço antigo parará de funcionar imediatamente.')) return;
    try {
      await api.post(`/companies/${empresaId}/email-channels/${id}/regenerate`, {});
      fetchChannels();
    } catch (err: any) {
      alert(err.message || 'Erro ao regenerar canal');
    }
  };

  const handleCopy = (id: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-slate-800">Canais de E-mail</h4>
          <p className="text-xs text-slate-500 max-w-md">E-mails que abrem chamados automaticamente.</p>
        </div>
        <Button size="sm" onClick={() => setIsCreating(true)} className="h-8 text-xs shrink-0 bg-blue-600 hover:bg-blue-700">
          <Plus size={14} className="mr-1" /> Adicionar Canal
        </Button>
      </div>

      {loading ? (
        <div className="p-8 text-center flex flex-col items-center justify-center">
          <RefreshCw size={20} className="text-blue-500 animate-spin mb-2" />
          <p className="text-xs font-medium text-slate-500">Carregando canais...</p>
        </div>
      ) : error ? (
        <Card className="p-4 bg-red-50 border-red-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-red-600">
             <AlertCircle size={16} />
             <p className="text-xs font-medium">{error}</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchChannels} className="text-xs h-7 text-red-600 border-red-200">Refazer</Button>
        </Card>
      ) : channels.length === 0 ? (
        <div className="p-8 bg-slate-50 border border-dashed border-slate-200 rounded-md text-center space-y-3">
           <div className="w-10 h-10 bg-white rounded-full shadow-sm border border-slate-100 flex items-center justify-center mx-auto">
             <Send size={20} className="text-slate-400" />
           </div>
           <div className="space-y-1">
             <p className="text-sm font-semibold text-slate-700">Nenhum canal configurado</p>
             <p className="text-xs text-slate-500 max-w-xs mx-auto">Transforme e-mails em chamados no Gestifique.</p>
           </div>
           <Button size="sm" onClick={() => setIsCreating(true)} variant="outline" className="h-8 text-xs">Configurar</Button>
        </div>
      ) : (
        <div className="grid gap-3">
          {channels.map(channel => (
            <Card key={channel.id} className="p-0 overflow-hidden border-slate-200 shadow-sm">
               <div className="p-4 border-b border-slate-100 bg-white">
                 <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-md bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                         <Mail size={16} className="text-blue-600" />
                       </div>
                       <div>
                          <div className="flex items-center gap-2">
                             <span className="font-semibold text-sm text-slate-800">{channel.email_publico}</span>
                             <Badge variant={channel.status === 'ativo' || channel.status === 'verificado' ? 'emerald' : channel.status === 'erro' ? 'red' : 'amber'} className="text-[10px] h-5">
                               {channel.status}
                             </Badge>
                          </div>
                          <div className="flex items-center gap-3 mt-0.5">
                            {channel.nome && <span className="text-xs font-medium text-slate-500">{channel.nome}</span>}
                            {channel.last_received_at && (
                              <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                                <Clock size={12} className="text-slate-300" /> Visto {formatRelativeTime(channel.last_received_at)}
                              </span>
                            )}
                          </div>
                       </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleRegenerate(channel.id)} title="Regerar Endereço Inbound" className="h-7 w-7 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md">
                        <RefreshCw size={14} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(channel.id)} className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md">
                        <Trash2 size={14} />
                      </Button>
                    </div>
                 </div>
               </div>
               
               <div className="p-4 bg-slate-50/50 space-y-3">
                 <div className="space-y-2">
                   <div className="flex items-center justify-between">
                     <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                       <ShieldCheck size={12} className="text-blue-500" /> Endpoint Técnico (ID Inbound)
                     </span>
                     <span className="text-[11px] font-medium text-amber-600">Confidencial</span>
                   </div>
                   <div className="bg-white p-2.5 rounded-md border border-slate-200 shadow-sm flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-mono text-slate-600 truncate select-all">{channel.inbound_address}</p>
                      </div>
                      <Button 
                        size="sm" 
                        className={cn(
                          "shrink-0 h-7 text-[11px] transition-all",
                          copiedId === channel.id ? "bg-emerald-600 hover:bg-emerald-700" : "bg-blue-600 hover:bg-blue-700"
                        )}
                        onClick={() => handleCopy(channel.id, channel.inbound_address)}
                      >
                        {copiedId === channel.id ? <Check size={12} className="mr-1" /> : <Copy size={12} className="mr-1" />}
                        {copiedId === channel.id ? 'Copiado' : 'Copiar'}
                      </Button>
                   </div>
                 </div>

                 {channel.ultimo_erro ? (
                    <div className="p-2.5 bg-red-50 border border-red-100 rounded-md text-[11px] text-red-700 flex items-start gap-2">
                       <AlertCircle size={14} className="shrink-0 mt-0.5" />
                       <div>
                          <p className="font-semibold mb-0.5">Erro no canal:</p>
                          <p className="font-medium bg-white/70 p-1 rounded border border-red-200">{channel.ultimo_erro}</p>
                       </div>
                    </div>
                 ) : channel.status === 'pendente' ? (
                    <div className="p-3 bg-amber-50 border border-amber-100 rounded-md space-y-2">
                       <div className="flex items-start gap-2">
                         <div className="w-6 h-6 rounded bg-white border border-amber-200 flex items-center justify-center shrink-0">
                           <History size={14} className="text-amber-600" />
                         </div>
                         <div>
                           <p className="text-xs font-semibold text-amber-700">Aguardando ativação</p>
                           <p className="text-[11px] text-amber-600/80 mt-0.5">Siga os passos abaixo:</p>
                         </div>
                       </div>
                       <ul className="text-[11px] text-amber-700 space-y-1.5 ml-8 list-decimal">
                         <li>Crie uma regra de <strong>encaminhamento automático</strong> no seu provedor de e-mail.</li>
                         <li>Aponte o destino para o <strong>Endpoint Técnico</strong> acima.</li>
                         <li>Envie um e-mail de teste para verificar.</li>
                       </ul>
                    </div>
                 ) : (
                    <div className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-md text-xs font-medium text-emerald-700">
                       <Check size={14} className="shrink-0" />
                       Canal em operação.
                    </div>
                 )}
               </div>
            </Card>
          ))}
        </div>
      )}

      <Modal 
        isOpen={isCreating} 
        onClose={() => !submitting && setIsCreating(false)} 
        title="Novo Canal de E-mail"
        size="sm"
      >
        <form onSubmit={handleCreate} className="space-y-4 p-1">
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-md flex gap-2 items-start">
             <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
             <div className="space-y-1">
               <p className="text-xs font-semibold text-blue-700">Como funciona?</p>
               <p className="text-[11px] text-blue-600 leading-relaxed">
                 O Gestifique não acessa sua senha. Crie um endereço técnico aqui e configure o encaminhamento automático no seu provedor.
               </p>
             </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">E-mail de Suporte *</label>
            <Input
              type="email"
              placeholder="suporte@sua-empresa.com"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              className="h-8 text-sm"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Nome (Opcional)</label>
            <Input
              placeholder="Ex: Suporte Nível 1"
              value={newNome}
              onChange={e => setNewNome(e.target.value)}
              className="h-8 text-sm"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button size="sm" type="button" variant="ghost" onClick={() => setIsCreating(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button size="sm" type="submit" loading={submitting}>
              Gerar Endpoint
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
