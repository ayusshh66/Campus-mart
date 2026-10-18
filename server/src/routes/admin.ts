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
      totalColleges,
      activeColleges,
      totalCustomSubmissions,
      pendingCustomSubmissions,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.sellRequest.count(),
      prisma.sellRequest.count({ where: { status: 'PENDING' } }),
      prisma.buyRequest.count(),
      prisma.buyRequest.count({ where: { status: 'PENDING' } }),
      prisma.product.count({ where: { is_active: true } }),
      prisma.campusHeroApplication.count(),
      prisma.campusHeroApplication.count({ where: { status: 'PENDING' } }),
      prisma.college.count(),
      prisma.college.count({ where: { is_active: true } }),
      prisma.customItemSubmission.count(),
      prisma.customItemSubmission.count({ where: { status: 'PENDING' } }),
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
        totalColleges,
        activeColleges,
        totalCustomSubmissions,
        pendingCustomSubmissions,
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

// ==========================================
// DYNAMIC COLLEGE MANAGEMENT (Admin Only)
// ==========================================

// GET /api/admin/colleges - List all colleges with counts
router.get('/colleges', async (_req: AuthRequest, res: Response) => {
  try {
    const colleges = await prisma.college.findMany({
      include: {
        _count: {
          select: {
            users: true,
            sell_requests: true,
            buy_requests: true,
            campus_hero_applications: true,
            delivery_tasks: true,
          },
        },
      },
      orderBy: { code: 'asc' },
    });

    return res.json({
      success: true,
      data: colleges,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch colleges',
      error: error.message,
    });
  }
});

// POST /api/admin/colleges - Create a new college
router.post('/colleges', async (req: AuthRequest, res: Response) => {
  try {
    const { code, name, is_active } = req.body;

    if (!code || typeof code !== 'string' || !code.trim()) {
      return res.status(400).json({
        success: false,
        message: 'College code is required (e.g. DTU, NSUT).',
      });
    }

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'College full name is required.',
      });
    }

    const normalizedCode = code.trim().toUpperCase();
    if (normalizedCode.length < 2 || normalizedCode.length > 20) {
      return res.status(400).json({
        success: false,
        message: 'College code must be between 2 and 20 characters.',
      });
    }

    if (name.trim().length < 3 || name.trim().length > 120) {
      return res.status(400).json({
        success: false,
        message: 'College name must be between 3 and 120 characters.',
      });
    }

    // Unique code validation (case-insensitive)
    const existing = await prisma.college.findFirst({
      where: { code: normalizedCode },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `A college with code "${normalizedCode}" already exists.`,
      });
    }

    const newCollege = await prisma.college.create({
      data: {
        code: normalizedCode,
        name: name.trim(),
        is_active: is_active !== undefined ? Boolean(is_active) : true,
      },
      include: {
        _count: {
          select: {
            users: true,
            sell_requests: true,
            buy_requests: true,
            campus_hero_applications: true,
            delivery_tasks: true,
          },
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: `College ${newCollege.code} (${newCollege.name}) created successfully!`,
      data: newCollege,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create college',
      error: error.message,
    });
  }
});

// PUT /api/admin/colleges/:id - Update college details & active status
router.put('/colleges/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { code, name, is_active } = req.body;

    const existing = await prisma.college.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'College not found.',
      });
    }

    const data: any = {};

    if (code !== undefined) {
      if (typeof code !== 'string' || !code.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Valid college code is required.',
        });
      }
      const normalizedCode = code.trim().toUpperCase();
      if (normalizedCode.length < 2 || normalizedCode.length > 20) {
        return res.status(400).json({
          success: false,
          message: 'College code must be between 2 and 20 characters.',
        });
      }

      // Check if duplicate code exists on another college
      const duplicate = await prisma.college.findFirst({
        where: {
          code: normalizedCode,
          NOT: { id },
        },
      });

      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: `Another college with code "${normalizedCode}" already exists.`,
        });
      }
      data.code = normalizedCode;
    }

    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Valid college name is required.',
        });
      }
      if (name.trim().length < 3 || name.trim().length > 120) {
        return res.status(400).json({
          success: false,
          message: 'College name must be between 3 and 120 characters.',
        });
      }
      data.name = name.trim();
    }

    if (is_active !== undefined) {
      data.is_active = Boolean(is_active);
    }

    const updated = await prisma.college.update({
      where: { id },
      data,
      include: {
        _count: {
          select: {
            users: true,
            sell_requests: true,
            buy_requests: true,
            campus_hero_applications: true,
            delivery_tasks: true,
          },
        },
      },
    });

    return res.json({
      success: true,
      message: `College "${updated.code}" updated successfully.`,
      data: updated,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update college',
      error: error.message,
    });
  }
});

