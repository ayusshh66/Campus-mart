import { Router, Response } from 'express';
import prisma from '../db';
import { authenticateToken, requireAuth, AuthRequest } from '../middleware/auth';
import { processAutoMatchForSellRequest } from '../services/autoMatch';

const router = Router();

// POST /api/sell-requests - Submit a request to sell an approved catalog item
router.post('/', authenticateToken, requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { product_id, condition, description, images, quality_answers, estimated_price } = req.body;

    if (!product_id || !condition) {
      return res.status(400).json({
        success: false,
        message: 'Product and condition are required.',
      });
    }

    const validConditions = ['Like New', 'Good', 'Used'];
    if (!validConditions.includes(condition)) {
      return res.status(400).json({
        success: false,
        message: `Condition must be one of: ${validConditions.join(', ')}`,
      });
    }

    // Check if the product exists and is active
    const product = await prisma.product.findUnique({
      where: { id: product_id },
    });

    if (!product || !product.is_active) {
      return res.status(404).json({
        success: false,
        message: 'The selected product does not exist or is inactive.',
      });
    }

    // Verify that the platform is currently buying this product
    if (!product.is_buying_enabled) {
      return res.status(400).json({
        success: false,
        message: 'CampusMart is currently not accepting sell requests for this product.',
      });
    }

    // Format images
    let imagesJson = '[]';
    if (images) {
      if (typeof images === 'string') {
        imagesJson = images.startsWith('[') ? images : JSON.stringify([images]);
      } else if (Array.isArray(images)) {
        imagesJson = JSON.stringify(images);
      }
    }

    let qualityAnswersJson = '{}';
    if (quality_answers) {
      if (typeof quality_answers === 'string') {
        qualityAnswersJson = quality_answers;
      } else {
        qualityAnswersJson = JSON.stringify(quality_answers);
      }
    }

    const finalEstimatedPrice = estimated_price !== undefined
      ? parseFloat(estimated_price)
      : product.buy_price;

    // STRICT SECURITY RULE: college_id is locked to the authenticated user's registered college!
    const sellRequest = await prisma.sellRequest.create({
      data: {
        user_id: req.user!.id,
        college_id: req.user!.college_id, // NEVER trust req.body.college_id
        product_id: product.id,
        condition,
        description: description?.trim() || null,
        images: imagesJson,
        quality_answers: qualityAnswersJson,
        estimated_price: finalEstimatedPrice,
        admin_buy_price: finalEstimatedPrice, // snapshot estimated price
        status: 'PENDING',
      },
      include: {
        product: true,
        college: true,
      },
    });

    // Run auto-match & auto-accept engine based on admin conditions
    const autoMatchResult = await processAutoMatchForSellRequest(sellRequest.id);

    const finalStatus = autoMatchResult?.auto_approved ? 'APPROVED' : 'PENDING';
    const responseMsg = autoMatchResult?.matched
      ? 'Congratulations! Your sell request was automatically approved and matched with a student buyer on campus! A Campus Hero has been assigned.'
      : autoMatchResult?.auto_approved
      ? 'Great news! Your sell request was automatically approved for campus inventory. A Campus Hero has been assigned for pickup.'
      : 'Your sell request has been submitted successfully! An admin will review it soon.';

    return res.status(201).json({
      success: true,
      message: responseMsg,
      data: {
        id: sellRequest.id,
        product_name: sellRequest.product.name,
        condition: sellRequest.condition,
        college_name: sellRequest.college.name,
        estimated_payout: finalEstimatedPrice,
        status: finalStatus,
        auto_matched: Boolean(autoMatchResult?.auto_approved),
        created_at: sellRequest.created_at,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to submit sell request',
      error: error.message,
    });
  }
});

// GET /api/sell-requests/my - Get current user's submitted sell requests
router.get('/my', authenticateToken, requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const requests = await prisma.sellRequest.findMany({
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
      condition: item.condition,
      description: item.description,
      images: JSON.parse(item.images || '[]'),
      quality_answers: JSON.parse(item.quality_answers || '{}'),
      estimated_price: item.estimated_price || item.admin_buy_price || item.product.buy_price,
      admin_buy_price: item.admin_buy_price || item.product.buy_price,
      college_code: item.college.code,
      college_name: item.college.name,
      status: item.status,
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
      message: 'Failed to fetch your sell requests',
      error: error.message,
    });
  }
});

// POST /api/sell-requests/custom - Submit any custom item not in the catalog
router.post('/custom', authenticateToken, requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { name, category, condition, description, expected_price, images } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Item name is required.',
      });
    }

    if (!category || typeof category !== 'string' || !category.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Category is required.',
      });
    }

    const validConditions = ['Like New', 'Good', 'Used'];
    if (!condition || !validConditions.includes(condition)) {
      return res.status(400).json({
        success: false,
        message: `Condition must be one of: ${validConditions.join(', ')}`,
      });
    }

    if (!description || typeof description !== 'string' || description.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a clear description (at least 5 characters).',
      });
    }

    const parsedPrice = parseFloat(expected_price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Expected price must be a valid positive amount.',
      });
    }

    // Format images safely as JSON
    let imagesJson = '[]';
    if (images) {
      if (typeof images === 'string') {
        imagesJson = images.startsWith('[') ? images : JSON.stringify([images]);
      } else if (Array.isArray(images)) {
        imagesJson = JSON.stringify(images);
      }
    }

    // SECURITY: College is strictly locked to authenticated user's registered college
    const collegeId = req.user!.college_id;

    const submission = await prisma.customItemSubmission.create({
      data: {
        user_id: req.user!.id,
        college_id: collegeId,
        name: name.trim(),
        category: category.trim(),
        condition,
        description: description.trim(),
        expected_price: parsedPrice,
        images: imagesJson,
        status: 'PENDING',
      },
      include: {
        college: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Your custom item has been submitted for review! Once approved by admin, it will be listed as available on your campus.',
      data: {
        id: submission.id,
        name: submission.name,
        category: submission.category,
        condition: submission.condition,
        expected_price: submission.expected_price,
        college_id: submission.college_id,
        college_code: submission.college.code,
        college_name: submission.college.name,
        college: submission.college,
        images: JSON.parse(submission.images || '[]'),
        status: submission.status,
        created_at: submission.created_at,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to submit custom item',
      error: error.message,
    });
  }
});

// GET /api/sell-requests/custom/my - List student's own custom submissions
router.get('/custom/my', authenticateToken, requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const submissions = await prisma.customItemSubmission.findMany({
      where: { user_id: req.user!.id },
      include: {
        college: true,
        product: true,
      },
      orderBy: { created_at: 'desc' },
    });

    const formatted = submissions.map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      condition: item.condition,
      description: item.description,
      expected_price: item.expected_price,
      images: JSON.parse(item.images || '[]'),
      status: item.status,
      rejection_reason: item.rejection_reason,
      admin_buy_price: item.admin_buy_price,
      admin_sell_price: item.admin_sell_price,
      college_code: item.college.code,
      college_name: item.college.name,
      created_product_id: item.created_product_id,
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
      message: 'Failed to fetch your custom item submissions',
      error: error.message,
    });
  }
});

export default router;
