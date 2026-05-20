import React, { useState, useEffect } from "react";
import { api } from "../../lib/api";
import { DashboardData, Ticket } from "../../types";
import { MetricCard } from "../ui/MetricCard";
import {
  Ticket as TicketIcon,
  CheckCircle2,
  AlertCircle,
  Calendar,
  ChevronRight,
  User as UserIcon,
  Plus,
  Building,
} from "lucide-react";
import { PageShell } from "../layout/PageShell";
import { SectionHeader } from "../ui/SectionHeader";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card, CardContent, CardHeader } from "../ui/Card";
import { LoadingState } from "../ui/LoadingState";
import { ErrorState } from "../ui/ErrorState";
import { EmptyState } from "../ui/EmptyState";
import {
  compactDateFormatter,
  statusToBadgeVariant,
  priorityToBadgeVariant,
} from "../../lib/utils";

interface DashboardPageProps {
  onNavigate?: (
    tab:
      | "dashboard"
      | "tickets"
      | "users"
      | "companies"
      | "logs"
      | "profile"
      | "settings",
  ) => void;
}

export const DashboardPage = ({ onNavigate }: DashboardPageProps) => {
  const [stats, setStats] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.get<DashboardData>("/dashboard/summary");
        setStats(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Ocorreu um erro ao carregar o dashboard.",
        );
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const chamadosAtivos = stats?.chamadosAtivos || 0;
  const resolvidosMes = stats?.resolvidosMes || 0;
  const totalUsuarios = stats?.totalUsuarios || 0;
  const slaAtrasados = stats?.slaAtrasados || 0;
  const totalEmpresas = stats?.totalEmpresas;

  const recentTickets = stats?.recentTickets || [];

  const mainMetrics: Array<{
    label: string;
    value: number;
    icon: React.ReactNode;
    color: "blue" | "amber" | "emerald" | "indigo" | "red" | "slate";
  }> = [
    {
      label: "Atendimentos Ativos",
      value: chamadosAtivos,
      icon: <AlertCircle size={18} />,
      color: "amber" as const,
    },
    {
      label: "SLA Atrasados",
      value: slaAtrasados,
      icon: <AlertCircle size={18} />,
      color: "red" as const,
    },
    {
      label: "Resolvidos (Mês)",
      value: resolvidosMes,
      icon: <CheckCircle2 size={18} />,
      color: "emerald" as const,
    },
  ];

  if (totalEmpresas !== undefined) {
    mainMetrics.push({
      label: "Total Empresas",
      value: totalEmpresas,
      icon: <Building size={18} />,
      color: "indigo" as const,
    });
  } else {
    mainMetrics.push({
      label: "Total Usuários",
      value: totalUsuarios,
      icon: <UserIcon size={18} />,
      color: "blue" as const,
    });
  }

  if (error) {
    return (
      <ErrorState message={error} onRetry={() => window.location.reload()} />
    );
  }

  return (
    <PageShell
      title="Visão Geral"
      subtitle="Acompanhe o volume de chamados, atendimentos ativos e produtividade."
      flush
    >
      <div className="space-y-4 sm:space-y-6 w-full max-w-none p-0 sm:p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 lg:gap-4">
          <MetricCard
            compact
            label="Ativos"
            value={chamadosAtivos}
            icon={<TicketIcon size={16} />}
            color="blue"
            loading={loading}
          />
          <MetricCard
            compact
            label="SLA Vencido"
            value={slaAtrasados}
            icon={<AlertCircle size={16} />}
            color="red"
            loading={loading}
          />
          <MetricCard
            compact
            label="Resolvidos (Mês)"
            value={resolvidosMes}
            icon={<CheckCircle2 size={16} />}
            color="emerald"
            loading={loading}
          />
          <MetricCard
            compact
            label="Total Usuários"
            value={totalUsuarios}
            icon={<UserIcon size={16} />}
            color="slate"
            loading={loading}
          />
        </div>

        {/* Atenção agora */}
        {(slaAtrasados > 0 || chamadosAtivos > 0) && (
          <Card className="p-3 sm:p-4 bg-slate-50/50">
            <h2 className="text-[12px] sm:text-[13px] font-bold text-slate-800 mb-3 flex items-center gap-2">
              <AlertCircle size={14} className="text-red-500" />
              Atenção agora
            </h2>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {slaAtrasados > 0 && (
                <div className="flex items-center gap-2 p-2 rounded-md bg-white border border-red-100 shadow-sm min-w-[120px]">
                  <div className="w-6 h-6 rounded flex items-center justify-center bg-red-50 text-red-600 font-bold text-xs">
                    {slaAtrasados}
                  </div>
                  <div className="text-[11px] font-semibold text-red-700">
                    SLA Vencido
                  </div>
                </div>
              )}
              {chamadosAtivos > 0 && (
                <div className="flex items-center gap-2 p-2 rounded-md bg-white border border-blue-100 shadow-sm min-w-[120px]">
                  <div className="w-6 h-6 rounded flex items-center justify-center bg-blue-50 text-blue-600 font-bold text-xs">
                    {chamadosAtivos}
                  </div>
                  <div className="text-[11px] font-semibold text-blue-700">
                    Abertos
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="overflow-hidden border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 py-2.5 px-4 bg-white/50 backdrop-blur-sm">
              <h3 className="text-[13px] font-bold text-slate-900 tracking-tight">
                Atendimentos Recentes
              </h3>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => onNavigate?.("tickets")}
                className="h-7 text-[11px] font-bold"
              >
                Ver todos <ChevronRight size={14} />
              </Button>
            </CardHeader>
            <div className="divide-y divide-slate-100">
              {loading ? (
                <LoadingState compact message="Carregando recentes..." />
              ) : recentTickets && recentTickets.length > 0 ? (
                recentTickets.map((ticket: Ticket) => (
                  <div
                    key={ticket.id}
                    onClick={() => onNavigate?.("tickets")}
                    className="p-3 px-4 flex items-center gap-3 hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-400 group-hover:text-blue-600 group-hover:border-blue-200 transition-all shadow-sm shrink-0">
                      <TicketIcon size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[13px] font-bold text-slate-800 truncate group-hover:text-slate-950 tracking-tight">
                          {ticket.titulo}
                        </span>
                        <Badge
                          variant={statusToBadgeVariant(ticket.status || "")}
                          className="text-[9px] h-4.5"
                        >
                          {ticket.status?.replace("_", " ")}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] sm:text-[11px] font-medium text-slate-400">
                        <span className="text-slate-500 font-bold shrink-0">
                          #{ticket.id}
                        </span>
                        <span className="opacity-50">•</span>
                        <span className="shrink-0">
                          {compactDateFormatter(ticket.created_at)}
                        </span>
                        <span className="opacity-50 hidden sm:inline">•</span>
                        <span className="truncate hidden sm:inline">
                          {ticket.cliente_nome || "Usuário"}
                        </span>
                      </div>
                    </div>
                    <div className="hidden md:block">
                      <Badge
                        variant={priorityToBadgeVariant(
                          ticket.prioridade || "",
                        )}
                        className="text-[9px] uppercase"
                      >
                        {ticket.prioridade}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  compact
                  title="Tudo em dia!"
                  description="Nenhum atendimento pendente no momento."
                  icon={<TicketIcon size={20} />}
                  action={{
                    label: "Novo Atendimento",
                    onClick: () => onNavigate?.("tickets"),
                  }}
                />
              )}
            </div>
          </Card>
        </div>
      </div>
    </PageShell>
  );
};
