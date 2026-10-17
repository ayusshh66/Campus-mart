import { Router, Response } from 'express';
import prisma from '../db';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';
import { runFullAutoMatchCycle } from '../services/autoMatch';

const router = Router();

// Protect ALL routes in this file with authenticateToken and requireAdmin
router.use(authenticateToken, requireAdmin);

// GET /api/admin/stats - High-level metrics for dashboard cards
router.get('/stats', async (_req: AuthRequest, res: Response) => {
  try {
    const [
      totalStudents,
      totalSellRequests,
      pendingSellRequests,
      totalBuyRequests,
      pendingBuyRequests,
      activeProducts,
      totalHeroApplications,
      pendingHeroApplications,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.sellRequest.count(),
      prisma.sellRequest.count({ where: { status: 'PENDING' } }),
      prisma.buyRequest.count(),
      prisma.buyRequest.count({ where: { status: 'PENDING' } }),
      prisma.product.count({ where: { is_active: true } }),
      prisma.campusHeroApplication.count(),
      prisma.campusHeroApplication.count({ where: { status: 'PENDING' } }),
    ]);

    return res.json({
      success: true,
      data: {
        totalStudents,
        totalSellRequests,
        pendingSellRequests,
        totalBuyRequests,
        pendingBuyRequests,
        activeProducts,
        totalHeroApplications,
        pendingHeroApplications,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard stats',
      error: error.message,
    });
  }
});

// GET /api/admin/sell-requests - List all sell requests
router.get('/sell-requests', async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.query;

    const where: any = {};
    if (status && typeof status === 'string' && status !== 'ALL') {
      where.status = status;
    }

    const requests = await prisma.sellRequest.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        college: { select: { id: true, code: true, name: true } },
        product: { select: { id: true, name: true, image_url: true, buy_price: true, sell_price: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    const formatted = requests.map((item) => ({
      id: item.id,
      user_id: item.user_id,
      student_name: item.user.name,
      student_email: item.user.email,
      student_phone: item.user.phone,
      college_id: item.college_id,
      college_code: item.college.code,
      college_name: item.college.name,
      product_id: item.product_id,
      product_name: item.product.name,
      product_image: item.product.image_url,
      condition: item.condition,
      description: item.description,
      images: JSON.parse(item.images || '[]'),
      quality_answers: JSON.parse(item.quality_answers || '{}'),
      estimated_price: item.estimated_price ?? item.admin_buy_price ?? item.product.buy_price,
      admin_buy_price: item.admin_buy_price ?? item.product.buy_price,
      admin_sell_price: item.admin_sell_price ?? item.product.sell_price,
      status: item.status,
      created_at: item.created_at,
      updated_at: item.updated_at,
    }));

    return res.json({ success: true, data: formatted });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch sell requests',
      error: error.message,
    });
  }
});

// PUT /api/admin/sell-requests/:id - Review, approve, or reject sell request
router.put('/sell-requests/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, admin_buy_price, admin_sell_price } = req.body;

    const validStatuses = ['PENDING', 'APPROVED', 'REJECTED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const existing = await prisma.sellRequest.findUnique({
      where: { id },
      include: { product: true },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Sell request not found.' });
    }

    const updated = await prisma.sellRequest.update({
      where: { id },
      data: {
        status,
        admin_buy_price: admin_buy_price !== undefined ? parseFloat(admin_buy_price) : existing.admin_buy_price || existing.product.buy_price,
        admin_sell_price: admin_sell_price !== undefined ? parseFloat(admin_sell_price) : existing.admin_sell_price || existing.product.sell_price,
      },
      include: {
        product: true,
        college: true,
        user: true,
      },
    });

    return res.json({
      success: true,
      message: `Sell request has been marked as ${status}.`,
      data: updated,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update sell request',
      error: error.message,
    });
  }
});

// GET /api/admin/buy-requests - List all buy requests
router.get('/buy-requests', async (_req: AuthRequest, res: Response) => {
  try {
    const requests = await prisma.buyRequest.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        college: { select: { id: true, code: true, name: true } },
        product: { select: { id: true, name: true, image_url: true, sell_price: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    const formatted = requests.map((item) => ({
      id: item.id,
      buyer_name: item.user.name,
      buyer_email: item.user.email,
      buyer_phone: item.user.phone,
      college_code: item.college.code,
      college_name: item.college.name,
      product_name: item.product.name,
      product_image: item.product.image_url,
      selling_price: item.product.sell_price,
      status: item.status,
      notes: item.notes,
      created_at: item.created_at,
    }));

    return res.json({ success: true, data: formatted });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch buy requests',
      error: error.message,
    });
  }
});