// PATCH /api/admin/colleges/:id/toggle-status - Quickly toggle active/inactive status
router.patch('/colleges/:id/toggle-status', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const college = await prisma.college.findUnique({
      where: { id },
    });

    if (!college) {
      return res.status(404).json({
        success: false,
        message: 'College not found.',
      });
    }

    const updated = await prisma.college.update({
      where: { id },
      data: {
        is_active: !college.is_active,
      },
      include: {
        _count: {
          select: {
            users: true,
            sell_requests: true,
            buy_requests: true,
            campus_hero_applications: true,
            delivery_tasks: true,
          },
        },
      },
    });

    return res.json({
      success: true,
      message: `College "${updated.code}" is now ${updated.is_active ? 'Active' : 'Deactivated'}.`,
      data: updated,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to toggle college status',
      error: error.message,
    });
  }
});

// ==========================================
// CUSTOM ITEM SUBMISSIONS REVIEW QUEUE
// ==========================================

// GET /api/admin/custom-submissions - List custom submissions
router.get('/custom-submissions', async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.query;

    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }

    const submissions = await prisma.customItemSubmission.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        college: { select: { id: true, code: true, name: true } },
        product: { select: { id: true, name: true, sell_price: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    const formatted = submissions.map((item) => ({
      id: item.id,
      user_id: item.user_id,
      student_name: item.user.name,
      student_email: item.user.email,
      student_phone: item.user.phone,
      college_id: item.college_id,
      college_code: item.college.code,
      college_name: item.college.name,
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
      created_product_id: item.created_product_id,
      created_sell_request_id: item.created_sell_request_id,
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
      message: 'Failed to fetch custom item submissions',
      error: error.message,
    });
  }
});

