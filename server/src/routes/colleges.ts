import { Router, Request, Response } from 'express';
import prisma from '../db';

const router = Router();

// GET /api/colleges - List all active colleges
router.get('/', async (_req: Request, res: Response) => {
  try {
    const colleges = await prisma.college.findMany({
      where: { is_active: true },
      orderBy: { code: 'asc' },
    });
    res.json({ success: true, data: colleges });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch colleges', error: error.message });
  }
});

export default router;
