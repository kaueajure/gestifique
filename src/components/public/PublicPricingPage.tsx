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
        'Atendentes ilimitados (a combinar)',
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
        'Separação por Departamentos',
        'Onboarding Dedicado (Implantação)',
        'SLA Customizado de Suporte'
      ],
      highlight: false
    }
  ];

  return (
    <div className="flex flex-col bg-slate-50 min-h-screen">
      {/* Header */}
      <section className="pt-24 pb-16 px-6 bg-slate-900 border-b border-slate-800 text-white text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight">
            Planos para diferentes fases da sua operação.
          </h1>
          <p className="text-lg font-medium text-slate-400 leading-relaxed max-w-xl mx-auto">
            O Gestifique pode ser adaptado ao tamanho da sua equipe, volume de tickets e necessidade de gestão de desempenho.
          </p>
        </div>
      </section>

      {/* Pricing Grid */}
      <section className="py-20 px-6 -mt-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 items-stretch">
             {plans.map((plan, i) => (
                <div key={i} className={`relative p-8 rounded-2xl border flex flex-col ${plan.highlight ? 'bg-white border-blue-600 shadow-xl scale-100 lg:scale-105 z-10' : 'bg-white border-slate-200 shadow-sm mt-4'}`}>
                  
                  {plan.highlight && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                       {plan.highlightText}
                    </div>
                  )}

                  <div className="space-y-2 mb-8">
                    {!plan.highlight && <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{plan.highlightText}</div>}
                    <h3 className="text-2xl font-bold text-slate-900">{plan.name}</h3>
                    <p className="text-sm font-medium text-slate-500">{plan.target}</p>
                  </div>
                  
                  <div className="mb-8">
                     <span className="text-3xl font-bold tracking-tight text-slate-900">Sob consulta</span>
                  </div>

                  <ul className="space-y-4 mb-10 flex-1">
                    {plan.features.map((feature, j) => (
                      <li key={j} className="flex items-start gap-3">
                         <div className={`mt-0.5 rounded-full p-0.5 ${plan.highlight ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400'}`}>
                           <Check size={14} strokeWidth={3} />
                         </div>
                         <span className="text-sm font-bold text-slate-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button 
                    onClick={() => onNavigate('/contato')}
                    className={`h-12 w-full rounded-lg text-[14px] font-bold transition-all ${
                      plan.highlight 
                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md' 
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
      <section className="py-20 px-6 bg-white border-y border-slate-200">
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
      <section className="py-24 px-6">
         <div className="max-w-3xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">Perguntas sobre Planos</h2>
            </div>
            
            <div className="space-y-4">
               {[
                 { q: 'Posso começar pequeno?', a: 'Com certeza. Muitos clientes iniciam no Plano Inicial para pequenas equipes organizarem as demandas e migram de plano conforme ganham maturidade de processo.' },
                 { q: 'Existe custo de implantação (Setup)?', a: 'Depende da complexidade e do plano escolhido. Para operações complexas (Empresarial), indicamos um valor isolado de setup para garantir que nosso time configure, treine sua equipe e deixe tudo operando.' },
                 { q: 'Posso usar para atendimento interno apenas?', a: 'Sim! Se você for usar para Help Desk de Ti, DP ou Financeiro sem convidar clientes externos, o volume de acesso e custo geralmente é otimizado. Avaliamos isso na demonstração.' },
                 { q: 'O preço é estritamente por usuário?', a: 'Nós avaliamos o modelo inteiro. Em alguns casos focamos em ranges (até 10 usuários), em outros por volume de ticket. A flexibilidade do "Sob Consulta" garante que seja justo.' },
                 { q: 'Posso solicitar demonstração antes de contratar?', a: 'Obrigatório! Nós não vendemos sem antes demonstrar a plataforma e ter certeza de que o Gestifique é o software ideal para as dores da sua empresa.' },
               ].map((faq, idx) => (
                 <div key={idx} className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
                   <h4 className="text-[15px] font-bold text-slate-900 flex items-center gap-2 mb-2">
                     <HelpCircle size={18} className="text-slate-400" /> {faq.q}
                   </h4>
                   <p className="text-sm text-slate-600 font-medium leading-relaxed pl-6">{faq.a}</p>
                 </div>
               ))}
            </div>
         </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6 text-center">
         <button 
           onClick={() => onNavigate('/contato')}
           className="h-12 px-8 bg-blue-600 text-white text-[14px] font-bold rounded-lg hover:bg-blue-700 transition-all shadow-md"
         >
           Falar com consultor agora
         </button>
      </section>
    </div>
  );
};
