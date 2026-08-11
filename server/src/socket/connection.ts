import { Server, Socket } from 'socket.io';
import { registerMessageHandler } from './message.handler';

export const setupSocketHandlers = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    const userId = socket.handshake.query.userId as string;
    console.log(`🔌 User connected via Socket: ${userId} (${socket.id})`);

    if (userId) {
      socket.join(`user_${userId}`);
    }

    // Join conversation rooms
    socket.on('join_room', (conversationId: string) => {
      socket.join(conversationId);
      console.log(`User ${userId} joined room ${conversationId}`);
    });

    // Register message events
    registerMessageHandler(io, socket);

    socket.on('disconnect', () => {
      console.log(`❌ Socket disconnected: ${socket.id}`);
    });
  });
};
