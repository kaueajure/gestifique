import React from 'react';
import { motion } from 'motion/react';
import { 
  ArrowRight, 
  Ticket, 
  CheckCircle2, 
  Users, 
  MessagesSquare, 
  LayoutDashboard, 
  History, 
  Building2,
  Clock,
  Menu,
  X,
  ShieldCheck,
  Activity
} from 'lucide-react';
import { AppLogo } from '../ui/Logo';

interface LandingPageProps {
  onLogin: () => void;
}

export const LandingPage = ({ onLogin }: LandingPageProps) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-blue-100 selection:text-blue-900 text-slate-900">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <AppLogo size={20} />
            <span className="text-base font-semibold tracking-tight">Gestifique</span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {['Recursos', 'Como funciona', 'Benefícios'].map((item) => (
              <a 
                key={item} 
                href={`#${item.toLowerCase().replace(' ', '-')}`} 
                className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(item.toLowerCase().replace(' ', '-'))?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                {item}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <button 
              onClick={onLogin}
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Entrar
            </button>
            <button 
              onClick={onLogin}
              className="h-8 px-4 bg-slate-900 text-white text-sm font-semibold rounded-md hover:bg-slate-800 transition-all active:scale-95"
            >
              Começar agora
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden text-slate-900 p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Nav */}
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden bg-white border-b border-slate-100 p-6 space-y-4 shadow-xl"
          >
            {['Recursos', 'Como funciona', 'Benefícios'].map((item) => (
              <a 
                key={item} 
                href={`#${item.toLowerCase().replace(' ', '-')}`} 
                className="block text-sm font-medium text-slate-600"
                onClick={() => setIsMenuOpen(false)}
              >
                {item}
              </a>
            ))}
            <div className="pt-4 flex flex-col gap-3">
              <button onClick={onLogin} className="h-9 border border-slate-200 rounded-md text-sm font-semibold text-slate-600">Entrar</button>
              <button onClick={onLogin} className="h-9 bg-blue-600 text-white rounded-md text-sm font-semibold">Começar agora</button>
            </div>
          </motion.div>
        )}
      </header>

      {/* Hero Section */}
      <section id="início" className="pt-24 pb-14 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="space-y-4">
                <h1 className="text-3xl lg:text-4xl font-bold tracking-tight leading-[1.15]">
                  A plataforma que ajuda empresas a <span className="text-blue-600">organizar demandas</span>, acelerar respostas e conectar equipes.
                </h1>
                <p className="text-base text-slate-500 font-medium leading-relaxed max-w-xl">
                  Mantenha sua operação clara e rastreável com a Gestifique. Centralize atendimentos e comunicação em um único lugar.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button 
                  onClick={onLogin}
                  className="w-full sm:w-auto h-9 px-6 bg-blue-600 text-white text-sm font-semibold rounded-md hover:bg-blue-700 transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  Começar agora <ArrowRight size={16} />
                </button>
                <button 
                   onClick={() => document.getElementById('recursos')?.scrollIntoView({ behavior: 'smooth' })}
                   className="w-full sm:w-auto h-9 px-6 border border-slate-200 text-slate-600 text-sm font-semibold rounded-md hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                >
                  Ver recursos
                </button>
              </div>

              <div className="flex items-center gap-8 pt-6 border-t border-slate-100">
                <div className="space-y-1">
                  <div className="text-lg font-bold tracking-tight text-slate-800">96%</div>
                  <div className="text-[10px] font-medium text-slate-500 uppercase">SLA Cumprido</div>
                </div>
                <div className="space-y-1">
                  <div className="text-lg font-bold tracking-tight text-slate-800">4min</div>
                  <div className="text-[10px] font-medium text-slate-500 uppercase">Tempo Médio</div>
                </div>
                <div className="space-y-1">
                  <div className="text-lg font-bold tracking-tight text-slate-800">24/7</div>
                  <div className="text-[10px] font-medium text-slate-500 uppercase">Operação Ativa</div>
                </div>
              </div>
            </div>

            {/* Mockup Dashboard */}
            <div className="relative">
              <div className="absolute -inset-10 bg-blue-50/50 blur-3xl rounded-full -z-10"></div>
              
              <div className="bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-200 px-4 h-10 flex items-center justify-between">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div>
                  </div>
                  <div className="text-[10px] font-medium text-slate-400 uppercase">Gestifique Dashboard</div>
                  <div className="w-4 h-4 rounded-full bg-slate-300"></div>
                </div>
                
                <div className="h-[400px] flex overflow-hidden">
                  {/* Mockup Sidebar */}
                  <div className="w-12 bg-white border-r border-slate-100 flex flex-col items-center py-4 gap-3">
                    {[LayoutDashboard, Ticket, Users, MessagesSquare, History].map((Icon, i) => (
                      <div key={i} className={`w-8 h-8 rounded-lg flex items-center justify-center ${i === 1 ? 'bg-blue-50 text-blue-600' : 'text-slate-300'}`}>
                        <Icon size={16} />
                      </div>
                    ))}
                  </div>

                  {/* Mockup Content */}
                  <div className="flex-1 p-4 space-y-4 bg-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-slate-100 rounded-lg"></div>
                        <div className="h-3 bg-slate-100 rounded-full w-24"></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-6 bg-blue-50 border border-blue-100 rounded text-[9px] flex items-center justify-center font-medium text-blue-600">Novo</div>
                        <div className="w-16 h-6 bg-slate-50 border border-slate-100 rounded text-[9px] flex items-center justify-center font-medium text-slate-600">Filtros</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'Tickets Abertos', val: '12', color: 'text-blue-600' },
                        { label: 'Em andamento', val: '8', color: 'text-amber-600' },
                        { label: 'Resolvidos', val: '142', color: 'text-emerald-600' }
                      ].map((card, i) => (
                        <div key={i} className="bg-slate-50/50 rounded-lg border border-slate-100 p-2.5 space-y-1">
                          <div className="text-[9px] font-medium text-slate-500">{card.label}</div>
                          <div className={`text-sm font-semibold ${card.color}`}>{card.val}</div>
                        </div>
                      ))}
                    </div>

                    <div className="border border-slate-100 rounded-lg overflow-hidden">
                      <table className="w-full text-[10px]">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="px-3 py-1.5 text-left font-medium text-slate-500">Ticket</th>
                            <th className="px-3 py-1.5 text-left font-medium text-slate-500">Status</th>
                            <th className="px-3 py-1.5 text-left font-medium text-slate-500">Responsável</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {[
                            { title: 'Falha no acesso ao portal', status: 'Em andamento', owner: 'Carlos M.' },
                            { title: 'Solicitação de suporte', status: 'Aguardando', owner: 'Ana P.' },
                            { title: 'Dúvida sobre permissões', status: 'Resolvido', owner: 'Roberto S.' },
                            { title: 'Erro de integração', status: 'Em análise', owner: 'Juliana F.' }
                          ].map((row, i) => (
                            <tr key={i}>
                              <td className="px-3 py-2 font-medium text-slate-700 truncate max-w-[100px]">{row.title}</td>
                              <td className="px-3 py-2">
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${
                                  row.status === 'Resolvido' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
                                  row.status === 'Em andamento' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 
                                  'bg-slate-100 text-slate-600 border border-slate-200'
                                }`}>{row.status}</span>
                              </td>
                              <td className="px-3 py-2 text-slate-500">{row.owner}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="grid grid-cols-5 gap-2 h-16 items-end">
                       {[60, 85, 40, 100, 70].map((h, i) => (
                         <div key={i} className="bg-blue-500/10 border-t-2 border-blue-500/20 rounded-t-sm w-full" style={{ height: `${h}%` }}></div>
                       ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-10 border-y border-slate-100 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-wrap items-center justify-center gap-10 opacity-40 grayscale">
            {['NovaCorp', 'Atlas TI', 'BlueDesk', 'Corefy', 'Metabit'].map(logo => (
              <span key={logo} className="text-lg font-bold text-slate-800 tracking-tight">{logo}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="recursos" className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
            <h2 className="text-2xl lg:text-3xl font-bold tracking-tight">Recursos simples para operações complexas.</h2>
            <p className="text-slate-500 text-sm">Focamos no essencial para que sua equipe não perca tempo com o que não importa.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Ticket, title: 'Gestão de Tickets', desc: 'Centralize chamados com priorização clara e fluxos organizados.' },
              { icon: MessagesSquare, title: 'Comunicação Interna', desc: 'Notas e discussões internas para manter o contexto da equipe.' },
              { icon: Users, title: 'Atendimento ao Cliente', desc: 'Ofereça transparência com acompanhamento real de solicitações.' },
              { icon: LayoutDashboard, title: 'Dashboard de Controle', desc: 'Monitore métricas vitais como tempo de resposta e volume.' },
              { icon: Building2, title: 'Gestão Multi-empresa', desc: 'Gerencie diferentes unidades de negócio ou clientes corporativos.' },
              { icon: History, title: 'Rastreabilidade Total', desc: 'Histórico completo de cada interação para auditoria e controle.' }
            ].map((feature, i) => (
              <div 
                key={i}
                className="p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-300 transition-colors group shadow-sm"
              >
                <div className="w-8 h-8 bg-slate-50 text-slate-500 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                  <feature.icon size={18} />
                </div>
                <h3 className="text-base font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="como-funciona" className="py-16 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
            <h2 className="text-2xl lg:text-3xl font-bold tracking-tight">Como funciona</h2>
            <p className="text-slate-500 text-sm">Uma estrutura lógica que traz ordem ao atendimento da sua empresa.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 relative">
            <div className="hidden lg:block absolute top-1/2 left-1/4 right-1/4 h-px bg-slate-200 -translate-y-1/2 z-0"></div>
            {[
              { num: '1', title: 'Receba chamados', desc: 'Solicitações chegam de forma organizada, com todas as informações necessárias.' },
              { num: '2', title: 'Organize prioridades', desc: 'Sua equipe tria as demandas e define o que deve ser resolvido primeiro.' },
              { num: '3', title: 'Resolva com histórico', desc: 'A resolução é registrada com contexto total, facilitando consultas futuras.' }
            ].map((step, i) => (
              <div key={i} className="p-5 bg-white rounded-xl border border-slate-200 space-y-4 relative z-10 shadow-sm text-center md:text-left">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 font-bold flex items-center justify-center mx-auto md:mx-0">{step.num}</div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-semibold">{step.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefícios" className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="space-y-3">
                <h2 className="text-2xl lg:text-3xl font-bold tracking-tight">O impacto de uma operação organizada</h2>
                <p className="text-base text-slate-500">Não é apenas responder chamados, é ter o controle total da sua central de suporte.</p>
              </div>

              <div className="space-y-3 pt-2">
                {[
                  'Redução drástica de chamados perdidos ou esquecidos.',
                  'Aumento na velocidade de resposta por categorização clara.',
                  'Histórico centralizado para consultas e treinamentos.',
                  'Equipes mais produtivas com fluxos de trabalho definidos.',
                  'Atendimento transparente e profissional para seus clientes.'
                ].map((benefit, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 p-1">
                      <CheckCircle2 size={14} />
                    </div>
                    <span className="text-sm text-slate-700">{benefit}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <button 
                  onClick={onLogin}
                  className="h-9 px-5 bg-slate-900 text-white font-medium rounded-md hover:bg-slate-800 transition-colors flex items-center gap-2 text-sm"
                >
                  Acessar plataforma <ArrowRight size={16} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between h-40">
                  <Activity className="text-blue-500" size={24} />
                  <div>
                    <div className="text-2xl font-bold mb-1">96%</div>
                    <div className="text-[10px] font-medium text-slate-500 uppercase">SLA Cumprido</div>
                  </div>
               </div>
               <div className="bg-blue-600 rounded-xl p-5 text-white flex flex-col justify-between h-40 shadow-md shadow-blue-100">
                  <Clock size={24} />
                  <div>
                    <div className="text-2xl font-bold mb-1">4m</div>
                    <div className="text-[10px] font-medium text-blue-100 uppercase">Tempo Resposta</div>
                  </div>
               </div>
               <div className="col-span-2 bg-slate-50 border border-slate-200 rounded-xl p-5 grid grid-cols-[1fr_auto] items-center gap-4 shadow-sm">
                  <div className="space-y-1">
                    <div className="text-lg font-bold text-slate-900">Operação Controlada</div>
                    <div className="text-xs text-slate-500">Visibilidade total para lideranças e gerentes</div>
                  </div>
                  <div className="w-10 h-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center">
                    <ShieldCheck className="text-blue-600" size={20} />
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-blue-600 rounded-xl p-8 lg:p-10 text-center space-y-4 shadow-md text-white">
            <h2 className="text-xl lg:text-2xl font-bold tracking-tight">Menos caos no atendimento. Mais controle para a operação.</h2>
            <p className="text-sm text-blue-100 max-w-xl mx-auto">Centralize chamados, documentações e indicadores em uma plataforma simples e moderna.</p>

            <div className="pt-4">
              <button 
                onClick={onLogin}
                className="w-full sm:w-auto h-9 px-8 bg-white text-blue-600 font-semibold text-sm rounded-md hover:bg-slate-50 transition-colors"
              >
                Acessar plataforma
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8 text-sm">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <AppLogo size={20} />
              <span className="font-semibold text-slate-900">Gestifique</span>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed max-w-xs">
              Gestão de atendimento corporativo e comunicação integrada em uma única plataforma.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-slate-900">Navegação</h4>
            <div className="flex flex-col gap-2 text-slate-500 text-sm">
              <a href="#recursos" className="hover:text-blue-600 transition-colors">Recursos</a>
              <a href="#como-funciona" className="hover:text-blue-600 transition-colors">Como funciona</a>
              <a href="#benefícios" className="hover:text-blue-600 transition-colors">Benefícios</a>
              <button onClick={onLogin} className="text-left hover:text-blue-600 transition-colors">Entrar</button>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-slate-900">Empresa</h4>
            <div className="flex flex-col gap-2 text-slate-500 text-sm">
              <a href="#" className="hover:text-blue-600 transition-colors">Sobre</a>
              <a href="#" className="hover:text-blue-600 transition-colors">Contato</a>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-slate-900">Legal</h4>
            <div className="flex flex-col gap-2 text-slate-500 text-sm">
              <a href="#" className="hover:text-blue-600 transition-colors">Privacidade</a>
              <a href="#" className="hover:text-blue-600 transition-colors">Termos de Uso</a>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto mt-10 pt-6 border-t border-slate-200 text-center md:text-left text-xs text-slate-500 font-medium">
          <p>© 2026 Gestifique. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};
