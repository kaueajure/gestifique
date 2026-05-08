import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (empresaId: number): Socket => {
  if (!socket) {
    socket = io({
      query: { empresa_id: empresaId },
      transports: ['websocket', 'polling']
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