// PUT /api/admin/buy-requests/:id - Update status of buy request
router.put('/buy-requests/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const validStatuses = ['PENDING', 'APPROVED', 'COMPLETED', 'REJECTED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const updated = await prisma.buyRequest.update({
      where: { id },
      data: {
        status,
        notes: notes !== undefined ? notes : undefined,
      },
    });

    return res.json({
      success: true,
      message: `Buy request marked as ${status}.`,
      data: updated,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update buy request',
      error: error.message,
    });
  }
});

// GET /api/admin/products - List all products for management table
router.get('/products', async (_req: AuthRequest, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        _count: {
          select: {
            sell_requests: true,
            buy_requests: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return res.json({ success: true, data: products });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message,
    });
  }
});

// POST /api/admin/products - Create a new product in the catalog
router.post('/products', async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      description,
      image_url,
      images,
      category,
      buy_price,
      upto_buy_price,
      sell_price,
      is_buying_enabled,
      is_active,
      quality_questions,
    } = req.body;

    if (!name || !description || buy_price === undefined || sell_price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Name, description, buying price, and selling price are required.',
      });
    }

    let imagesJson = '[]';
    if (images) {
      if (typeof images === 'string') {
        imagesJson = images.startsWith('[') ? images : JSON.stringify([images]);
      } else if (Array.isArray(images)) {
        imagesJson = JSON.stringify(images);
      }
    } else if (image_url) {
      imagesJson = JSON.stringify([image_url]);
    }

    let questionsJson = '[]';
    if (quality_questions) {
      if (typeof quality_questions === 'string') {
        questionsJson = quality_questions;
      } else if (Array.isArray(quality_questions)) {
        questionsJson = JSON.stringify(quality_questions);
      }
    }

    const newProduct = await prisma.product.create({
      data: {
        name: name.trim(),
        description: description.trim(),
        image_url: image_url?.trim() || (images && images[0]) || 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=800&q=80',
        images: imagesJson,
        category: category?.trim() || 'General',
        buy_price: parseFloat(buy_price),
        upto_buy_price: upto_buy_price !== undefined ? parseFloat(upto_buy_price) : parseFloat(buy_price) * 1.2,
        sell_price: parseFloat(sell_price),
        is_buying_enabled: is_buying_enabled !== undefined ? Boolean(is_buying_enabled) : true,
        is_active: is_active !== undefined ? Boolean(is_active) : true,
        quality_questions: questionsJson,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Product created successfully!',
      data: newProduct,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create product',
      error: error.message,
    });
  }
});

// PUT /api/admin/products/:id - Update product details or toggle buying/active status
router.put('/products/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      image_url,
      images,
      category,
      buy_price,
      upto_buy_price,
      sell_price,
      is_buying_enabled,
      is_active,
      quality_questions,
    } = req.body;

    const data: any = {};
    if (name !== undefined) data.name = name.trim();
    if (description !== undefined) data.description = description.trim();
    if (image_url !== undefined) data.image_url = image_url.trim();
    if (images !== undefined) {
      data.images = Array.isArray(images) ? JSON.stringify(images) : images;
    }
    if (category !== undefined) data.category = category.trim();
    if (buy_price !== undefined) data.buy_price = parseFloat(buy_price);
    if (upto_buy_price !== undefined) data.upto_buy_price = parseFloat(upto_buy_price);
    if (sell_price !== undefined) data.sell_price = parseFloat(sell_price);
    if (is_buying_enabled !== undefined) data.is_buying_enabled = Boolean(is_buying_enabled);
    if (is_active !== undefined) data.is_active = Boolean(is_active);
    if (quality_questions !== undefined) {
      data.quality_questions = Array.isArray(quality_questions) ? JSON.stringify(quality_questions) : quality_questions;
    }

    const updated = await prisma.product.update({
      where: { id },
      data,
    });

    return res.json({
      success: true,
      message: 'Product updated successfully.',
      data: updated,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update product',
      error: error.message,
    });
  }
});

// DELETE /api/admin/products/:id - Deactivate product
router.delete('/products/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const deactivated = await prisma.product.update({
      where: { id },
      data: { is_active: false },
    });

    return res.json({
      success: true,
      message: 'Product deactivated successfully.',
      data: deactivated,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to deactivate product',
      error: error.message,
    });
  }
});

// GET /api/admin/campus-heroes - List all Campus Hero applications
router.get('/campus-heroes', async (_req: AuthRequest, res: Response) => {
  try {
    const applications = await prisma.campusHeroApplication.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        college: { select: { id: true, code: true, name: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    const formatted = applications.map((item) => ({
      id: item.id,
      user_id: item.user_id,
      applicant_name: item.user.name,
      applicant_email: item.user.email,
      phone: item.phone,
      college_code: item.college.code,
      college_name: item.college.name,
      branch: item.branch,
      year: item.year,
      instagram: item.instagram,
      linkedin: item.linkedin,
      reason: item.reason,
      status: item.status,
      created_at: item.created_at,
    }));

    return res.json({ success: true, data: formatted });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch campus hero applications',
      error: error.message,
    });
  }
});

