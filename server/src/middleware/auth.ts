import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import prisma from '../db';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  college_id: string;
  college_name?: string;
  college_code?: string;
  role: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : null;

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as { id: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { college: true },
    });

    if (user) {
      req.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        college_id: user.college_id,
        college_name: user.college.name,
        college_code: user.college.code,
        role: user.role,
      };
    }
  } catch (err) {
    // Token expired or invalid, leave req.user undefined
  }

  next();
};

export const requireAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please log in to continue.',
    });
  }
  next();
};

export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please log in as an administrator.',
    });
  }

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Administrator privileges required.',
    });
  }

  next();
};
