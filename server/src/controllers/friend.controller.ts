import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import * as friendService from '../services/friend.service';

export const handleSearchUsers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const query = (req.query.q as string) || '';
    const results = await friendService.searchUsersWithFriendStatus(userId, query);
    return res.status(200).json(results);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const handleSendRequest = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const senderId = req.user!.id;
    const { receiverId } = req.body;
    if (!receiverId) return res.status(400).json({ error: 'receiverId is required' });

    const request = await friendService.sendFriendRequest(senderId, receiverId);
    return res.status(201).json(request);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

export const handleGetPendingRequests = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const requests = await friendService.getPendingRequests(userId);
    return res.status(200).json(requests);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const handleRespondRequest = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { requestId, action } = req.body; // action: 'accept' | 'reject'
    if (!requestId || !action) {
      return res.status(400).json({ error: 'requestId and action are required' });
    }

    const result = await friendService.respondToFriendRequest(requestId, userId, action);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};
