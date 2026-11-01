
import { Router, Response } from 'express';
import prisma from '../db';
import { authenticateToken, requireAuth, AuthRequest } from '../middleware/auth';
import { processAutoMatchForBuyRequest } from '../services/autoMatch';

const router = Router();

// POST /api/buy-requests - Submit a request to buy a product
router.post('/', authenticateToken, requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({
        success: false,
        message: 'A valid request body is required.',
      });
    }

    const { product_id, notes, college_id } = req.body;

    // Validate product ID
    if (typeof product_id !== 'string' || !product_id.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A valid product ID is required.',
      });
    }

    // Validate optional notes before calling .trim()
    if (notes != null && typeof notes !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Notes must be text.',
      });
    }

    const trimmedNotes = typeof notes === 'string' ? notes.trim() : '';

    if (trimmedNotes.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Notes cannot exceed 1000 characters.',
      });
    }

    // Validate optional campus selection
    if (college_id != null && typeof college_id !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'College ID must be a string.',
      });
    }

    const product = await prisma.product.findUnique({
      where: { id: product_id.trim() },
    });

    if (!product || !product.is_active) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or currently inactive.',
      });
    }

    // Keep cross-campus browsing supported
    let targetCollegeId = req.user!.college_id;

    const requestedCollegeId =
      typeof college_id === 'string' ? college_id.trim() : '';

    if (requestedCollegeId) {
      const selectedCollege = await prisma.college.findFirst({
        where: {
          id: requestedCollegeId,
          is_active: true,
        },
        select: { id: true },
      });

      if (!selectedCollege) {
        return res.status(400).json({
          success: false,
          message: 'Selected college is invalid or inactive.',
        });
      }

      targetCollegeId = selectedCollege.id;
    }

    // User's registered home college remains unchanged
    const buyRequest = await prisma.buyRequest.create({
      data: {
        user_id: req.user!.id,
        college_id: targetCollegeId,
        product_id: product.id,
        status: 'PENDING',
        notes: trimmedNotes || null,
      },
      include: {
        product: true,
        college: true,
      },
    });

    // Run auto-match
    const autoMatchResult = await processAutoMatchForBuyRequest(buyRequest.id);

    const wasMatched = Boolean(autoMatchResult?.auto_matched);
    const finalStatus = wasMatched ? 'APPROVED' : 'PENDING';

    const responseMsg = wasMatched
      ? 'Great news! An available item was auto-matched at the selected campus. A Campus Hero has been assigned for delivery.'
      : 'Your purchase request has been submitted. The team will contact you with the next steps.';

    return res.status(201).json({
      success: true,
      message: responseMsg,
      data: {
        id: buyRequest.id,
        product_name: buyRequest.product.name,
        price: buyRequest.product.sell_price,
        college_name: buyRequest.college.name,
        status: finalStatus,
        auto_matched: wasMatched,
        created_at: buyRequest.created_at,
      },
    });
  } catch (error) {
    console.error('Failed to submit buy request:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to submit buy request.',
    });
  }
});

// GET /api/buy-requests/my - Get the logged-in user's buy requests
router.get('/my', authenticateToken, requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const requests = await prisma.buyRequest.findMany({
      where: { user_id: req.user!.id },
      include: {
        product: true,
        college: true,
      },
      orderBy: { created_at: 'desc' },
    });

    const formatted = requests.map((item) => ({
      id: item.id,
      product_id: item.product_id,
      product_name: item.product.name,
      product_image: item.product.image_url,
      selling_price: item.product.sell_price,
      college_code: item.college.code,
      college_name: item.college.name,
      status: item.status,
      notes: item.notes,
      created_at: item.created_at,
      updated_at: item.updated_at,
    }));

    return res.json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    console.error('Failed to fetch buy requests:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch your buy requests.',
    });
  }
});

export default router;
