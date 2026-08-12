import { Server, Socket } from 'socket.io';
import * as chatService from '../services/chat.service';

export const registerMessageHandler = (io: Server, socket: Socket) => {
  socket.on(
    'send_message',
    async (payload: { conversationId: string; senderId: string; textContent?: string; imageUrl?: string; audioUrl?: string }) => {
      try {
        const { conversationId, senderId, textContent, imageUrl, audioUrl } = payload;
        const message = await chatService.createMessage(conversationId, senderId, textContent, imageUrl, audioUrl);

        // Broadcast to all clients in the conversation room
        io.to(conversationId).emit('new_message', message);
      } catch (error) {
        console.error('Failed to handle send_message socket event:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    }
  );

  socket.on(
    'edit_message',
    async (payload: { messageId: string; senderId: string; textContent: string }) => {
      try {
        const { messageId, senderId, textContent } = payload;
        const updatedMessage = await chatService.editMessage(messageId, senderId, textContent);

        // Broadcast updated message to room
        io.to(updatedMessage.conversationId).emit('message_edited', updatedMessage);
      } catch (error: any) {
        console.error('Failed to edit message:', error.message);
        socket.emit('error', { message: error.message || 'Failed to edit message' });
      }
    }
  );

  socket.on('typing', (data: { conversationId: string; username: string; isTyping: boolean }) => {
    socket.to(data.conversationId).emit('user_typing', data);
  });

  socket.on('delete_conversation', (data: { conversationId: string }) => {
    io.to(data.conversationId).emit('conversation_deleted', { conversationId: data.conversationId });
  });

  socket.on('delete_message', async (payload: { messageId: string; senderId: string }) => {
    try {
      const { messageId, senderId } = payload;
      const result = await chatService.deleteMessage(messageId, senderId);
      io.to(result.conversationId).emit('message_deleted', result);
    } catch (error: any) {
      console.error('Failed to delete message:', error.message);
      socket.emit('error', { message: error.message || 'Failed to delete message' });
    }
  });

  socket.on('update_status', (data: { userId: string; status: 'online' | 'offline' }) => {
    io.emit('user_status_changed', data);
  });

  socket.on('react_message', async (payload: { messageId: string; userId: string; emoji: string }) => {
    try {
      const { messageId, userId, emoji } = payload;
      const result = await chatService.toggleReaction(messageId, userId, emoji);
      if (result.conversationId) {
        io.to(result.conversationId).emit('message_reaction_updated', result);
      }
    } catch (error: any) {
      console.error('Failed to toggle reaction:', error.message);
      socket.emit('error', { message: error.message || 'Failed to toggle reaction' });
    }
  });
};
