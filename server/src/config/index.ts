import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  jwtSecret: process.env.JWT_SECRET || 'campusmart_jwt_secure_key_2026_xYz9',
  uploadDir: process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads'),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  maxUploadSizeBytes: parseInt(process.env.MAX_UPLOAD_SIZE_BYTES || '5242880', 10), // 5MB default
  maxImagesPerItem: parseInt(process.env.MAX_IMAGES_PER_ITEM || '5', 10), // Max 5 images
  storageProvider: (process.env.STORAGE_PROVIDER || 'local') as 'local' | 'cloud',
  cloudStorage: {
    provider: process.env.CLOUD_STORAGE_PROVIDER || 's3', // 's3', 'r2', 'cloudinary', 'custom'
    endpoint: process.env.CLOUD_STORAGE_ENDPOINT || '',
    bucket: process.env.CLOUD_STORAGE_BUCKET || '',
    region: process.env.CLOUD_STORAGE_REGION || 'us-east-1',
    accessKeyId: process.env.CLOUD_STORAGE_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.CLOUD_STORAGE_SECRET_ACCESS_KEY || '',
    publicBaseUrl: process.env.CLOUD_STORAGE_PUBLIC_BASE_URL || '',
  },
};
