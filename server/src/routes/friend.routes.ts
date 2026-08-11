import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import {
  handleSearchUsers,
  handleSendRequest,
  handleGetPendingRequests,
  handleRespondRequest,
  handleGetFriends,
  handleUnfriend,
} from '../controllers/friend.controller';

const router = Router();

router.get('/search', authenticateToken, handleSearchUsers);
router.post('/request', authenticateToken, handleSendRequest);
router.get('/requests', authenticateToken, handleGetPendingRequests);
router.post('/respond', authenticateToken, handleRespondRequest);
router.get('/list', authenticateToken, handleGetFriends);
router.post('/unfriend', authenticateToken, handleUnfriend);

export default router;
