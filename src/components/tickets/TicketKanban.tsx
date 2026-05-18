import React, { useState, useEffect } from 'react';
import { TicketKanbanColumn, TicketKanbanResponse, User, Ticket } from '../../types';
import { Badge } from '../ui/Badge';
import { User as UserIcon, AlertCircle, Building, Clock, ShieldAlert, Download, Layers, Play, UserPlus, MoreVertical, Copy, Mail } from 'lucide-react';
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
          const filteredTickets = col.tickets.filter(t => t.id !== updatedTicket.id);
          return { ...col, tickets: filteredTickets };
        });

        const targetColIndex = newColumns.findIndex(c => c.id === updatedTicket.status);
        if (targetColIndex !== -1) {
          newColumns[targetColIndex].tickets.unshift(updatedTicket);
        }

        newColumns.forEach(c => c.count = c.tickets.length);
        return { ...currentData, columns: newColumns };
      });
    };

    const handleTicketCreated = (newTicket: Ticket) => {
      setLocalData(currentData => {
        const newColumns = [...currentData.columns];
        
        let exists = false;
        for (const col of newColumns) {
           if (col.tickets.some(t => t.id === newTicket.id)) {
              exists = true;
              break;
           }
        }
        
        if (exists) return currentData; 

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
      onStatusChange();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Erro ao persistir mudança de status.');
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

    const sourceCol = localData.columns.find(c => c.id === source.droppableId);
    const destCol = localData.columns.find(c => c.id === destination.droppableId);

    if (sourceCol && destCol) {
      const newColumns = [...localData.columns];
      const sourceColIndex = newColumns.findIndex(c => c.id === source.droppableId);
      const destColIndex = newColumns.findIndex(c => c.id === destination.droppableId);

      const [movedTicket] = newColumns[sourceColIndex].tickets.splice(source.index, 1);
      movedTicket.status = newStatus as any; 
      newColumns[destColIndex].tickets.splice(destination.index, 0, movedTicket);

      newColumns[sourceColIndex].count--;
      newColumns[destColIndex].count++;

      setLocalData({
        ...localData,
        columns: newColumns
      });

      handleStatusUpdate(ticketId, newStatus);
    }
  };

  const getPriorityInfo = (prio: string) => {
    switch (prio) {
      case 'urgente': return 'bg-red-500';
      case 'alta': return 'bg-orange-500';
      case 'media': return 'bg-amber-400';
      case 'baixa': return 'bg-blue-500';
      default: return 'bg-slate-300';
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50 rounded-lg overflow-hidden border border-slate-200/60">
      {errorMsg && (
        <div className="mb-2 p-2 bg-red-50 border border-red-100 rounded-md flex items-center gap-2 text-red-600 text-[10px] font-semibold mx-2 mt-2">
          <AlertCircle size={12} /> {errorMsg}
        </div>
      )}
      <DragDropContextComp onDragEnd={onDragEnd}>
        <div className="flex gap-2 overflow-x-auto p-3 h-full no-scrollbar">
          {localData.columns.map(column => (
            <div 
              key={column.id}
              className="w-[240px] shrink-0 flex flex-col h-full"
            >
              <div className="flex items-center justify-between px-1 mb-2 shrink-0">
                <div className="flex items-center gap-1.5">
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    column.id === 'aberto' && "bg-blue-500",
                    column.id === 'em_andamento' && "bg-indigo-500",
                    column.id === 'aguardando_cliente' && "bg-amber-500",
                    column.id === 'resolvido' && "bg-emerald-500",
                    column.id === 'fechado' && "bg-slate-500"
                  )} />
                  <h3 className="font-semibold text-xs text-slate-700">{column.title}</h3>
                </div>
                <span className="text-[10px] font-medium bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-sm">
                  {column.count}
                </span>
              </div>

              <DroppableComp droppableId={column.id}>
                {(provided: any, snapshot: any) => (
                  <div 
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      "flex-1 flex flex-col gap-2 rounded-md transition-all duration-200 overflow-y-auto no-scrollbar pb-8",
                      snapshot.isDraggingOver ? "bg-slate-100/50" : ""
                    )}
                  >
                    {column.tickets.map((ticket, index) => {
                      const sla = getSlaInfo(ticket.prazo_sla, ticket.status, ticket.sla_status_operacional);
                      const priorityColor = getPriorityInfo(ticket.prioridade);
                      
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
                              "bg-white rounded border cursor-pointer transition-all flex flex-col p-2.5 relative overflow-hidden",
                              snapshot.isDragging ? "shadow-md border-blue-300 z-50" : "shadow-sm border-slate-200 hover:border-slate-300",
                              updatingId === ticket.id && "opacity-50 pointer-events-none"
                            )}
                          >
                            <div className={cn("absolute left-0 top-0 bottom-0 w-[3px]", priorityColor)} />
                            
                            <div className="flex items-start justify-between gap-2 mb-1.5 pl-1.5">
                              <span className="text-[10px] text-slate-500 font-medium">#{ticket.id}</span>
                              <div className={cn(
                                "flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-sm",
                                sla.color
                              )}>
                                <Clock size={10} />
                                {sla.compactText || sla.label}
                              </div>
                            </div>

                            <h4 className="font-medium text-[13px] leading-tight text-slate-800 line-clamp-2 pl-1.5">
                              {ticket.titulo}
                            </h4>

                            <div className="mt-2.5 flex items-center justify-between pl-1.5">
                              <div className="flex items-center gap-1.5 min-w-0">
                                {ticket.responsavel_id ? (
                                  <div className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center text-[9px] font-medium text-slate-600 shrink-0" title={ticket.responsavel_nome}>
                                    {ticket.responsavel_nome?.[0]}
                                  </div>
                                ) : (
                                  <div className="w-4 h-4 rounded-full bg-amber-50 flex items-center justify-center text-[9px] text-amber-500 shrink-0" title="Sem responsável">
                                    <ShieldAlert size={10} />
                                  </div>
                                )}
                                <span className="text-[10px] text-slate-500 truncate" title={ticket.cliente_nome || 'Cliente'}>
                                  {ticket.cliente_nome?.split(' ')[0] || 'Cliente'}
                                </span>
                              </div>
                              
                              {ticket.nao_lido && (
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                              )}
                            </div>
                          </div>
                        )}
                      </DraggableComp>
                    )})}
                    {provided.placeholder}
                    {column.tickets.length === 0 && !snapshot.isDraggingOver && (
                      <div className="h-10 mt-1 flex items-center justify-center border border-dashed border-slate-200 rounded text-[10px] text-slate-400">
                        Vazio
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
