import React from 'react';
import { ArrowRight, Ticket, Clock, CheckCircle2, AlertCircle, LayoutDashboard, Database, Settings, ShieldCheck, ChevronRight, MessageSquare, Menu, Check, X } from 'lucide-react';
import { AppLogo } from '../ui/Logo';

interface PublicPreviewPageProps {
  onNavigate: (path: string) => void;
}

export const PublicPreviewPage = ({ onNavigate }: PublicPreviewPageProps) => {
  return (
    <div className="flex flex-col bg-white">
      {/* Hero Section */}
      <section className="pt-20 pb-16 px-6 bg-gradient-to-b from-slate-50 to-white border-b border-slate-100 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold mb-4">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            Prévia Visual
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-slate-900">
            Veja uma prévia do Gestifique em operação.
          </h1>
          <p className="text-base lg:text-lg font-medium text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Explore visualmente como sua equipe pode acompanhar tickets, SLAs, clientes, responsáveis e indicadores em uma interface organizada e B2B.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => onNavigate('/contato')}
              className="h-11 px-6 w-full sm:w-auto bg-blue-600 text-white text-[14px] font-bold rounded-lg hover:bg-blue-700 transition-all shadow-sm flex items-center justify-center gap-2"
            >
              Solicitar demonstração <ArrowRight size={18} />
            </button>
            <button 
              onClick={() => onNavigate('/funcionalidades')}
              className="h-11 px-6 w-full sm:w-auto bg-white text-slate-700 border border-slate-200 text-[14px] font-bold rounded-lg hover:bg-slate-50 transition-all shadow-sm flex items-center justify-center gap-2"
            >
              Ver funcionalidades <CheckCircle2 size={18} className="text-slate-400" />
            </button>
          </div>
          <p className="text-[12px] text-slate-400 font-medium pt-2">
            * Prévia visual estática. Algumas informações são simuladas para fins demonstrativos.
          </p>
        </div>
      </section>

      {/* Main Mockup Section */}
      <section className="py-16 px-6 bg-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto">
          {/* Mockup Container */}
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden flex flex-col">
            
            {/* Fake Browser/App Bar */}
            <div className="h-10 bg-slate-800 flex items-center px-4 border-b border-slate-900 shrink-0">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
              </div>
              <div className="mx-auto bg-slate-700/50 hover:bg-slate-700 text-slate-300 text-xs font-mono py-1 px-3 rounded flex items-center gap-2 cursor-default transition-colors">
                <ShieldCheck size={14} className="text-emerald-400" />
                app.gestifique.com.br
              </div>
              <div className="text-[10px] uppercase font-bold text-slate-400 bg-slate-700/50 px-2 py-1 rounded">Ambiente de prévia</div>
            </div>

            {/* App Layout */}
            <div className="flex flex-1 min-h-[600px]">
              {/* Sidebar */}
              <div className="w-56 bg-slate-900 flex-col hidden md:flex border-r border-slate-800">
                <div className="p-4 flex items-center gap-2 border-b border-slate-800">
                  <AppLogo size={24} />
                  <span className="font-bold text-white tracking-tight">Gestifique</span>
                </div>
                
                <div className="flex-1 py-4 px-2 space-y-1">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 mb-2">Workspace</div>
                  <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                    <LayoutDashboard size={16} />
                    Dashboard
                  </button>
                  <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-bold text-blue-400 bg-blue-900/40 border border-blue-800/50 transition-colors">
                    <Ticket size={16} />
                    Tickets
                  </button>
                  <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                    <Database size={16} />
                    Clientes B2B
                  </button>
                  <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                    <CheckCircle2 size={16} />
                    Base de Conhecimento
                  </button>
                  
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 mb-2 mt-6">Gestão</div>
                  <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                    <Settings size={16} />
                    Configurações
                  </button>
                </div>
                
                <div className="p-4 border-t border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-700 text-white flex items-center justify-center font-bold text-xs">LD</div>
                    <div className="flex flex-col">
                      <span className="text-[13px] font-bold text-white">Lucas Diretor</span>
                      <span className="text-[11px] text-slate-400">Admin</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Area */}
              <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
                {/* Internal Header */}
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
                  <div className="flex items-center gap-4">
                     <button className="md:hidden text-slate-500"><Menu size={20} /></button>
                     <div>
                       <h2 className="text-lg font-bold text-slate-900">Central de Tickets</h2>
                       <p className="text-xs font-medium text-slate-500">Visão geral de demandas da operação</p>
                     </div>
                  </div>
                  <button className="h-9 px-4 bg-blue-600 text-white text-sm font-bold rounded-lg shadow-sm">
                    Novo Ticket
                  </button>
                </header>

                <div className="p-6 flex-1 overflow-auto">
                  
                  {/* KPI Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                      <div className="text-sm font-semibold text-slate-500 mb-1">Total Abertos</div>
                      <div className="text-2xl font-bold text-slate-900">24</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-12 h-12 bg-red-50 rounded-bl-full flex items-center justify-center pointer-events-none">
                         <AlertCircle size={16} className="text-red-500 relative top-1 right-1" />
                      </div>
                      <div className="text-sm font-semibold text-slate-500 mb-1">SLA Crítico</div>
                      <div className="text-2xl font-bold text-red-600">3</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                      <div className="text-sm font-semibold text-slate-500 mb-1">Em Atendimento</div>
                      <div className="text-2xl font-bold text-slate-900">12</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                      <div className="text-sm font-semibold text-slate-500 mb-1">Resolvidos Hoje</div>
                      <div className="text-2xl font-bold text-emerald-600 flex items-center gap-2">
                        9 <span className="text-xs font-medium text-emerald-600/70 bg-emerald-50 px-2 py-0.5 rounded">+2</span>
                      </div>
                    </div>
                  </div>

                  {/* Filters & Table */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
                    <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                         <div className="h-9 px-3 bg-slate-100 text-slate-600 font-medium text-sm rounded-lg flex items-center border border-slate-200">
                           Busca...
                         </div>
                         <button className="h-9 px-3 bg-white text-slate-600 font-medium text-sm border border-slate-200 hover:bg-slate-50 rounded-lg flex items-center gap-2">
                           Pendentes <ChevronRight size={14} className="text-slate-400 rotate-90" />
                         </button>
                      </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 font-semibold text-[13px] border-b border-slate-200">
                            <th className="px-5 py-3 rounded-tl-xl w-16">Ticket</th>
                            <th className="px-5 py-3">Assunto</th>
                            <th className="px-5 py-3">Cliente</th>
                            <th className="px-5 py-3 text-center">Prioridade</th>
                            <th className="px-5 py-3">Status</th>
                            <th className="px-5 py-3">Responsável</th>
                            <th className="px-5 py-3 rounded-tr-xl">SLA (Resolução)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          <tr className="hover:bg-slate-50 transition-colors">
                            <td className="px-5 py-4 font-mono font-medium text-slate-600">#4092</td>
                            <td className="px-5 py-4 font-medium text-slate-900 border-l-2 border-orange-400">Dúvida faturamento mensal</td>
                            <td className="px-5 py-4 text-slate-600">TechCorp S/A</td>
                            <td className="px-5 py-4 text-center">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-orange-100 text-orange-700">Alta</span>
                            </td>
                            <td className="px-5 py-4">
                              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-[12px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Novo
                              </span>
                            </td>
                            <td className="px-5 py-4 text-slate-600">Marina</td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                 <Clock size={14} className="text-slate-400" />
                                 <span className="font-mono text-[13px] text-slate-600">1h 20m</span>
                              </div>
                            </td>
                          </tr>
                          <tr className="hover:bg-slate-50 transition-colors bg-red-50/30">
                            <td className="px-5 py-4 font-mono font-medium text-slate-600">#4091</td>
                            <td className="px-5 py-4 font-medium text-slate-900 border-l-2 border-red-500">Erro de acesso ao portal</td>
                            <td className="px-5 py-4 text-slate-600">Logística Brasil</td>
                            <td className="px-5 py-4 text-center">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-700">Urgente</span>
                            </td>
                            <td className="px-5 py-4">
                              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-[12px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span> Em atendimento
                              </span>
                            </td>
                            <td className="px-5 py-4 text-slate-600">Lucas</td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2 text-red-600">
                                 <AlertCircle size={14} />
                                 <span className="font-mono text-[13px] font-bold">Atrasado (+35m)</span>
                              </div>
                            </td>
                          </tr>
                          <tr className="hover:bg-slate-50 transition-colors">
                            <td className="px-5 py-4 font-mono font-medium text-slate-600">#4090</td>
                            <td className="px-5 py-4 font-medium text-slate-900 border-l-2 border-blue-400">Atualização de plano</td>
                            <td className="px-5 py-4 text-slate-600">Agência XYZ</td>
                            <td className="px-5 py-4 text-center">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-700">Média</span>
                            </td>
                            <td className="px-5 py-4">
                              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-[12px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Aguardando cliente
                              </span>
                            </td>
                            <td className="px-5 py-4 text-slate-600">Ana</td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                 <Clock size={14} className="text-slate-400" />
                                 <span className="font-mono text-[13px] text-slate-500">Pausado (4h restantes)</span>
                              </div>
                            </td>
                          </tr>
                          <tr className="hover:bg-slate-50 transition-colors opacity-75">
                            <td className="px-5 py-4 font-mono font-medium text-slate-500">#4089</td>
                            <td className="px-5 py-4 font-medium text-slate-600 border-l-2 border-slate-300">Solicitação de relatório</td>
                            <td className="px-5 py-4 text-slate-500">Varejo Sul</td>
                            <td className="px-5 py-4 text-center">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-600">Baixa</span>
                            </td>
                            <td className="px-5 py-4">
                              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-[12px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                                <Check size={12} /> Resolvido
                              </span>
                            </td>
                            <td className="px-5 py-4 text-slate-500">Pedro</td>
                            <td className="px-5 py-4">
                              <span className="font-mono text-[13px] text-slate-400">—</span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              </div>
              
              {/* Optional Side Panel (Ticket Detail Preview) - Hidden on smaller screens */}
              <div className="w-72 bg-white border-l border-slate-200 hidden lg:flex flex-col">
                 <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                    <div className="font-mono font-bold text-slate-700">#4092</div>
                    <button className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
                 </div>
                 <div className="p-4 flex-1 overflow-y-auto space-y-6">
                    <div>
                       <h3 className="font-bold text-slate-900 leading-tight mb-2">Dúvida faturamento mensal</h3>
                       <div className="flex flex-wrap gap-2">
                          <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded">ALTA</span>
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded">NOVO</span>
                       </div>
                    </div>
                    
                    <div className="space-y-3 pt-4 border-t border-slate-100">
                       <div className="flex flex-col">
                          <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Cliente</span>
                          <span className="text-sm font-medium text-slate-900">TechCorp S/A</span>
                          <span className="text-xs text-slate-500">João Silva (joao@techcorp.com)</span>
                       </div>
                       <div className="flex flex-col">
                          <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Categoria</span>
                          <span className="text-sm font-medium text-slate-900">Financeiro / Faturamento</span>
                       </div>
                       <div className="flex flex-col">
                          <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Abertura</span>
                          <span className="text-sm font-medium text-slate-900">Hoje, 10:45</span>
                       </div>
                    </div>
                    
                    <div className="pt-4 border-t border-slate-100">
                       <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-2 block">Última interação</span>
                       <div className="bg-amber-50 border border-amber-100 p-3 rounded-lg relative">
                          <div className="flex items-center gap-2 mb-1">
                             <div className="w-5 h-5 bg-amber-200 rounded text-[9px] font-bold text-amber-700 flex items-center justify-center">M</div>
                             <span className="text-[11px] font-bold text-amber-900">Nota Interna (Marina)</span>
                          </div>
                          <p className="text-xs text-amber-800">Verificando com o financeiro se o boleto já foi compensado. Retorno em breve.</p>
                       </div>
                    </div>
                 </div>
                 <div className="p-4 border-t border-slate-200 grid grid-cols-2 gap-2 bg-slate-50 shrink-0">
                    <button className="h-9 w-full bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded hover:bg-slate-50 transition-colors">Atribuir</button>
                    <button className="h-9 w-full bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"><MessageSquare size={14} /> Responder</button>
                 </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Explaining the parts Section */}
      <section className="py-16 px-6 bg-white border-b border-slate-100">
         <div className="max-w-5xl mx-auto space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <h2 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900">O que você está vendo?</h2>
              <p className="text-base text-slate-600">A interface foi desenhada para dar foco total no andamento da operação e na resolução de demandas, cortando ruídos.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
               <div className="space-y-3 p-5 bg-slate-50 border border-slate-100 rounded-xl">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                     <AlertCircle size={20} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">SLA e Prioridades Visuais</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">Em vermelho, amarelo e verde. Bater o olho na fila é suficiente para saber exatamente o que precisa ser feito agora.</p>
               </div>
               <div className="space-y-3 p-5 bg-slate-50 border border-slate-100 rounded-xl">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                     <LayoutDashboard size={20} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Dashboard Direto ao Ponto</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">Cards de indicadores que mostram volume de atendimento, repasses e gargalos de tempo instantaneamente.</p>
               </div>
               <div className="space-y-3 p-5 bg-slate-50 border border-slate-100 rounded-xl">
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                     <Database size={20} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Gestão B2B Centrada</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">Controle por base de cliente ou contrato, não apenas e-mails isolados soltos em uma caixa de entrada caótica.</p>
               </div>
            </div>
         </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-6 bg-slate-50 border-t border-slate-100 text-center">
         <div className="max-w-2xl mx-auto space-y-6">
           <h2 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900">Quer ver o Gestifique aplicado à sua operação?</h2>
           <p className="text-slate-500 text-base lg:text-lg font-medium">Solicite uma demonstração guiada para entender como a plataforma pode se adaptar ao seu fluxo real de atendimento.</p>
           <div className="pt-2 flex justify-center">
             <button 
               onClick={() => onNavigate('/contato')}
               className="h-11 px-6 bg-blue-600 text-white text-[14px] font-bold rounded-lg hover:bg-blue-700 transition-all shadow-sm flex items-center justify-center gap-2"
             >
               Agendar demonstração real <ArrowRight size={18} />
             </button>
           </div>
         </div>
      </section>
    </div>
  );
};
