import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  jwtSecret: process.env.JWT_SECRET || 'campusmart_jwt_secure_key_2026_xYz9',
  uploadDir: process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads'),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
};
