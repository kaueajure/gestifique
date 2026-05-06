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
  ultimo_login: string | null;
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
  total_usuarios?: number;
  total_tickets?: number;
}

export interface UserFormData {
  nome: string;
  email: string;
  password?: string;
  cargo: string;
  telefone: string;
  empresa_id: number | null;
  administrador: boolean;
  desenvolvedor: boolean;
}

export interface CompanyFormData {
  nome: string;
  cnpj: string;
  email: string;
  telefone: string;
  cor_principal: string;
  logo?: string | null;
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
  origem?: string;
  prazo_sla?: string | null;
  cliente_nome?: string;
  cliente_email?: string;
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
