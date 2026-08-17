import { Router } from 'express';
import {
  handleRegister,
  handleLogin,
  handleUpdateProfile,
  handleUpdatePublicKey,
  handleForgotPassword,
  handleResetPassword,
} from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', handleRegister);
router.post('/login', handleLogin);
router.put('/profile', authenticateToken, handleUpdateProfile);
router.put('/public-key', authenticateToken, handleUpdatePublicKey);
router.post('/forgot-password', handleForgotPassword);
router.post('/reset-password', handleResetPassword);

export default router;
