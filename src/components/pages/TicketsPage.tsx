import React, { useState, useEffect } from "react";
import { api } from "../../lib/api";
import {
  Ticket,
  User,
  TicketListResponse,
  TicketKanbanResponse,
  TicketStatus,
  Empresa,
} from "../../types";
import {
  Plus,
  Kanban,
  List as ListIcon,
  Building,
  Layers,
  User as UserIcon,
  UserMinus,
  AlertCircle,
  Clock,
  History,
  MessageSquare,
  Search,
  ChevronDown,
} from "lucide-react";
import { Button } from "../ui/Button";
import { TicketList } from "../tickets/TicketList";
import { TicketKanban } from "../tickets/TicketKanban";
import { CreateTicketModal } from "../tickets/CreateTicketModal";
import { TeamSidebar } from "../tickets/TeamSidebar";
import { LoadingState } from "../ui/LoadingState";
import { ErrorState } from "../ui/ErrorState";
import { EmptyState } from "../ui/EmptyState";
import {
  TicketAdvancedFilters as IAdvancedFilters,
  TicketView,
} from "../../types";
import { Select } from "../ui/Select";
import { TicketQueue } from "../../types";
import { cn } from "../../lib/utils";
import { hasPermission } from "../../lib/permissions";
import { FilterChip } from "../ui/FilterChip";
import { motion, AnimatePresence } from "motion/react";
import { TicketBulkActions } from "../tickets/TicketBulkActions";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useTicketOptions } from "../../hooks/useTicketOptions";

interface TicketsPageProps {
  onSelectTicket: (id: number) => void;
  currentUser: User;
}

const QUEUES: {
  id: TicketQueue;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}[] = [
  { id: "todos", label: "Todos", icon: Layers },
  { id: "meus", label: "Minha fila", icon: UserIcon },
  { id: "sem_responsavel", label: "Sem responsável", icon: UserMinus },
  { id: "urgentes", label: "Urgentes", icon: AlertCircle },
  { id: "sla_vencido", label: "SLA vencido", icon: Clock },
];

const MORE_QUEUES: {
  id: TicketQueue;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}[] = [
  { id: "vence_em_breve", label: "Vence em breve", icon: History },
  {
    id: "aguardando_cliente",
    label: "Aguardando cliente",
    icon: MessageSquare,
  },
  { id: "precisa_resposta", label: "Precisa resposta", icon: AlertCircle },
];

const EMPTY_KANBAN_COLUMNS = [
  { id: "aberto" as TicketStatus, title: "Aberto", count: 0, tickets: [] },
  {
    id: "em_andamento" as TicketStatus,
    title: "Em andamento",
    count: 0,
    tickets: [],
  },
  {
    id: "aguardando_cliente" as TicketStatus,
    title: "Aguardando resposta",
    count: 0,
    tickets: [],
  },
  {
    id: "resolvido" as TicketStatus,
    title: "Finalizado",
    count: 0,
    tickets: [],
  },
];

const EMPTY_QUEUES = {
  todos: 0,
  meus: 0,
  sem_responsavel: 0,
  urgentes: 0,
  sla_vencido: 0,
  vence_em_breve: 0,
  aguardando_cliente: 0,
  precisa_resposta: 0,
};

import { PageShell } from "../layout/PageShell";

