import { Router, Response } from 'express';
import prisma from '../db';
import { authenticateToken, requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// Middleware: Verify that user is an authorized Campus Hero or Admin
export const requireCampusHeroOrAdmin = async (req: AuthRequest, res: Response, next: Function) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  // Admins are always authorized
  if (req.user.role === 'ADMIN') {
    return next();
  }

  // If user role is CAMPUS_HERO, ensure they have not been rejected
  if (req.user.role === 'CAMPUS_HERO') {
    const rejectedApp = await prisma.campusHeroApplication.findFirst({
      where: {
        user_id: req.user.id,
        status: 'REJECTED',
      },
    });

    if (rejectedApp) {
      // Downgrade stale role in database
      await prisma.user.update({
        where: { id: req.user.id },
        data: { role: 'USER' },
      });
      req.user.role = 'USER';
      return res.status(403).json({
        success: false,
        message: 'Access restricted. Your Campus Hero application has been rejected.',
      });
    }

    return next();
  }

  // For users with role 'USER', check if they have an APPROVED application
  const heroApp = await prisma.campusHeroApplication.findFirst({
    where: {
      user_id: req.user.id,
    },
    orderBy: { created_at: 'desc' },
  });

  if (heroApp && heroApp.status === 'APPROVED') {
    // Synchronize user role in database
    await prisma.user.update({
      where: { id: req.user.id },
      data: { role: 'CAMPUS_HERO' },
    });
    req.user.role = 'CAMPUS_HERO';
    return next();
  }

  if (heroApp && heroApp.status === 'PENDING') {
    return res.status(403).json({
      success: false,
      message: 'Your Campus Hero application is currently pending review by administrators.',
    });
  }

  if (heroApp && heroApp.status === 'REJECTED') {
    return res.status(403).json({
      success: false,
      message: 'Access restricted. Your Campus Hero application has been rejected.',
    });
  }

  return res.status(403).json({
    success: false,
    message: 'Access restricted. You must be an approved Campus Hero or Admin to access this dashboard.',
  });
};

// GET /api/hero/dashboard - Fetch full operational data for Campus Hero
router.get('/dashboard', authenticateToken, requireAuth, requireCampusHeroOrAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const userCollegeId = req.user!.college_id;
    const heroUserId = req.user!.id;
    const isAdmin = req.user!.role === 'ADMIN';

    // Fetch hero's college info
    const college = await prisma.college.findUnique({
      where: { id: userCollegeId },
    });

    // Where clause: Campus Heroes see ONLY tasks in their own college (claimed by them OR unassigned)
    const whereClause: any = {};
    if (!isAdmin) {
      whereClause.college_id = userCollegeId;
      whereClause.OR = [
        { assigned_hero_id: heroUserId },
        { assigned_hero_id: null }, // Available unassigned tasks in their college
      ];
    } else {
      // Admins can view college-filtered tasks or default to their college
      const targetCollegeId = req.query.college_id as string;
      if (targetCollegeId) {
        whereClause.college_id = targetCollegeId;
      } else if (!req.query.all) {
        whereClause.college_id = userCollegeId;
      }
    }

    const tasks = await prisma.deliveryTask.findMany({
      where: whereClause,
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

    // Compute live operational metrics
    const isMyTask = (t: any) => t.assigned_hero_id === heroUserId;
    const isUnassigned = (t: any) => !t.assigned_hero_id;

    const availableTasks = tasks.filter((t) => isUnassigned(t) && t.status !== 'COMPLETED' && t.status !== 'CANCELLED');
    const myActiveTasks = tasks.filter((t) => isMyTask(t) && t.status !== 'COMPLETED' && t.status !== 'CANCELLED');
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

    // Format tasks for frontend with strict privacy controls
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

      const isClaimedByMe = t.assigned_hero_id === heroUserId;
      const isUnclaimed = !t.assigned_hero_id;
      // Private student details (phone, email) are authorized ONLY when claimed by this hero or accessed by Admin
      const canViewPrivateDetails = isAdmin || isClaimedByMe;

      return {
        id: t.id,
        task_type: t.task_type,
        status: t.status,
        assigned_hero_id: t.assigned_hero_id,
        is_assigned_to_me: isClaimedByMe,
        is_unassigned: isUnclaimed,
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
          phone: canViewPrivateDetails ? t.sell_request.user.phone : 'Claim task to unlock phone',
          email: canViewPrivateDetails ? t.sell_request.user.email : 'Claim task to unlock email',
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
          phone: canViewPrivateDetails ? t.buy_request.user.phone : 'Claim task to unlock phone',
          email: canViewPrivateDetails ? t.buy_request.user.email : 'Claim task to unlock email',
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
          available_tasks_count: availableTasks.length,
          my_active_tasks_count: myActiveTasks.length,
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

// POST /api/hero/tasks/:id/claim - Claim an available delivery task in hero's college
router.post('/tasks/:id/claim', authenticateToken, requireAuth, requireCampusHeroOrAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const task = await prisma.deliveryTask.findUnique({
      where: { id },
      include: { college: true },
    });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Delivery task not found' });
    }

    // Verify college scope for non-admins
    if (req.user!.role !== 'ADMIN' && task.college_id !== req.user!.college_id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized. You can only claim tasks for your own college campus.',
      });
    }

    // Verify task is not already claimed by someone else
    if (task.assigned_hero_id && task.assigned_hero_id !== req.user!.id) {
      return res.status(400).json({
        success: false,
        message: 'This task has already been claimed by another Campus Hero.',
      });
    }

    if (task.status === 'COMPLETED' || task.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        message: `Cannot claim a task that is already ${task.status.toLowerCase()}.`,
      });
    }

    const updatedTask = await prisma.deliveryTask.update({
      where: { id: task.id },
      data: {
        assigned_hero_id: req.user!.id,
        status: task.status === 'ASSIGNED' ? 'ASSIGNED' : task.status,
      },
    });

    return res.json({
      success: true,
      message: 'Task claimed successfully! Student contact details and messaging are now unlocked.',
      data: updatedTask,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to claim delivery task',
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

    // College & authorization check
    if (req.user!.role !== 'ADMIN') {
      if (task.college_id !== req.user!.college_id) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized. You can only update tasks for your own college campus.',
        });
      }

      if (task.assigned_hero_id && task.assigned_hero_id !== req.user!.id) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized. This task is assigned to another Campus Hero.',
        });
      }
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

    // College & authorization check
    if (req.user!.role !== 'ADMIN') {
      if (task.college_id !== req.user!.college_id) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized. You can only coordinate tasks for your own college campus.',
        });
      }

      if (task.assigned_hero_id && task.assigned_hero_id !== req.user!.id) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized. This task is assigned to another Campus Hero.',
        });
      }
    }

    // If task was unassigned, assign to this hero upon sending message
    if (!task.assigned_hero_id) {
      await prisma.deliveryTask.update({
        where: { id: task.id },
        data: { assigned_hero_id: req.user!.id },
      });
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
