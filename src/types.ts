export interface User {
  id: number;
  empresa_id: number | null;
  nome: string;
  email: string;
  cargo: string | null;
  administrador: boolean;
  desenvolvedor: boolean;
  ativo: boolean;
  telefone: string | null;
  foto: string | null;
  empresa_nome?: string;
  created_at: string;
}

export interface Empresa {
  id: number;
  nome: string;
  cnpj: string;
  email: string;
  telefone: string;
  logo: string | null;
  cor_principal: string;
  ativo: boolean;
  created_at: string;
}

export interface Ticket {
  id: number;
  empresa_id: number;
  usuario_id: number;
  responsavel_id: number | null;
  titulo: string;
  descricao: string;
  status: 'aberto' | 'em_andamento' | 'aguardando_cliente' | 'resolvido' | 'fechado';
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
  categoria: string;
  cliente_nome?: string;
  responsavel_nome?: string;
  empresa_nome?: string;
  finalizado_em: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: number;
  ticket_id: number;
  usuario_id: number;
  usuario_nome: string;
  mensagem: string;
  interno: boolean;
  anexo: string | null;
  created_at: string;
}

export interface DashboardStats {
  total: number;
  aberto: number;
  em_andamento: number;
  aguardando_cliente: number;
  resolvido: number;
  fechado: number;
  urgente: number;
}
