import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { config } from './config';
import authRoutes from './routes/auth';
import collegeRoutes from './routes/colleges';
import productRoutes from './routes/products';
import sellRequestRoutes from './routes/sellRequests';
import buyRequestRoutes from './routes/buyRequests';
import campusHeroRoutes from './routes/campusHeroes';
import adminRoutes from './routes/admin';
import heroRoutes from './routes/hero';
import messageRoutes from './routes/messages';
import teamRoutes from './routes/teams';
import { handleSingleUpload, handleMultipleUpload } from './middleware/upload';
import { authenticateToken, requireAuth } from './middleware/auth';
import { storageService } from './services/storage';

const app = express();

// Middleware
app.use(cors({
  origin: '*', // Allow frontend dev server and network testing
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static uploads serving (local development storage)
if (!fs.existsSync(config.uploadDir)) {
  fs.mkdirSync(config.uploadDir, { recursive: true });
}
app.use('/uploads', express.static(config.uploadDir));

// Single image upload endpoint (JPEG, PNG, WebP only, max 5MB)
app.post('/api/upload', authenticateToken, requireAuth, handleSingleUpload, async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No image file uploaded.' });
  }
  const storageResult = await storageService.handleUploadedFile(req.file);
  return res.json({
    success: true,
    message: 'Image uploaded successfully',
    data: {
      url: storageResult.url,
      filename: storageResult.filename,
      provider: storageResult.provider,
    },
  });
});

// Multiple image upload endpoint (1 to 5 images per request)
app.post('/api/upload/multiple', authenticateToken, requireAuth, handleMultipleUpload, async (req: Request, res: Response) => {
  const files = (req.files as Express.Multer.File[]) || [];
  if (files.length === 0) {
    return res.status(400).json({ success: false, message: 'No image files uploaded.' });
  }

  const results = await Promise.all(
    files.map((file) => storageService.handleUploadedFile(file))
  );

  return res.json({
    success: true,
    message: `${results.length} image${results.length !== 1 ? 's' : ''} uploaded successfully`,
    data: results.map((r) => ({
      url: r.url,
      filename: r.filename,
      provider: r.provider,
    })),
  });
});

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'CampusMart API',
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/colleges', collegeRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sell-requests', sellRequestRoutes);
app.use('/api/buy-requests', buyRequestRoutes);
app.use('/api/campus-heroes', campusHeroRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/hero', heroRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/teams', teamRoutes);

// Error Handling Middleware
app.use((err: any, _req: Request, res: Response, _next: any) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

export { app };

if (process.env.NODE_ENV !== 'test') {
  app.listen(config.port, () => {
    console.log(`🚀 CampusMart Server running on http://localhost:${config.port}`);
  });
}

export default app;

