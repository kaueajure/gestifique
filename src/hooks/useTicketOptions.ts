import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { TicketOption } from '../types';

export function useTicketOptions(companyId?: string) {
  const [categories, setCategories] = useState<TicketOption[]>([]);
  const [services, setServices] = useState<TicketOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) {
      setLoading(false);
      setCategories([]);
      setServices([]);
      return;
    }

    let isMounted = true;

    async function fetchOptions() {
      try {
        setLoading(true);
        setError(null);
        
        const [catRes, servRes] = await Promise.all([
          api.get(`/companies/${companyId}/ticket-categories`),
          api.get(`/companies/${companyId}/ticket-services`)
        ]);

        if (isMounted) {
          setCategories(catRes as unknown as TicketOption[]);
          setServices(servRes as unknown as TicketOption[]);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.response?.data?.error || 'Erro ao carregar opções do ticket');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchOptions();

    return () => { isMounted = false; };
  }, [companyId]);

  const activeCategories = categories.filter(c => c.ativo);
  const activeServices = services.filter(s => s.ativo);

  return { 
    categories, 
    services, 
    activeCategories, 
    activeServices, 
    loading, 
    error
  };
}