export const TicketsPage = ({
  onSelectTicket,
  currentUser,
}: TicketsPageProps) => {
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");

  const [ticketsResponse, setTicketsResponse] =
    useState<TicketListResponse | null>(null);
  const [kanbanResponse, setKanbanResponse] =
    useState<TicketKanbanResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [toasts, setToasts] = useState<
    { id: number; message: string; type: "success" | "error" | "info" }[]
  >([]);

  const addToast = (
    message: string,
    type: "success" | "error" | "info" = "success",
  ) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [priorityFilter, setPriorityFilter] = useState("todas");
  const [categoryFilter, setCategoryFilter] = useState("todas");
  const [serviceFilter, setServiceFilter] = useState("todos");
  const [selectedQueue, setSelectedQueue] = useState<TicketQueue>("todos");

  // Advanced Filters
  const [advancedFilters, setAdvancedFilters] = useState<IAdvancedFilters>({
    sla_status: "todos",
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showTeamSidebar, setShowTeamSidebar] = useState(false);
  const [showMoreQueues, setShowMoreQueues] = useState(false);

  // Saved Views
  const [savedViews, setSavedViews] = useState<TicketView[]>([]);
  const [currentViewId, setCurrentViewId] = useState<number | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const [devCompanyId, setDevCompanyId] = useState<string>("");
  const [companies, setCompanies] = useState<Empresa[]>([]);
  const [agents, setAgents] = useState<User[]>([]);

  // Bulk Selection
  const [selectedTicketIds, setSelectedTicketIds] = useState<number[]>([]);

  const { activeCategories, activeServices } = useTicketOptions(
    currentUser.desenvolvedor
      ? devCompanyId || undefined
      : String(currentUser.empresa_id),
  );

  const categoryOptionsForFilter =
    activeCategories.length > 0
      ? [
          { value: "todas", label: "Todas" },
          ...activeCategories.map((c) => ({ value: c.valor, label: c.nome })),
        ]
      : [
          { value: "todas", label: "Todas" },
          { value: "suporte_tecnico", label: "Suporte Técnico" },
          { value: "financeiro", label: "Financeiro" },
          { value: "recursos_humanos", label: "Recursos Humanos" },
          { value: "comercial", label: "Comercial" },
          { value: "outros", label: "Outros" },
        ];

  const serviceOptionsForFilter =
    activeServices.length > 0
      ? [
          { value: "todos", label: "Todos" },
          ...activeServices.map((s) => ({ value: s.valor, label: s.nome })),
        ]
      : [
          { value: "todos", label: "Todos" },
          { value: "suporte", label: "Suporte" },
          { value: "implantacao", label: "Implantação" },
          { value: "treinamento", label: "Treinamento" },
          { value: "outros", label: "Outros" },
        ];

  useEffect(() => {
    if (hasPermission(currentUser, "tickets.ver_todos")) {
      api.get<Empresa[]>("/companies").then(setCompanies).catch(console.error);

      // Fetch agents for bulk assignment
      api
        .get<User[]>("/users")
        .then((users) => {
          const filteredAgents = users.filter(
            (u) =>
              u.ativo &&
              (u.administrador ||
                u.cargo?.toLowerCase().includes("técnico") ||
                u.cargo?.toLowerCase().includes("suporte")),
          );
          setAgents(filteredAgents);
        })
        .catch(console.error);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser.desenvolvedor) {
      if (devCompanyId) {
        fetchViews(devCompanyId);
      } else {
        setSavedViews([]);
      }
      setCurrentViewId(null);
    } else {
      fetchViews();
    }
  }, [currentUser, devCompanyId]);

  const fetchViews = async (empresaId?: string) => {
    try {
      const url = empresaId
        ? `/tickets/views?empresa_id=${empresaId}`
        : "/tickets/views";
      const views = await api.get<TicketView[]>(url);
      setSavedViews(views);
    } catch (err) {
      console.error("Erro ao carregar views:", err);
    }
  };

  const fetchData = async () => {
    if (!!currentUser.desenvolvedor && !devCompanyId) {
      setTicketsResponse({
        data: [],
        meta: { page: 1, limit: 15, total: 0, totalPages: 1 },
        summary: {
          total: 0,
          aberto: 0,
          em_andamento: 0,
          aguardando_cliente: 0,
          resolvido: 0,
          fechado: 0,
        },
        queues: EMPTY_QUEUES,
      });
      setKanbanResponse({
        columns: EMPTY_KANBAN_COLUMNS,
        totals: {
          total: 0,
          aberto: 0,
          em_andamento: 0,
          aguardando_cliente: 0,
          resolvido: 0,
          fechado: 0,
        },
        queues: EMPTY_QUEUES,
      });
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams();
      if (!!currentUser.desenvolvedor) query.append("empresa_id", devCompanyId);
      if (searchTerm) query.append("search", searchTerm);
      if (statusFilter !== "todos") query.append("status", statusFilter);
      if (priorityFilter !== "todas")
        query.append("prioridade", priorityFilter);
      if (categoryFilter !== "todas") query.append("categoria", categoryFilter);
      if (serviceFilter !== "todos") query.append("servico", serviceFilter);
      if (selectedQueue !== "todos") query.append("fila", selectedQueue);

      // Advanced Filters
      if (advancedFilters.responsavel_id)
        query.append(
          "responsavel_id",
          advancedFilters.responsavel_id.toString(),
        );
      if (advancedFilters.tag) query.append("tag", advancedFilters.tag);
      if (advancedFilters.origem)
        query.append("origem", advancedFilters.origem);
      if (advancedFilters.created_from)
        query.append("created_from", advancedFilters.created_from);
      if (advancedFilters.created_to)
        query.append("created_to", advancedFilters.created_to);
      if (advancedFilters.updated_from)
        query.append("updated_from", advancedFilters.updated_from);
      if (advancedFilters.updated_to)
        query.append("updated_to", advancedFilters.updated_to);
      if (advancedFilters.sla_status && advancedFilters.sla_status !== "todos")
        query.append("sla_status", advancedFilters.sla_status);
      if (advancedFilters.custom_field_search)
        query.append(
          "custom_field_search",
          advancedFilters.custom_field_search,
        );

      if (viewMode === "list") {
        query.append("page", currentPage.toString());
        query.append("limit", "15");
        // Compatibility check in case the backend hasn't been reloaded yet to return the new format
        const response = await api.get(`/tickets?${query.toString()}`);
        if (Array.isArray(response)) {
          setTicketsResponse({
            data: response as Ticket[],
            meta: { page: 1, limit: 15, total: response.length, totalPages: 1 },
            summary: {
              total: 0,
              aberto: 0,
              em_andamento: 0,
              aguardando_cliente: 0,
              resolvido: 0,
              fechado: 0,
            },
          });
        } else {
          setTicketsResponse(response as TicketListResponse);
        }
      } else {
        query.append("limit", "100"); // Limit for Kanban API
        const kanbanData = await api.get<TicketKanbanResponse>(
          `/tickets/kanban?${query.toString()}`,
        );
        setKanbanResponse(kanbanData);
      }

      // Clear selection on refresh
      setSelectedTicketIds([]);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao carregar atendimentos.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    setSelectedTicketIds([]);
  }, [
    searchTerm,
    statusFilter,
    priorityFilter,
    categoryFilter,
    viewMode,
    devCompanyId,
    selectedQueue,
    advancedFilters,
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(timer);
  }, [
    searchTerm,
    statusFilter,
    priorityFilter,
    categoryFilter,
    viewMode,
    currentPage,
    devCompanyId,
    selectedQueue,
    advancedFilters,
  ]);

  const handleBulkAction = async (action: string, value?: any) => {
    try {
      setLoading(true);
      const result: any = await api.patch("/tickets/bulk", {
        ticket_ids: selectedTicketIds,
        action,
        value,
      });
      setSelectedTicketIds([]);
      fetchData();

      // Improved feedback
      const msg = `${result.updated} tickets atualizados.`;
      if (result.errors && result.errors.length > 0) {
        console.warn("Erros na ação em massa:", result.errors);
        addToast(`${msg} Alguns erros ocorreram.`, "error");
      } else {
        addToast(msg, "success");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao processar ação em massa.";
      addToast(message, "error");
      setLoading(false);
    }
  };

  const handleSelectView = (view: TicketView | null) => {
    if (!view) {
      setCurrentViewId(null);
      // Reset filters (optional, but good for UX)
      setSearchTerm("");
      setStatusFilter("todos");
      setPriorityFilter("todas");
      setCategoryFilter("todas");
      setServiceFilter("todos");
      setSelectedQueue("todos");
      setAdvancedFilters({ sla_status: "todos" });
      return;
    }

    setCurrentViewId(view.id);
    const f = view.filtros_json;
    if (f.status) setStatusFilter(f.status);
    if (f.prioridade) setPriorityFilter(f.prioridade);
    if (f.categoria) setCategoryFilter(f.categoria);
    if (f.servico) setServiceFilter(f.servico);
    if (f.fila) setSelectedQueue(f.fila);
    if (f.search !== undefined) setSearchTerm(f.search);
    if (f.advanced) setAdvancedFilters(f.advanced);
    if (f.mode) setViewMode(f.mode);
  };

  const handleSaveView = async (nome: string) => {
    if (currentUser.desenvolvedor && !devCompanyId) {
      addToast("Selecione uma empresa antes de salvar uma view.", "error");
      return;
    }

    try {
      const filtros_json = {
        status: statusFilter as any,
        prioridade: priorityFilter as any,
        categoria: categoryFilter,
        servico: serviceFilter,
        fila: selectedQueue,
        search: searchTerm,
        advanced: advancedFilters,
        mode: viewMode,
      };

      const empresa_id = currentUser.desenvolvedor
        ? Number(devCompanyId)
        : currentUser.empresa_id;

      const response = await api.post<{ id: number }>("/tickets/views", {
        nome,
        filtros_json,
        empresa_id,
      });

      const newView: TicketView = {
        id: response.id,
        nome,
        filtros_json,
        empresa_id: empresa_id || 0,
        usuario_id: currentUser.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setSavedViews((prev) => [...prev, newView]);
      setCurrentViewId(response.id);
      addToast("Visualização salva com sucesso!");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao salvar view";
      addToast(message, "error");
    }
  };

  const handleDeleteView = async (id: number) => {
    if (!confirm("Deseja excluir esta view?")) return;
    try {
      await api.delete(`/tickets/views/${id}`);
      setSavedViews((prev) => prev.filter((v) => v.id !== id));
      if (currentViewId === id) setCurrentViewId(null);
      addToast("Visualização excluída.");
    } catch (err) {
      addToast("Erro ao excluir view", "error");
    }
  };
  const safeFormatDateTime = (value?: string | null) => {
    if (!value) return "N/A";
    const date = new Date(value);
    if (isNaN(date.getTime())) return "N/A";
    return format(date, "dd/MM/yyyy HH:mm", { locale: ptBR });
  };

  const exportToCSV = () => {
    const data =
      viewMode === "list"
        ? ticketsResponse?.data || []
        : (kanbanResponse?.columns || []).flatMap((c) => c.tickets);

    if (data.length === 0) {
      addToast("Nenhum dado para exportar", "info");
      return;
    }

    const headers = [
      "ID",
      "Título",
      "Status",
      "Prioridade",
      "Categoria",
      "Responsável",
      "Solicitante",
      "Empresa",
      "Tags",
      "Criado em",
      "Atualizado em",
      "Prazo SLA",
    ];

    const csvContent = [
      headers.join(";"),
      ...data.map((t) =>
        [
          t.id,
          `"${(t.titulo || "").replace(/"/g, '""')}"`,
          t.status || "",
          t.prioridade || "",
          t.categoria || "",
          t.responsavel_nome || "N/A",
          t.cliente_nome || "N/A",
          t.empresa_nome || "N/A",
          `"${(t.tags || []).join(", ")}"`,
          safeFormatDateTime(t.created_at),
          safeFormatDateTime(t.updated_at),
          safeFormatDateTime(t.prazo_sla),
        ].join(";"),
      ),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `tickets_export_${format(new Date(), "yyyyMMdd_HHmm")}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast("Arquivo exportado!");
  };

  const hasAdvancedFilters = Object.entries(advancedFilters).some(
    ([key, value]) => {
      if (key === "sla_status") return value && value !== "todos";
      return value !== undefined && value !== null && value !== "";
    },
  );

  const hasAnyFilters =
    searchTerm !== "" ||
    statusFilter !== "todos" ||
    priorityFilter !== "todas" ||
    categoryFilter !== "todas" ||
    serviceFilter !== "todos" ||
    selectedQueue !== "todos" ||
    hasAdvancedFilters;

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("todos");
    setPriorityFilter("todas");
    setCategoryFilter("todas");
    setServiceFilter("todos");
    setSelectedQueue("todos");
    setAdvancedFilters({ sla_status: "todos" });
    setCurrentViewId(null);
  };

  const removeFilter = (key: string) => {
    if (key === "search") setSearchTerm("");
    else if (key === "status") setStatusFilter("todos");
    else if (key === "priority") setPriorityFilter("todas");
    else if (key === "category") setCategoryFilter("todas");
    else if (key === "service") setServiceFilter("todos");
    else if (key === "queue") setSelectedQueue("todos");
    else if (key.startsWith("adv:")) {
      const advKey = key.replace("adv:", "") as keyof IAdvancedFilters;
      setAdvancedFilters((prev) => ({ ...prev, [advKey]: undefined }));
    }
  };

  const getActiveFilterChips = () => {
    const chips: { id: string; label: string; value: string }[] = [];

    if (searchTerm)
      chips.push({ id: "search", label: "Busca", value: searchTerm });
    if (statusFilter !== "todos")
      chips.push({
        id: "status",
        label: "Status",
        value: statusFilter.replace("_", " "),
      });
    if (priorityFilter !== "todas")
      chips.push({
        id: "priority",
        label: "Prioridade",
        value: priorityFilter,
      });
    if (categoryFilter !== "todas") {
      const catLabel =
        categoryOptionsForFilter.find((c) => c.value === categoryFilter)
          ?.label || categoryFilter.replace("_", " ");
      chips.push({ id: "category", label: "Categoria", value: catLabel });
    }
    if (serviceFilter !== "todos") {
      const srvLabel =
        serviceOptionsForFilter.find((c) => c.value === serviceFilter)?.label ||
        serviceFilter.replace("_", " ");
      chips.push({ id: "service", label: "Serviço", value: srvLabel });
    }
    if (selectedQueue !== "todos") {
      const queueLabel =
        QUEUES.find((q) => q.id === selectedQueue)?.label || selectedQueue;
      chips.push({ id: "queue", label: "Fila", value: queueLabel });
    }

    if (advancedFilters.sla_status && advancedFilters.sla_status !== "todos") {
      chips.push({
        id: "adv:sla_status",
        label: "SLA",
        value: advancedFilters.sla_status.replace("_", " "),
      });
    }
    if (advancedFilters.tag)
      chips.push({ id: "adv:tag", label: "Tag", value: advancedFilters.tag });
    if (advancedFilters.origem)
      chips.push({
        id: "adv:origem",
        label: "Origem",
        value: advancedFilters.origem,
      });
    if (advancedFilters.responsavel_id) {
      const agent = agents.find((a) => a.id === advancedFilters.responsavel_id);
      chips.push({
        id: "adv:responsavel_id",
        label: "Responsável",
        value: agent?.nome || String(advancedFilters.responsavel_id),
      });
    }

    return chips;
  };

  const queueCounts =
    viewMode === "list" ? ticketsResponse?.queues : kanbanResponse?.queues;

  return (
    <PageShell
      title="Central de Chamados"
      subtitle="Gerencie tickets, acompanhe prazos e organize a operação de atendimento."
      flush
      contentClassName="!overflow-hidden flex flex-col"
    >
      <div className="flex flex-col lg:flex-row gap-3 items-start h-full min-h-0 pt-0 sm:pt-4 px-0 sm:px-4 pb-0 sm:pb-4">
        <div className="flex-1 w-full space-y-3 min-w-0 flex flex-col h-full min-h-0">
          {/* Main Toolbar */}
          <div className="flex flex-col gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
              <div className="relative flex-1 w-full group">
                <Search
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors"
                  size={14}
                />
                <input
                  type="text"
                  placeholder="Buscar ticket..."
                  className="w-full h-8 bg-slate-50 border border-slate-200 rounded-md pl-8 pr-3 text-[13px] outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white focus:border-blue-500 transition-all placeholder:text-slate-400"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between xl:justify-end gap-2 shrink-0">
                <div className="flex items-center p-0.5 bg-slate-100 rounded-md border border-slate-200/50">
                  <button
                    onClick={() => setViewMode("list")}
                    className={cn(
                      "px-2 py-1 rounded transition-all flex items-center gap-1",
                      viewMode === "list"
                        ? "bg-white text-blue-600 shadow-sm border border-slate-200/60"
                        : "text-slate-500 hover:text-slate-700",
                    )}
                  >
                    <ListIcon size={14} />
                    <span className="text-[11px] font-bold hidden sm:inline">
                      Lista
                    </span>
                  </button>
                  <button
                    onClick={() => setViewMode("kanban")}
                    className={cn(
                      "px-2 py-1 rounded transition-all flex items-center gap-1",
                      viewMode === "kanban"
                        ? "bg-white text-blue-600 shadow-sm border border-slate-200/60"
                        : "text-slate-500 hover:text-slate-700",
                    )}
                  >
                    <Kanban size={14} />
                    <span className="text-[11px] font-bold hidden sm:inline">
                      Kanban
                    </span>
                  </button>
                </div>

                {!!currentUser.desenvolvedor && (
                  <div className="relative w-28 sm:w-36">
                    <Building
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 z-10"
                      size={14}
                    />
                    <Select
                      size="sm"
                      value={devCompanyId}
                      onChange={setDevCompanyId}
                      placeholder="Empresa..."
                      buttonClassName="pl-8 bg-slate-50 border-slate-200 h-8 text-[11px]"
                      options={[
                        { value: "", label: "Selecione a empresa" },
                        ...companies.map((emp) => ({
                          value: String(emp.id),
                          label: emp.nome,
                        })),
                      ]}
                    />
                  </div>
                )}

                <Button
                  size="sm"
                  className="h-8 w-8 p-0 rounded-md text-[11px] font-bold"
                  onClick={() => setIsModalOpen(true)}
                  title="Novo ticket"
                >
                  <Plus size={16} />
                </Button>

                <Select
                  size="sm"
                  value=""
                  onChange={(val) => {
                    if (val === "equipe") setShowTeamSidebar(!showTeamSidebar);
                    if (val === "exportar") exportToCSV();
                    if (val === "atualizar") fetchData();
                  }}
                  options={[
                    { value: "", label: "Mais" },
                    { value: "equipe", label: "Ver Equipe" },
                    { value: "exportar", label: "Exportar CSV" },
                    { value: "atualizar", label: "Atualizar" },
                  ]}
                  className="w-20 sm:w-24 text-[11px]"
                  buttonClassName="h-8"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar border-t border-slate-100 pt-2">
              <div className="flex items-center gap-1.5 pr-2 border-r border-slate-200 my-1">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Filas
                </span>
              </div>

              <div className="flex items-center gap-1">
                {QUEUES.map((q) => {
                  const isActive = selectedQueue === q.id;
                  const count = queueCounts?.[q.id] || 0;

                  return (
                    <button
                      key={q.id}
                      onClick={() => setSelectedQueue(q.id)}
                      className={cn(
                        "relative flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-md transition-all whitespace-nowrap",
                        isActive
                          ? "bg-slate-100 text-slate-900"
                          : "bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50",
                      )}
                    >
                      <q.icon
                        size={14}
                        className={cn(
                          isActive ? "text-slate-800" : "text-slate-400",
                        )}
                      />
                      <span>{q.label}</span>
                      {(count > 0 || q.id === "todos") && (
                        <span
                          className={cn(
                            "flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-sm text-[10px] font-semibold",
                            isActive
                              ? "bg-white text-slate-700 shadow-sm"
                              : "bg-slate-100 text-slate-500",
                          )}
                        >
                          {count > 99 ? "99+" : count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="w-px h-5 bg-slate-200 mx-1" />

              <div className="relative shrink-0">
                <button
                  onClick={() => setShowMoreQueues((prev) => !prev)}
                  className={cn(
                    "relative flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-md transition-all whitespace-nowrap",
                    MORE_QUEUES.some((q) => q.id === selectedQueue)
                      ? "bg-slate-100 text-slate-900"
                      : "bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50",
                  )}
                >
                  <span>
                    {MORE_QUEUES.find((q) => q.id === selectedQueue)?.label ||
                      "Mais Filas"}
                  </span>
                  {MORE_QUEUES.some((q) => q.id === selectedQueue) &&
                    (queueCounts?.[selectedQueue] || 0) > 0 && (
                      <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-sm text-[10px] font-semibold bg-white text-slate-700 shadow-sm">
                        {(queueCounts?.[selectedQueue] || 0) > 99
                          ? "99+"
                          : queueCounts?.[selectedQueue] || 0}
                      </span>
                    )}
                  <ChevronDown
                    size={14}
                    className={cn(
                      "transition-transform text-slate-400",
                      showMoreQueues && "rotate-180",
                    )}
                  />
                </button>

                {showMoreQueues && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowMoreQueues(false)}
                    />
                    <div className="absolute top-full right-0 lg:left-0 lg:right-auto mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 p-1.5 z-50">
                      {MORE_QUEUES.map((q) => {
                        const isActive = selectedQueue === q.id;
                        const count = queueCounts?.[q.id] || 0;
                        return (
                          <button
                            key={q.id}
                            onClick={() => {
                              setSelectedQueue(q.id);
                              setShowMoreQueues(false);
                            }}
                            className={cn(
                              "w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-md transition-colors",
                              isActive
                                ? "bg-blue-50 text-blue-700"
                                : "text-slate-600 hover:bg-slate-50",
                            )}
                          >
                            <span>{q.label}</span>
                            {count > 0 && (
                              <span
                                className={cn(
                                  "flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold tracking-tight",
                                  isActive
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-slate-100 text-slate-500",
                                )}
                              >
                                {count > 99 ? "99+" : count}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <AnimatePresence>
            {hasAnyFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="flex flex-wrap items-center gap-2 py-2 px-3 bg-slate-50 rounded-lg border border-slate-200"
              >
                <div className="flex items-center gap-2 mr-1">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Filtros
                  </span>
                </div>
                {getActiveFilterChips().map((chip) => (
                  <FilterChip
                    key={chip.id}
                    label={chip.label}
                    value={chip.value}
                    onRemove={() => removeFilter(chip.id)}
                  />
                ))}
                <button
                  onClick={clearFilters}
                  className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 px-2 py-1 rounded hover:bg-rose-50 transition-all border border-transparent ml-auto"
                >
                  Limpar todos
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div
            className={cn(
              "relative z-0 transition-all duration-300 flex-1 min-h-0 bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden",
            )}
          >
            {!!currentUser.desenvolvedor && !devCompanyId ? (
              <EmptyState
                title="Seleção de Ambiente Necessária"
                description="Você está no modo desenvolvedor. Escolha uma empresa para visualizar os atendimentos."
                icon={<Building size={24} />}
              />
            ) : loading && !kanbanResponse && !ticketsResponse ? (
              <LoadingState message="Organizando sua central de tickets..." />
            ) : error ? (
              <ErrorState
                title="Falha na Sincronização"
                message={error}
                onRetry={fetchData}
              />
            ) : viewMode === "kanban" && kanbanResponse ? (
              <TicketKanban
                kanbanData={kanbanResponse}
                onSelectTicket={onSelectTicket}
                currentUser={currentUser}
                onStatusChange={() => fetchData()}
                devCompanyId={devCompanyId}
              />
            ) : viewMode === "list" && ticketsResponse ? (
              <TicketList
                tickets={ticketsResponse.data}
                meta={ticketsResponse.meta}
                onPageChange={setCurrentPage}
                onSelectTicket={onSelectTicket}
                currentUser={currentUser}
                onStatusChange={() => fetchData()}
                searchTerm={searchTerm}
                hasFilters={hasAnyFilters}
                selectedTicketIds={selectedTicketIds}
                onSelectionChange={setSelectedTicketIds}
                canSelectBulk={hasPermission(currentUser, "tickets.editar")}
              />
            ) : null}
          </div>
        </div>

        {showTeamSidebar && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="w-full lg:w-56 shrink-0"
          >
            <TeamSidebar
              currentUser={currentUser}
              devCompanyId={devCompanyId}
            />
          </motion.div>
        )}
      </div>

      <TicketBulkActions
        selectedCount={selectedTicketIds.length}
        onAction={handleBulkAction}
        onClear={() => setSelectedTicketIds([])}
        agents={agents}
      />

      <CreateTicketModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentUser={currentUser}
        onSuccess={() => {
          setIsModalOpen(false);
          fetchData();
        }}
      />

      {/* Toast System */}
      <div className="fixed bottom-6 right-6 z-[10000] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={cn(
                "px-3 py-2 rounded-lg shadow-lg border text-xs font-semibold flex items-center gap-2 pointer-events-auto",
                toast.type === "success" &&
                  "bg-emerald-600 border-emerald-500 text-white",
                toast.type === "error" &&
                  "bg-red-600 border-red-500 text-white",
                toast.type === "info" &&
                  "bg-blue-600 border-blue-500 text-white",
              )}
            >
              <AlertCircle size={14} />
              <span>{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </PageShell>
  );
};
