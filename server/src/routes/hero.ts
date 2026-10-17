import { Router, Response } from 'express';
import prisma from '../db';
import { authenticateToken, requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// Middleware: Verify that user is a Campus Hero or Admin
const requireCampusHeroOrAdmin = async (req: AuthRequest, res: Response, next: Function) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  if (req.user.role === 'ADMIN' || req.user.role === 'CAMPUS_HERO') {
    return next();
  }

  // Check if user has an APPROVED Campus Hero Application
  const approvedApp = await prisma.campusHeroApplication.findFirst({
    where: {
      user_id: req.user.id,
      status: 'APPROVED',
    },
  });

  if (approvedApp) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Access restricted. You must be an authorized Campus Hero or Admin to access this dashboard.',
  });
};

// GET /api/hero/dashboard - Fetch full operational data for Campus Hero
router.get('/dashboard', authenticateToken, requireAuth, requireCampusHeroOrAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const userCollegeId = req.user!.college_id;
    const heroUserId = req.user!.id;

    // Fetch hero's college info
    const college = await prisma.college.findUnique({
      where: { id: userCollegeId },
    });

    // Fetch delivery tasks assigned to this hero OR available in their college
    const tasks = await prisma.deliveryTask.findMany({
      where: {
        college_id: userCollegeId,
        OR: [
          { assigned_hero_id: heroUserId },
          { assigned_hero_id: null }, // Unassigned tasks in this college can be claimed
        ],
      },
      include: {
        product: true,
        college: true,
        sell_request: {
          include: {
            user: { select: { id: true, name: true, phone: true, email: true } },
          },
        },
        buy_request: {
          include: {
            user: { select: { id: true, name: true, phone: true, email: true } },
          },
        },
        messages: {
          orderBy: { created_at: 'asc' },
          include: {
            sender: { select: { id: true, name: true, role: true } },
            receiver: { select: { id: true, name: true, role: true } },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    // Compute stats
    const activeTasks = tasks.filter((t) => t.status !== 'COMPLETED' && t.status !== 'CANCELLED');
    const completedTasks = tasks.filter((t) => t.status === 'COMPLETED');
    const pendingPickups = tasks.filter((t) => (t.task_type === 'PICKUP' || t.task_type === 'MATCHED_EXCHANGE') && t.status === 'ASSIGNED');
    const pendingDrops = tasks.filter((t) => (t.task_type === 'DROP' || t.task_type === 'MATCHED_EXCHANGE') && (t.status === 'ASSIGNED' || t.status === 'PICKED_UP'));

    // Count unread messages received by this hero
    const unreadMessagesCount = await prisma.message.count({
      where: {
        receiver_id: heroUserId,
        is_read: false,
      },
    });

    // Format tasks for frontend
    const formattedTasks = tasks.map((t) => {
      let parsedImages: string[] = [];
      let parsedAnswers: Record<string, string> = {};

      if (t.sell_request?.images) {
        try {
          parsedImages = JSON.parse(t.sell_request.images);
        } catch (e) {
          parsedImages = [];
        }
      }

      if (t.sell_request?.quality_answers) {
        try {
          parsedAnswers = JSON.parse(t.sell_request.quality_answers);
        } catch (e) {
          parsedAnswers = {};
        }
      }

      return {
        id: t.id,
        task_type: t.task_type,
        status: t.status,
        quality_verified: t.quality_verified,
        pickup_notes: t.pickup_notes,
        delivery_notes: t.delivery_notes,
        created_at: t.created_at,
        updated_at: t.updated_at,
        product: {
          id: t.product.id,
          name: t.product.name,
          category: t.product.category,
          image_url: t.product.image_url,
          buy_price: t.product.buy_price,
          sell_price: t.product.sell_price,
        },
        seller: t.sell_request ? {
          id: t.sell_request.user.id,
          name: t.sell_request.user.name,
          phone: t.sell_request.user.phone,
          email: t.sell_request.user.email,
          condition: t.sell_request.condition,
          estimated_payout: t.sell_request.admin_buy_price || t.sell_request.estimated_price,
          images: parsedImages,
          quality_answers: parsedAnswers,
          description: t.sell_request.description,
          sell_request_id: t.sell_request.id,
        } : null,
        buyer: t.buy_request ? {
          id: t.buy_request.user.id,
          name: t.buy_request.user.name,
          phone: t.buy_request.user.phone,
          email: t.buy_request.user.email,
          price_to_collect: t.product.sell_price,
          notes: t.buy_request.notes,
          buy_request_id: t.buy_request.id,
        } : null,
        messages: t.messages.map((m) => ({
          id: m.id,
          sender_id: m.sender_id,
          sender_name: m.sender.name,
          sender_display_name: m.sender_display_name,
          receiver_id: m.receiver_id,
          receiver_name: m.receiver.name,
          content: m.content,
          is_read: m.is_read,
          created_at: m.created_at,
          is_hero_sender: m.sender_id === heroUserId,
        })),
      };
    });

    return res.json({
      success: true,
      data: {
        hero: {
          id: req.user!.id,
          name: req.user!.name,
          email: req.user!.email,
          phone: req.user!.phone || '',
          role: req.user!.role,
          college_code: college?.code,
          college_name: college?.name,
        },
        stats: {
          active_tasks_count: activeTasks.length,
          completed_tasks_count: completedTasks.length,
          pending_pickups_count: pendingPickups.length,
          pending_drops_count: pendingDrops.length,
          unread_messages_count: unreadMessagesCount,
        },
        tasks: formattedTasks,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch Campus Hero dashboard data',
      error: error.message,
    });
  }
});

// PUT /api/hero/tasks/:id/status - Update task status and verification
router.put('/tasks/:id/status', authenticateToken, requireAuth, requireCampusHeroOrAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, quality_verified, pickup_notes, delivery_notes } = req.body;

    const validStatuses = ['ASSIGNED', 'PICKED_UP', 'DELIVERED', 'COMPLETED', 'CANCELLED'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const task = await prisma.deliveryTask.findUnique({
      where: { id },
      include: { sell_request: true, buy_request: true },
    });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Delivery task not found' });
    }

    const dataToUpdate: any = {};
    if (status) dataToUpdate.status = status;
    if (quality_verified !== undefined) dataToUpdate.quality_verified = Boolean(quality_verified);
    if (pickup_notes !== undefined) dataToUpdate.pickup_notes = pickup_notes;
    if (delivery_notes !== undefined) dataToUpdate.delivery_notes = delivery_notes;

    // Automatically assign to this hero if unassigned
    if (!task.assigned_hero_id) {
      dataToUpdate.assigned_hero_id = req.user!.id;
    }

    const updatedTask = await prisma.deliveryTask.update({
      where: { id },
      data: dataToUpdate,
    });

    // If marked COMPLETED, update the linked buy request / sell request
    if (status === 'COMPLETED') {
      if (task.buy_request_id) {
        await prisma.buyRequest.update({
          where: { id: task.buy_request_id },
          data: { status: 'COMPLETED' },
        });
      }
      if (task.sell_request_id && !task.buy_request_id) {
        // Just inventory pickup completed
        await prisma.sellRequest.update({
          where: { id: task.sell_request_id },
          data: { status: 'APPROVED' },
        });
      }
    }

    return res.json({
      success: true,
      message: `Task updated to ${status || 'new status'}.`,
      data: updatedTask,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update delivery task',
      error: error.message,
    });
  }
});

// POST /api/hero/tasks/:id/message - Send in-website message as "Operations Team — Campus Hero"
router.post('/tasks/:id/message', authenticateToken, requireAuth, requireCampusHeroOrAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { receiver_id, content } = req.body;

    if (!receiver_id || !content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Receiver ID and non-empty message content are required.',
      });
    }

    const task = await prisma.deliveryTask.findUnique({
      where: { id },
    });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Delivery task not found' });
    }

    const heroDisplayName = 'Operations Team — Campus Hero';

    const message = await prisma.message.create({
      data: {
        sender_id: req.user!.id,
        sender_display_name: heroDisplayName,
        receiver_id,
        task_id: task.id,
        sell_request_id: task.sell_request_id,
        buy_request_id: task.buy_request_id,
        content: content.trim(),
      },
      include: {
        sender: { select: { id: true, name: true } },
        receiver: { select: { id: true, name: true } },
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Message sent successfully as Operations Team — Campus Hero',
      data: message,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message,
    });
  }
});

export default router;
