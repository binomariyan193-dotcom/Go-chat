import multer from 'multer';

const storage = multer.memoryStorage();

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('audio/') || file.mimetype.includes('webm') || file.mimetype.includes('ogg')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and audio files are allowed!'));
    }
  },
});
