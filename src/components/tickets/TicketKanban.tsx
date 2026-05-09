import React, { useState, useEffect } from 'react';
import { TicketKanbanColumn, TicketKanbanResponse, User, Ticket } from '../../types';
import { Badge } from '../ui/Badge';
import { MessageSquare, User as UserIcon, Calendar, Loader2, AlertCircle, Building } from 'lucide-react';
import { cn } from '../../lib/utils';
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

  const canManage = currentUser.administrador || currentUser.desenvolvedor;

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

  const statusMap: Record<string, string> = {
    aberto: 'blue',
    em_andamento: 'indigo',
    aguardando_cliente: 'amber',
    resolvido: 'emerald',
    fechado: 'slate'
  };

  const getPriorityVariant = (prio: string): 'red' | 'orange' | 'amber' | 'blue' | 'slate' => {
    switch (prio) {
      case 'urgente': return 'red';
      case 'alta': return 'orange';
      case 'media': return 'amber';
      case 'baixa': return 'blue';
      default: return 'slate';
    }
  };

  return (
    <div className="flex flex-col h-full">
      {errorMsg && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-red-600 text-xs font-bold shrink-0 mx-2">
          <AlertCircle size={14} /> {errorMsg}
        </div>
      )}
      <DragDropContextComp onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4 pt-2 -mx-2 px-2 snap-x items-start h-[calc(100vh-280px)]">
          {localData.columns.map(column => (
            <DroppableComp key={column.id} droppableId={column.id}>
              {(provided: any, snapshot: any) => (
                <div 
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={cn(
                    "w-[300px] shrink-0 rounded-xl p-3 border snap-center flex flex-col max-h-full transition-colors",
                    snapshot.isDraggingOver ? "bg-blue-50/50 border-blue-200" : "bg-slate-50/50 border-slate-200/60"
                  )}
                >
                   <div className="flex items-center justify-between mb-3 px-1">
                     <h3 className="font-bold text-sm text-slate-700 tracking-tight">{column.title}</h3>
                     <Badge variant={statusMap[column.id] as any} className="text-[10px] bg-white bg-opacity-100 shadow-sm px-2">
                       {column.count}
                     </Badge>
                   </div>
                                        <div className="flex flex-col gap-3 flex-1 overflow-y-auto custom-scrollbar pr-1 pb-1 min-h-[200px]">
                     {column.tickets.map((ticket, index) => {
                       const prazoSLA = ticket.prazo_sla ? new Date(ticket.prazo_sla) : null;
                       const isFinalizado = ticket.status === 'resolvido' || ticket.status === 'fechado';
                       let slaStatus: 'normal' | 'warning' | 'expired' = 'normal';

                       if (prazoSLA && !isFinalizado) {
                         const now = new Date();
                         const diffHours = (prazoSLA.getTime() - now.getTime()) / (1000 * 60 * 60);
                         if (diffHours < 0) slaStatus = 'expired';
                         else if (diffHours <= 2) slaStatus = 'warning';
                       }

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
                               "bg-white rounded-lg p-3 shadow-sm border cursor-pointer hover:shadow-md transition-all group relative shrink-0",
                               !snapshot.isDragging && slaStatus === 'expired' && "border-red-500 ring-1 ring-red-500",
                               !snapshot.isDragging && slaStatus === 'warning' && "border-yellow-400",
                               !snapshot.isDragging && slaStatus === 'normal' && "border-slate-200 hover:border-slate-300",
                               snapshot.isDragging && "shadow-xl border-blue-300 ring-4 ring-blue-50 rotate-2 z-50",
                               updatingId === ticket.id && "opacity-50 pointer-events-none"
                             )}
                           >
                             <div className="flex items-start justify-between gap-2 mb-2">
                               <div className="flex-1 min-w-0">
                                 <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] font-bold text-slate-400 tracking-tighter block">#{ticket.id}</span>
                                    {slaStatus === 'expired' && (
                                      <span className="text-[8px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-sm uppercase tracking-tight animate-pulse border border-red-200">
                                        SLA Vencido
                                      </span>
                                    )}
                                    {slaStatus === 'warning' && (
                                      <span className="text-[8px] font-bold bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-sm uppercase tracking-tight border border-yellow-200">
                                        Vence em breve
                                      </span>
                                    )}
                                 </div>
                                 <h4 className="font-semibold text-sm leading-tight text-slate-900 group-hover:text-blue-700 transition-colors line-clamp-2">
                                   {ticket.titulo}
                                 </h4>
                               </div>
                               <Badge variant={getPriorityVariant(ticket.prioridade || 'media')} className="text-[9px] px-1 font-bold uppercase shrink-0">
                                 {ticket.prioridade}
                               </Badge>
                             </div>
            
                             <div className="flex flex-col gap-1.5 mt-3 pt-3 border-t border-slate-50">
                                {currentUser.desenvolvedor && ticket.empresa_nome && (
                                   <div className="flex items-center gap-1 text-[10px] font-bold text-slate-600 uppercase tracking-tight mb-1">
                                      <Building size={10} className="text-slate-400" />
                                      <span className="truncate">{ticket.empresa_nome}</span>
                                   </div>
                                )}
                                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                   <span className="flex items-center gap-1 min-w-0">
                                      <UserIcon size={10} className="shrink-0" />
                                      {ticket.cliente_nome === 'Usuário Removido' ? (
                                        <Badge variant="slate" className="text-[8px] px-1 py-0 h-4 border-none bg-slate-100 text-slate-500">Conta Excluída</Badge>
                                      ) : (
                                        <span className="truncate">{ticket.cliente_nome?.split(' ')[0] || 'Usuário'}</span>
                                      )}
                                   </span>
                                   <span className="flex items-center gap-1 shrink-0"><Calendar size={10} />{new Date(ticket.created_at).toLocaleDateString()}</span>
                                </div>
                                {ticket.responsavel_nome && (
                                  <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-400 uppercase tracking-tight">
                                     <UserIcon size={10} /> 
                                     {ticket.responsavel_nome === 'Não Atribuído' ? (
                                       <span className="text-slate-300 italic">Não Atribuído</span>
                                     ) : (
                                       ticket.responsavel_nome
                                     )}
                                  </div>
                                )}
                             </div>
                           </div>
                         )}
                       </DraggableComp>
                       );
                     })}
                     {provided.placeholder}
                     {column.tickets.length === 0 && !snapshot.isDraggingOver && (
                       <div className="flex-1 min-h-[100px] flex items-center justify-center border-2 border-dashed border-slate-200 rounded-lg p-4">
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vazio</p>
                       </div>
                     )}
                   </div>
                </div>
              )}
            </DroppableComp>
          ))}
        </div>
      </DragDropContextComp>
    </div>
  );
};
