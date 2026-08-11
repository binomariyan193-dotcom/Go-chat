import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { uploadMiddleware } from '../middleware/upload.middleware';
import { handleImageUpload } from '../controllers/media.controller';

const router = Router();

router.post('/upload', authenticateToken, uploadMiddleware.single('image'), handleImageUpload);

export default router;
