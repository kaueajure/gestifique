import React from 'react';
import { Ticket, Clock, Users, ShieldCheck, History, MessagesSquare, LayoutDashboard, Database, RefreshCw, Layers, Bell, CheckCircle2 } from 'lucide-react';

interface PublicFeaturesPageProps {
  onNavigate: (path: string) => void;
}

export const PublicFeaturesPage = ({ onNavigate }: PublicFeaturesPageProps) => {
  const features = [
    { icon: Ticket, title: 'Gestão Inteligente de Tickets', desc: 'Estruturação por status, prioridades, e status operacional contínuo.' },
    { icon: Clock, title: 'Monitoramento de SLA', desc: 'Acompanhe metas de primeira resposta e tempo de resolução geral.' },
    { icon: ShieldCheck, title: 'Permissões por Nível', desc: 'Administradores, Atendentes e Clientes com acessos baseados em função.' },
    { icon: MessagesSquare, title: 'Comunicação Interna', desc: 'Notas e anexos visíveis somente para sua equipe técnica.' },
    { icon: Users, title: 'Portal do Cliente', desc: 'Um ambiente exclusivo para os clientes acompanharem os chamados.' },
    { icon: Database, title: 'Base de Conhecimento', desc: 'Documentação integrada e FAQ acessível na plataforma.' },
    { icon: History, title: 'Histórico & Auditoria', desc: 'Acompanhamento total de mudanças e interações de cada ticket.' },
    { icon: LayoutDashboard, title: 'Dashboard Gerencial', desc: 'Painel em tempo real da saúde da operação.' },
    { icon: CheckCircle2, title: 'Respostas Prontas', desc: 'Catálogo de macros para respostas comuns.' },
    { icon: Layers, title: 'Campos Personalizados', desc: 'Enriqueça o ticket com dados vitais da operação.' },
    { icon: Bell, title: 'Notificações', desc: 'Alertas e badges atualizados instantaneamente.' },
    { icon: RefreshCw, title: 'Status Moderno', desc: 'Fluxos desenhados para a realidade de suporte B2B.' },
  ];

  return (
    <div className="flex flex-col pb-20">
      {/* Header */}
      <section className="pt-20 pb-12 px-6 bg-slate-50 border-b border-slate-100">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Funcionalidades para organizar seu atendimento
          </h1>
          <p className="text-[15px] font-medium text-slate-500 leading-relaxed">
            Sem excesso de botões. Apenas os recursos necessários para que sua equipe seja ágil e seu cliente bem atendido.
          </p>
        </div>
      </section>

      {/* Grid */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, i) => (
              <div 
                key={i}
                className="p-5 bg-white border border-slate-200 rounded-xl hover:border-blue-300 transition-colors shadow-sm"
              >
                <div className="w-8 h-8 bg-slate-50 text-slate-500 rounded-lg flex items-center justify-center mb-3">
                  <feature.icon size={16} />
                </div>
                <h3 className="text-sm font-bold mb-1.5">{feature.title}</h3>
                <p className="text-[13px] font-medium text-slate-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="pt-10 px-6 text-center">
         <h2 className="text-lg font-bold mb-4">Veja como essas ferramentas se encaixam no seu negócio</h2>
         <button 
           onClick={() => onNavigate('/contato')}
           className="h-9 px-6 bg-blue-600 text-white text-[13px] font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-sm"
         >
           Falar com o time
         </button>
      </section>
    </div>
  );
};
