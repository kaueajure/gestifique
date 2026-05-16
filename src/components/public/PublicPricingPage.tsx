import React from 'react';
import { Check, HelpCircle } from 'lucide-react';

interface PublicPricingPageProps {
  onNavigate: (path: string) => void;
}

export const PublicPricingPage = ({ onNavigate }: PublicPricingPageProps) => {
  const plans = [
    {
      name: 'Inicial',
      target: 'Equipes que estão organizando o fluxo.',
      highlightText: 'Para sair da planilha',
      features: [
        'Atendentes limitados (até 5)',
        'Portal do cliente',
        'Criação de tickets padronizados',
        'Pesquisa de satisfação (CSAT)',
        'Relatórios básicos de operação'
      ],
      highlight: false
    },
    {
      name: 'Profissional',
      target: 'Operações B2B que precisam de controle.',
      highlightText: 'Mais escolhido',
      features: [
        'Faixa de atendentes personalizada',
        'SLA Estrito (1ª resposta e resolução)',
        'Dashboard em Tempo Real',
        'Fluxo de Inatividade de chamados',
        'Base de Conhecimento'
      ],
      highlight: true
    },
    {
      name: 'Empresarial',
      target: 'Múltiplas áreas com alta complexidade.',
      highlightText: 'Para operações complexas',
      features: [
        'Gestão Multi-empresa (Multi-tenant)',
        'Auditoria e Logs refinados',
        'Configuração por equipe',
        'Onboarding Dedicado (Implantação)',
        'SLA Customizado de Suporte'
      ],
      highlight: false
    }
  ];

  return (
    <div className="flex flex-col bg-slate-50 min-h-screen">
      {/* Header */}
      <section className="pt-20 pb-12 px-6 bg-slate-900 border-b border-slate-800 text-white text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">
            Planos para diferentes fases da sua operação.
          </h1>
          <p className="text-lg font-medium text-slate-400 leading-relaxed max-w-xl mx-auto">
            O Gestifique pode ser adaptado ao tamanho da sua equipe, volume de tickets e necessidade de gestão de desempenho.
          </p>
        </div>
      </section>

      {/* Pricing Grid */}
      <section className="py-16 px-6 -mt-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6 items-stretch">
             {plans.map((plan, i) => (
                <div key={i} className={`relative p-6 rounded-xl border flex flex-col ${plan.highlight ? 'bg-white border-blue-600 shadow-md z-10' : 'bg-white border-slate-200 shadow-sm mt-0 md:mt-2'}`}>
                  
                  {plan.highlight && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                       {plan.highlightText}
                    </div>
                  )}

                  <div className="space-y-2 mb-6">
                    {!plan.highlight && <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{plan.highlightText}</div>}
                    <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                    <p className="text-[13px] font-medium text-slate-500">{plan.target}</p>
                  </div>
                  
                  <div className="mb-6">
                     <span className="text-2xl font-bold tracking-tight text-slate-900">Sob consulta</span>
                  </div>

                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feature, j) => (
                      <li key={j} className="flex items-start gap-3">
                         <div className={`mt-0.5 rounded-full p-0.5 ${plan.highlight ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400'}`}>
                           <Check size={14} strokeWidth={3} />
                         </div>
                         <span className="text-[13px] font-bold text-slate-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button 
                    onClick={() => onNavigate('/contato')}
                    className={`h-11 w-full rounded-lg text-[14px] font-bold transition-all ${
                      plan.highlight 
                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm' 
                        : 'bg-white text-slate-700 hover:bg-slate-50 border-2 border-slate-200'
                    }`}
                  >
                    Solicitar Proposta
                  </button>
                </div>
             ))}
          </div>
        </div>
      </section>

      {/* O que influencia */}
      <section className="py-16 px-6 bg-white border-y border-slate-200">
         <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-center text-slate-900 tracking-tight mb-10">O que influencia a proposta?</h2>
            
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
              {[
                "Quantidade de Atendentes",
                "Volume mensal de atendimentos",
                "Multi-empresas e marcas",
                "Necessidade rigorosa de SLA",
                "Uso de Portal do Cliente VIP",
                "Treinamento de Implantação"
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border border-slate-100">
                   <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                   <span className="text-sm font-bold text-slate-700">{item}</span>
                </div>
              ))}
            </div>
         </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-6">
         <div className="max-w-3xl mx-auto space-y-10">
            <div className="text-center space-y-4">
              <h2 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900">Perguntas sobre Planos</h2>
            </div>
            
            <div className="space-y-4">
               {[
                 { q: 'Posso começar pequeno?', a: 'Com certeza. Muitos clientes iniciam no Plano Inicial para organizar as demandas primárias e migram conforme ganham escala.' },
                 { q: 'Existe custo de implantação (Setup)?', a: 'Depende da complexidade e do plano. Para operações mais estruturadas, recomendamos um setup dedicado para garantir treinamento e aderência.' },
                 { q: 'Posso usar para atendimento interno apenas?', a: 'Sim! Se você for usar para Help Desk de TI ou DP, sem acesso de cliente externo, podemos adequar nossa proposta.' },
                 { q: 'O preço é estritamente por usuário?', a: 'Avaliamos o escopo técnico todo: volume esperado, necessidades, integrações se houverem. Tudo sob consulta.' },
                 { q: 'Posso solicitar demonstração antes de contratar?', a: 'Sim! É mandatório para que tenhamos plena certeza de que seremos a ferramenta correta para o momento de vocês.' },
               ].map((faq, idx) => (
                 <div key={idx} className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                   <h4 className="text-[14px] font-bold text-slate-900 flex items-center gap-2 mb-2">
                     <HelpCircle size={16} className="text-slate-400" /> {faq.q}
                   </h4>
                   <p className="text-[13px] text-slate-600 font-medium leading-relaxed pl-6">{faq.a}</p>
                 </div>
               ))}
            </div>
         </div>
      </section>

      {/* Final CTA */}
      <section className="py-12 px-6 text-center mb-8">
         <button 
           onClick={() => onNavigate('/contato')}
           className="h-11 px-6 bg-blue-600 text-white text-[14px] font-bold rounded-lg hover:bg-blue-700 transition-all shadow-sm"
         >
           Falar com consultor agora
         </button>
      </section>
    </div>
  );
};