// PUT /api/admin/custom-submissions/:id - Approve or reject a custom item submission
router.put('/custom-submissions/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { action, admin_buy_price, admin_sell_price, rejection_reason } = req.body;

    if (!['APPROVE', 'REJECT'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Action must be either APPROVE or REJECT.',
      });
    }

    const submission = await prisma.customItemSubmission.findUnique({
      where: { id },
      include: {
        user: true,
        college: true,
      },
    });

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Custom item submission not found.',
      });
    }

    // Prevent duplicate publication or re-processing
    if (submission.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `This submission has already been processed with status "${submission.status}".`,
      });
    }

    if (action === 'REJECT') {
      const updated = await prisma.customItemSubmission.update({
        where: { id },
        data: {
          status: 'REJECTED',
          rejection_reason: rejection_reason?.trim() || 'Item does not meet platform quality or policy standards.',
        },
      });

      return res.json({
        success: true,
        message: `Custom submission for "${submission.name}" has been rejected.`,
        data: updated,
      });
    }

    // Action: APPROVE
    const buyPrice = parseFloat(admin_buy_price);
    const sellPrice = parseFloat(admin_sell_price);

    if (isNaN(buyPrice) || buyPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: 'A valid positive buying price (paid to student) is required.',
      });
    }

    if (isNaN(sellPrice) || sellPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: 'A valid positive selling price (buyer catalog price) is required.',
      });
    }

    let parsedImages: string[] = [];
    try {
      parsedImages = JSON.parse(submission.images || '[]');
    } catch (e) {
      parsedImages = [];
    }
    const primaryImage = parsedImages[0] || 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=800&q=80';

    // Atomic transaction: Create Product, Create SellRequest, Update CustomItemSubmission
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create real Product in the catalog
      const newProduct = await tx.product.create({
        data: {
          name: submission.name,
          category: submission.category,
          description: submission.description,
          image_url: primaryImage,
          images: submission.images,
          buy_price: buyPrice,
          upto_buy_price: buyPrice,
          sell_price: sellPrice,
          is_buying_enabled: false, // Unique custom item, not an open buying program
          is_active: true,
        },
      });

      // 2. Create approved SellRequest linked to the student and their locked campus
      const newSellRequest = await tx.sellRequest.create({
        data: {
          user_id: submission.user_id,
          college_id: submission.college_id, // Locked to student's campus
          product_id: newProduct.id,
          condition: submission.condition,
          description: submission.description,
          images: submission.images,
          estimated_price: submission.expected_price,
          admin_buy_price: buyPrice,
          admin_sell_price: sellPrice,
          status: 'APPROVED', // Makes it dynamically available on student's campus!
        },
      });

      // 3. Mark submission as APPROVED and record references
      const updatedSubmission = await tx.customItemSubmission.update({
        where: { id },
        data: {
          status: 'APPROVED',
          admin_buy_price: buyPrice,
          admin_sell_price: sellPrice,
          created_product_id: newProduct.id,
          created_sell_request_id: newSellRequest.id,
        },
      });

      return {
        product: newProduct,
        sellRequest: newSellRequest,
        submission: updatedSubmission,
      };
    });

    return res.json({
      success: true,
      message: `Custom submission approved! "${submission.name}" is now live and available on ${submission.college.code} campus.`,
      data: result,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to process custom item submission',
      error: error.message,
    });
  }
});

// ==========================================
// USER MANAGEMENT ENDPOINTS
// ==========================================

// GET /api/admin/users - List and filter registered users
router.get('/users', async (req: AuthRequest, res: Response) => {
  try {
    const { search, role, college_id } = req.query;

    const where: any = {};

    if (role && typeof role === 'string' && role !== 'ALL') {
      where.role = role;
    }

    if (college_id && typeof college_id === 'string' && college_id !== 'ALL') {
      where.college_id = college_id;
    }

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q } },
        { email: { contains: q } },
        { phone: { contains: q } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        college_id: true,
        created_at: true,
        updated_at: true,
        college: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        _count: {
          select: {
            sell_requests: true,
            buy_requests: true,
            hero_tasks: true,
            created_teams: true,
            team_applications: true,
            custom_item_submissions: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return res.json({
      success: true,
      data: users,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message,
    });
  }
});

// PUT /api/admin/users/:id/role - Update a user's role with validation
router.put('/users/:id/role', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const validRoles = ['USER', 'CAMPUS_HERO', 'ADMIN'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Role must be one of: ${validRoles.join(', ')}`,
      });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Protection: Prevent demoting the last active administrator
    if (targetUser.role === 'ADMIN' && role !== 'ADMIN') {
      const adminCount = await prisma.user.count({
        where: { role: 'ADMIN' },
      });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot demote the sole remaining administrator.',
        });
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        college_id: true,
        college: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });

    // If promoted to CAMPUS_HERO, mark any pending application as APPROVED
    if (role === 'CAMPUS_HERO') {
      await prisma.campusHeroApplication.updateMany({
        where: { user_id: id, status: 'PENDING' },
        data: { status: 'APPROVED' },
      });
    }

    return res.json({
      success: true,
      message: `User ${updated.name}'s role updated to ${role}.`,
      data: updated,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update user role',
      error: error.message,
    });
  }
});

// ==========================================
// COMPREHENSIVE PLATFORM ANALYTICS ENDPOINT
// ==========================================

