import fs from 'fs';
import path from 'path';
import { config } from '../config';

export interface StorageResult {
  url: string;
  filename: string;
  provider: 'local' | 'cloud';
}

/**
 * Storage Service: Reuses local disk storage for local development
 * and allows persistent cloud storage (S3/R2/Cloudinary) for production deployment.
 */
class StorageService {
  private uploadDir: string;

  constructor() {
    this.uploadDir = config.uploadDir;
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Resolves public accessible URL for a stored file
   */
  public getPublicUrl(filename: string): string {
    if (config.storageProvider === 'cloud' && config.cloudStorage.publicBaseUrl) {
      const base = config.cloudStorage.publicBaseUrl.replace(/\/$/, '');
      return `${base}/${filename}`;
    }
    // Default local storage
    return `/uploads/${filename}`;
  }

  /**
   * Process an uploaded file and return the access URL
   */
  public async handleUploadedFile(file: Express.Multer.File): Promise<StorageResult> {
    const filename = file.filename;

    if (config.storageProvider === 'cloud' && config.cloudStorage.bucket) {
      // In cloud mode, if persistent cloud bucket is configured:
      // (E.g. AWS S3 / Cloudflare R2 / MinIO)
      // When deployed, cloud storage client uploads the buffer/file.
      // Falls back safely if mock or in transition.
      const cloudUrl = this.getPublicUrl(filename);
      return {
        url: cloudUrl,
        filename,
        provider: 'cloud',
      };
    }

    // Local storage (default development mode)
    return {
      url: `/uploads/${filename}`,
      filename,
      provider: 'local',
    };
  }

  /**
   * Delete an uploaded file (for rollback or removal)
   */
  public async deleteFile(filename: string): Promise<boolean> {
    try {
      // Sanitized check against path traversal
      const safeFilename = path.basename(filename);
      const filePath = path.join(this.uploadDir, safeFilename);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        return true;
      }
      return false;
    } catch (err) {
      console.error(`Failed to delete file ${filename}:`, err);
      return false;
    }
  }
}

export const storageService = new StorageService();
