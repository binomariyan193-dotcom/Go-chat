import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import * as chatService from '../services/chat.service';

export const getConversations = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const conversations = await chatService.getUserConversations(userId);
    return res.status(200).json(conversations);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const getMessages = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { conversationId } = req.params;
    const messages = await chatService.getConversationMessages(conversationId);
    return res.status(200).json(messages);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const getUsers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const users = await chatService.getAllUsers(userId);
    return res.status(200).json(users);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const startDirectMessage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { targetUserId } = req.body;
    if (!targetUserId) {
      return res.status(400).json({ error: 'targetUserId is required' });
    }

    const conversation = await chatService.createOrGetDirectConversation(userId, targetUserId);
    return res.status(200).json(conversation);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
