import { Router, Response } from 'express';
import prisma from '../db';
import { authenticateToken, requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/campus-heroes/apply - Submit Campus Hero application
router.post('/apply', authenticateToken, requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { branch, year, phone, instagram, linkedin, reason } = req.body;

    if (!branch || !year || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Branch, academic year, and reason for joining are required.',
      });
    }

    // Check if user already has an active application
    const existingApplication = await prisma.campusHeroApplication.findFirst({
      where: { user_id: req.user!.id },
      orderBy: { created_at: 'desc' },
    });

    if (existingApplication && existingApplication.status === 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending Campus Hero application under review.',
      });
    }

    // Inherit college strictly from user
    const application = await prisma.campusHeroApplication.create({
      data: {
        user_id: req.user!.id,
        college_id: req.user!.college_id, // Locked to user's registered college
        branch: branch.trim(),
        year: year.trim(),
        phone: phone ? phone.trim() : (req.user as any).phone || '',
        instagram: instagram ? instagram.trim() : null,
        linkedin: linkedin ? linkedin.trim() : null,
        reason: reason.trim(),
        status: 'PENDING',
      },
      include: {
        college: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Your Campus Hero application has been submitted! Our team will reach out to you shortly.',
      data: {
        id: application.id,
        college_name: application.college.name,
        branch: application.branch,
        year: application.year,
        status: application.status,
        created_at: application.created_at,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to submit application',
      error: error.message,
    });
  }
});

// GET /api/campus-heroes/my - Get current user's application
router.get('/my', authenticateToken, requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const application = await prisma.campusHeroApplication.findFirst({
      where: { user_id: req.user!.id },
      include: {
        college: true,
      },
      orderBy: { created_at: 'desc' },
    });

    return res.json({
      success: true,
      data: application
        ? {
            id: application.id,
            branch: application.branch,
            year: application.year,
            phone: application.phone,
            instagram: application.instagram,
            linkedin: application.linkedin,
            reason: application.reason,
            status: application.status,
            college_code: application.college.code,
            college_name: application.college.name,
            created_at: application.created_at,
          }
        : null,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch application status',
      error: error.message,
    });
  }
});

export default router;
