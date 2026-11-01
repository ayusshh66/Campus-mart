import { Router, Response } from 'express';
import prisma from '../db';
import { authenticateToken, requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/messages/my - Get current student's messages and conversations
router.get('/my', authenticateToken, requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { sender_id: userId },
          { receiver_id: userId },
        ],
      },
      include: {
        sender: { select: { id: true, name: true, role: true } },
        receiver: { select: { id: true, name: true, role: true } },
        task: {
          include: {
            product: { select: { id: true, name: true, image_url: true } },
            college: { select: { id: true, code: true } },
          },
        },
      },
      orderBy: { created_at: 'asc' },
    });

    return res.json({
      success: true,
      data: messages.map((m) => ({
        id: m.id,
        task_id: m.task_id,
        sender_id: m.sender_id,
        sender_name: m.sender.name,
        // The display name requested by the user: "Operations Team — Campus Hero"
        sender_display_name: m.sender_id === userId ? m.sender.name : m.sender_display_name,
        receiver_id: m.receiver_id,
        receiver_name: m.receiver.name,
        content: m.content,
        is_read: m.is_read,
        is_from_me: m.sender_id === userId,
        product_name: m.task?.product?.name,
        created_at: m.created_at,
      })),
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch messages',
      error: error.message,
    });
  }
});

// POST /api/messages/reply - Student replies back to the Operations Team

router.post('/reply', authenticateToken, requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { task_id, content } = req.body;

    // 1. Validate inputs
    if (
      typeof task_id !== 'string' ||
      !task_id.trim() ||
      typeof content !== 'string' ||
      !content.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: 'Valid task ID and message content are required.',
      });
    }

    if (content.trim().length > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Message cannot exceed 2000 characters.',
      });
    }

    // 2. Fetch task with related buyer and seller
    const task = await prisma.deliveryTask.findUnique({
      where: { id: task_id },
      include: {
        sell_request: {
          select: { user_id: true },
        },
        buy_request: {
          select: { user_id: true },
        },
      },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task conversation not found.',
      });
    }

    // 3. SECURITY: Verify student belongs to the task
    const userId = req.user!.id;

    const isSeller = task.sell_request?.user_id === userId;
    const isBuyer = task.buy_request?.user_id === userId;

    if (!isSeller && !isBuyer) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to message on this task.',
      });
    }

    // 4. Find the assigned Campus Hero
    let receiverId: string | null = task.assigned_hero_id;

    if (!receiverId) {
      const heroApp = await prisma.campusHeroApplication.findFirst({
        where: {
          college_id: task.college_id,
          status: 'APPROVED',
        },
      });

      receiverId = heroApp?.user_id ?? null;
    }

    // 5. Fallback to admin if no Campus Hero exists
    if (!receiverId) {
      const admin = await prisma.user.findFirst({
        where: { role: 'ADMIN' },
        select: { id: true },
      });

      receiverId = admin?.id ?? null;
    }

    // Never use a college ID as a message receiver
    if (!receiverId) {
      return res.status(503).json({
        success: false,
        message: 'No operations representative is available.',
      });
    }

    // 6. Create the message
    const message = await prisma.message.create({
      data: {
        sender_id: userId,
        sender_display_name: req.user!.name,
        receiver_id: receiverId,
        task_id: task.id,
        sell_request_id: task.sell_request_id,
        buy_request_id: task.buy_request_id,
        content: content.trim(),
      },
      include: {
        sender: {
          select: { id: true, name: true },
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Reply sent to Operations Team — Campus Hero',
      data: message,
    });
  } catch (error: any) {
    console.error('Message reply error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to send reply.',
    });
  }
});


export default router;
