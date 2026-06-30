import React, { useState, useEffect, useRef } from "react";
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
  Tag,
  ChevronDown,
  Settings2,
  HelpCircle,
  Eye,
  EyeOff,
  Palette,
  RotateCcw,
  Save,
  ShieldCheck,
  ArrowUp,
  ArrowDown,
  Trash2,
  Check,
  X,
  CircleDot,
  PlayCircle,
  PauseCircle,
  CheckCircle2,
  LockKeyhole,
} from "lucide-react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Modal } from "../ui/Modal";
import { TicketList, TicketSortKey, TicketSortOrder } from "../tickets/TicketList";
import { TicketKanban } from "../tickets/TicketKanban";
import { CreateTicketModal } from "../tickets/CreateTicketModal";
import { TeamSidebar } from "../tickets/TeamSidebar";
import { TicketFilterDrawer } from "../tickets/TicketFilterDrawer";
import { LoadingState } from "../ui/LoadingState";
import { ErrorState } from "../ui/ErrorState";
import { EmptyState } from "../ui/EmptyState";
import {
  TicketAdvancedFilters as IAdvancedFilters,
  TicketStatusSpecial,
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
import {
  applyTicketWorkflowToKanban,
  DEFAULT_TICKET_WORKFLOW,
  labelFromTicketStatus,
  loadTicketWorkflow,
  normalizeWorkflowStatus,
  slugifyTicketStatus,
  TICKET_STATUS_SPECIAL_OPTIONS,
  TicketWorkflowStatus,
} from "../../lib/ticketWorkflow";
import { getCategoryShortLabel } from "../../lib/ticketOptions";

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
  {
    id: "fechado" as TicketStatus,
    title: "Fechado",
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

const queueChipBaseClass =
  "relative flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-md transition-all whitespace-nowrap";

const queueChipInactiveClass =
  "bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50";

const queueChipActiveClass = "bg-slate-100 text-slate-900";

const MORE_QUEUES_MENU_WIDTH = 192;
const CATEGORY_MENU_WIDTH = 240;
const STATUS_COLOR_SWATCHES = [
  "#2563eb",
  "#4f46e5",
  "#0891b2",
  "#0f766e",
  "#059669",
  "#d97706",
  "#dc2626",
  "#64748b",
];

const STATUS_SPECIAL_PRESENTATION: Record<
  TicketStatusSpecial,
  {
    icon: React.ComponentType<{ size?: number; className?: string }>;
    badge: string;
    impact: string;
    rule: string;
  }
> = {
  normal: {
    icon: CircleDot,
    badge: "Etapa de trabalho",
    impact: "Mantém o ticket ativo nas filas e no SLA.",
    rule: "Use para triagem, atendimento, análise ou qualquer etapa operacional.",
  },
  inicial: {
    icon: PlayCircle,
    badge: "Entrada do fluxo",
    impact: "Recebe tickets novos e chamados reabertos.",
    rule: "A empresa precisa ter exatamente um status inicial ativo.",
  },
  aguardando_cliente: {
    icon: PauseCircle,
    badge: "Espera externa",
    impact: "Pausa o SLA e tira o chamado da fila de resposta do atendente.",
    rule: "Use quando a próxima ação depende do cliente.",
  },
  finalizado: {
    icon: CheckCircle2,
    badge: "Resolução",
    impact: "Marca conclusão, grava dados de resolução e permite reabertura.",
    rule: "Use para chamados resolvidos pela equipe.",
  },
  encerrado: {
    icon: LockKeyhole,
    badge: "Encerramento",
    impact: "Exige permissão de fechamento e remove o ticket das pendências.",
    rule: "Use para arquivamento, cancelamento definitivo ou fechamento administrativo.",
  },
};

const getFloatingMenuPosition = (
  element: HTMLElement | null,
  width: number,
) => {
  if (!element || typeof window === "undefined") return null;

  const rect = element.getBoundingClientRect();
  const margin = 8;
  const maxLeft = Math.max(margin, window.innerWidth - width - margin);
  const left = Math.min(Math.max(rect.left, margin), maxLeft);

  return {
    top: rect.bottom + 4,
    left,
    width,
  };
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
  const [sortBy, setSortBy] = useState<TicketSortKey>("operacional");
  const [sortOrder, setSortOrder] = useState<TicketSortOrder>("desc");

  // Advanced Filters
  const [advancedFilters, setAdvancedFilters] = useState<IAdvancedFilters>({
    sla_status: "todos",
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showTeamSidebar, setShowTeamSidebar] = useState(false);
  const [showMoreQueues, setShowMoreQueues] = useState(false);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const moreQueuesButtonRef = useRef<HTMLButtonElement | null>(null);
  const categoryButtonRef = useRef<HTMLButtonElement | null>(null);
  const [moreQueuesMenuPosition, setMoreQueuesMenuPosition] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const [categoryMenuPosition, setCategoryMenuPosition] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const [showWorkflowSettings, setShowWorkflowSettings] = useState(false);
  const [showAddWorkflowStatus, setShowAddWorkflowStatus] = useState(false);
  const [pendingRemoveWorkflowStatusId, setPendingRemoveWorkflowStatusId] =
    useState<TicketStatus | null>(null);
  const [specialStatusModalId, setSpecialStatusModalId] =
    useState<TicketStatus | null>(null);
  const [workflowStatuses, setWorkflowStatuses] = useState<TicketWorkflowStatus[]>(
    DEFAULT_TICKET_WORKFLOW,
  );
  const [workflowDraftStatuses, setWorkflowDraftStatuses] = useState<TicketWorkflowStatus[]>(
    DEFAULT_TICKET_WORKFLOW,
  );
  const [workflowUsage, setWorkflowUsage] = useState<{
    tickets: Record<string, number>;
    automations: Record<string, number>;
  }>({ tickets: {}, automations: {} });
  const [workflowLoading, setWorkflowLoading] = useState(false);
  const [workflowSaving, setWorkflowSaving] = useState(false);
  const [workflowError, setWorkflowError] = useState<string | null>(null);
  const [newWorkflowStatusLabel, setNewWorkflowStatusLabel] = useState("");

  // Saved Views
  const [savedViews, setSavedViews] = useState<TicketView[]>([]);
  const [currentViewId, setCurrentViewId] = useState<number | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const [devCompanyId, setDevCompanyId] = useState<string>(() =>
    currentUser.desenvolvedor && currentUser.empresa_id
      ? String(currentUser.empresa_id)
      : "",
  );
  const [companies, setCompanies] = useState<Empresa[]>([]);
  const [agents, setAgents] = useState<User[]>([]);

  // Bulk Selection
  const [selectedTicketIds, setSelectedTicketIds] = useState<number[]>([]);

  const handleSortChange = (key: TicketSortKey, order: TicketSortOrder) => {
    setSortBy(key);
    setSortOrder(order);
  };

  const {
    activeCategories,
    activeServices,
    loading: ticketOptionsLoading,
    error: ticketOptionsError,
  } = useTicketOptions(
    currentUser.desenvolvedor
      ? devCompanyId || undefined
      : undefined,
    { scope: "current-user" },
  );

  const workflowCompanyKey = currentUser.desenvolvedor
    ? devCompanyId || "dev"
    : currentUser.empresa_id;

  const mapWorkflowRows = (rows: any[]): TicketWorkflowStatus[] =>
    rows.map((row) => normalizeWorkflowStatus({
      id: row.valor,
      label: row.nome,
      visible: Number(row.kanban_visivel ?? row.ativo) === 1,
      active: Number(row.ativo) === 1,
      color: row.cor || "#0891b2",
      special: row.especial || "normal",
    }));

  const buildWorkflowPayload = (items: TicketWorkflowStatus[]) =>
    items.map((status) => ({
      id: status.id,
      label: status.label.trim(),
      visible: status.visible,
      active: status.active,
      color: status.color,
      special: status.special,
    }));

  useEffect(() => {
    const fetchWorkflowStatuses = async () => {
      if (!workflowCompanyKey || workflowCompanyKey === "dev") {
        setWorkflowStatuses([]);
        setWorkflowDraftStatuses([]);
        setWorkflowUsage({ tickets: {}, automations: {} });
        return;
      }

      try {
        setWorkflowLoading(true);
        setWorkflowError(null);
        const [rows, usage] = await Promise.all([
          api.get<any[]>(`/companies/${workflowCompanyKey}/ticket-statuses`),
          api.get<{ tickets: Record<string, number>; automations: Record<string, number> }>(
            `/companies/${workflowCompanyKey}/ticket-statuses/usage`,
          ).catch(() => ({ tickets: {}, automations: {} })),
        ]);
        const mapped = mapWorkflowRows(rows);
        setWorkflowStatuses(mapped);
        setWorkflowDraftStatuses(mapped);
        setWorkflowUsage(usage);
      } catch (err) {
        const fallback = loadTicketWorkflow(workflowCompanyKey);
        setWorkflowStatuses(fallback);
        setWorkflowDraftStatuses(fallback);
        setWorkflowError("Erro ao carregar status de atendimento.");
        addToast("Erro ao carregar status de atendimento.", "error");
      } finally {
        setWorkflowLoading(false);
      }
    };

    fetchWorkflowStatuses();
    setShowAddWorkflowStatus(false);
    setPendingRemoveWorkflowStatusId(null);
    setSpecialStatusModalId(null);
    setNewWorkflowStatusLabel("");
  }, [workflowCompanyKey]);

  const validateWorkflowDraft = (next: TicketWorkflowStatus[]): string | null => {
    const activeStatuses = next.filter((status) => status.active);
    if (activeStatuses.length === 0) return "Mantenha ao menos um status ativo.";
    if (activeStatuses.filter((status) => status.special === "inicial").length !== 1) {
      return "Configure exatamente um status como Inicial.";
    }
    if (!activeStatuses.some((status) => status.special === "finalizado" || status.special === "encerrado")) {
      return "Configure ao menos um status Finalizado ou Encerrado.";
    }
    if (next.some((status) => !status.label.trim())) return "Nenhum status pode ficar sem nome.";
    return null;
  };

  const saveWorkflowStatuses = async () => {
    if (!workflowCompanyKey || workflowCompanyKey === "dev") return;

    const validation = validateWorkflowDraft(workflowDraftStatuses);
    if (validation) {
      setWorkflowError(validation);
      addToast(validation, "error");
      return;
    }

    try {
      setWorkflowSaving(true);
      setWorkflowError(null);
      const rows = await api.put<any[]>(
        `/companies/${workflowCompanyKey}/ticket-statuses`,
        { statuses: buildWorkflowPayload(workflowDraftStatuses) },
      );
      const mapped = mapWorkflowRows(rows);
      setWorkflowStatuses(mapped);
      setWorkflowDraftStatuses(mapped);
      const usage = await api.get<{ tickets: Record<string, number>; automations: Record<string, number> }>(
        `/companies/${workflowCompanyKey}/ticket-statuses/usage`,
      ).catch(() => ({ tickets: {}, automations: {} }));
      setWorkflowUsage(usage);
      addToast("Fluxo de atendimento salvo.", "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao salvar status de atendimento.";
      setWorkflowError(message);
      addToast(message, "error");
    } finally {
      setWorkflowSaving(false);
    }
  };

  const updateWorkflowStatus = (
    id: TicketStatus,
    changes: Partial<TicketWorkflowStatus>,
  ) => {
    const next = workflowDraftStatuses.map((status) =>
        status.id === id ? { ...status, ...changes } : status,
    );

    setWorkflowDraftStatuses(next);
  };

  const moveWorkflowStatus = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= workflowDraftStatuses.length) return;

    const next = [...workflowDraftStatuses];
    const [item] = next.splice(index, 1);
    next.splice(targetIndex, 0, item);
    setWorkflowDraftStatuses(next);
  };

  const requestRemoveWorkflowStatus = (id: TicketStatus) => {
    setPendingRemoveWorkflowStatusId(id);
  };

  const confirmRemoveWorkflowStatus = (id: TicketStatus) => {
    setWorkflowDraftStatuses(workflowDraftStatuses.filter((item) => item.id !== id));
    setPendingRemoveWorkflowStatusId(null);
    addToast("Status removido do rascunho.", "info");
  };

  const setWorkflowStatusSpecial = (id: TicketStatus, special: TicketStatusSpecial) => {
    setWorkflowDraftStatuses((current) =>
      current.map((status) => {
        if (status.id === id) return { ...status, special, active: true };
        if (special === "inicial" && status.special === "inicial") {
          return { ...status, special: "normal" };
        }
        return status;
      }),
    );
    setSpecialStatusModalId(null);
  };

  const addWorkflowStatus = () => {
    const label = newWorkflowStatusLabel.trim();
    const id = slugifyTicketStatus(label);

    if (!label) return;
    if (!id || id.length < 2) {
      addToast("Use um nome com pelo menos duas letras ou números.", "error");
      return;
    }

    if (workflowDraftStatuses.some((status) => status.id === id)) {
      addToast("Esse status já está configurado.", "info");
      return;
    }

    setWorkflowDraftStatuses([
      ...workflowDraftStatuses,
      normalizeWorkflowStatus({
        id,
        label,
        active: true,
        visible: true,
        color: "#0891b2",
        special: "normal",
      }),
    ]);
    setShowAddWorkflowStatus(false);
    setPendingRemoveWorkflowStatusId(null);
    setNewWorkflowStatusLabel("");
  };

  const resetWorkflowStatuses = () => {
    setWorkflowDraftStatuses(DEFAULT_TICKET_WORKFLOW);
    setPendingRemoveWorkflowStatusId(null);
    addToast("Padrão aplicado ao rascunho.", "info");
  };

  const cancelWorkflowDraft = () => {
    setWorkflowDraftStatuses(workflowStatuses);
    setWorkflowError(null);
    setPendingRemoveWorkflowStatusId(null);
    setSpecialStatusModalId(null);
    setShowWorkflowSettings(false);
  };

  const configuredKanbanResponse = kanbanResponse
    ? applyTicketWorkflowToKanban(kanbanResponse, workflowStatuses)
    : null;
  const activeWorkflowStatusOptions = workflowStatuses
    .filter((status) => status.active)
    .map((status) => ({
      value: status.id,
      label: status.label,
      special: status.special,
      color: status.color,
    }));
  const workflowDraftPayload = JSON.stringify(buildWorkflowPayload(workflowDraftStatuses));
  const workflowSavedPayload = JSON.stringify(buildWorkflowPayload(workflowStatuses));
  const hasWorkflowDraftChanges = workflowDraftPayload !== workflowSavedPayload;
  const specialModalStatus = workflowDraftStatuses.find((status) => status.id === specialStatusModalId) || null;
  const getWorkflowUsage = (statusId: string) => ({
    tickets: workflowUsage.tickets[statusId] || 0,
    automations: workflowUsage.automations[statusId] || 0,
  });

  const canCreateTicket = hasPermission(currentUser, "tickets.criar");
  const canBulkActions = hasPermission(currentUser, "tickets.acoes_em_massa");
  const canViewTeam = hasPermission(currentUser, "usuarios.visualizar");
  const canConfigureTicketStatuses = hasPermission(currentUser, "empresas.gerenciar_configuracoes");

  const categoryOptionsForFilter = [
    { value: "todas", label: "Todas" },
    ...activeCategories.map((c) => ({
      value: c.valor,
      label: getCategoryShortLabel(c),
    })),
  ];

  const categoryQuickFilterOptions = categoryOptionsForFilter.map((option) =>
    option.value === "todas"
      ? { ...option, label: "Todas categorias" }
      : option,
  );

  const selectedCategoryLabel =
    categoryQuickFilterOptions.find((option) => option.value === categoryFilter)
      ?.label || "Categorias";

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
    if (categoryFilter === "todas" || ticketOptionsLoading) return;

    const categoryStillExists = categoryOptionsForFilter.some(
      (option) => option.value === categoryFilter,
    );

    if (!categoryStillExists) {
      setCategoryFilter("todas");
    }
  }, [categoryFilter, categoryOptionsForFilter, ticketOptionsLoading]);

  useEffect(() => {
    if (currentUser.desenvolvedor || hasPermission(currentUser, "tickets.ver_todos")) {
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
    if (!currentUser.desenvolvedor || devCompanyId || companies.length === 0) {
      return;
    }

    if (!currentUser.empresa_id) {
      return;
    }

    const linkedCompany = companies.find(
      (company) => Number(company.id) === Number(currentUser.empresa_id),
    );

    if (linkedCompany) {
      setDevCompanyId(String(linkedCompany.id));
    }
  }, [currentUser.desenvolvedor, currentUser.empresa_id, devCompanyId, companies]);

  const handleDevCompanyChange = (companyId: string) => {
    setDevCompanyId(companyId);
    setCategoryFilter("todas");
    setServiceFilter("todos");
  };

  const updateFloatingMenuPositions = () => {
    if (showMoreQueues) {
      setMoreQueuesMenuPosition(
        getFloatingMenuPosition(moreQueuesButtonRef.current, MORE_QUEUES_MENU_WIDTH),
      );
    }

    if (showCategoryMenu) {
      setCategoryMenuPosition(
        getFloatingMenuPosition(categoryButtonRef.current, CATEGORY_MENU_WIDTH),
      );
    }
  };

  useEffect(() => {
    if (!showMoreQueues && !showCategoryMenu) return;

    updateFloatingMenuPositions();
    window.addEventListener("resize", updateFloatingMenuPositions);
    window.addEventListener("scroll", updateFloatingMenuPositions, true);

    return () => {
      window.removeEventListener("resize", updateFloatingMenuPositions);
      window.removeEventListener("scroll", updateFloatingMenuPositions, true);
    };
  }, [showMoreQueues, showCategoryMenu]);

  const toggleMoreQueuesMenu = () => {
    const nextOpen = !showMoreQueues;
    setShowMoreQueues(nextOpen);
    setShowCategoryMenu(false);
    setMoreQueuesMenuPosition(
      nextOpen
        ? getFloatingMenuPosition(moreQueuesButtonRef.current, MORE_QUEUES_MENU_WIDTH)
        : null,
    );
  };

  const toggleCategoryMenu = () => {
    const nextOpen = !showCategoryMenu;
    setShowCategoryMenu(nextOpen);
    setShowMoreQueues(false);
    setCategoryMenuPosition(
      nextOpen
        ? getFloatingMenuPosition(categoryButtonRef.current, CATEGORY_MENU_WIDTH)
        : null,
    );
  };

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
      if (sortBy !== "operacional") {
        query.append("sort_by", sortBy);
        query.append("sort_order", sortOrder);
      }

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
    sortBy,
    sortOrder,
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
    sortBy,
    sortOrder,
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
      setSortBy("operacional");
      setSortOrder("desc");
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
    if (f.sort_by) setSortBy(f.sort_by);
    else setSortBy("operacional");
    if (f.sort_order) setSortOrder(f.sort_order);
    else setSortOrder("desc");
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
        sort_by: sortBy,
        sort_order: sortOrder,
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
        [...QUEUES, ...MORE_QUEUES].find((q) => q.id === selectedQueue)?.label || selectedQueue;
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

  const moreActionOptions = [
    { value: "", label: "Mais" },
    { value: "filtros", label: "Filtros" },
    ...(canViewTeam ? [{ value: "equipe", label: "Ver Equipe" }] : []),
    ...(canConfigureTicketStatuses ? [{ value: "config_status", label: "Configurar status" }] : []),
    { value: "exportar", label: "Exportar CSV" },
    { value: "atualizar", label: "Atualizar" },
  ];

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
                      onChange={handleDevCompanyChange}
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

                {canCreateTicket && (
                  <Button
                    size="sm"
                    className="h-8 w-8 p-0 rounded-md text-[11px] font-bold"
                    onClick={() => setIsModalOpen(true)}
                    title="Novo ticket"
                  >
                    <Plus size={16} />
                  </Button>
                )}

                <Select
                  size="sm"
                  value=""
                  onChange={(val) => {
                    if (val === "filtros") setShowAdvanced(true);
                    if (val === "equipe") setShowTeamSidebar(!showTeamSidebar);
                    if (val === "config_status")
                      setShowWorkflowSettings(true);
                    if (val === "exportar") exportToCSV();
                    if (val === "atualizar") fetchData();
                  }}
                  options={moreActionOptions}
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
                        queueChipBaseClass,
                        isActive ? queueChipActiveClass : queueChipInactiveClass,
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
                  ref={moreQueuesButtonRef}
                  onClick={toggleMoreQueuesMenu}
                  className={cn(
                    queueChipBaseClass,
                    MORE_QUEUES.some((q) => q.id === selectedQueue)
                      ? queueChipActiveClass
                      : queueChipInactiveClass,
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
                    <div
                      className="fixed w-48 bg-white rounded-lg shadow-lg border border-slate-200 p-1.5 z-50"
                      style={moreQueuesMenuPosition || undefined}
                    >
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

              <div className="relative shrink-0">
                <button
                  ref={categoryButtonRef}
                  onClick={toggleCategoryMenu}
                  className={cn(
                    queueChipBaseClass,
                    categoryFilter !== "todas"
                      ? queueChipActiveClass
                      : queueChipInactiveClass,
                  )}
                >
                  <Tag
                    size={14}
                    className={cn(
                      categoryFilter !== "todas"
                        ? "text-slate-800"
                        : "text-slate-400",
                    )}
                  />
                  <span className="max-w-[170px] truncate">
                    {categoryFilter === "todas"
                      ? "Categorias"
                      : selectedCategoryLabel}
                  </span>
                  <ChevronDown
                    size={14}
                    className={cn(
                      "transition-transform text-slate-400",
                      showCategoryMenu && "rotate-180",
                    )}
                  />
                </button>

                {showCategoryMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowCategoryMenu(false)}
                    />
                    <div
                      className="fixed w-60 bg-white rounded-lg shadow-lg border border-slate-200 p-1.5 z-50"
                      style={categoryMenuPosition || undefined}
                    >
                      {ticketOptionsLoading ? (
                        <div className="px-3 py-2 text-xs font-medium text-slate-400">
                          Carregando categorias...
                        </div>
                      ) : ticketOptionsError ? (
                        <div className="px-3 py-2 text-xs font-medium text-rose-600">
                          {ticketOptionsError}
                        </div>
                      ) : currentUser.desenvolvedor && !devCompanyId ? (
                        <div className="px-3 py-2 text-xs font-medium text-slate-400">
                          Selecione uma empresa para ver categorias.
                        </div>
                      ) : categoryQuickFilterOptions.length === 1 ? (
                        <div className="px-3 py-2 text-xs font-medium text-slate-400">
                          Nenhuma categoria ativa nesta empresa.
                        </div>
                      ) : (
                        categoryQuickFilterOptions.map((option) => {
                          const isActive = categoryFilter === option.value;

                          return (
                            <button
                              key={option.value}
                              onClick={() => {
                                setCategoryFilter(option.value);
                                setShowCategoryMenu(false);
                              }}
                              className={cn(
                                "w-full flex items-center justify-between gap-2 px-3 py-2 text-xs font-semibold rounded-md transition-colors",
                                isActive
                                  ? "bg-blue-50 text-blue-700"
                                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                              )}
                            >
                              <span className="truncate">{option.label}</span>
                              {isActive && (
                                <Check
                                  size={13}
                                  className="shrink-0 text-blue-600"
                                />
                              )}
                            </button>
                          );
                        })
                      )}
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
            ) : viewMode === "kanban" && configuredKanbanResponse ? (
              <TicketKanban
                kanbanData={configuredKanbanResponse}
                onSelectTicket={onSelectTicket}
                currentUser={currentUser}
                onStatusChange={() => fetchData()}
                devCompanyId={devCompanyId}
                statusOptions={activeWorkflowStatusOptions}
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
                canSelectBulk={canBulkActions}
                sortKey={sortBy}
                sortOrder={sortOrder}
                onSortChange={handleSortChange}
                statusOptions={activeWorkflowStatusOptions}
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

      {canBulkActions && (
        <TicketBulkActions
          selectedCount={selectedTicketIds.length}
          onAction={handleBulkAction}
          onClear={() => setSelectedTicketIds([])}
          agents={agents}
          currentUser={currentUser}
          statusOptions={activeWorkflowStatusOptions}
        />
      )}

      <TicketFilterDrawer
        isOpen={showAdvanced}
        onClose={() => setShowAdvanced(false)}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        priorityFilter={priorityFilter}
        setPriorityFilter={setPriorityFilter}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        serviceFilter={serviceFilter}
        setServiceFilter={setServiceFilter}
        filters={advancedFilters}
        onFilterChange={setAdvancedFilters}
        onClear={clearFilters}
        agents={agents}
        categoryOptions={categoryOptionsForFilter}
        serviceOptions={serviceOptionsForFilter}
        statusOptions={activeWorkflowStatusOptions}
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

      <Modal
        isOpen={showWorkflowSettings}
        onClose={cancelWorkflowDraft}
        title="Fluxo de atendimento"
        size="xl"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={cancelWorkflowDraft}
            >
              Cancelar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={resetWorkflowStatuses}
            >
              <RotateCcw size={14} />
              Padrão
            </Button>
            <Button
              size="sm"
              onClick={saveWorkflowStatuses}
              disabled={!hasWorkflowDraftChanges || workflowSaving}
            >
              <Save size={14} />
              {workflowSaving ? "Salvando..." : "Salvar fluxo"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_260px]">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-start gap-2">
                <Settings2 size={16} className="mt-0.5 text-slate-500" />
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">
                    Status reais do atendimento
                  </h4>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">
                    Defina as etapas usadas no ticket, filtros, Kanban, ações em massa e automações. A função especial altera o comportamento real do sistema.
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Validação</div>
              <div className="mt-2 space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={13} className="text-emerald-600" />
                  1 status inicial obrigatório
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck size={13} className="text-emerald-600" />
                  Finalizado ou encerrado obrigatório
                </div>
              </div>
            </div>
          </div>

          {workflowError && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
              {workflowError}
            </div>
          )}

          <div className="space-y-2">
            {workflowLoading && (
              <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs font-semibold text-slate-500">
                Carregando status de atendimento...
              </div>
            )}
            {!workflowLoading && workflowDraftStatuses.length === 0 && (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-xs font-medium text-slate-500">
                Nenhum status configurado. Adicione um status para exibir o fluxo.
              </div>
            )}
            {workflowDraftStatuses.map((status, index) => {
              const usage = getWorkflowUsage(status.id);
              const specialLabel = TICKET_STATUS_SPECIAL_OPTIONS.find((option) => option.value === status.special)?.label || "Normal";
              return (
                <div
                key={status.id}
                className={cn(
                  "rounded-lg border bg-white p-3 shadow-sm",
                  status.active ? "border-slate-200" : "border-slate-200 bg-slate-50/70 opacity-80",
                )}
              >
                <div className="grid gap-3 lg:grid-cols-[88px_1fr_180px_210px_84px] lg:items-end">
                  <div className="flex items-center gap-1">
                    <Button type="button" variant="ghost" size="icon" onClick={() => moveWorkflowStatus(index, -1)} disabled={index === 0} title="Mover para cima" className="h-8 w-8">
                      <ArrowUp size={14} />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" onClick={() => moveWorkflowStatus(index, 1)} disabled={index === workflowDraftStatuses.length - 1} title="Mover para baixo" className="h-8 w-8">
                      <ArrowDown size={14} />
                    </Button>
                  </div>

                  <Input
                    inputSize="sm"
                    label={labelFromTicketStatus(status.id)}
                    value={status.label}
                    onChange={(event) => updateWorkflowStatus(status.id, { label: event.target.value })}
                    hint={`ID: ${status.id}`}
                  />

                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-slate-700">Cor</div>
                    <div className="flex items-center gap-1.5">
                      {STATUS_COLOR_SWATCHES.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => updateWorkflowStatus(status.id, { color })}
                          className={cn(
                            "h-6 w-6 rounded-md border shadow-sm",
                            status.color === color ? "border-slate-900 ring-2 ring-slate-200" : "border-white",
                          )}
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                      <Palette size={14} className="text-slate-400" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-slate-700">Função</div>
                    <button
                      type="button"
                      onClick={() => setSpecialStatusModalId(status.id)}
                      className="flex h-8 w-full items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-white"
                    >
                      <span>{specialLabel}</span>
                      <HelpCircle size={13} className="text-slate-400" />
                    </button>
                  </div>

                  <div className="flex items-center justify-end gap-1">
                    <Button
                      type="button"
                      variant={status.active ? "secondary" : "outline"}
                      size="icon"
                      onClick={() => updateWorkflowStatus(status.id, { active: !status.active })}
                      title={status.active ? "Desativar uso" : "Ativar uso"}
                      className="h-8 w-8"
                    >
                      <Check size={14} />
                    </Button>
                    <Button
                      type="button"
                      variant={status.visible ? "secondary" : "outline"}
                      size="icon"
                      onClick={() => updateWorkflowStatus(status.id, { visible: !status.visible })}
                      title={status.visible ? "Ocultar no Kanban" : "Mostrar no Kanban"}
                      className="h-8 w-8"
                    >
                      {status.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                    </Button>
                    {pendingRemoveWorkflowStatusId === status.id ? (
                      <button
                        type="button"
                        onClick={() => confirmRemoveWorkflowStatus(status.id)}
                        title="Confirmar remoção"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-rose-200 bg-white text-rose-700 shadow-sm hover:bg-rose-50"
                      >
                        <Trash2 size={14} />
                      </button>
                    ) : (
                      <Button type="button" variant="ghost" size="icon" onClick={() => requestRemoveWorkflowStatus(status.id)} title="Remover status" className="h-8 w-8 text-rose-600 hover:bg-rose-50 hover:text-rose-700">
                        <Trash2 size={14} />
                      </Button>
                    )}
                  </div>
                </div>

                {(usage.tickets > 0 || usage.automations > 0 || pendingRemoveWorkflowStatusId === status.id) && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-2 text-[11px] font-semibold text-slate-500">
                    <span>{usage.tickets} ticket(s)</span>
                    <span>{usage.automations} regra(s)</span>
                    {pendingRemoveWorkflowStatusId === status.id && (
                      <button
                        type="button"
                        onClick={() => setPendingRemoveWorkflowStatusId(null)}
                        className="ml-auto text-slate-500 hover:text-slate-800"
                      >
                        cancelar remoção
                      </button>
                    )}
                  </div>
                )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-semibold text-slate-900">
                Adicionar status
              </h4>
              <p className="mt-0.5 text-xs text-slate-500">
                Inclua outra etapa operacional no fluxo da empresa.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAddWorkflowStatus((prev) => !prev)}
            >
              <Plus size={14} />
              Adicionar
            </Button>
          </div>

          {showAddWorkflowStatus && (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/70 p-3">
              <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
                <Input
                  inputSize="sm"
                  label="Nome do status"
                  placeholder="Ex.: Backlog, Em Análise, Aguardando financeiro"
                  value={newWorkflowStatusLabel}
                  onChange={(event) =>
                    setNewWorkflowStatusLabel(event.target.value)
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") addWorkflowStatus();
                  }}
                  hint={
                    newWorkflowStatusLabel.trim()
                      ? `Identificador: ${slugifyTicketStatus(newWorkflowStatusLabel)}`
                      : "Você pode criar qualquer status personalizado."
                  }
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={addWorkflowStatus}
                  disabled={!newWorkflowStatusLabel.trim()}
                >
                  <Plus size={14} />
                  Adicionar
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={!!specialModalStatus}
        onClose={() => setSpecialStatusModalId(null)}
        title={specialModalStatus ? `Regra operacional de ${specialModalStatus.label}` : "Regra operacional do status"}
        size="lg"
      >
        <div className="space-y-4">
          {specialModalStatus && (
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-start gap-3">
                <div
                  className="mt-0.5 h-9 w-9 shrink-0 rounded-md border border-white shadow-sm ring-1 ring-slate-200"
                  style={{ backgroundColor: specialModalStatus.color || "#0891b2" }}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                    Status especial
                  </div>
                  <p className="mt-1 text-sm font-semibold leading-snug text-slate-900">
                    Escolha como o sistema deve tratar este status nas filas, SLA, reabertura e fechamento.
                  </p>
                  <div className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
                    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                      <div className="font-semibold text-slate-400">Status</div>
                      <div className="mt-0.5 truncate font-semibold text-slate-800">{specialModalStatus.label}</div>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                      <div className="font-semibold text-slate-400">Identificador</div>
                      <div className="mt-0.5 truncate font-mono text-[11px] font-semibold text-slate-700">{specialModalStatus.id}</div>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                      <div className="font-semibold text-slate-400">Publicação</div>
                      <div className="mt-0.5 font-semibold text-slate-800">Rascunho do fluxo</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-2">
            {TICKET_STATUS_SPECIAL_OPTIONS.map((option) => {
              const selected = specialModalStatus?.special === option.value;
              const presentation = STATUS_SPECIAL_PRESENTATION[option.value];
              const SpecialIcon = presentation.icon;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => specialModalStatus && setWorkflowStatusSpecial(specialModalStatus.id, option.value)}
                  className={cn(
                    "group rounded-lg border p-3 text-left transition-colors",
                    selected
                      ? "border-slate-900 bg-slate-950 text-white shadow-sm"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md border",
                        selected
                          ? "border-white/15 bg-white/10 text-white"
                          : "border-slate-200 bg-slate-50 text-slate-500 group-hover:bg-white",
                      )}
                    >
                      <SpecialIcon size={17} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-sm font-semibold">{option.label}</div>
                        <span
                          className={cn(
                            "rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                            selected
                              ? "border-white/15 bg-white/10 text-slate-200"
                              : "border-slate-200 bg-slate-50 text-slate-500",
                          )}
                        >
                          {presentation.badge}
                        </span>
                      </div>
                      <p className={cn("mt-1 text-xs leading-relaxed", selected ? "text-slate-300" : "text-slate-500")}>
                        {option.description}
                      </p>
                      <div className="mt-2 grid gap-1.5 text-[11px] sm:grid-cols-2">
                        <div className={cn("rounded-md px-2 py-1.5", selected ? "bg-white/10 text-slate-200" : "bg-slate-50 text-slate-600")}>
                          <span className="font-bold">Impacto:</span> {presentation.impact}
                        </div>
                        <div className={cn("rounded-md px-2 py-1.5", selected ? "bg-white/10 text-slate-200" : "bg-slate-50 text-slate-600")}>
                          <span className="font-bold">Quando usar:</span> {presentation.rule}
                        </div>
                      </div>
                    </div>
                    <div
                      className={cn(
                        "mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                        selected
                          ? "border-white bg-white text-slate-950"
                          : "border-slate-300 text-transparent",
                      )}
                    >
                      <Check size={13} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200 pt-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-relaxed text-slate-500">
              A escolha é aplicada ao rascunho. Para publicar, feche esta janela e clique em <span className="font-semibold text-slate-700">Salvar fluxo</span>.
            </p>
            <Button type="button" size="sm" onClick={() => setSpecialStatusModalId(null)}>
              Concluir
            </Button>
          </div>
        </div>
      </Modal>

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