// GET /api/admin/analytics - Real data aggregation for charts, GMV, and KPI insights
router.get('/analytics', async (_req: AuthRequest, res: Response) => {
  try {
    const [
      // Users
      totalUsers,
      studentUsers,
      heroUsers,
      adminUsers,
      // Sell Requests
      totalSellRequests,
      pendingSellRequests,
      approvedSellRequests,
      rejectedSellRequests,
      sellRequestsWithPrices,
      // Buy Requests
      totalBuyRequests,
      pendingBuyRequests,
      approvedBuyRequests,
      completedBuyRequests,
      rejectedBuyRequests,
      buyRequestsWithPrices,
      // Delivery Tasks
      totalDeliveryTasks,
      availableTasks,
      claimedTasks,
      pickedUpTasks,
      deliveredTasks,
      // Custom Submissions
      totalCustomSubmissions,
      pendingCustomSubmissions,
      approvedCustomSubmissions,
      rejectedCustomSubmissions,
      // Hackathon Teams
      totalTeamPosts,
      openTeamPosts,
      closedTeamPosts,
      totalTeamApplications,
      // Campus Hero Apps
      totalHeroApps,
      pendingHeroApps,
      approvedHeroApps,
      // Products & Colleges
      totalProducts,
      activeProducts,
      totalColleges,
      activeColleges,
      // College breakdowns
      collegesData,
      // Products for category breakdown
      productsData,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.user.count({ where: { role: 'CAMPUS_HERO' } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),

      prisma.sellRequest.count(),
      prisma.sellRequest.count({ where: { status: 'PENDING' } }),
      prisma.sellRequest.count({ where: { status: 'APPROVED' } }),
      prisma.sellRequest.count({ where: { status: 'REJECTED' } }),
      prisma.sellRequest.findMany({
        where: { status: { in: ['APPROVED', 'PENDING'] } },
        select: { status: true, admin_buy_price: true, estimated_price: true },
      }),

      prisma.buyRequest.count(),
      prisma.buyRequest.count({ where: { status: 'PENDING' } }),
      prisma.buyRequest.count({ where: { status: 'APPROVED' } }),
      prisma.buyRequest.count({ where: { status: 'COMPLETED' } }),
      prisma.buyRequest.count({ where: { status: 'REJECTED' } }),
      prisma.buyRequest.findMany({
        where: { status: { in: ['APPROVED', 'COMPLETED'] } },
        select: { status: true, product: { select: { sell_price: true } } },
      }),

      prisma.deliveryTask.count(),
      prisma.deliveryTask.count({ where: { status: 'AVAILABLE' } }),
      prisma.deliveryTask.count({ where: { status: 'CLAIMED' } }),
      prisma.deliveryTask.count({ where: { status: 'PICKED_UP' } }),
      prisma.deliveryTask.count({ where: { status: 'DELIVERED' } }),

      prisma.customItemSubmission.count(),
      prisma.customItemSubmission.count({ where: { status: 'PENDING' } }),
      prisma.customItemSubmission.count({ where: { status: 'APPROVED' } }),
      prisma.customItemSubmission.count({ where: { status: 'REJECTED' } }),

      prisma.teamPost.count(),
      prisma.teamPost.count({ where: { status: 'OPEN' } }),
      prisma.teamPost.count({ where: { status: { in: ['FULL', 'CLOSED'] } } }),
      prisma.teamApplication.count(),

      prisma.campusHeroApplication.count(),
      prisma.campusHeroApplication.count({ where: { status: 'PENDING' } }),
      prisma.campusHeroApplication.count({ where: { status: 'APPROVED' } }),

      prisma.product.count(),
      prisma.product.count({ where: { is_active: true } }),
      prisma.college.count(),
      prisma.college.count({ where: { is_active: true } }),

      // College breakdowns with full counts
      prisma.college.findMany({
        select: {
          id: true,
          code: true,
          name: true,
          is_active: true,
          _count: {
            select: {
              users: true,
              sell_requests: true,
              buy_requests: true,
              delivery_tasks: true,
              campus_hero_applications: true,
              team_posts: true,
            },
          },
        },
        orderBy: { code: 'asc' },
      }),

      // Products data for category rollup
      prisma.product.findMany({
        select: {
          id: true,
          category: true,
          buy_price: true,
          sell_price: true,
          is_active: true,
          _count: {
            select: {
              sell_requests: true,
              buy_requests: true,
            },
          },
        },
      }),
    ]);

    // Financial Computations
    const approvedSellValue = sellRequestsWithPrices
      .filter((r) => r.status === 'APPROVED')
      .reduce((sum, r) => sum + (r.admin_buy_price || r.estimated_price || 0), 0);

    const pendingSellValue = sellRequestsWithPrices
      .filter((r) => r.status === 'PENDING')
      .reduce((sum, r) => sum + (r.estimated_price || r.admin_buy_price || 0), 0);

    const completedBuyValue = buyRequestsWithPrices
      .filter((r) => r.status === 'COMPLETED')
      .reduce((sum, r) => sum + (r.product?.sell_price || 0), 0);

    const activeBuyPipelineValue = buyRequestsWithPrices
      .reduce((sum, r) => sum + (r.product?.sell_price || 0), 0);

    // Category Rollups
    const categoryMap: Record<string, { category: string; productCount: number; activeProductCount: number; sellCount: number; buyCount: number }> = {};
    productsData.forEach((p) => {
      const cat = p.category || 'General';
      if (!categoryMap[cat]) {
        categoryMap[cat] = {
          category: cat,
          productCount: 0,
          activeProductCount: 0,
          sellCount: 0,
          buyCount: 0,
        };
      }
      categoryMap[cat].productCount += 1;
      if (p.is_active) categoryMap[cat].activeProductCount += 1;
      categoryMap[cat].sellCount += p._count.sell_requests;
      categoryMap[cat].buyCount += p._count.buy_requests;
    });
    const categoryBreakdown = Object.values(categoryMap).sort((a, b) => b.productCount - a.productCount);

    // College Rollups
    const collegeBreakdown = collegesData.map((c) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      is_active: c.is_active,
      users: c._count.users,
      sellRequests: c._count.sell_requests,
      buyRequests: c._count.buy_requests,
      deliveryTasks: c._count.delivery_tasks,
      heroApplications: c._count.campus_hero_applications,
      teamPosts: c._count.team_posts,
    }));

    return res.json({
      success: true,
      data: {
        summary: {
          totalUsers,
          studentUsers,
          heroUsers,
          adminUsers,
          totalColleges,
          activeColleges,
          totalProducts,
          activeProducts,
          totalSellRequests,
          pendingSellRequests,
          approvedSellRequests,
          rejectedSellRequests,
          totalBuyRequests,
          pendingBuyRequests,
          approvedBuyRequests,
          completedBuyRequests,
          rejectedBuyRequests,
          totalDeliveryTasks,
          availableTasks,
          claimedTasks,
          pickedUpTasks,
          deliveredTasks,
          totalCustomSubmissions,
          pendingCustomSubmissions,
          approvedCustomSubmissions,
          rejectedCustomSubmissions,
          totalTeamPosts,
          openTeamPosts,
          closedTeamPosts,
          totalTeamApplications,
          totalHeroApps,
          pendingHeroApps,
          approvedHeroApps,
        },
        financials: {
          approvedSellValue: Math.round(approvedSellValue),
          pendingSellValue: Math.round(pendingSellValue),
          completedBuyValue: Math.round(completedBuyValue),
          activeBuyPipelineValue: Math.round(activeBuyPipelineValue),
          totalEstimatedVolume: Math.round(approvedSellValue + completedBuyValue),
        },
        categoryBreakdown,
        collegeBreakdown,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to compute analytics',
      error: error.message,
    });
  }
});

export default router;

