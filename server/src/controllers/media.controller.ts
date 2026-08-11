import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { uploadImageToSupabase } from '../services/storage.service';

export const handleImageUpload = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const publicUrl = await uploadImageToSupabase(req.file);
    return res.status(200).json({ imageUrl: publicUrl });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
