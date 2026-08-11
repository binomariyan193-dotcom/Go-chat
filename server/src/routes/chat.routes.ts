import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { getConversations, getMessages, getUsers, startDirectMessage, deleteConversation } from '../controllers/chat.controller';

const router = Router();

router.get('/conversations', authenticateToken, getConversations);
router.get('/conversations/:conversationId/messages', authenticateToken, getMessages);
router.get('/users', authenticateToken, getUsers);
router.post('/dm', authenticateToken, startDirectMessage);
router.delete('/conversations/:conversationId', authenticateToken, deleteConversation);

export default router;
