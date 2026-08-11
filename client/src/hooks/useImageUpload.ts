import { useState } from 'react';
import { api } from '../services/api';
import { compressToWebPLossless } from '../utils/imageCompressor';

export const useImageUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadImage = async (file: File): Promise<string | null> => {
    setIsUploading(true);
    setError(null);

    try {
      // Apply WebP Lossless compression
      const compressedFile = await compressToWebPLossless(file);

      const formData = new FormData();
      formData.append('image', compressedFile);

      const response = await api.post('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setIsUploading(false);
      return response.data.imageUrl;
    } catch (err: any) {
      setIsUploading(false);
      setError(err.response?.data?.error || 'Failed to upload image');
      return null;
    }
  };

  return { uploadImage, isUploading, error };
};
