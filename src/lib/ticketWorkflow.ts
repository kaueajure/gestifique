import { TicketKanbanResponse, TicketStatus } from "../types";

export interface TicketWorkflowStatus {
  id: TicketStatus;
  label: string;
  visible: boolean;
}

export const DEFAULT_TICKET_WORKFLOW: TicketWorkflowStatus[] = [
  { id: "aberto", label: "Aberto", visible: true },
  { id: "em_andamento", label: "Em andamento", visible: true },
  { id: "aguardando_cliente", label: "Aguardando resposta", visible: true },
  { id: "resolvido", label: "Finalizado", visible: true },
  { id: "fechado", label: "Fechado", visible: false },
];

const STORAGE_KEY_PREFIX = "gestifique.ticketWorkflow";

const getWorkflowKey = (companyId?: number | string | null) =>
  `${STORAGE_KEY_PREFIX}.${companyId || "default"}`;

export const loadTicketWorkflow = (
  companyId?: number | string | null,
): TicketWorkflowStatus[] => {
  if (typeof window === "undefined") return DEFAULT_TICKET_WORKFLOW;

  try {
    const stored = window.localStorage.getItem(getWorkflowKey(companyId));
    if (!stored) return DEFAULT_TICKET_WORKFLOW;

    const parsed = JSON.parse(stored) as TicketWorkflowStatus[];
    if (!Array.isArray(parsed)) return DEFAULT_TICKET_WORKFLOW;

    const validIds = new Set(DEFAULT_TICKET_WORKFLOW.map((item) => item.id));
    const sanitized = parsed.filter((item) => validIds.has(item.id));
    const missing = DEFAULT_TICKET_WORKFLOW.filter(
      (item) => !sanitized.some((storedItem) => storedItem.id === item.id),
    );

    return [...sanitized, ...missing];
  } catch {
    return DEFAULT_TICKET_WORKFLOW;
  }
};

export const saveTicketWorkflow = (
  companyId: number | string | null | undefined,
  workflow: TicketWorkflowStatus[],
) => {
  window.localStorage.setItem(getWorkflowKey(companyId), JSON.stringify(workflow));
};

export const applyTicketWorkflowToKanban = (
  kanbanData: TicketKanbanResponse,
  workflow: TicketWorkflowStatus[],
): TicketKanbanResponse => {
  const sourceColumns = kanbanData.columns || [];

  const columns = workflow
    .filter((item) => item.visible)
    .map((item) => {
      const sourceColumn = sourceColumns.find((column) => column.id === item.id);
      return {
        id: item.id,
        title: item.label,
        count: sourceColumn?.count || 0,
        tickets: sourceColumn?.tickets || [],
      };
    });

  return { ...kanbanData, columns };
};
