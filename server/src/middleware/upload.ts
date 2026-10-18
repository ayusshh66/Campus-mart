import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { config } from '../config';
import { AuthRequest } from './auth';

// Ensure upload directory exists
if (!fs.existsSync(config.uploadDir)) {
  fs.mkdirSync(config.uploadDir, { recursive: true });
}

// Allowed MIME types and extensions: Strictly JPEG, PNG, and WebP only
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

// Disk storage with secure, collision-proof filename generation
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, config.uploadDir);
  },
  filename: (req: Request, file, cb) => {
    try {
      const ext = path.extname(file.originalname).toLowerCase();
      // Ensure only valid extension is used
      const safeExt = ALLOWED_EXTENSIONS.has(ext) ? ext : '.jpg';
      
      // Prefix with authenticated user id (if available) to prevent unauthorized association
      const authReq = req as AuthRequest;
      const userPrefix = authReq.user?.id ? `u_${authReq.user.id.slice(0, 8)}_` : '';
      const uniqueRandom = crypto.randomBytes(12).toString('hex');
      const timestamp = Date.now();

      // Safe, path-traversal proof filename
      const safeFilename = `${userPrefix}${timestamp}_${uniqueRandom}${safeExt}`;
      cb(null, safeFilename);
    } catch (err: any) {
      cb(err, '');
    }
  },
});

// File filter: Strictly JPEG, PNG, and WebP
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype.toLowerCase();

  const isExtValid = ALLOWED_EXTENSIONS.has(ext);
  const isMimeValid = ALLOWED_MIME_TYPES.has(mime);

  if (isExtValid && isMimeValid) {
    return cb(null, true);
  }

  return cb(
    new Error(
      'Invalid file format. Only JPEG, PNG, and WebP images are allowed (max 5MB each).'
    )
  );
};

// Base Multer configuration
export const upload = multer({
  storage,
  limits: {
    fileSize: config.maxUploadSizeBytes, // 5MB limit
    files: config.maxImagesPerItem, // 5 files max
  },
  fileFilter,
});

/**
 * Middleware wrapper for single image upload with clean error handling
 */
export const handleSingleUpload = (req: Request, res: Response, next: NextFunction) => {
  const uploadSingle = upload.single('image');

  uploadSingle(req, res, (err: any) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: `File size exceeds the 5MB limit. Please upload an image smaller than 5MB.`,
          });
        }
        return res.status(400).json({
          success: false,
          message: `Upload error: ${err.message}`,
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message || 'Failed to process uploaded image.',
      });
    }
    next();
  });
};

/**
 * Middleware wrapper for multiple images upload (1 to 5 images) with clean error handling
 */
export const handleMultipleUpload = (req: Request, res: Response, next: NextFunction) => {
  const uploadMultiple = upload.array('images', config.maxImagesPerItem);

  uploadMultiple(req, res, (err: any) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: `One or more files exceed the 5MB limit. Each image must be under 5MB.`,
          });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE' || err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({
            success: false,
            message: `Too many images. A maximum of 5 images per item is supported.`,
          });
        }
        return res.status(400).json({
          success: false,
          message: `Upload error: ${err.message}`,
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message || 'Failed to process uploaded images.',
      });
    }
    next();
  });
};
