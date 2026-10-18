import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../db';
import { config } from '../config';
import { authenticateToken, requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, phone, password, college_id } = req.body;

    if (!name || !email || !phone || !password || !college_id) {
      return res.status(400).json({
        success: false,
        message: 'All fields (Name, Email, Phone, Password, and College) are required.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if college exists and is active
    const college = await prisma.college.findUnique({
      where: { id: college_id },
    });

    if (!college || !college.is_active) {
      return res.status(400).json({
        success: false,
        message: 'The selected college is not currently active for registration.',
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists. Please log in.',
      });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Create user with locked college
    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        phone: phone.trim(),
        password_hash,
        college_id: college.id,
        role: 'USER',
      },
      include: {
        college: true,
      },
    });

    // Generate JWT token
    const token = jwt.sign(
      {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        college_id: newUser.college_id,
      },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Account created successfully! Welcome to CampusMart.',
      data: {
        token,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone,
          role: newUser.role,
          college: {
            id: newUser.college.id,
            code: newUser.college.code,
            name: newUser.college.name,
          },
        },
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Registration failed due to a server error.',
      error: error.message,
    });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        college: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        college_id: user.college_id,
      },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          college: {
            id: user.college.id,
            code: user.college.code,
            name: user.college.name,
          },
        },
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Login failed due to a server error.',
      error: error.message,
    });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        college: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.',
      });
    }

    let currentRole = user.role;
    if (currentRole === 'USER') {
      const approvedApp = await prisma.campusHeroApplication.findFirst({
        where: { user_id: user.id, status: 'APPROVED' },
      });
      if (approvedApp) {
        currentRole = 'CAMPUS_HERO';
        await prisma.user.update({
          where: { id: user.id },
          data: { role: 'CAMPUS_HERO' },
        });
      }
    } else if (currentRole === 'CAMPUS_HERO') {
      const rejectedApp = await prisma.campusHeroApplication.findFirst({
        where: { user_id: user.id, status: 'REJECTED' },
      });
      if (rejectedApp) {
        currentRole = 'USER';
        await prisma.user.update({
          where: { id: user.id },
          data: { role: 'USER' },
        });
      }
    }

    return res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: currentRole,
        college: {
          id: user.college.id,
          code: user.college.code,
          name: user.college.name,
        },
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile.',
      error: error.message,
    });
  }
});

export default router;
