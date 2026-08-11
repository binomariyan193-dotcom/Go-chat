import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import {
  handleSearchUsers,
  handleSendRequest,
  handleGetPendingRequests,
  handleRespondRequest,
} from '../controllers/friend.controller';

const router = Router();

router.get('/search', authenticateToken, handleSearchUsers);
router.post('/request', authenticateToken, handleSendRequest);
router.get('/requests', authenticateToken, handleGetPendingRequests);
router.post('/respond', authenticateToken, handleRespondRequest);

export default router;
