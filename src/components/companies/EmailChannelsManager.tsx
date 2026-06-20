import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Check, Clock, Copy, History, Info, Mail, Plus, RefreshCw, Send, ShieldCheck, Trash2 } from 'lucide-react';
import { api } from '../../lib/api';
import { cn, formatRelativeTime } from '../../lib/utils';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
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
  // Envio por canal (SMTP da empresa). Senha NUNCA é exposta.
  smtp_enabled?: boolean | number;
  smtp_host?: string | null;
  smtp_port?: number | null;
  smtp_secure?: boolean | number;
  smtp_user?: string | null;
  smtp_from_name?: string | null;
  smtp_status?: 'not_configured' | 'configured' | 'verified' | 'error';
  smtp_last_test_at?: string | null;
  smtp_last_error?: string | null;
}

const getSmtpStatusInfo = (status?: string) => {
  switch (status) {
    case 'verified':
      return { label: 'Verificado', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'configured':
      return { label: 'Configurado', cls: 'bg-amber-50 text-amber-700 border-amber-200' };
    case 'error':
      return { label: 'Erro', cls: 'bg-red-50 text-red-700 border-red-200' };
    default:
      return { label: 'Não configurado', cls: 'bg-slate-100 text-slate-500 border-slate-200' };
  }
};

interface EmailChannelsManagerProps {
  empresaId: number;
}

interface CreateEmailChannelResponse {
  id: number;
}

export const EmailChannelsManager = ({ empresaId }: EmailChannelsManagerProps) => {
  const [channels, setChannels] = useState<EmailChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [isCreating, setIsCreating] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newNome, setNewNome] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // --- Configuração de SMTP por canal ---
  const [smtpModalChannel, setSmtpModalChannel] = useState<EmailChannel | null>(null);
  const [smtpForm, setSmtpForm] = useState({
    smtp_enabled: false,
    smtp_host: '',
    smtp_port: 587,
    smtp_secure: false,
    smtp_user: '',
    smtp_from_name: '',
  });
  const [smtpPassword, setSmtpPassword] = useState('');
  const [smtpError, setSmtpError] = useState<string | null>(null);
  const [smtpSaving, setSmtpSaving] = useState(false);
  const [smtpTesting, setSmtpTesting] = useState(false);

  const channelHasStoredPassword = (c: EmailChannel | null) =>
    !!c && !!c.smtp_status && c.smtp_status !== 'not_configured';

  const openSmtpModal = (channel: EmailChannel) => {
    setSmtpModalChannel(channel);
    setSmtpForm({
      smtp_enabled: !!Number(channel.smtp_enabled),
      smtp_host: channel.smtp_host || '',
      smtp_port: channel.smtp_port || 587,
      smtp_secure: !!Number(channel.smtp_secure),
      smtp_user: channel.smtp_user || '',
      smtp_from_name: channel.smtp_from_name || '',
    });
    setSmtpPassword('');
    setSmtpError(null);
  };

  const closeSmtpModal = () => {
    if (smtpSaving || smtpTesting) return;
    setSmtpModalChannel(null);
    setSmtpPassword('');
    setSmtpError(null);
  };

  const handleSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smtpModalChannel) return;

    const hasStored = channelHasStoredPassword(smtpModalChannel);
    if (smtpForm.smtp_enabled) {
      if (!smtpForm.smtp_host.trim()) { setSmtpError('Host SMTP é obrigatório.'); return; }
      const portNum = Number(smtpForm.smtp_port);
      if (!Number.isInteger(portNum) || portNum <= 0 || portNum > 65535) { setSmtpError('Porta SMTP inválida.'); return; }
      if (!smtpForm.smtp_user.trim()) { setSmtpError('Usuário SMTP é obrigatório.'); return; }
      if (!smtpPassword && !hasStored) { setSmtpError('Senha SMTP é obrigatória para ativar o envio.'); return; }
    }

    try {
      setSmtpSaving(true);
      setSmtpError(null);
      const payload: any = {
        smtp_enabled: smtpForm.smtp_enabled,
        smtp_host: smtpForm.smtp_host.trim() || null,
        smtp_port: Number(smtpForm.smtp_port) || null,
        smtp_secure: smtpForm.smtp_secure,
        smtp_user: smtpForm.smtp_user.trim() || null,
        smtp_from_name: smtpForm.smtp_from_name.trim() || null,
      };
      // Só envia a senha se uma NOVA foi digitada (não sobrescreve a existente com vazio).
      if (smtpPassword) payload.password = smtpPassword;

      await api.put(`/companies/${empresaId}/email-channels/${smtpModalChannel.id}/smtp`, payload);
      setSmtpPassword('');
      setFeedback({ type: 'success', message: 'Configuração de envio salva.' });
      await fetchChannels();
      closeSmtpModal();
    } catch (err: any) {
      setSmtpError(err.message || 'Erro ao salvar configuração SMTP.');
    } finally {
      setSmtpSaving(false);
    }
  };

  const handleTestSmtp = async () => {
    if (!smtpModalChannel) return;
    try {
      setSmtpTesting(true);
      setSmtpError(null);
      const res = await api.post<{ sentTo?: string }>(
        `/companies/${empresaId}/email-channels/${smtpModalChannel.id}/smtp/test`,
        {}
      );
      setFeedback({ type: 'success', message: `E-mail de teste enviado para ${res?.sentTo || smtpModalChannel.email_publico}.` });
      await fetchChannels();
    } catch (err: any) {
      setSmtpError(err.message || 'Falha no teste de SMTP. Verifique host, porta, usuário e senha.');
    } finally {
      setSmtpTesting(false);
    }
  };

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

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 5000);
    return () => clearTimeout(timer);
  }, [feedback]);

  const openCreateModal = () => {
    setNewEmail('');
    setNewNome('');
    setCreateError(null);
    setIsCreating(true);
  };

  const closeCreateModal = () => {
    if (submitting) return;
    setCreateError(null);
    setIsCreating(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) return;

    try {
      setSubmitting(true);
      setCreateError(null);

      await api.post<CreateEmailChannelResponse>(`/companies/${empresaId}/email-channels`, {
        email_publico: newEmail.trim(),
        nome: newNome.trim(),
      });

      setNewEmail('');
      setNewNome('');
      setIsCreating(false);
      setFeedback({ type: 'success', message: 'Canal criado com sucesso.' });
      fetchChannels();
    } catch (err: any) {
      setCreateError(err.message || 'Erro ao criar canal');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Remover este canal de e-mail? Nenhum novo ticket sera recebido por este endereco tecnico.')) return;

    try {
      await api.delete(`/companies/${empresaId}/email-channels/${id}`);
      setFeedback({ type: 'success', message: 'Canal removido com sucesso.' });
      fetchChannels();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erro ao remover canal' });
    }
  };

  const handleRegenerate = async (id: number) => {
    if (!confirm('Regerar o endereco de encaminhamento? O endereco antigo para de funcionar imediatamente.')) return;

    try {
      await api.post(`/companies/${empresaId}/email-channels/${id}/regenerate`, {});
      setFeedback({ type: 'success', message: 'Endereco de encaminhamento regenerado.' });
      fetchChannels();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erro ao regenerar canal' });
    }
  };

  const handleCopy = (id: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <h4 className="text-sm font-semibold text-slate-800">Canais de E-mail</h4>
          <p className="text-xs text-slate-500 max-w-md">
            Receba tickets por encaminhamento e responda pelo SMTP configurado no sistema.
          </p>
        </div>
        <Button size="sm" onClick={openCreateModal} className="h-8 text-xs shrink-0 bg-blue-600 hover:bg-blue-700">
          <Plus size={14} className="mr-1" /> Adicionar Canal
        </Button>
      </div>

      {feedback && (
        <Card
          className={cn(
            'p-3 flex items-start gap-2 text-xs',
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
              : 'bg-red-50 border-red-100 text-red-700'
          )}
        >
          {feedback.type === 'success' ? (
            <Check size={14} className="shrink-0 mt-0.5" />
          ) : (
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
          )}
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
          <Button variant="outline" size="sm" onClick={fetchChannels} className="text-xs h-7 text-red-600 border-red-200">
            Refazer
          </Button>
        </Card>
      ) : channels.length === 0 ? (
        <div className="p-8 bg-slate-50 border border-dashed border-slate-200 rounded-md text-center space-y-3">
          <div className="w-10 h-10 bg-white rounded-full shadow-sm border border-slate-100 flex items-center justify-center mx-auto">
            <Send size={20} className="text-slate-400" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-700">Nenhum canal configurado</p>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">Transforme e-mails encaminhados em chamados no Gestifique.</p>
          </div>
          <Button size="sm" onClick={openCreateModal} variant="outline" className="h-8 text-xs">
            Configurar
          </Button>
        </div>
      ) : (
        <div className="grid gap-3">
          {channels.map((channel) => (
            <Card key={channel.id} className="p-0 overflow-hidden border-slate-200 shadow-sm">
              <div className="p-4 border-b border-slate-100 bg-white">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-md bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                      <Mail size={16} className="text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-slate-800 break-all">{channel.email_publico}</span>
                        <Badge
                          variant={channel.status === 'ativo' || channel.status === 'verificado' ? 'emerald' : channel.status === 'erro' ? 'red' : 'amber'}
                          className="text-[10px] h-5"
                        >
                          Recebimento: {channel.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        {channel.nome && <span className="text-xs font-medium text-slate-500">{channel.nome}</span>}
                        {channel.last_received_at && (
                          <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                            <Clock size={12} className="text-slate-300" /> Recebido {formatRelativeTime(channel.last_received_at)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRegenerate(channel.id)}
                      title="Regerar endereco inbound"
                      className="h-7 w-7 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md"
                    >
                      <RefreshCw size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(channel.id)}
                      className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50/50 space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                      <ShieldCheck size={12} className="text-blue-500" /> Endereco de encaminhamento
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
                        'shrink-0 h-7 text-[11px] transition-all',
                        copiedId === channel.id ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'
                      )}
                      onClick={() => handleCopy(channel.id, channel.inbound_address)}
                    >
                      {copiedId === channel.id ? <Check size={12} className="mr-1" /> : <Copy size={12} className="mr-1" />}
                      {copiedId === channel.id ? 'Copiado' : 'Copiar'}
                    </Button>
                  </div>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-md space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                        <Send size={14} className="text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800">Envio de respostas</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          O cliente recebe as respostas como <strong className="break-all">{channel.email_publico}</strong>.
                        </p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        'shrink-0 rounded px-2 py-0.5 text-[10px] font-semibold border',
                        getSmtpStatusInfo(channel.smtp_status).cls
                      )}
                    >
                      Envio: {getSmtpStatusInfo(channel.smtp_status).label}
                    </span>
                  </div>

                  {channel.smtp_status === 'error' && channel.smtp_last_error && (
                    <p className="text-[11px] text-red-700 bg-red-50 border border-red-100 rounded p-1.5 flex items-start gap-1.5">
                      <AlertCircle size={12} className="shrink-0 mt-0.5" />
                      <span className="break-words">{channel.smtp_last_error}</span>
                    </p>
                  )}

                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-[11px]"
                      onClick={() => openSmtpModal(channel)}
                    >
                      Configurar envio
                    </Button>
                  </div>
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
                      <li>Crie uma regra de encaminhamento automatico para <strong>{channel.email_publico}</strong>.</li>
                      <li>Aponte o destino para o endereco de encaminhamento acima.</li>
                      <li>Envie um e-mail de teste para ativar o recebimento.</li>
                    </ul>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-md text-xs font-medium text-emerald-700">
                    <Check size={14} className="shrink-0" />
                    Recebimento em operacao.
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={isCreating} onClose={closeCreateModal} title="Adicionar Canal de E-mail" size="md">
        <form onSubmit={handleCreate} className="space-y-4 p-1">
          {createError && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-md flex gap-2 items-start text-red-700">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <p className="text-xs font-medium">{createError}</p>
            </div>
          )}

          <div className="p-3 bg-blue-50 border border-blue-100 rounded-md flex gap-2 items-start">
            <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-semibold text-blue-700">Como funciona?</p>
              <p className="text-[11px] text-blue-600 leading-relaxed">
                Cadastre o e-mail de suporte da empresa e configure uma regra de encaminhamento para o endereco tecnico gerado.
              </p>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">E-mail de Suporte *</label>
            <Input
              type="email"
              placeholder="suporte@sua-empresa.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="h-8 text-sm"
              disabled={submitting}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Nome (Opcional)</label>
            <Input
              placeholder="Ex: Suporte Nivel 1"
              value={newNome}
              onChange={(e) => setNewNome(e.target.value)}
              className="h-8 text-sm"
              disabled={submitting}
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button size="sm" type="button" variant="ghost" onClick={closeCreateModal} disabled={submitting}>
              Cancelar
            </Button>
            <Button size="sm" type="submit" loading={submitting}>
              Criar canal
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!smtpModalChannel}
        onClose={closeSmtpModal}
        title="Configurar envio (SMTP do canal)"
        size="md"
      >
        <form onSubmit={handleSaveSmtp} className="space-y-4 p-1">
          {smtpError && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-md flex gap-2 items-start text-red-700">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <p className="text-xs font-medium">{smtpError}</p>
            </div>
          )}

          <div className="p-3 bg-blue-50 border border-blue-100 rounded-md flex gap-2 items-start">
            <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-blue-700 leading-relaxed">
              Essa configuração permite que o cliente receba as respostas do ticket como vindas de{' '}
              <strong className="break-all">{smtpModalChannel?.email_publico}</strong>. Use o SMTP do
              provedor desse e-mail (ex.: senha de aplicativo).
            </p>
          </div>

          <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
            <input
              type="checkbox"
              checked={smtpForm.smtp_enabled}
              onChange={(e) => setSmtpForm((f) => ({ ...f, smtp_enabled: e.target.checked }))}
              disabled={smtpSaving}
            />
            Habilitar envio por este canal
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-medium text-slate-700">Host SMTP</label>
              <Input
                placeholder="smtp.empresa.com"
                value={smtpForm.smtp_host}
                onChange={(e) => setSmtpForm((f) => ({ ...f, smtp_host: e.target.value }))}
                className="h-8 text-sm"
                disabled={smtpSaving}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Porta</label>
              <Input
                type="number"
                placeholder="587"
                value={String(smtpForm.smtp_port ?? '')}
                onChange={(e) => setSmtpForm((f) => ({ ...f, smtp_port: Number(e.target.value) }))}
                className="h-8 text-sm"
                disabled={smtpSaving}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
            <input
              type="checkbox"
              checked={smtpForm.smtp_secure}
              onChange={(e) => setSmtpForm((f) => ({ ...f, smtp_secure: e.target.checked }))}
              disabled={smtpSaving}
            />
            Conexão segura SSL/TLS (porta 465). Deixe desmarcado para STARTTLS (porta 587).
          </label>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Usuário SMTP</label>
            <Input
              placeholder="suporte@empresa.com"
              value={smtpForm.smtp_user}
              onChange={(e) => setSmtpForm((f) => ({ ...f, smtp_user: e.target.value }))}
              className="h-8 text-sm"
              disabled={smtpSaving}
              autoComplete="off"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Senha SMTP</label>
            <Input
              type="password"
              placeholder={channelHasStoredPassword(smtpModalChannel) ? 'Senha já configurada (deixe em branco para manter)' : 'Senha / senha de aplicativo'}
              value={smtpPassword}
              onChange={(e) => setSmtpPassword(e.target.value)}
              className="h-8 text-sm"
              disabled={smtpSaving}
              autoComplete="new-password"
            />
            <p className="text-[10px] text-slate-400">A senha é armazenada de forma cifrada e nunca é exibida novamente.</p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Nome do remetente (opcional)</label>
            <Input
              placeholder="Ex: Suporte Empresa"
              value={smtpForm.smtp_from_name}
              onChange={(e) => setSmtpForm((f) => ({ ...f, smtp_from_name: e.target.value }))}
              className="h-8 text-sm"
              disabled={smtpSaving}
            />
          </div>

          <div className="pt-2 flex justify-between gap-2">
            <Button
              size="sm"
              type="button"
              variant="outline"
              onClick={handleTestSmtp}
              loading={smtpTesting}
              disabled={smtpSaving || !channelHasStoredPassword(smtpModalChannel)}
              title={!channelHasStoredPassword(smtpModalChannel) ? 'Salve a configuração antes de testar.' : 'Envia um e-mail de teste usando a configuração salva.'}
            >
              <Send size={14} className="mr-1" /> Testar envio
            </Button>
            <div className="flex gap-2">
              <Button size="sm" type="button" variant="ghost" onClick={closeSmtpModal} disabled={smtpSaving || smtpTesting}>
                Cancelar
              </Button>
              <Button size="sm" type="submit" loading={smtpSaving}>
                Salvar configuração
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
