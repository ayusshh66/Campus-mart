import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../db';
import { authenticateToken, requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticateToken, requireAuth);

// GET /api/account/me - Return private settings data for the signed-in user.
router.get('/me', async (req: AuthRequest, res: Response) => {
  try {
    const account = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        role: true,
        created_at: true,
        college: { select: { code: true, name: true } },
      },
    });
    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found.' });
    }
    return res.json({ success: true, data: account });
  } catch (error) {
    console.error('Account lookup failed:', error);
    return res.status(500).json({ success: false, message: 'Could not load your account.' });
  }
});

// PATCH /api/account/profile - Never accept a client-supplied user ID or role.
router.patch('/profile', async (req: AuthRequest, res: Response) => {
  const { name, phone, address } = req.body ?? {};
  if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 70) {
    return res.status(400).json({ success: false, message: 'Name must be 2–70 characters.' });
  }
  if (typeof phone !== 'string' || !/^\+?[\d\s()\-]{7,20}$/.test(phone.trim())) {
    return res.status(400).json({ success: false, message: 'Enter a valid phone number.' });
  }
  if (typeof address !== 'string' || address.trim().length > 300) {
    return res.status(400).json({ success: false, message: 'Address must be 300 characters or fewer.' });
  }
  try {
    const updated = await prisma.user.update({
      where: { id: req.user!.id },
      data: { name: name.trim(), phone: phone.trim(), address: address.trim() || null },
      select: { id: true, name: true, email: true, phone: true, address: true },
    });
    return res.json({ success: true, data: updated, message: 'Profile updated.' });
  } catch (error) {
    console.error('Account update failed:', error);
    return res.status(500).json({ success: false, message: 'Could not save your profile.' });
  }
});

// POST /api/account/change-password - Current password is always required.
router.post('/change-password', async (req: AuthRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body ?? {};
  if (
    typeof currentPassword !== 'string' ||
    typeof newPassword !== 'string' ||
    newPassword.length < 10 || newPassword.length > 128
  ) {
    return res.status(400).json({ success: false, message: 'New password must be 10–128 characters.' });
  }
  try {
    const account = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, password_hash: true },
    });
    if (!account || !(await bcrypt.compare(currentPassword, account.password_hash))) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }
    if (await bcrypt.compare(newPassword, account.password_hash)) {
      return res.status(400).json({ success: false, message: 'Choose a different password.' });
    }
    const password_hash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: account.id }, data: { password_hash } });
    return res.json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    console.error('Password change failed:', error);
    return res.status(500).json({ success: false, message: 'Could not update your password.' });
  }
});

export default router;