// PUT /api/admin/campus-heroes/:id - Review and approve/reject Campus Hero application
router.put('/campus-heroes/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['PENDING', 'APPROVED', 'REJECTED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const updated = await prisma.campusHeroApplication.update({
      where: { id },
      data: { status },
      include: {
        user: true,
        college: true,
      },
    });

    // If approved, also upgrade user.role to CAMPUS_HERO
    if (status === 'APPROVED') {
      await prisma.user.update({
        where: { id: updated.user_id },
        data: { role: 'CAMPUS_HERO' },
      });
    }

    return res.json({
      success: true,
      message: `Campus Hero application has been marked as ${status}.`,
      data: updated,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update campus hero application',
      error: error.message,
    });
  }
});

// GET /api/admin/auto-match/rules - List auto-match rules for all products
router.get('/auto-match/rules', async (_req: AuthRequest, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      where: { is_active: true },
      select: {
        id: true,
        name: true,
        category: true,
        image_url: true,
        buy_price: true,
        upto_buy_price: true,
        sell_price: true,
        auto_match_enabled: true,
        max_campus_inventory: true,
        auto_accept_conditions: true,
        require_photos_for_auto: true,
        min_payout_for_auto: true,
      },
      orderBy: { created_at: 'asc' },
    });

    const formatted = products.map((p) => {
      let conditions = ['Like New', 'Good'];
      try {
        conditions = JSON.parse(p.auto_accept_conditions || '["Like New", "Good"]');
      } catch (e) {
        conditions = ['Like New', 'Good'];
      }
      return {
        ...p,
        auto_accept_conditions: conditions,
      };
    });

    return res.json({ success: true, data: formatted });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch auto-match rules',
      error: error.message,
    });
  }
});

// PUT /api/admin/auto-match/rules/:productId - Update auto-match rule for a product
router.put('/auto-match/rules/:productId', async (req: AuthRequest, res: Response) => {
  try {
    const { productId } = req.params;
    const {
      auto_match_enabled,
      max_campus_inventory,
      auto_accept_conditions,
      require_photos_for_auto,
      min_payout_for_auto,
    } = req.body;

    const dataToUpdate: any = {};
    if (auto_match_enabled !== undefined) dataToUpdate.auto_match_enabled = Boolean(auto_match_enabled);
    if (max_campus_inventory !== undefined) dataToUpdate.max_campus_inventory = parseInt(max_campus_inventory);
    if (auto_accept_conditions !== undefined) {
      dataToUpdate.auto_accept_conditions = Array.isArray(auto_accept_conditions)
        ? JSON.stringify(auto_accept_conditions)
        : auto_accept_conditions;
    }
    if (require_photos_for_auto !== undefined) dataToUpdate.require_photos_for_auto = Boolean(require_photos_for_auto);
    if (min_payout_for_auto !== undefined) dataToUpdate.min_payout_for_auto = parseFloat(min_payout_for_auto);

    const updated = await prisma.product.update({
      where: { id: productId },
      data: dataToUpdate,
    });

    return res.json({
      success: true,
      message: 'Auto-matching rules updated successfully.',
      data: updated,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update auto-matching rules',
      error: error.message,
    });
  }
});

// POST /api/admin/auto-match/run - Manually trigger auto-match & auto-accept scan
router.post('/auto-match/run', async (_req: AuthRequest, res: Response) => {
  try {
    const result = await runFullAutoMatchCycle();
    return res.json({
      success: true,
      message: `Auto-match cycle complete. Processed ${result.processed_count} matches.`,
      data: result,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to run auto-match cycle',
      error: error.message,
    });
  }
});

// GET /api/admin/delivery-tasks - List all delivery tasks across all campuses
router.get('/delivery-tasks', async (_req: AuthRequest, res: Response) => {
  try {
    const tasks = await prisma.deliveryTask.findMany({
      include: {
        product: true,
        college: true,
        assigned_hero: { select: { id: true, name: true, phone: true, email: true } },
        sell_request: {
          include: {
            user: { select: { id: true, name: true, phone: true } },
          },
        },
        buy_request: {
          include: {
            user: { select: { id: true, name: true, phone: true } },
          },
        },
        messages: {
          take: 5,
          orderBy: { created_at: 'desc' },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return res.json({
      success: true,
      data: tasks,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch delivery tasks',
      error: error.message,
    });
  }
});

export default router;
