import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import {
  getConversations,
  getMessages,
  getUsers,
  startDirectMessage,
  deleteConversation,
  createGroup,
  updateGroupDetails,
  addGroupMembers,
  removeGroupMember,
  updateMemberRole,
} from '../controllers/chat.controller';

const router = Router();

router.get('/conversations', authenticateToken, getConversations);
router.get('/conversations/:conversationId/messages', authenticateToken, getMessages);
router.get('/users', authenticateToken, getUsers);
router.post('/dm', authenticateToken, startDirectMessage);
router.delete('/conversations/:conversationId', authenticateToken, deleteConversation);

// Group Chat Management Routes
router.post('/groups', authenticateToken, createGroup);
router.patch('/groups/:conversationId', authenticateToken, updateGroupDetails);
router.post('/groups/:conversationId/members', authenticateToken, addGroupMembers);
router.delete('/groups/:conversationId/members/:targetUserId', authenticateToken, removeGroupMember);
router.patch('/groups/:conversationId/members/:targetUserId/role', authenticateToken, updateMemberRole);

export default router;
