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
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AppLogo size={20} />
            <span className="text-lg font-bold tracking-tight">Gestifique</span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
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
              className="h-9 px-4 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-all active:scale-95"
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
              <button onClick={onLogin} className="h-10 border border-slate-200 rounded-lg font-semibold text-slate-600">Entrar</button>
              <button onClick={onLogin} className="h-10 bg-blue-600 text-white rounded-lg font-semibold">Começar agora</button>
            </div>
          </motion.div>
        )}
      </header>

      {/* Hero Section */}
      <section id="início" className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-6">
                <h1 className="text-4xl lg:text-6xl font-bold tracking-tight leading-[1.15]">
                  A plataforma que ajuda empresas a <span className="text-blue-600">organizar demandas</span>, acelerar respostas e conectar equipes.
                </h1>
                <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-xl">
                  Mantenha sua operação clara e rastreável com a Gestifique. Centralize atendimentos e comunicação em um único lugar.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <button 
                  onClick={onLogin}
                  className="w-full sm:w-auto h-12 px-8 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
                >
                  Começar agora <ArrowRight size={18} />
                </button>
                <button 
                   onClick={() => document.getElementById('recursos')?.scrollIntoView({ behavior: 'smooth' })}
                   className="w-full sm:w-auto h-12 px-8 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                >
                  Ver recursos
                </button>
              </div>

              <div className="flex items-center gap-10 pt-6 border-t border-slate-100">
                <div className="space-y-0.5">
                  <div className="text-lg font-bold tracking-tight text-slate-700">96%</div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">SLA Cumprido</div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-lg font-bold tracking-tight text-slate-700">4min</div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Tempo Médio</div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-lg font-bold tracking-tight text-slate-700">24/7</div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Operação Ativa</div>
                </div>
              </div>
            </div>

            {/* Mockup Dashboard */}
            <div className="relative">
              <div className="absolute -inset-10 bg-blue-50/50 blur-3xl rounded-full -z-10"></div>
              
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden shadow-slate-200/50">
                <div className="bg-slate-50 border-b border-slate-200 px-4 h-11 flex items-center justify-between">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div>
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gestifique Dashboard</div>
                  <div className="w-4 h-4 rounded-full bg-slate-300"></div>
                </div>
                
                <div className="h-[480px] flex overflow-hidden">
                  {/* Mockup Sidebar */}
                  <div className="w-14 bg-white border-r border-slate-100 flex flex-col items-center py-4 gap-4">
                    {[LayoutDashboard, Ticket, Users, MessagesSquare, History].map((Icon, i) => (
                      <div key={i} className={`w-8 h-8 rounded-lg flex items-center justify-center ${i === 1 ? 'bg-blue-50 text-blue-600' : 'text-slate-300'}`}>
                        <Icon size={16} />
                      </div>
                    ))}
                  </div>

                  {/* Mockup Content */}
                  <div className="flex-1 p-5 space-y-5 bg-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-slate-100 rounded-lg"></div>
                        <div className="h-3 bg-slate-100 rounded-full w-24"></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-7 bg-blue-50 border border-blue-100 rounded-md"></div>
                        <div className="w-20 h-7 bg-slate-50 border border-slate-100 rounded-md"></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'Tickets Abertos', val: '12', color: 'text-blue-600' },
                        { label: 'Em andamento', val: '8', color: 'text-amber-600' },
                        { label: 'Resolvidos', val: '142', color: 'text-emerald-600' }
                      ].map((card, i) => (
                        <div key={i} className="bg-slate-50/50 rounded-xl border border-slate-100 p-3 space-y-0.5">
                          <div className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">{card.label}</div>
                          <div className={`text-base font-bold ${card.color}`}>{card.val}</div>
                        </div>
                      ))}
                    </div>

                    <div className="border border-slate-100 rounded-xl overflow-hidden">
                      <table className="w-full text-[9px]">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="px-3 py-1.5 text-left font-bold text-slate-400 uppercase">Ticket</th>
                            <th className="px-3 py-1.5 text-left font-bold text-slate-400 uppercase">Status</th>
                            <th className="px-3 py-1.5 text-left font-bold text-slate-400 uppercase">Responsável</th>
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
                              <td className="px-3 py-2 font-semibold text-slate-700 truncate max-w-[100px]">{row.title}</td>
                              <td className="px-3 py-2">
                                <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-bold ${
                                  row.status === 'Resolvido' ? 'bg-emerald-50 text-emerald-600' : 
                                  row.status === 'Em andamento' ? 'bg-blue-50 text-blue-600' : 
                                  'bg-slate-100 text-slate-500'
                                }`}>{row.status}</span>
                              </td>
                              <td className="px-3 py-2 text-slate-500">{row.owner}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="grid grid-cols-5 gap-3 h-20 items-end px-2">
                       {[60, 85, 40, 100, 70].map((h, i) => (
                         <div key={i} className="bg-blue-600/10 border-t-2 border-blue-600/20 rounded-t-sm w-full" style={{ height: `${h}%` }}></div>
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
      <section className="py-12 border-y border-slate-50 bg-slate-50/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-wrap items-center justify-center gap-12 lg:gap-20 opacity-30 grayscale saturate-0">
            {['NovaCorp', 'Atlas TI', 'BlueDesk', 'Corefy', 'Metabit'].map(logo => (
              <span key={logo} className="text-xl font-bold text-slate-900 tracking-tight">{logo}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="recursos" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight">Recursos simples para operações complexas.</h2>
            <p className="text-slate-500 font-medium">Focamos no essencial para que sua equipe não perca tempo com o que não importa.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                className="p-8 bg-white border border-slate-100 rounded-2xl hover:border-blue-200 transition-all group"
              >
                <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-lg flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <feature.icon size={20} />
                </div>
                <h3 className="text-lg font-bold mb-3">{feature.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="como-funciona" className="py-24 px-6 bg-slate-50/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight">Como funciona</h2>
            <p className="text-slate-500 font-medium">Uma estrutura lógica que traz ordem ao atendimento da sua empresa.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden lg:block absolute top-1/2 left-1/4 right-1/4 h-px bg-slate-200 -translate-y-1/2 z-0"></div>
            {[
              { num: '01', title: 'Receba chamados', desc: 'Solicitações chegam de forma organizada, com todas as informações necessárias.' },
              { num: '02', title: 'Organize prioridades', desc: 'Sua equipe tria as demandas e define o que deve ser resolvido primeiro.' },
              { num: '03', title: 'Resolva com histórico', desc: 'A resolução é registrada com contexto total, facilitando consultas futuras.' }
            ].map((step, i) => (
              <div key={i} className="p-8 bg-white rounded-2xl border border-slate-100 space-y-6 relative z-10">
                <div className="text-2xl font-bold text-blue-600">{step.num}</div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold">{step.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefícios" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-3xl lg:text-4xl font-bold tracking-tight">O impacto de uma operação organizada</h2>
                <p className="text-lg text-slate-500 font-medium leading-relaxed">Não é apenas responder chamados, é ter o controle total da sua central de suporte.</p>
              </div>

              <div className="space-y-5">
                {[
                  'Redução drástica de chamados perdidos ou esquecidos.',
                  'Aumento na velocidade de resposta por categorização clara.',
                  'Histórico centralizado para consultas e treinamentos.',
                  'Equipes mais produtivas com fluxos de trabalho definidos.',
                  'Atendimento transparente e profissional para seus clientes.'
                ].map((benefit, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 size={12} />
                    </div>
                    <span className="text-sm font-semibold text-slate-700">{benefit}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4">
                <button 
                  onClick={onLogin}
                  className="h-11 px-6 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition-all flex items-center gap-2 text-sm"
                >
                  Acessar plataforma <ArrowRight size={16} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 flex flex-col justify-between h-64">
                  <Activity className="text-blue-600" size={32} />
                  <div>
                    <div className="text-3xl font-bold mb-1">96%</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SLA Cumprido</div>
                  </div>
               </div>
               <div className="bg-blue-600 rounded-2xl p-8 text-white flex flex-col justify-between h-64 shadow-xl shadow-blue-50">
                  <Clock size={32} />
                  <div>
                    <div className="text-3xl font-bold mb-1">4m</div>
                    <div className="text-[10px] font-bold text-blue-100 uppercase tracking-widest">Tempo Resposta</div>
                  </div>
               </div>
               <div className="col-span-2 bg-slate-900 rounded-2xl p-8 text-white flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="text-2xl font-bold">Operação Controlada</div>
                    <div className="text-xs text-slate-400">Visibilidade total para lideranças</div>
                  </div>
                  <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
                    <ShieldCheck className="text-blue-400" size={24} />
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-blue-600 rounded-2xl p-12 lg:p-16 text-center space-y-8 relative overflow-hidden shadow-2xl shadow-blue-50 text-white">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-700 -z-10"></div>
            
            <div className="space-y-4">
              <h2 className="text-3xl lg:text-4xl font-bold tracking-tight leading-tight">Menos caos no atendimento. Mais controle para sua operação.</h2>
              <p className="text-lg text-blue-100 font-medium max-w-2xl mx-auto">Centralize tickets, mensagens e indicadores em uma plataforma simples e moderna.</p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={onLogin}
                className="w-full sm:w-auto h-12 px-10 bg-white text-blue-600 font-bold rounded-xl hover:bg-slate-50 transition-all active:scale-95"
              >
                Acessar plataforma
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12 text-sm">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <AppLogo size={30} />
              <span className="font-bold text-slate-900 tracking-tight">Gestifique</span>
            </div>
            <p className="text-slate-500 font-medium leading-relaxed">
              Gestão de atendimento corporativo e comunicação integrada em uma única plataforma.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-slate-900">Navegação</h4>
            <div className="flex flex-col gap-3 text-slate-500">
              <a href="#recursos" className="hover:text-blue-600">Recursos</a>
              <a href="#como-funciona" className="hover:text-blue-600">Como funciona</a>
              <a href="#benefícios" className="hover:text-blue-600">Benefícios</a>
              <button onClick={onLogin} className="text-left hover:text-blue-600">Entrar</button>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-slate-900">Empresa</h4>
            <div className="flex flex-col gap-3 text-slate-500">
              <a href="#" className="hover:text-blue-600">Sobre</a>
              <a href="#" className="hover:text-blue-600">Contato</a>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-slate-900">Legal</h4>
            <div className="flex flex-col gap-3 text-slate-500">
              <a href="#" className="hover:text-blue-600">Privacidade</a>
              <a href="#" className="hover:text-blue-600">Termos de Uso</a>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-slate-50 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs font-medium text-slate-400">© 2026 Gestifique. Direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};
