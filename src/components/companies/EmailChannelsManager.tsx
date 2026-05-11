import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Mail, Trash2, RefreshCw, Copy, Check, Plus, AlertCircle, Send } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Modal } from '../ui/Modal';

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
        <div>
          <h4 className="text-sm font-semibold text-slate-900 border-b-0">Canais de E-mail Verificados</h4>
          <p className="text-xs text-slate-500 font-medium">Configure encaminhamentos para transformar e-mails em tickets.</p>
        </div>
        <Button size="sm" onClick={() => setIsCreating(true)} variant="outline" className="text-xs">
          <Plus size={14} className="mr-1.5" /> Adicionar
        </Button>
      </div>

      {loading ? (
        <div className="p-4 text-center text-xs text-slate-500">Carregando canais...</div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg text-xs font-semibold">{error}</div>
      ) : channels.length === 0 ? (
        <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center space-y-2">
           <Send size={24} className="mx-auto text-slate-300" />
           <p className="text-sm font-medium text-slate-600">Nenhum canal configurado</p>
           <p className="text-xs text-slate-400">Transforme mensagens do seu domínio em chamados via encaminhamento.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {channels.map(channel => (
            <div key={channel.id} className="p-4 border border-slate-200 rounded-xl space-y-3 bg-white">
               <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                       <Mail size={14} className="text-blue-500" />
                       <span className="font-bold text-sm text-slate-900">{channel.email_publico}</span>
                       <Badge variant={channel.status === 'ativo' || channel.status === 'verificado' ? 'emerald' : channel.status === 'erro' ? 'red' : 'amber'} className="text-[10px]">
                         {channel.status.toUpperCase()}
                       </Badge>
                    </div>
                    {channel.nome && <p className="text-xs text-slate-500 mt-0.5">{channel.nome}</p>}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleRegenerate(channel.id)} title="Regerar Endereço Inbound" className="h-8 px-2 text-slate-400 hover:text-blue-600">
                      <RefreshCw size={14} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(channel.id)} className="h-8 px-2 text-slate-400 hover:text-red-600">
                      <Trash2 size={14} />
                    </Button>
                  </div>
               </div>

               <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Encaminhe os e-mails para:</p>
                    <p className="text-xs font-mono text-slate-700 truncate">{channel.inbound_address}</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="shrink-0 h-8 text-xs"
                    onClick={() => handleCopy(channel.id, channel.inbound_address)}
                  >
                    {copiedId === channel.id ? <Check size={14} className="text-emerald-500 mr-1.5" /> : <Copy size={14} className="mr-1.5 text-slate-400" />}
                    Copiar
                  </Button>
               </div>

               {channel.status === 'pendente' && (
                  <div className="flex items-start gap-2 text-amber-600 bg-amber-50 p-2.5 rounded border border-amber-100 text-xs">
                     <AlertCircle size={14} className="shrink-0 mt-0.5" />
                     <p>Aguardando o primeiro e-mail. Para ativar, envie uma mensagem de teste para o seu e-mail público e garanta que o encaminhamento esteja ativo em seu provedor.</p>
                  </div>
               )}
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isCreating} onClose={() => !submitting && setIsCreating(false)} title="Novo Canal de E-mail">
        <form onSubmit={handleCreate} className="space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed max-w-sm mb-4">
            Aqui você cria um endereço técnico seguro (inbound). A empresa no provedor dela deverá encaminhar as mensagens para este endereço gerado.
          </p>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Qual e-mail o cliente mandará mensagem?</label>
            <Input
              type="email"
              placeholder="Ex: suporte@empresa.com.br"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Nome do canal (opcional)</label>
            <Input
              placeholder="Ex: Suporte Técnico"
              value={newNome}
              onChange={e => setNewNome(e.target.value)}
            />
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setIsCreating(false)} disabled={submitting}>Cancelar</Button>
            <Button type="submit" loading={submitting}>Criar Canal</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
