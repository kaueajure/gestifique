import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { 
  Mail, Trash2, RefreshCw, Copy, Check, Plus, AlertCircle, 
  Send, Clock, History, Info, ShieldCheck, Unplug, LogOut
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
  send_provider?: 'smtp_global' | 'gmail_oauth';
  send_status?: 'disconnected' | 'connected' | 'expired' | 'error';
  oauth_email?: string;
  oauth_connected_at?: string;
  oauth_last_error?: string;
  send_last_at?: string;
  send_last_test_at?: string;
  send_last_test_result?: 'ok' | 'fail';
}

interface EmailChannelsManagerProps {
  empresaId: number;
}

const sendStatusLabel: Record<string, string> = {
  disconnected: 'Envio não configurado',
  connected: 'Gmail conectado',
  expired: 'Reconectar Gmail',
  error: 'Erro no envio',
};

const sendStatusVariant = (status?: string): 'emerald' | 'amber' | 'red' => {
  if (status === 'connected') return 'emerald';
  if (status === 'expired' || status === 'error') return 'red';
  return 'amber';
};

export const EmailChannelsManager = ({ empresaId }: EmailChannelsManagerProps) => {
  const [channels, setChannels] = useState<EmailChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  const [isCreating, setIsCreating] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newNome, setNewNome] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionChannelId, setActionChannelId] = useState<number | null>(null);
  
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const fetchChannels = useCallback(async () => {
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
  }, [empresaId]);

  const clearOAuthQueryParams = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('gmail_oauth');
    url.searchParams.delete('empresa_id');
    url.searchParams.delete('channel_id');
    url.searchParams.delete('message');
    window.history.replaceState({}, '', url.toString());
  };

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthResult = params.get('gmail_oauth');
    if (!oauthResult) return;

    const paramEmpresaId = params.get('empresa_id');
    if (paramEmpresaId && Number(paramEmpresaId) !== empresaId) return;

    if (oauthResult === 'success') {
      setFeedback({
        type: 'success',
        message: 'Gmail conectado com sucesso. As respostas dos tickets sairão com o e-mail da sua empresa.',
      });
      fetchChannels();
    } else if (oauthResult === 'error') {
      setFeedback({
        type: 'error',
        message: params.get('message') || 'Não foi possível conectar o Gmail.',
      });
    }

    clearOAuthQueryParams();
  }, [empresaId, fetchChannels]);

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 8000);
    return () => clearTimeout(timer);
  }, [feedback]);

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

  const handleConnectGmail = (channelId: number) => {
    window.location.href = `/api/companies/${empresaId}/email-channels/${channelId}/oauth/google/start`;
  };

  const handleDisconnectGmail = async (channelId: number) => {
    if (!confirm('Desconectar o Gmail deste canal? As respostas voltarão a sair pelo e-mail padrão do Gestifique.')) return;
    try {
      setActionChannelId(channelId);
      await api.post(`/companies/${empresaId}/email-channels/${channelId}/oauth/google/disconnect`, {});
      setFeedback({ type: 'success', message: 'Gmail desconectado com sucesso.' });
      fetchChannels();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erro ao desconectar Gmail' });
    } finally {
      setActionChannelId(null);
    }
  };

  const handleTestSend = async (channelId: number) => {
    try {
      setActionChannelId(channelId);
      await api.post(`/companies/${empresaId}/email-channels/${channelId}/oauth/google/test-send`, {});
      setFeedback({ type: 'success', message: 'E-mail de teste enviado. Verifique a caixa de entrada do e-mail do canal.' });
      fetchChannels();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erro ao enviar teste' });
    } finally {
      setActionChannelId(null);
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
          <p className="text-xs text-slate-500 max-w-md">Receba tickets por encaminhamento e responda com o e-mail da sua empresa.</p>
        </div>
        <Button size="sm" onClick={() => setIsCreating(true)} className="h-8 text-xs shrink-0 bg-blue-600 hover:bg-blue-700">
          <Plus size={14} className="mr-1" /> Adicionar Canal
        </Button>
      </div>

      {feedback && (
        <Card className={cn(
          'p-3 flex items-start gap-2 text-xs',
          feedback.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-700'
        )}>
          {feedback.type === 'success' ? <Check size={14} className="shrink-0 mt-0.5" /> : <AlertCircle size={14} className="shrink-0 mt-0.5" />}
          <p className="font-medium">{feedback.message}</p>
        </Card>
      )}

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
          {channels.map(channel => {
            const sendStatus = channel.send_status || 'disconnected';
            const isSendConnected = sendStatus === 'connected';
            const isActionLoading = actionChannelId === channel.id;

            return (
            <Card key={channel.id} className="p-0 overflow-hidden border-slate-200 shadow-sm">
               <div className="p-4 border-b border-slate-100 bg-white">
                 <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-md bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                         <Mail size={16} className="text-blue-600" />
                       </div>
                       <div>
                          <div className="flex items-center gap-2 flex-wrap">
                             <span className="font-semibold text-sm text-slate-800">{channel.email_publico}</span>
                             <Badge variant={channel.status === 'ativo' || channel.status === 'verificado' ? 'emerald' : channel.status === 'erro' ? 'red' : 'amber'} className="text-[10px] h-5">
                               Recebimento: {channel.status}
                             </Badge>
                             <Badge variant={sendStatusVariant(sendStatus)} className="text-[10px] h-5">
                               {sendStatusLabel[sendStatus] || sendStatus}
                             </Badge>
                          </div>
                          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                            {channel.nome && <span className="text-xs font-medium text-slate-500">{channel.nome}</span>}
                            {channel.last_received_at && (
                              <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                                <Clock size={12} className="text-slate-300" /> Recebido {formatRelativeTime(channel.last_received_at)}
                              </span>
                            )}
                            {channel.send_last_at && (
                              <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                                <Send size={12} className="text-slate-300" /> Enviado {formatRelativeTime(channel.send_last_at)}
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
                       <ShieldCheck size={12} className="text-blue-500" /> Endereço de encaminhamento (recebimento)
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

                 <div className="p-3 bg-white border border-slate-200 rounded-md space-y-3">
                   <div className="flex items-start gap-2">
                     <div className="w-6 h-6 rounded bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                       <Send size={14} className="text-blue-600" />
                     </div>
                     <div className="flex-1 min-w-0">
                       <p className="text-xs font-semibold text-slate-800">Envio de respostas</p>
                       <p className="text-[11px] text-slate-500 mt-0.5">
                         Conecte o Gmail de <strong>{channel.email_publico}</strong> para que respostas do painel saiam com esse remetente.
                       </p>
                     </div>
                   </div>

                   {channel.oauth_last_error && (
                     <div className="p-2 bg-red-50 border border-red-100 rounded text-[11px] text-red-700">
                       {channel.oauth_last_error}
                     </div>
                   )}

                   <div className="flex flex-wrap gap-2">
                     {!isSendConnected ? (
                       <Button
                         size="sm"
                         className="h-7 text-[11px] bg-blue-600 hover:bg-blue-700"
                         onClick={() => handleConnectGmail(channel.id)}
                       >
                         Conectar Gmail para envio
                       </Button>
                     ) : (
                       <>
                         <Button
                           size="sm"
                           variant="outline"
                           className="h-7 text-[11px]"
                           onClick={() => handleTestSend(channel.id)}
                           loading={isActionLoading}
                         >
                           Testar envio
                         </Button>
                         <Button
                           size="sm"
                           variant="outline"
                           className="h-7 text-[11px] text-slate-600"
                           onClick={() => handleConnectGmail(channel.id)}
                         >
                           <RefreshCw size={12} className="mr-1" /> Reconectar
                         </Button>
                         <Button
                           size="sm"
                           variant="ghost"
                           className="h-7 text-[11px] text-red-600 hover:text-red-700 hover:bg-red-50"
                           onClick={() => handleDisconnectGmail(channel.id)}
                           loading={isActionLoading}
                         >
                           <LogOut size={12} className="mr-1" /> Desconectar
                         </Button>
                       </>
                     )}
                   </div>

                   {(sendStatus === 'expired' || sendStatus === 'error') && (
                     <div className="flex items-start gap-2 p-2 bg-amber-50 border border-amber-100 rounded text-[11px] text-amber-800">
                       <Unplug size={14} className="shrink-0 mt-0.5" />
                       <p>Reconecte o Gmail para voltar a enviar respostas com o e-mail da empresa.</p>
                     </div>
                   )}
                 </div>

                 {channel.ultimo_erro ? (
                    <div className="p-2.5 bg-red-50 border border-red-100 rounded-md text-[11px] text-red-700 flex items-start gap-2">
                       <AlertCircle size={14} className="shrink-0 mt-0.5" />
                       <div>
                          <p className="font-semibold mb-0.5">Erro no recebimento:</p>
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
                           <p className="text-xs font-semibold text-amber-700">Aguardando primeiro e-mail</p>
                           <p className="text-[11px] text-amber-600/80 mt-0.5">Configure o encaminhamento no seu provedor:</p>
                         </div>
                       </div>
                       <ul className="text-[11px] text-amber-700 space-y-1.5 ml-8 list-decimal">
                         <li>Crie uma regra de <strong>encaminhamento automático</strong> para <strong>{channel.email_publico}</strong>.</li>
                         <li>Aponte o destino para o endereço de encaminhamento acima.</li>
                         <li>Envie um e-mail de teste para ativar o recebimento.</li>
                         <li>Conecte o Gmail para que as respostas saiam com o e-mail da empresa.</li>
                       </ul>
                    </div>
                 ) : (
                    <div className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-md text-xs font-medium text-emerald-700">
                       <Check size={14} className="shrink-0" />
                       Recebimento em operação.
                    </div>
                 )}
               </div>
            </Card>
          );
          })}
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
                 Cadastre o e-mail de suporte da empresa, configure o encaminhamento e conecte o Gmail para enviar respostas com a identidade da empresa.
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
              Criar canal
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
