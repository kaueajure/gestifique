import React, { useEffect, useState } from "react";
import {
  MessageCircle,
  RefreshCw,
  Send,
  Copy,
  Check,
  AlertTriangle,
  ShieldCheck,
  Link2,
  Phone,
} from "lucide-react";
import { PageShell } from "../layout/PageShell";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { api } from "../../lib/api";
import { cn } from "../../lib/utils";
import { User } from "../../types";
import { hasPermission } from "../../lib/permissions";

interface WhatsappPageProps {
  currentUser: User;
}

interface WhatsAppStatus {
  enabled: boolean;
  configured: boolean;
  phoneNumberId: string | null;
  businessAccountId: string | null;
  apiVersion: string;
  hasAccessToken: boolean;
  accessTokenPreview: string | null;
  hasAppSecret: boolean;
  verifyToken: string | null;
  callbackUrl: string;
  displayPhoneNumber: string | null;
}

interface WhatsAppMessage {
  id: number;
  wa_message_id: string | null;
  direction: "inbound" | "outbound";
  from_phone: string | null;
  to_phone: string | null;
  contact_name: string | null;
  message_type: string;
  body: string | null;
  status: string | null;
  created_at: string;
}

export const WhatsappPage = ({ currentUser }: WhatsappPageProps) => {
  const canManage = hasPermission(currentUser, "integracoes.whatsapp.gerenciar");
  const [status, setStatus] = useState<WhatsAppStatus | null>(null);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [to, setTo] = useState("5517992686132");
  const [text, setText] = useState("Olá! Teste de integração WhatsApp do Gestifique.");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statusData, messagesData] = await Promise.all([
        api.get<WhatsAppStatus>("/whatsapp/status"),
        api.get<WhatsAppMessage[]>("/whatsapp/messages?limit=40"),
      ]);
      setStatus(statusData);
      setMessages(messagesData);
    } catch (err: any) {
      setError(err?.message || "Não foi possível carregar o WhatsApp.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const copyValue = async (field: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      window.setTimeout(() => setCopiedField(null), 1600);
    } catch {
      setError("Não foi possível copiar para a área de transferência.");
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) return;
    setSending(true);
    setError(null);
    setSuccess(null);
    try {
      await api.post("/whatsapp/messages", { to, text });
      setSuccess("Mensagem enviada com sucesso.");
      setText("");
      await load();
    } catch (err: any) {
      setError(err?.message || "Falha ao enviar mensagem.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <PageShell
        title="WhatsApp"
        subtitle="Integração com a WhatsApp Cloud API (Meta) — webhooks, envio e mensagens recebidas."
        actions={
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw size={14} className={cn(loading && "animate-spin")} />
            Atualizar
          </Button>
        }
        contentClassName="overflow-y-auto p-4 sm:p-5 space-y-5"
      >
        {error && (
          <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            <Check size={16} className="mt-0.5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
            <div className="mb-3 flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-600" />
              <h2 className="text-sm font-semibold text-slate-900">Status da integração</h2>
            </div>
            <dl className="space-y-2 text-sm">
              <StatusRow
                label="Habilitado"
                value={status?.enabled ? "Sim" : "Não"}
                ok={!!status?.enabled}
              />
              <StatusRow
                label="Configurado"
                value={status?.configured ? "Pronto" : "Incompleto"}
                ok={!!status?.configured}
              />
              <StatusRow label="Phone Number ID" value={status?.phoneNumberId || "—"} />
              <StatusRow
                label="WABA ID"
                value={status?.businessAccountId || "—"}
              />
              <StatusRow label="API" value={status?.apiVersion || "—"} />
              <StatusRow
                label="Token"
                value={status?.accessTokenPreview || "Ausente"}
                ok={!!status?.hasAccessToken}
              />
              <StatusRow
                label="App Secret"
                value={status?.hasAppSecret ? "Configurado" : "Opcional (não definido)"}
                ok={!!status?.hasAppSecret}
              />
            </dl>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center gap-2">
              <Link2 size={16} className="text-blue-600" />
              <h2 className="text-sm font-semibold text-slate-900">
                Configuração de webhooks (Meta)
              </h2>
            </div>
            <p className="mb-4 text-sm text-slate-500">
              Cole estes valores em{" "}
              <span className="font-medium text-slate-700">
                Meta for Developers → WhatsApp → Configuration → Configure webhooks
              </span>
              . Depois de salvar, assine o campo <span className="font-medium">messages</span>.
            </p>

            <CopyField
              label="URL de callback"
              value={status?.callbackUrl || "https://gestifique.com.br/api/whatsapp/webhook"}
              fieldKey="callback"
              copiedField={copiedField}
              onCopy={copyValue}
            />
            <CopyField
              label="Verificar token"
              value={status?.verifyToken || "—"}
              fieldKey="verify"
              copiedField={copiedField}
              onCopy={copyValue}
              className="mt-3"
            />

            <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              A URL precisa ser HTTPS público e o servidor deve estar no ar antes de clicar em
              “Verificar e salvar”. Em apps não publicados, a Meta só envia webhooks de teste do
              dashboard.
            </div>
          </section>
        </div>

        {canManage && (
          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center gap-2">
              <Send size={16} className="text-blue-600" />
              <h2 className="text-sm font-semibold text-slate-900">Enviar mensagem de teste</h2>
            </div>
            <form onSubmit={handleSend} className="grid gap-3 sm:grid-cols-[220px_1fr_auto]">
              <Input
                label="Destino (E.164)"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="5511999999999"
                required
              />
              <Input
                label="Mensagem"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Texto da mensagem"
                required
              />
              <div className="flex items-end">
                <Button type="submit" loading={sending} disabled={!status?.configured}>
                  <Send size={14} />
                  Enviar
                </Button>
              </div>
            </form>
            <p className="mt-2 text-xs text-slate-500">
              Fora da janela de 24h, a Meta exige template aprovado — use a rota de template ou
              envie um template pelo painel da Meta primeiro.
            </p>
          </section>
        )}

        <section className="rounded-lg border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div className="flex items-center gap-2">
              <MessageCircle size={16} className="text-slate-600" />
              <h2 className="text-sm font-semibold text-slate-900">Mensagens recentes</h2>
            </div>
            <span className="text-xs text-slate-400">{messages.length} registros</span>
          </div>

          {loading ? (
            <div className="px-4 py-10 text-center text-sm text-slate-500">Carregando…</div>
          ) : messages.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-slate-500">
              Nenhuma mensagem ainda. Configure o webhook e envie um teste pela Meta ou pelo
              formulário acima.
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {messages.map((msg) => (
                <li key={msg.id} className="flex gap-3 px-4 py-3 text-sm">
                  <div
                    className={cn(
                      "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                      msg.direction === "inbound"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-blue-50 text-blue-700",
                    )}
                  >
                    {msg.direction === "inbound" ? <Phone size={14} /> : <Send size={14} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="font-medium text-slate-900">
                        {msg.contact_name ||
                          (msg.direction === "inbound" ? msg.from_phone : msg.to_phone) ||
                          "Desconhecido"}
                      </span>
                      <span className="text-xs uppercase tracking-wide text-slate-400">
                        {msg.direction} · {msg.message_type}
                        {msg.status ? ` · ${msg.status}` : ""}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-slate-600">
                      {msg.body || "(sem texto)"}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      {new Date(msg.created_at).toLocaleString("pt-BR")}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </PageShell>
    </div>
  );
};

function StatusRow({
  label,
  value,
  ok,
}: {
  label: string;
  value: string;
  ok?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-slate-500">{label}</dt>
      <dd
        className={cn(
          "text-right font-medium",
          ok === true && "text-emerald-700",
          ok === false && "text-amber-700",
          ok === undefined && "text-slate-900",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function CopyField({
  label,
  value,
  fieldKey,
  copiedField,
  onCopy,
  className,
}: {
  label: string;
  value: string;
  fieldKey: string;
  copiedField: string | null;
  onCopy: (field: string, value: string) => void;
  className?: string;
}) {
  const copied = copiedField === fieldKey;
  return (
    <div className={className}>
      <label className="mb-1 block text-xs font-semibold text-slate-700">{label}</label>
      <div className="flex items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-800">
          {value}
        </code>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onCopy(fieldKey, value)}
          disabled={!value || value === "—"}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Copiado" : "Copiar"}
        </Button>
      </div>
    </div>
  );
}
