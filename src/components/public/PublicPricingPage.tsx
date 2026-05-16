import React from 'react';
import { Check } from 'lucide-react';

interface PublicPricingPageProps {
  onNavigate: (path: string) => void;
}

export const PublicPricingPage = ({ onNavigate }: PublicPricingPageProps) => {
  const plans = [
    {
      name: 'Plano Inicial',
      target: 'Ideal para equipes pequenas',
      features: [
        'Organização de Tickets Básica',
        'Atendentes e Clientes ilimitados',
        'Dashboard em Tempo Real',
        'Histórico e Base de Conhecimento'
      ],
      highlight: false
    },
    {
      name: 'Plano Profissional',
      target: 'Ideal para operações em crescimento',
      features: [
        'Tudo do Plano Inicial',
        'Controle de SLA Completo',
        'Campos Personalizados em Chamados',
        'Relatórios Gerenciais Avançados',
        'Portal do Cliente Integrado'
      ],
      highlight: true
    },
    {
      name: 'Plano Empresarial',
      target: 'Ideal para múltiplas equipes/empresas',
      features: [
        'Tudo do Plano Profissional',
        'Gestão Multi-empresa (Multi-tenant)',
        'Auditoria e Logs do Sistema',
        'Painel de Controle Customizado',
        'Suporte Dedicado'
      ],
      highlight: false
    }
  ];

  return (
    <div className="flex flex-col pb-20">
      {/* Header */}
      <section className="pt-20 pb-12 px-6 bg-slate-50 border-b border-slate-100">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Modelos de contratação
          </h1>
          <p className="text-[15px] font-medium text-slate-500 leading-relaxed max-w-xl mx-auto">
            Planos desenhados para suportar o crescimento da sua equipe de atendimento sem custos surpresa.
          </p>
        </div>
      </section>

      {/* Pricing Grid */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6 items-stretch">
             {plans.map((plan, i) => (
                <div key={i} className={`p-6 rounded-2xl border flex flex-col ${plan.highlight ? 'bg-slate-900 border-slate-800 text-white shadow-xl' : 'bg-white border-slate-200 text-slate-900 shadow-sm'}`}>
                  <div className="space-y-1 mb-6">
                    <h3 className={`text-lg font-bold ${plan.highlight ? 'text-white' : 'text-slate-900'}`}>{plan.name}</h3>
                    <p className={`text-xs font-semibold ${plan.highlight ? 'text-slate-400' : 'text-slate-500'}`}>{plan.target}</p>
                  </div>
                  
                  <div className="mb-6">
                     <span className={`text-2xl font-bold tracking-tight ${plan.highlight ? 'text-white' : 'text-slate-900'}`}>Sob consulta</span>
                  </div>

                  <ul className="space-y-4 mb-8 flex-1">
                    {plan.features.map((feature, j) => (
                      <li key={j} className="flex items-start gap-3">
                         <div className={`mt-0.5 rounded-full p-0.5 ${plan.highlight ? 'bg-slate-800 text-blue-400' : 'bg-emerald-50 text-emerald-500'}`}>
                           <Check size={12} strokeWidth={3} />
                         </div>
                         <span className={`text-[13px] font-medium ${plan.highlight ? 'text-slate-300' : 'text-slate-600'}`}>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button 
                    onClick={() => onNavigate('/contato')}
                    className={`h-10 w-full rounded-lg text-[13px] font-bold transition-all ${
                      plan.highlight 
                        ? 'bg-blue-600 text-white hover:bg-blue-500' 
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    Solicitar Proposta
                  </button>
                </div>
             ))}
          </div>
        </div>
      </section>
    </div>
  );
};
