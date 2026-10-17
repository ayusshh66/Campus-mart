import { Router, Response } from 'express';
import prisma from '../db';
import { authenticateToken, requireAuth, AuthRequest } from '../middleware/auth';
import { processAutoMatchForBuyRequest } from '../services/autoMatch';

const router = Router();

// POST /api/buy-requests - Submit a request to buy a product
router.post('/', authenticateToken, requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { product_id, notes } = req.body;

    if (!product_id) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required.',
      });
    }

    const product = await prisma.product.findUnique({
      where: { id: product_id },
    });

    if (!product || !product.is_active) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or currently inactive.',
      });
    }

    // STRICT SECURITY RULE: college_id is locked to authenticated user's registered college
    const buyRequest = await prisma.buyRequest.create({
      data: {
        user_id: req.user!.id,
        college_id: req.user!.college_id, // Inherit user's locked college
        product_id: product.id,
        status: 'PENDING',
        notes: notes?.trim() || null,
      },
      include: {
        product: true,
        college: true,
      },
    });

    // Run auto-match engine
    const autoMatchResult = await processAutoMatchForBuyRequest(buyRequest.id);

    const finalStatus = autoMatchResult?.auto_matched ? 'APPROVED' : 'PENDING';
    const responseMsg = autoMatchResult?.auto_matched
      ? 'Great news! An available item was auto-matched on your campus! A Campus Hero has been assigned for delivery.'
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
        auto_matched: Boolean(autoMatchResult?.auto_matched),
        created_at: buyRequest.created_at,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to submit buy request',
      error: error.message,
    });
  }
});

// GET /api/buy-requests/my - Get current user's buy requests
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
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch your buy requests',
      error: error.message,
    });
  }
});

export default router;
