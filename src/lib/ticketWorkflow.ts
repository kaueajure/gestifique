import { TicketKanbanResponse, TicketStatus } from "../types";

export interface TicketWorkflowStatus {
  id: TicketStatus;
  label: string;
  visible: boolean;
}

export const DEFAULT_TICKET_WORKFLOW: TicketWorkflowStatus[] = [
  { id: "aberto", label: "Aberto", visible: true },
  { id: "em_andamento", label: "Em Atendimento", visible: true },
  { id: "resolvido", label: "Finalizado", visible: true },
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

    const sanitized = parsed.filter(
      (item) =>
        item &&
        typeof item.id === "string" &&
        /^[a-z0-9_]{2,80}$/.test(item.id) &&
        typeof item.label === "string" &&
        item.label.trim().length > 0,
    );
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

export const slugifyTicketStatus = (label: string) =>
  label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);

export const labelFromTicketStatus = (status: string) =>
  status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

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
