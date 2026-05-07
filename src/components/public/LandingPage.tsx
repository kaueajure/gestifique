import React from 'react';
import { motion } from 'motion/react';
import { 
  ArrowRight, 
  Ticket, 
  CheckCircle2, 
  Zap, 
  Users, 
  MessagesSquare, 
  LayoutDashboard, 
  History, 
  ShieldCheck,
  Building2,
  Clock,
  ArrowUpRight,
  Menu,
  X
} from 'lucide-react';

interface LandingPageProps {
  onLogin: () => void;
}

export const LandingPage = ({ onLogin }: LandingPageProps) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
              <Ticket className="text-white" size={24} />
            </div>
            <span className="text-xl font-black text-slate-900 tracking-tighter">Gestifique</span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {['Início', 'Recursos', 'Como funciona', 'Benefícios'].map((item) => (
              <a 
                key={item} 
                href={`#${item.toLowerCase().replace(' ', '-')}`} 
                className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors"
              >
                {item}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <button 
              onClick={onLogin}
              className="px-6 h-11 text-sm font-black text-slate-600 hover:text-blue-600 transition-colors"
            >
              Entrar
            </button>
            <button 
              onClick={onLogin}
              className="px-6 h-11 bg-slate-900 text-white text-sm font-black rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 active:scale-95"
            >
              Começar agora
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden text-slate-900 p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Nav */}
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden bg-white border-b border-slate-100 p-6 space-y-4"
          >
            {['Início', 'Recursos', 'Como funciona', 'Benefícios'].map((item) => (
              <a 
                key={item} 
                href={`#${item.toLowerCase().replace(' ', '-')}`} 
                className="block text-sm font-bold text-slate-600"
                onClick={() => setIsMenuOpen(false)}
              >
                {item}
              </a>
            ))}
            <div className="pt-4 flex flex-col gap-3">
              <button onClick={onLogin} className="h-12 border border-slate-200 rounded-xl font-black text-slate-600">Entrar</button>
              <button onClick={onLogin} className="h-12 bg-blue-600 text-white rounded-xl font-black">Começar agora</button>
            </div>
          </motion.div>
        )}
      </header>

      {/* Hero Section */}
      <section id="início" className="pt-40 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-blue-100">
                <Zap size={14} className="fill-blue-600" /> Solução Corporativa Premium
              </div>
              
              <div className="space-y-6">
                <h1 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tight leading-[0.95]">
                  Centralize tickets, atendimentos e <span className="text-blue-600">comunicação.</span>
                </h1>
                <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-xl">
                  A Gestifique ajuda empresas a organizar demandas, acelerar respostas e manter equipes e clientes conectados em uma operação clara e rastreável.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <button 
                  onClick={onLogin}
                  className="w-full sm:w-auto h-16 px-10 bg-blue-600 text-white text-lg font-black rounded-2xl hover:bg-blue-700 transition-all shadow-2xl shadow-blue-200 flex items-center justify-center gap-3 group"
                >
                  Começar agora <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="w-full sm:w-auto h-16 px-8 border-2 border-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                  Ver demonstração <ArrowUpRight size={20} className="text-slate-300" />
                </button>
              </div>

              <div className="flex items-center gap-12 pt-4 border-t border-slate-100">
                <div className="space-y-1">
                  <div className="text-2xl font-black text-slate-900Tracking-tight">96%</div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SLA Cumprido</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-black text-slate-900 tracking-tight">4min</div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tempo Médio</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-black text-slate-900 tracking-tight">24/7</div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Operação Ativa</div>
                </div>
              </div>
            </div>

            {/* Mockup Dashboard */}
            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-tr from-blue-600 to-indigo-600 opacity-20 blur-3xl rounded-full scale-110 -z-10 group-hover:scale-125 transition-transform duration-1000"></div>
              
              <div className="bg-slate-900 p-2 rounded-[32px] border border-slate-800 shadow-2xl overflow-hidden transform rotate-2 group-hover:rotate-0 transition-transform duration-700">
                <div className="bg-white rounded-[26px] h-[540px] flex overflow-hidden border border-slate-100/50">
                  {/* Mockup Sidebar */}
                  <div className="w-16 bg-slate-50 border-r border-slate-100 flex flex-col items-center py-6 gap-6">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg"></div>
                    <div className="flex flex-col gap-4">
                      {[LayoutDashboard, Ticket, Users, MessagesSquare, History].map((Icon, i) => (
                        <div key={i} className={`w-8 h-8 rounded-lg flex items-center justify-center ${i === 1 ? 'bg-blue-100 text-blue-600' : 'text-slate-300'}`}>
                          <Icon size={18} />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Mockup Content */}
                  <div className="flex-1 p-6 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="h-4 bg-slate-100 rounded-full w-32"></div>
                      <div className="w-8 h-8 bg-slate-100 rounded-full"></div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-24 bg-slate-50 rounded-2xl border border-slate-100 p-4 space-y-3">
                          <div className="w-8 h-2 bg-slate-200 rounded-full"></div>
                          <div className="w-16 h-4 bg-slate-300 rounded-full"></div>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-3 gap-6">
                      <div className="col-span-2 space-y-4">
                        <div className="bg-slate-50 rounded-2xl border border-slate-100 p-6 space-y-4">
                          <div className="flex items-center justify-between pb-2 border-b border-slate-200/50">
                            <div className="w-40 h-3 bg-slate-200 rounded-full"></div>
                            <div className="w-20 h-2 bg-slate-100 rounded-full"></div>
                          </div>
                          {[1, 2, 3, 4].map(i => (
                            <div key={i} className="flex items-center gap-4">
                              <div className="w-8 h-8 bg-white border border-slate-100 rounded-lg"></div>
                              <div className="flex-1 space-y-2">
                                <div className="w-full h-2.5 bg-slate-100 rounded-full"></div>
                                <div className="w-2/3 h-2 bg-slate-50 rounded-full"></div>
                              </div>
                              <div className={`w-12 h-5 rounded-full ${i === 1 ? 'bg-amber-100' : 'bg-emerald-100'}`}></div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-6">
                        {/* Simple Chart Mockup */}
                        <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 h-40 flex items-end gap-2">
                          {[40, 70, 45, 90, 65, 80].map((h, i) => (
                            <div 
                              key={i} 
                              className="flex-1 bg-blue-600 rounded-t-lg transition-all duration-1000 delay-500" 
                              style={{ height: `${h}%`, opacity: 0.2 + (i * 0.15) }}
                            ></div>
                          ))}
                        </div>

                        {/* Chat Mockup */}
                        <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 space-y-3">
                          <div className="flex gap-2">
                            <div className="w-6 h-6 bg-blue-100 rounded-full"></div>
                            <div className="flex-1 bg-white p-2 rounded-lg rounded-tl-none border border-slate-100">
                              <div className="w-full h-1.5 bg-slate-100 rounded-full"></div>
                            </div>
                          </div>
                          <div className="flex gap-2 flex-row-reverse">
                            <div className="w-6 h-6 bg-slate-200 rounded-full"></div>
                            <div className="flex-1 bg-blue-600 p-2 rounded-lg rounded-tr-none">
                              <div className="w-3/4 h-1.5 bg-blue-400 rounded-full"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 border-y border-slate-50 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-10">Empresas que organizam seu atendimento com a Gestifique</p>
          <div className="flex flex-wrap items-center justify-center gap-12 lg:gap-24 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-700">
            {['NovaCorp', 'Atlas TI', 'BlueDesk', 'Corefy', 'Metabit'].map(logo => (
              <span key={logo} className="text-2xl font-black text-slate-900 tracking-tight">{logo}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="recursos" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
            <h2 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">Tudo o que sua equipe precisa para performar melhor.</h2>
            <p className="text-lg text-slate-500 font-medium leading-relaxed">Ferramentas pensadas para eliminar o caos e trazer clareza operacional.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Ticket, title: 'Gestão de Tickets', desc: 'Centralize chamados internos e externos com priorização inteligente e fluxos personalizados.' },
              { icon: MessagesSquare, title: 'Comunicação Interna', desc: 'Chat e notas ocultas para que sua equipe discuta soluções sem que o cliente veja.' },
              { icon: Users, title: 'Atendimento ao Cliente', desc: 'Mantenha seus clientes informados com automações de status e portal de acompanhamento.' },
              { icon: LayoutDashboard, title: 'Dashboard Inteligente', desc: 'Visualize métricas de tempo de resposta, volume de chamados e produtividade em tempo real.' },
              { icon: Building2, title: 'Organização de Equipes', desc: 'Atribua responsabilidades, divida por departamentos e gerencie níveis de acesso.' },
              { icon: History, title: 'Histórico Completo', desc: 'Nunca perca uma vírgula. Todo o log de ações e mensagens fica gravado para sempre.' }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -5 }}
                className="p-10 bg-white border border-slate-100 rounded-[32px] shadow-sm hover:shadow-xl hover:shadow-slate-100 hover:border-blue-100 transition-all group"
              >
                <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <feature.icon size={28} />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-4">{feature.title}</h3>
                <p className="text-slate-500 font-medium leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="como-funciona" className="py-32 px-6 bg-slate-900 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full -ml-48 -mb-48"></div>
        
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
            <h2 className="text-4xl lg:text-5xl font-black text-white tracking-tight">Implementação rápida, resultados imediatos.</h2>
            <p className="text-lg text-slate-400 font-medium leading-relaxed">Em poucos passos sua operação ganha um novo padrão de qualidade.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 relative">
            {/* Connection Line */}
            <div className="hidden lg:block absolute top-1/2 left-0 w-full h-px bg-white/10 -translate-y-1/2"></div>
            
            {[
              { num: '01', title: 'Receba chamados', desc: 'Seus clientes ou funcionários abrem chamados de forma simples via portal ou e-mail.' },
              { num: '02', title: 'Organize prioridades', desc: 'Seu time tria e define o que é urgente, garantindo que nada fique parado na fila.' },
              { num: '03', title: 'Resolva com histórico', desc: 'Acompanhe a conversa, anexe arquivos e feche o ticket com o feedback do solicitante.' }
            ].map((step, i) => (
              <div key={i} className="relative z-10 space-y-8 bg-slate-800/50 backdrop-blur-sm p-10 rounded-[32px] border border-white/5">
                <div className="text-4xl font-black text-blue-500">{step.num}</div>
                <div className="space-y-4">
                  <h3 className="text-2xl font-black text-white leading-tight">{step.title}</h3>
                  <p className="text-slate-400 font-medium leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefícios" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                <img 
                  src="https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&q=80&w=800" 
                  alt="Trabalho em equipe" 
                  className="rounded-[32px] w-full h-[400px] object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="space-y-4 pt-12">
                   <img 
                    src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800" 
                    alt="Escritório moderno" 
                    className="rounded-[32px] w-full h-[240px] object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="bg-blue-600 rounded-[32px] p-8 aspect-video flex flex-col justify-end text-white">
                    <div className="text-3xl font-black mb-2">+250%</div>
                    <div className="text-xs font-black uppercase tracking-widest opacity-80">Ganhos em Agilidade</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-12">
              <div className="space-y-6">
                <h2 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-[1.1]">Por que empresas escolhem a Gestifique?</h2>
                <p className="text-lg text-slate-500 font-medium leading-relaxed">Não é apenas um sistema de chamados. É o motor de eficiência da sua central de atendimento e comunicação.</p>
              </div>

              <div className="space-y-6">
                {[
                  'Menos tickets perdidos em e-mails e planilhas.',
                  'Mais velocidade nas respostas com triagem rápida.',
                  'Histórico sempre rastreável para auditoria e controle.',
                  'Equipes mais alinhadas com comunicação interna.',
                  'Atendimento mais profissional e transparente.'
                ].map((benefit, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-6 h-6 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <CheckCircle2 size={16} />
                    </div>
                    <span className="text-lg font-bold text-slate-700">{benefit}</span>
                  </div>
                ))}
              </div>

              <button 
                onClick={onLogin}
                className="h-16 px-10 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all flex items-center gap-3"
              >
                Começar agora <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-blue-600 rounded-[48px] p-12 lg:p-24 text-center space-y-10 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-700 -z-10"></div>
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay"></div>
            
            <div className="max-w-3xl mx-auto space-y-6">
              <h2 className="text-4xl lg:text-6xl font-black text-white tracking-tight leading-tight">Menos caos no atendimento. Mais controle para sua operação.</h2>
              <p className="text-xl text-blue-100 font-medium leading-relaxed">Centralize tickets, mensagens e indicadores em uma plataforma simples, moderna e preparada para crescer com sua empresa.</p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={onLogin}
                className="w-full sm:w-auto h-16 px-12 bg-white text-blue-600 text-lg font-black rounded-2xl hover:bg-slate-50 transition-all shadow-2xl shadow-blue-900/20 active:scale-95"
              >
                Acessar plataforma
              </button>
              <button 
                onClick={onLogin}
                className="w-full sm:w-auto h-16 px-12 bg-blue-700/30 backdrop-blur-md text-white text-lg font-black rounded-2xl hover:bg-blue-700/50 transition-all border border-blue-400/20"
              >
                Falar com consultor
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
                <Ticket className="text-white" size={18} />
              </div>
              <span className="text-lg font-black text-slate-900 tracking-tighter">Gestifique</span>
            </div>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              Solução definitiva para gestão de atendimento corporativo e comunicação integrada.
            </p>
          </div>

          <div className="space-y-6">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Plataforma</h4>
            <div className="flex flex-col gap-4 text-sm font-bold text-slate-500">
              <a href="#" className="hover:text-blue-600">Recursos</a>
              <a href="#" className="hover:text-blue-600">Planos</a>
              <a href="#" className="hover:text-blue-600">Segurança</a>
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Suporte</h4>
            <div className="flex flex-col gap-4 text-sm font-bold text-slate-500">
              <a href="#" className="hover:text-blue-600">Centro de Ajuda</a>
              <a href="#" className="hover:text-blue-600">API</a>
              <a href="#" className="hover:text-blue-600">Status</a>
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Legal</h4>
            <div className="flex flex-col gap-4 text-sm font-bold text-slate-500">
              <a href="#" className="hover:text-blue-600">Privacidade</a>
              <a href="#" className="hover:text-blue-600">Termos de Uso</a>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-slate-50 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs font-medium text-slate-400">© 2026 Gestifique. Direitos reservados.</p>
          <p className="text-xs font-black text-slate-900 tracking-widest uppercase">Tecnologia para atender melhor.</p>
        </div>
      </footer>
    </div>
  );
};
