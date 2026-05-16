import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { Trash2, Plus, Edit2, Check, X, ShieldAlert } from 'lucide-react';
import { TicketOption, User } from '../../types';

interface TicketOptionsManagerProps {
  currentUser: User;
}

export const TicketOptionsManager = ({ currentUser }: TicketOptionsManagerProps) => {
  const [categories, setCategories] = useState<TicketOption[]>([]);
  const [services, setServices] = useState<TicketOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [newCategory, setNewCategory] = useState('');
  const [newService, setNewService] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const isDevOrAdmin = currentUser.administrador || currentUser.desenvolvedor;
  const companyId = currentUser.empresa_id;

  const loadOptions = async () => {
    if (!companyId) return;
    try {
      setLoading(true);
      const [catRes, servRes] = await Promise.all([
        api.get<TicketOption[]>(`/companies/${companyId}/ticket-categories`),
        api.get<TicketOption[]>(`/companies/${companyId}/ticket-services`)
      ]);
      setCategories(catRes);
      setServices(servRes);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOptions();
  }, [companyId]);

  const handleAdd = async (type: 'category' | 'service') => {
    const value = type === 'category' ? newCategory : newService;
    if (!value.trim()) return;
    const slug = value.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    
    try {
      const endpoint = type === 'category' ? 'ticket-categories' : 'ticket-services';
      await api.post(`/companies/${companyId}/${endpoint}`, {
        nome: value.trim(),
        valor: slug,
        ativo: 1,
        ordem: type === 'category' ? categories.length : services.length
      });
      if (type === 'category') setNewCategory('');
      else setNewService('');
      loadOptions();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao adicionar item');
    }
  };

  const handleDelete = async (type: 'category' | 'service', id: number) => {
    if (!confirm('Deseja realmente excluir esta opção?')) return;
    try {
      const endpoint = type === 'category' ? 'ticket-categories' : 'ticket-services';
      await api.delete(`/companies/${companyId}/${endpoint}/${id}`);
      loadOptions();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao excluir item');
    }
  };

  const handleSaveEdit = async (type: 'category' | 'service', id: number) => {
    if (!editName.trim()) return;
    try {
      const endpoint = type === 'category' ? 'ticket-categories' : 'ticket-services';
      await api.patch(`/companies/${companyId}/${endpoint}/${id}`, {
        nome: editName.trim()
      });
      setEditingId(null);
      loadOptions();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao atualizar item');
    }
  };

  const startEdit = (type: string, id: number, currentName: string) => {
    setEditingId(`${type}_${id}`);
    setEditName(currentName);
  };

  if (!isDevOrAdmin) {
    return (
      <div className="p-6 bg-red-50 text-red-600 rounded-xl flex items-center gap-3">
        <ShieldAlert size={20} />
        Acesso restrito. Apenas administradores podem gerenciar configurações de atendimento.
      </div>
    );
  }

  if (loading) return <div className="p-6 text-slate-500 text-sm">Carregando configurações...</div>;

  const renderList = (type: 'category' | 'service', items: TicketOption[]) => {
    return (
      <div className="space-y-1.5 mt-3">
        {items.map(item => (
          <div key={item.id} className="flex justify-between items-center p-2 border border-slate-100 rounded-md hover:border-slate-200 bg-slate-50/50">
            {editingId === `${type}_${item.id}` ? (
              <div className="flex-1 flex gap-2 mr-4">
                <Input value={editName} onChange={e => setEditName(e.target.value)} autoFocus className="h-7 text-xs" />
                <Button size="sm" className="h-7 w-7 p-0" onClick={() => handleSaveEdit(type, item.id)}><Check size={14}/></Button>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditingId(null)}><X size={14}/></Button>
              </div>
            ) : (
              <div className="flex-1">
                <span className="text-sm font-medium text-slate-800">{item.nome}</span>
              </div>
            )}
            
            {editingId !== `${type}_${item.id}` && (
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => startEdit(type, item.id, item.nome)} className="h-7 w-7 p-0 text-slate-400 hover:text-slate-600">
                  <Edit2 size={13} />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(type, item.id)} className="h-7 w-7 p-0 text-red-500 hover:bg-red-50 hover:text-red-600">
                  <Trash2 size={13} />
                </Button>
              </div>
            )}
          </div>
        ))}
        {items.length === 0 && (
          <div className="text-center p-4 bg-slate-50 rounded-md border border-slate-100 text-slate-400 text-xs">
            Nenhuma opção configurada.
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {error && <div className="p-3 bg-red-50 text-red-600 text-xs font-semibold rounded-lg border border-red-100">{error}</div>}
      
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-slate-900 mb-0.5">Categorias</h3>
          <p className="text-xs text-slate-500 mb-4">Configure os tipos de atendimento da empresa.</p>
          
          <div className="flex gap-2">
            <Input 
              value={newCategory} 
              onChange={e => setNewCategory(e.target.value)} 
              placeholder="Ex: Suporte Técnico" 
              className="flex-1 h-8 text-sm"
              onKeyDown={e => e.key === 'Enter' && handleAdd('category')}
            />
            <Button size="sm" onClick={() => handleAdd('category')}><Plus size={14} className="mr-1" /> Adicionar</Button>
          </div>
          
          {renderList('category', categories)}
        </Card>
        
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-slate-900 mb-0.5">Serviços</h3>
          <p className="text-xs text-slate-500 mb-4">Serviços oferecidos nos atendimentos.</p>
          
          <div className="flex gap-2">
            <Input 
              value={newService} 
              onChange={e => setNewService(e.target.value)} 
              placeholder="Ex: Consultoria" 
              className="flex-1 h-8 text-sm"
              onKeyDown={e => e.key === 'Enter' && handleAdd('service')}
            />
            <Button size="sm" onClick={() => handleAdd('service')}><Plus size={14} className="mr-1" /> Adicionar</Button>
          </div>
          
          {renderList('service', services)}
        </Card>
      </div>
    </div>
  );
};
