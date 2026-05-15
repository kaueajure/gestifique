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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Canais de E-mail (Omnichannel)</h4>
          <p className="text-[11px] text-slate-500 font-medium max-w-md">Gerencie os endereços que recebem chamados. As mensagens enviadas para estes e-mails tornam-se tickets automaticamente.</p>
        </div>
        <Button size="sm" onClick={() => setIsCreating(true)} variant="primary" className="text-[10px] font-black uppercase tracking-widest bg-blue-600 shadow-sm border-blue-700">
          <Plus size={14} className="mr-1.5" /> Adicionar Canal
        </Button>
      </div>

      {loading ? (
        <div className="p-12 text-center flex flex-col items-center justify-center">
          <RefreshCw size={24} className="text-blue-500 animate-spin mb-3" />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Carregando seus canais...</p>
        </div>
      ) : error ? (
        <Card className="p-6 bg-rose-50 border-rose-100 flex items-center gap-3">
          <AlertCircle className="text-rose-600" size={20} />
           <p className="text-xs font-bold text-rose-700 uppercase tracking-tight">{error}</p>
           <Button variant="outline" size="sm" onClick={fetchChannels} className="ml-auto text-[10px] font-black uppercase tracking-widest bg-white border-rose-200 text-rose-600">Tentar Novamente</Button>
        </Card>
      ) : channels.length === 0 ? (
        <div className="p-10 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center space-y-4">
           <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mx-auto">
             <Send size={24} className="text-slate-300" />
           </div>
           <div className="space-y-1">
             <p className="text-sm font-black text-slate-700 uppercase tracking-tight">Nenhum canal configurado</p>
             <p className="text-[11px] text-slate-400 font-medium max-w-xs mx-auto">Transforme as mensagens do suporte da sua empresa em chamados centralizados no Gestifique.</p>
           </div>
           <Button onClick={() => setIsCreating(true)} variant="outline" className="text-[10px] font-black uppercase tracking-widest border-slate-200 text-slate-600">Configurar Agora</Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {channels.map(channel => (
            <Card key={channel.id} className="p-0 overflow-hidden border-slate-200 shadow-sm group hover:border-blue-200 transition-all">
               <div className="p-5 border-b border-slate-100 bg-white">
                 <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                         <Mail size={18} className="text-blue-600" />
                       </div>
                       <div>
                          <div className="flex items-center gap-2">
                             <span className="font-black text-sm text-slate-900 tracking-tight uppercase leading-none">{channel.email_publico}</span>
                             <Badge variant={channel.status === 'ativo' || channel.status === 'verificado' ? 'emerald' : channel.status === 'erro' ? 'red' : 'amber'} className="text-[9px] font-black px-1.5 py-0.5 uppercase tracking-widest">
                               {channel.status}
                             </Badge>
                          </div>
                          <div className="flex items-center gap-3 mt-1.5">
                            {channel.nome && <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{channel.nome}</span>}
                            {channel.last_received_at && (
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter flex items-center gap-1">
                                <Clock size={10} className="text-slate-300" /> Visto {formatRelativeTime(channel.last_received_at)}
                              </span>
                            )}
                          </div>
                       </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleRegenerate(channel.id)} title="Regerar Endereço Inbound" className="h-8 px-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                        <RefreshCw size={14} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(channel.id)} className="h-8 px-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
                        <Trash2 size={14} />
                      </Button>
                    </div>
                 </div>
               </div>

               <div className="p-5 bg-slate-50/50 space-y-4">
                 <div className="space-y-2">
                   <div className="flex items-center justify-between">
                     <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                       <ShieldCheck size={10} className="text-blue-500" /> Endpoint Técnico (ID Inbound)
                     </span>
                     <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Não compartilhe este endereço</span>
                   </div>
                   <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-4 group/box hover:border-blue-300 transition-all">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-mono text-slate-600 truncate select-all">{channel.inbound_address}</p>
                      </div>
                      <Button 
                        variant="primary" 
                        size="sm" 
                        className={cn(
                          "shrink-0 h-8 text-[10px] font-black uppercase tracking-widest transition-all",
                          copiedId === channel.id ? "bg-emerald-600 border-emerald-700" : "bg-blue-600 border-blue-700"
                        )}
                        onClick={() => handleCopy(channel.id, channel.inbound_address)}
                      >
                        {copiedId === channel.id ? <Check size={14} className="mr-1.5" /> : <Copy size={14} className="mr-1.5" />}
                        {copiedId === channel.id ? 'Copiado' : 'Copiar'}
                      </Button>
                   </div>
                 </div>

                 {channel.ultimo_erro ? (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-[11px] font-bold text-red-700 flex items-start gap-2 animate-shake">
                       <AlertCircle size={14} className="shrink-0 mt-0.5" />
                       <div className="space-y-1">
                          <p className="uppercase tracking-tight">Erro detectado no canal:</p>
                          <p className="font-medium normal-case bg-white/50 p-1.5 rounded border border-red-200 mt-1">{channel.ultimo_erro}</p>
                       </div>
                    </div>
                 ) : channel.status === 'pendente' ? (
                    <div className="p-3.5 bg-amber-50 border border-amber-100 rounded-xl space-y-3">
                       <div className="flex items-start gap-3">
                         <div className="w-8 h-8 rounded-lg bg-white border border-amber-200 flex items-center justify-center shrink-0">
                           <History size={16} className="text-amber-600" />
                         </div>
                         <div className="space-y-1">
                           <p className="text-[11px] font-black text-amber-700 uppercase tracking-tight">Instruções de Configuração</p>
                           <p className="text-[10px] text-amber-600 font-medium leading-relaxed">
                             Este canal está aguardando ativação. Siga os passos:
                           </p>
                         </div>
                       </div>
                       <ul className="text-[10px] font-bold text-amber-700 space-y-2 ml-1">
                         <li className="flex items-center gap-2">
                           <div className="w-4 h-4 rounded-full bg-amber-200 flex items-center justify-center text-[8px]">1</div>
                           No seu provedor de e-mail (Gmail/Outlook), crie uma regra de <span className="underline">encaminhamento automático</span>.
                         </li>
                         <li className="flex items-center gap-2">
                           <div className="w-4 h-4 rounded-full bg-amber-200 flex items-center justify-center text-[8px]">2</div>
                           O destino do encaminhamento deve ser o <span className="bg-amber-200/50 px-1 rounded">Endpoint Técnico</span> copiado acima.
                         </li>
                         <li className="flex items-center gap-2">
                           <div className="w-4 h-4 rounded-full bg-amber-200 flex items-center justify-center text-[8px]">3</div>
                           Envie um e-mail de teste diretamente para o seu e-mail público para verificar a ativação.
                         </li>
                       </ul>
                    </div>
                 ) : (
                    <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-100 rounded-xl text-[10px] font-black text-emerald-700 uppercase tracking-widest">
                       <Check size={14} className="shrink-0" />
                       Canal em plena operação e sincronizado em tempo real.
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
        title="Novo Canal Omnichannel"
      >
        <form onSubmit={handleCreate} className="space-y-5 p-2">
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex gap-3 items-start">
             <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
             <div className="space-y-1">
               <p className="text-[11px] font-black text-blue-700 uppercase tracking-tight">Como funciona?</p>
               <p className="text-[10px] text-blue-600 font-medium leading-relaxed">
                 O Gestifique não acessa sua senha de e-mail. Você cria um endereço técnico seguro aqui e, 
                 no seu painel de TI (Outlook/GSuite/CPanel), você configura o encaminhamento automático. 
                 Privacidade total e performance real-time.
               </p>
             </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">E-mail de Suporte (Ex: contato@empresa.com)</label>
            <Input
              type="email"
              placeholder="suporte@suaempresa.com.br"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              className="h-11 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all text-sm font-medium"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Identificador Interno (Opcional)</label>
            <Input
              placeholder="Ex: Suporte Nível 1"
              value={newNome}
              onChange={e => setNewNome(e.target.value)}
              className="h-11 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all text-sm font-medium"
            />
          </div>

          <div className="pt-4 flex flex-col gap-2">
            <Button type="submit" loading={submitting} className="h-11 rounded-xl bg-blue-600 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-blue-500/20 border-blue-700">
              Gerar Endpoint Técnico
            </Button>
            <Button type="button" variant="ghost" onClick={() => setIsCreating(false)} disabled={submitting} className="h-11 font-black uppercase text-[10px] tracking-widest text-slate-400">
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
