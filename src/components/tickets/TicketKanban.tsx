import React, { useState, useEffect } from 'react';
import { TicketKanbanColumn, TicketKanbanResponse, User, Ticket } from '../../types';
import { Badge } from '../ui/Badge';
import { User as UserIcon, AlertCircle, Building, Clock, ShieldAlert, Download, Layers, Play, UserPlus, MoreVertical, Copy } from 'lucide-react';
import { cn, formatRelativeTime, getSlaInfo } from '../../lib/utils';
import { api } from '../../lib/api';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { getSocket } from '../../lib/socket';

const DraggableComp = Draggable as any;
const DroppableComp = Droppable as any;
const DragDropContextComp = DragDropContext as any;

interface TicketKanbanProps {
  kanbanData: TicketKanbanResponse;
  onSelectTicket: (id: number) => void;
  currentUser: User;
  onStatusChange: () => void;
}

export const TicketKanban = ({ kanbanData, onSelectTicket, currentUser, onStatusChange }: TicketKanbanProps) => {

  const canManage = !!(currentUser.administrador || currentUser.desenvolvedor);

  const [localData, setLocalData] = useState<TicketKanbanResponse>(kanbanData);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync local data when props change
  useEffect(() => {
    setLocalData(kanbanData);
  }, [kanbanData]);

  // Real-time updates via WebSockets
  useEffect(() => {
    if (!currentUser?.empresa_id) return;
    
    const socket = getSocket(currentUser.empresa_id);

    const handleTicketUpdated = (updatedTicket: Ticket) => {
      setLocalData(currentData => {
        const newColumns = currentData.columns.map(col => {
          // Remove from all existing columns first
          const filteredTickets = col.tickets.filter(t => t.id !== updatedTicket.id);
          return { ...col, tickets: filteredTickets };
        });

        // Add to the correct column
        const targetColIndex = newColumns.findIndex(c => c.id === updatedTicket.status);
        if (targetColIndex !== -1) {
          // Find original index if it was in the same column to preserve order,
          // otherwise put it at the beginning
          newColumns[targetColIndex].tickets.unshift(updatedTicket);
        }

        // Update counts
        newColumns.forEach(c => c.count = c.tickets.length);

        return { ...currentData, columns: newColumns };
      });
    };

    const handleTicketCreated = (newTicket: Ticket) => {
      setLocalData(currentData => {
        const newColumns = [...currentData.columns];
        
        // Check if ticket already exists in any column
        let exists = false;
        for (const col of newColumns) {
           if (col.tickets.some(t => t.id === newTicket.id)) {
              exists = true;
              break;
           }
        }
        
        if (exists) {
           // Proceed with updated logic instead
           return currentData; 
        }

        const targetColIndex = newColumns.findIndex(c => c.id === newTicket.status);
        
        if (targetColIndex !== -1) {
          newColumns[targetColIndex].tickets.unshift(newTicket);
          newColumns[targetColIndex].count++;
        }
        
        return { ...currentData, columns: newColumns };
      });
    };

    socket.on('ticketUpdated', handleTicketUpdated);
    socket.on('ticketCreated', handleTicketCreated);

    return () => {
      socket.off('ticketUpdated', handleTicketUpdated);
      socket.off('ticketCreated', handleTicketCreated);
    };
  }, [currentUser]);

  const handleStatusUpdate = async (ticketId: number, newStatus: string) => {
    try {
      await api.patch(`/tickets/${ticketId}/status`, { status: newStatus });
      onStatusChange(); // Full refresh to ensure consistency
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Erro ao persistir mudança de status.');
      onStatusChange();
    }
  };

  const handleAssumirTicket = async (e: React.MouseEvent, ticketId: number) => {
    e.stopPropagation();
    setUpdatingId(ticketId);
    try {
      await api.patch(`/tickets/${ticketId}`, { responsavel_id: currentUser.id });
      onStatusChange();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Erro ao assumir chamado.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleMudarStatus = async (e: React.MouseEvent, ticketId: number, status: string) => {
    e.stopPropagation();
    setUpdatingId(ticketId);
    try {
      await api.patch(`/tickets/${ticketId}/status`, { status });
      onStatusChange();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Erro ao alterar status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCopyId = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id.toString());
    // No alert, just feedback potentially?
  };

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    if (!canManage) {
      setErrorMsg('Apenas administradores podem mover chamados.');
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }

    const ticketId = parseInt(draggableId);
    const newStatus = destination.droppableId;

    // Optimistic Update
    const sourceCol = localData.columns.find(c => c.id === source.droppableId);
    const destCol = localData.columns.find(c => c.id === destination.droppableId);

    if (sourceCol && destCol) {
      const newColumns = [...localData.columns];
      const sourceColIndex = newColumns.findIndex(c => c.id === source.droppableId);
      const destColIndex = newColumns.findIndex(c => c.id === destination.droppableId);

      const [movedTicket] = newColumns[sourceColIndex].tickets.splice(source.index, 1);
      // Update the status on the ticket object itself
      movedTicket.status = newStatus as any; 
      newColumns[destColIndex].tickets.splice(destination.index, 0, movedTicket);

      // Simple count adjustment
      newColumns[sourceColIndex].count--;
      newColumns[destColIndex].count++;

      setLocalData({
        ...localData,
        columns: newColumns
      });

      // Persist
      handleStatusUpdate(ticketId, newStatus);
    }
  };

  const getPriorityInfo = (prio: string) => {
    switch (prio) {
      case 'urgente': return { color: 'text-red-600 bg-red-50 border-red-100', label: 'URG' };
      case 'alta': return { color: 'text-orange-600 bg-orange-50 border-orange-100', label: 'ALTA' };
      case 'media': return { color: 'text-amber-600 bg-amber-50 border-amber-100', label: 'MÉD' };
      case 'baixa': return { color: 'text-blue-600 bg-blue-50 border-blue-100', label: 'BAIX' };
      default: return { color: 'text-slate-500 bg-slate-50 border-slate-200', label: prio.substring(0, 4).toUpperCase() };
    }
  };

  const getEstadoAtendimentoInfo = (estado?: string) => {
    switch (estado) {
      case 'cliente_respondeu':
        return { 
          label: 'Cliente respondeu', 
          color: 'bg-blue-600 text-white border-blue-700 shadow-sm',
          dot: 'bg-blue-100'
        };
      case 'aguardando_cliente':
        return { 
          label: 'Aguardando cliente', 
          color: 'bg-amber-50 text-amber-700 border-amber-200',
          dot: 'bg-amber-500'
        };
      case 'atendente_respondeu':
        return { 
          label: 'Atendente respondeu', 
          color: 'bg-slate-50 text-slate-500 border-slate-200',
          dot: 'bg-slate-300'
        };
      case 'sem_resposta':
        return { 
          label: 'Sem resposta', 
          color: 'bg-rose-50 text-rose-600 border-rose-100',
          dot: 'bg-rose-500'
        };
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/20 rounded-xl overflow-hidden">
      {errorMsg && (
        <div className="mb-2 p-2 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-red-600 text-[10px] font-bold shrink-0 mx-2 mt-2">
          <AlertCircle size={12} /> {errorMsg}
        </div>
      )}
      <DragDropContextComp onDragEnd={onDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4 pt-3 px-3 snap-x items-start h-full no-scrollbar">
          {localData.columns.map(column => (
            <div 
              key={column.id}
              className="w-[260px] sm:w-[270px] xl:w-[280px] shrink-0 flex flex-col max-h-full snap-start"
            >
              <div className="flex items-center justify-between px-2 mb-2 shrink-0">
                <div className="flex items-center gap-1.5">
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    column.id === 'aberto' && "bg-blue-500",
                    column.id === 'em_andamento' && "bg-indigo-500",
                    column.id === 'aguardando_cliente' && "bg-amber-500",
                    column.id === 'resolvido' && "bg-emerald-500",
                    column.id === 'fechado' && "bg-slate-500"
                  )} />
                  <h3 className="font-black text-[10px] uppercase tracking-[0.1em] text-slate-500">{column.title}</h3>
                </div>
                <span className="text-[9px] font-black bg-white border border-slate-200 text-slate-400 px-1.5 rounded shadow-sm">
                  {column.count}
                </span>
              </div>

              <DroppableComp droppableId={column.id}>
                {(provided: any, snapshot: any) => (
                  <div 
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      "flex-1 flex flex-col gap-2 p-1 rounded-xl transition-all duration-200 min-h-[150px] overflow-y-auto custom-scrollbar overflow-x-hidden",
                      snapshot.isDraggingOver ? "bg-blue-50/30 ring-1 ring-blue-100 ring-inset" : "bg-transparent"
                    )}
                  >
                    {column.tickets.map((ticket, index) => {
                      const sla = getSlaInfo(ticket.prazo_sla, ticket.status);
                      const isAbertoESemResp = ticket.status === 'aberto' && !ticket.responsavel_id;
                      const priority = getPriorityInfo(ticket.prioridade);
                      const estadoInfo = getEstadoAtendimentoInfo(ticket.estado_atendimento);
                      
                      return (
                      <DraggableComp 
                        key={ticket.id.toString()} 
                        draggableId={ticket.id.toString()} 
                        index={index} 
                        isDragDisabled={!canManage}
                      >
                        {(provided: any, snapshot: any) => (
                          <div 
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            onClick={() => onSelectTicket(ticket.id)}
                            className={cn(
                              "bg-white rounded-xl shadow-sm border border-slate-200/80 cursor-pointer transition-all duration-200 hover:shadow-md hover:border-blue-400 group relative overflow-hidden",
                              snapshot.isDragging && "shadow-xl border-blue-400 ring-4 ring-blue-50 z-50 scale-[1.02]",
                              updatingId === ticket.id && "opacity-50 pointer-events-none"
                            )}
                          >
                            {/* Left critical marker - more subtle */}
                            {(sla.status === 'vencido' || isAbertoESemResp || ticket.precisa_resposta) && (
                              <div className={cn(
                                "absolute left-0 top-0 bottom-0 w-1",
                                sla.status === 'vencido' ? "bg-red-500" : (ticket.precisa_resposta ? "bg-blue-500" : "bg-amber-400")
                              )} />
                            )}

                            <div className="p-3.5 space-y-3">
                              {/* Header: ID + State */}
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="text-[10px] font-black text-slate-400 tracking-tighter opacity-70 group-hover:text-blue-500 transition-colors">
                                    #{ticket.id}
                                  </span>
                                  {ticket.nao_lido && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600 ring-4 ring-blue-50 animate-pulse" />
                                  )}
                                  {estadoInfo && (
                                    <span className={cn(
                                      "px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border transition-all truncate max-w-[120px]",
                                      estadoInfo.color
                                    )}>
                                      {estadoInfo.label}
                                    </span>
                                  )}
                                </div>
                                <div className={cn(
                                  "px-1.5 py-px rounded-[4px] text-[8px] font-black uppercase tracking-tight border shrink-0 opacity-80 group-hover:opacity-100 transition-all",
                                  priority.color
                                )}>
                                  {priority.label}
                                </div>
                              </div>

                              {/* Body: Title */}
                              <h4 className="font-bold text-[13px] leading-tight text-slate-800 tracking-tight group-hover:text-slate-900 transition-colors line-clamp-2">
                                {ticket.titulo}
                              </h4>

                              {/* People/Client Row */}
                              <div className="flex items-center justify-between gap-2 pt-1">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <div className="w-5 h-5 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                                      <UserIcon size={10} className="text-slate-400" />
                                    </div>
                                    <span className="text-[11px] font-bold text-slate-500 truncate">
                                      {ticket.cliente_nome?.split(' ')[0] || 'Cliente'}
                                    </span>
                                  </div>
                                </div>

                                {ticket.responsavel_id ? (
                                  <div className="flex items-center gap-1.5 shrink-0 bg-slate-50/50 pr-1.5 rounded-full border border-slate-100/50">
                                    <div className="w-5 h-5 rounded-full bg-blue-600 border border-blue-700 flex items-center justify-center text-[8px] font-black text-white uppercase shrink-0 shadow-sm">
                                      {ticket.responsavel_nome?.[0]}
                                    </div>
                                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-tighter">
                                      {ticket.responsavel_nome?.split(' ')[0]}
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-100/50 shadow-sm">
                                    <ShieldAlert size={10} />
                                    <span className="text-[8px] font-black uppercase tracking-tighter">Pendente</span>
                                  </div>
                                )}
                              </div>

                              {/* Footer: SLA + Time/Tags */}
                              <div className="pt-2 border-t border-slate-50 flex items-center justify-between">
                                <div className={cn(
                                  "px-2 py-0.5 rounded-[4px] border text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all",
                                  sla.color
                                )}>
                                  <Clock size={9} />
                                  {sla.compactText || sla.label}
                                </div>
                                <div className="flex items-center gap-2">
                                  {ticket.tags && ticket.tags.length > 0 && (
                                    <span className="text-[9px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200/50 uppercase tracking-tighter whitespace-nowrap">
                                      {ticket.tags[0]}
                                    </span>
                                  )}
                                  <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap tabular-nums">
                                    {formatRelativeTime(ticket.updated_at).replace('há ', '')}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Quick Actions overlay - More elegant */}
                            <div className="absolute inset-x-0 bottom-0 h-9 bg-slate-900/95 backdrop-blur-sm transform translate-y-full group-hover:translate-y-0 transition-transform flex items-center justify-center gap-4 px-4 z-10 border-t border-slate-800">
                               {canManage && isAbertoESemResp && (
                                  <button 
                                    onClick={(e) => handleAssumirTicket(e, ticket.id)} 
                                    className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-400 hover:text-emerald-300 transition-colors"
                                  >
                                    <UserPlus size={13} />
                                    <span>Assumir</span>
                                  </button>
                                )}
                                {canManage && ticket.status === 'aberto' && ticket.responsavel_id === currentUser.id && (
                                  <button 
                                    onClick={(e) => handleMudarStatus(e, ticket.id, 'em_andamento')} 
                                    className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors"
                                  >
                                    <Play size={13} />
                                    <span>Atender</span>
                                  </button>
                                )}
                                <button 
                                  onClick={(e) => handleCopyId(e, ticket.id)} 
                                  className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-300 transition-colors"
                                  title="Copiar ID"
                                >
                                  <Copy size={13} />
                                  <span>ID</span>
                                </button>
                            </div>
                          </div>
                        )}
                      </DraggableComp>
                    )})}
                    {provided.placeholder}
                    {column.tickets.length === 0 && !snapshot.isDraggingOver && (
                      <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl p-4 opacity-30 mt-1">
                        <Layers size={16} className="text-slate-300 mb-1" />
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] text-center">Vazio</p>
                      </div>
                    )}
                  </div>
                )}
              </DroppableComp>
            </div>
          ))}
        </div>
      </DragDropContextComp>
    </div>
  );
};
