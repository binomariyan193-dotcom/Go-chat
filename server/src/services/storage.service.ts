import { supabaseAdmin } from '../config/supabase';
import { randomUUID } from 'crypto';

const BUCKET_NAME = 'chat-images';

export const uploadImageToSupabase = async (
  file: Express.Multer.File
): Promise<string> => {
  const fileExt = file.originalname.split('.').pop() || 'png';
  const fileName = `${Date.now()}_${randomUUID()}.${fileExt}`;
  const filePath = `uploads/${fileName}`;

  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) {
    throw new Error(`Supabase upload failed: ${error.message}`);
  }

  // Retrieve public URL
  const { data: publicUrlData } = supabaseAdmin.storage
    .from(BUCKET_NAME)
    .getPublicUrl(data.path);

  return publicUrlData.publicUrl;
};
