import React, { useState, useEffect } from 'react';
import { TicketKanbanColumn, TicketKanbanResponse, User, Ticket } from '../../types';
import { Badge } from '../ui/Badge';
import { User as UserIcon, AlertCircle, Building, Clock, ShieldAlert, Download, Layers } from 'lucide-react';
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
           return currentData; // Or maybe forward to handleTicketUpdated, but we'll just ignore for now to avoid duplications
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
      // Revert if error? Props change will eventually fix it, but for now we catch
      onStatusChange();
    }
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
      case 'urgente': return { color: 'text-red-600 bg-red-50 border-red-100', label: 'Urgente' };
      case 'alta': return { color: 'text-orange-600 bg-orange-50 border-orange-100', label: 'Alta' };
      case 'media': return { color: 'text-amber-600 bg-amber-50 border-amber-100', label: 'Média' };
      case 'baixa': return { color: 'text-blue-600 bg-blue-50 border-blue-100', label: 'Baixa' };
      default: return { color: 'text-slate-500 bg-slate-50 border-slate-200', label: prio };
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/30 rounded-xl">
      {errorMsg && (
        <div className="mb-3 p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-red-600 text-[11px] font-bold shrink-0 mx-3 mt-3">
          <AlertCircle size={14} /> {errorMsg}
        </div>
      )}
      <DragDropContextComp onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4 pt-4 px-4 snap-x items-start h-full no-scrollbar">
          {localData.columns.map(column => (
            <div 
              key={column.id}
              className="w-[280px] sm:w-[320px] shrink-0 flex flex-col max-h-full snap-start"
            >
              <div className="flex items-center justify-between px-3 mb-3 shrink-0">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    column.id === 'aberto' && "bg-blue-500",
                    column.id === 'em_andamento' && "bg-indigo-500",
                    column.id === 'aguardando_cliente' && "bg-amber-500",
                    column.id === 'resolvido' && "bg-emerald-500",
                    column.id === 'fechado' && "bg-slate-500"
                  )} />
                  <h3 className="font-black text-[11px] uppercase tracking-[0.15em] text-slate-500">{column.title}</h3>
                </div>
                <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full shadow-inner">
                  {column.count}
                </span>
              </div>

              <DroppableComp droppableId={column.id}>
                {(provided: any, snapshot: any) => (
                  <div 
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      "flex-1 flex flex-col gap-3 p-1.5 rounded-2xl transition-all duration-200 min-h-[150px] overflow-y-auto custom-scrollbar",
                      snapshot.isDraggingOver ? "bg-blue-50/50 ring-2 ring-blue-100 ring-inset" : "bg-transparent"
                    )}
                  >
                    {column.tickets.map((ticket, index) => {
                      const sla = getSlaInfo(ticket.prazo_sla, ticket.status);
                      const isAbertoESemResp = ticket.status === 'aberto' && !ticket.responsavel_id;
                      const priority = getPriorityInfo(ticket.prioridade);
                      
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
                              "bg-white rounded-xl shadow-sm border border-slate-200 cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-slate-200/50 hover:border-blue-200 group relative",
                              snapshot.isDragging && "shadow-2xl border-blue-400 ring-4 ring-blue-50/50 -rotate-1 z-50",
                              updatingId === ticket.id && "opacity-50 pointer-events-none"
                            )}
                          >
                            {/* Left critical marker */}
                            {(sla.status === 'vencido' || isAbertoESemResp) && (
                              <div className={cn(
                                "absolute left-0 top-3 bottom-3 w-1 rounded-r-full",
                                sla.status === 'vencido' ? "bg-red-500" : "bg-amber-400"
                              )} />
                            )}

                            <div className="p-4">
                              <div className="flex items-start justify-between gap-3 mb-2.5">
                                <div className="flex flex-col gap-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black text-blue-600 tracking-tighter shrink-0 bg-blue-50/50 px-1.5 py-0.5 rounded border border-blue-100/50">
                                      #{ticket.id}
                                    </span>
                                    {isAbertoESemResp && (
                                      <span className="text-[9px] font-black text-amber-600 uppercase tracking-tighter">Novo</span>
                                    )}
                                    {ticket.origem === 'email' && (
                                      <span className="p-0.5 text-slate-400" title="Origem: E-mail">
                                        <Download size={10} className="rotate-180" />
                                      </span>
                                    )}
                                  </div>
                                  <h4 className="font-bold text-[13px] leading-tight text-slate-800 group-hover:text-blue-700 transition-colors line-clamp-2 mt-1">
                                    {ticket.titulo}
                                  </h4>
                                </div>
                                <div className={cn(
                                  "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border transition-colors shrink-0",
                                  priority.color
                                )}>
                                  {priority.label}
                                </div>
                              </div>

                              {ticket.tags && ticket.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-4">
                                  {ticket.tags.slice(0, 3).map(tag => (
                                    <span key={tag} className="text-[9px] font-bold text-slate-500 bg-slate-50 border border-slate-100 rounded px-1.5 py-0.5">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}

                              <div className="flex flex-col gap-3 pt-3 border-t border-slate-50">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className="w-6 h-6 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                                      <UserIcon size={12} className="text-slate-400" />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                      <span className="text-[10px] font-bold text-slate-700 truncate">
                                        {ticket.cliente_nome || 'Solicitante'}
                                      </span>
                                      <span className="text-[9px] text-slate-400 font-medium truncate">
                                        {ticket.empresa_nome}
                                      </span>
                                    </div>
                                  </div>
                                  
                                  <div className={cn(
                                    "px-2 py-1 rounded-lg border text-[9px] font-black uppercase tracking-tight flex items-center gap-1.5",
                                    sla.color
                                  )}>
                                    <Clock size={10} />
                                    {sla.remainingText || sla.label}
                                  </div>
                                </div>

                                <div className="flex items-center justify-between bg-slate-50/50 p-2 rounded-lg border border-slate-100/50">
                                  <div className="flex items-center gap-2">
                                    {ticket.responsavel_id ? (
                                      <>
                                        <div className="w-5 h-5 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-[10px] font-black text-blue-700 uppercase">
                                          {ticket.responsavel_nome?.[0]}
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-600 truncate max-w-[100px]">
                                          {ticket.responsavel_nome?.split(' ')[0]}
                                        </span>
                                      </>
                                    ) : (
                                      <div className="flex items-center gap-1.5 text-amber-600 group-hover:text-amber-700 transition-colors">
                                        <ShieldAlert size={12} />
                                        <span className="text-[10px] font-black uppercase tracking-tighter">Sem responsável</span>
                                      </div>
                                    )}
                                  </div>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                                    {formatRelativeTime(ticket.updated_at)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </DraggableComp>
                    )})}
                    {provided.placeholder}
                    {column.tickets.length === 0 && !snapshot.isDraggingOver && (
                      <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl p-6 opacity-30 mt-2">
                        <Layers size={24} className="text-slate-300 mb-2" />
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] text-center">Coluna vazia</p>
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
