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

export const deleteConversation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { conversationId } = req.params;
    const result = await chatService.deleteConversation(conversationId, userId);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const createGroup = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const creatorId = req.user!.id;
    const { name, description, avatarUrl, memberUserIds } = req.body;
    const conversation = await chatService.createGroupConversation(
      creatorId,
      name,
      description,
      avatarUrl,
      memberUserIds || []
    );
    return res.status(201).json(conversation);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

export const updateGroupDetails = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const requesterId = req.user!.id;
    const { conversationId } = req.params;
    const { name, description, avatarUrl } = req.body;
    const updated = await chatService.updateGroupDetails(conversationId, requesterId, {
      name,
      description,
      avatarUrl,
    });
    return res.status(200).json(updated);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

export const addGroupMembers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const requesterId = req.user!.id;
    const { conversationId } = req.params;
    const { userIds } = req.body;
    const result = await chatService.addGroupMembers(conversationId, requesterId, userIds || []);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

export const removeGroupMember = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const requesterId = req.user!.id;
    const { conversationId, targetUserId } = req.params;
    const result = await chatService.removeGroupMember(conversationId, requesterId, targetUserId);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

export const updateMemberRole = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const requesterId = req.user!.id;
    const { conversationId, targetUserId } = req.params;
    const { role } = req.body;
    const result = await chatService.updateMemberRole(conversationId, requesterId, targetUserId, role);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};
