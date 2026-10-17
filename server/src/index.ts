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
import { upload } from './middleware/upload';
import { authenticateToken, requireAuth } from './middleware/auth';

const app = express();

// Middleware
app.use(cors({
  origin: '*', // Allow frontend dev server and network testing
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static uploads serving
if (!fs.existsSync(config.uploadDir)) {
  fs.mkdirSync(config.uploadDir, { recursive: true });
}
app.use('/uploads', express.static(config.uploadDir));

// Image upload endpoint
app.post('/api/upload', authenticateToken, requireAuth, upload.single('image'), (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No image file uploaded.' });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  return res.json({
    success: true,
    message: 'Image uploaded successfully',
    data: {
      url: fileUrl,
      filename: req.file.filename,
    },
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

// Error Handling Middleware
app.use((err: any, _req: Request, res: Response, _next: any) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

app.listen(config.port, () => {
  console.log(`🚀 CampusMart Server running on http://localhost:${config.port}`);
});
