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

    if (!task_id || !content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Task ID and message content are required.',
      });
    }

    const task = await prisma.deliveryTask.findUnique({
      where: { id: task_id },
      include: {
        assigned_hero: true,
      },
    });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task conversation not found' });
    }

    // Determine receiver: the assigned campus hero
    let receiverId = task.assigned_hero_id;
    if (!receiverId) {
      // Find campus hero for this college
      const heroApp = await prisma.campusHeroApplication.findFirst({
        where: { college_id: task.college_id, status: 'APPROVED' },
      });
      receiverId = heroApp?.user_id || null;
    }

    if (!receiverId) {
      // Fallback: send to admin
      const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
      receiverId = admin?.id || task.college_id;
    }

    const message = await prisma.message.create({
      data: {
        sender_id: req.user!.id,
        sender_display_name: req.user!.name,
        receiver_id: receiverId,
        task_id: task.id,
        sell_request_id: task.sell_request_id,
        buy_request_id: task.buy_request_id,
        content: content.trim(),
      },
      include: {
        sender: { select: { id: true, name: true } },
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Reply sent to Operations Team — Campus Hero',
      data: message,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to send reply',
      error: error.message,
    });
  }
});

export default router;
