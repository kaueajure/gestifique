import React, { useState, useEffect } from 'react';
import { Building, Loader2 } from 'lucide-react';
import { User, Empresa as Company } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { api } from '../../lib/api';

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onSuccess: () => void;
}

export const CreateTicketModal = ({ isOpen, onClose, currentUser, onSuccess }: CreateTicketModalProps) => {
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);

  useEffect(() => {
    if (isOpen && !!currentUser.desenvolvedor && !currentUser.empresa_id) {
      fetchCompanies();
    }
  }, [isOpen, currentUser]);

  const fetchCompanies = async () => {
    setLoadingCompanies(true);
    try {
      const data = await api.get<Company[]>('/companies');
      setCompanies(data);
    } catch (err) {
      console.error('Erro ao buscar empresas:', err);
    } finally {
      setLoadingCompanies(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoadingCreate(true);
    setCreateError(null);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    if (!!currentUser.desenvolvedor && !currentUser.empresa_id && !data.empresa_id) {
       setCreateError('Selecione uma empresa para abrir o atendimento.');
       setLoadingCreate(false);
       return;
    }

    try {
      if (data.titulo && String(data.titulo).length < 3) throw new Error("O título precisa ter no mínimo 3 caracteres");
      if (data.descricao && String(data.descricao).length < 5) throw new Error("A descrição precisa ter no mínimo 5 caracteres");
      
      await api.post('/tickets', data);
      onSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar atendimento.';
      setCreateError(message);
    } finally {
      setLoadingCreate(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Novo Atendimento"
      size="lg"
    >
      <form onSubmit={handleCreateTicket} className="space-y-5">
        {createError && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-xs font-semibold mb-4">
              {createError}
            </div>
          )}
        
        <Input 
          label="Assunto do Atendimento"
          name="titulo" 
          required 
          placeholder="Descreva o assunto brevemente" 
          minLength={3}
        />

        {!!currentUser.desenvolvedor && !currentUser.empresa_id && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Empresa Solicitante</label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <select 
                name="empresa_id" 
                required
                className="w-full h-10 bg-white border border-slate-200 rounded-lg pl-9 pr-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-100 transition-all appearance-none"
              >
                <option value="">Selecione uma empresa...</option>
                {companies.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.nome}</option>
                ))}
              </select>
              {loadingCompanies && (
                <div className="absolute right-8 top-1/2 -translate-y-1/2">
                  <Loader2 size={14} className="animate-spin text-blue-600" />
                </div>
              )}
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Categoria</label>
            <select name="categoria" className="w-full h-10 bg-white border border-slate-200 rounded-lg px-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-100 transition-all appearance-none">
              <option value="suporte_tecnico">Suporte Técnico</option>
              <option value="financeiro">Financeiro</option>
              <option value="recursos_humanos">Recursos Humanos</option>
              <option value="comercial">Comercial</option>
              <option value="outros">Outros</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Prioridade</label>
            <select name="prioridade" className="w-full h-10 bg-white border border-slate-200 rounded-lg px-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-100 transition-all appearance-none">
              <option value="baixa">Baixa</option>
              <option value="media">Média</option>
              <option value="alta">Alta</option>
              <option value="urgente">Urgente</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Descrição</label>
          <textarea 
            name="descricao" 
            required
            minLength={5}
            rows={5}
            placeholder="Descreva os detalhes da sua solicitação..."
            className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-100 transition-all resize-none"
          ></textarea>
        </div>

        <div className="pt-4 flex justify-end gap-2">
            <Button variant="ghost" type="button" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" loading={loadingCreate}>
              Criar Atendimento
            </Button>
        </div>
      </form>
    </Modal>
  );
};
