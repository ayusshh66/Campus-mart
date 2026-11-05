import { Router, Response } from 'express';
import prisma from '../db';
import { authenticateToken, requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

type Scope = 'OPEN_TO_ALL' | 'SAME_COLLEGE_ONLY';

type PostInput = {
  hackathon_name: string;
  headline: string;
  description: string;
  skills: string[];
  preferred_roles: string[];
  eligibility_rules: Scope;
};

function parseList(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.length > 15 || !value.every((entry) => typeof entry === 'string')) return null;
  const cleaned = value.map((v: string) => v.trim()).filter(Boolean);
  if (cleaned.some((value: string) => value.length > 50)) return null;
  return Array.from(new Set(cleaned));
}

function validatePost(body: unknown): { valid: true; data: PostInput } | { valid: false; message: string } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { valid: false, message: 'Valid post data is required.' };
  const b = body as Record<string, unknown>;
  const hackathon_name = typeof b.hackathon_name === 'string' ? b.hackathon_name.trim() : '';
  const headline = typeof b.headline === 'string' ? b.headline.trim() : '';
  const description = typeof b.description === 'string' ? b.description.trim() : '';
  const skills = parseList(b.skills);
  const preferred_roles = parseList(b.preferred_roles);
  const eligibility_rules = b.eligibility_rules === 'SAME_COLLEGE_ONLY' ? 'SAME_COLLEGE_ONLY' : b.eligibility_rules === 'OPEN_TO_ALL' ? 'OPEN_TO_ALL' : null;

  if (hackathon_name.length < 3 || hackathon_name.length > 120) return { valid: false, message: 'Hackathon name must be 3–120 characters.' };
  if (headline.length < 5 || headline.length > 100) return { valid: false, message: 'Headline must be 5–100 characters.' };
  if (description.length < 20 || description.length > 1200) return { valid: false, message: 'Introduction must be 20–1200 characters.' };
  if (!skills || skills.length === 0) return { valid: false, message: 'Select at least one skill (maximum 15).' };
  if (!preferred_roles || preferred_roles.length === 0) return { valid: false, message: 'Select at least one preferred role (maximum 15).' };
  if (!eligibility_rules) return { valid: false, message: 'Choose an eligibility scope.' };
  return { valid: true, data: { hackathon_name, headline, description, skills, preferred_roles, eligibility_rules } };
}

const includePublic = {
  user: {
    select: {
      id: true,
      name: true,
      college: { select: { id: true, code: true, name: true } },
      hackathon_profile: {
        select: { experience_level: true, github_url: true, portfolio_url: true },
      },
    },
  },
} as const;

function formatPost<T extends { skills: string; preferred_roles: string }>(post: T) {
  let skills: string[] = [];
  let preferred_roles: string[] = [];
  try { const parsed = JSON.parse(post.skills); if (Array.isArray(parsed)) skills = parsed; } catch { /* Legacy data */ }
  try { const parsed = JSON.parse(post.preferred_roles); if (Array.isArray(parsed)) preferred_roles = parsed; } catch { /* Legacy data */ }
  return { ...post, skills, preferred_roles };
}

// Browse publicly visible individual posts (without leaking email/phone).
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 100) : '';
    const college = typeof req.query.college === 'string' ? req.query.college.trim() : '';
    const page = Math.max(1, Math.min(100, Number(req.query.page) || 1));
    const where: any = {
      status: 'OPEN',
      // Same-college posts should only be visible to students from that campus.
      OR: [
        { eligibility_rules: 'OPEN_TO_ALL' },
        ...(req.user ? [{ eligibility_rules: 'SAME_COLLEGE_ONLY', college_id: req.user.college_id }] : []),
      ],
    };
    if (college) where.college_id = college;
    if (search) {
      where.AND = [{ OR: [
        { headline: { contains: search } },
        { hackathon_name: { contains: search } },
        { description: { contains: search } },
        { skills: { contains: search } },
        { preferred_roles: { contains: search } },
      ] }];
    }
    const [posts, total] = await Promise.all([
      prisma.soloPost.findMany({ where, include: includePublic, orderBy: { created_at: 'desc' }, skip: (page - 1) * 20, take: 20 }),
      prisma.soloPost.count({ where }),
    ]);
    return res.json({ success: true, count: total, page, data: posts.map(formatPost) });
  } catch (error) {
    console.error('Failed to load solo posts:', error);
    return res.status(500).json({ success: false, message: 'Failed to load available students.' });
  }
});

// Static /mine MUST be before /:id
router.get('/mine', authenticateToken, requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const posts = await prisma.soloPost.findMany({ where: { user_id: req.user!.id }, include: includePublic, orderBy: { created_at: 'desc' } });
    return res.json({ success: true, data: posts.map(formatPost) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to load your posts.' });
  }
});

router.post('/', authenticateToken, requireAuth, async (req: AuthRequest, res: Response) => {
  const validated = validatePost(req.body);
  if (!validated.valid) return res.status(400).json({ success: false, message: validated.message });
  const d = validated.data;
  try {
    const created = await prisma.soloPost.create({
      data: {
        user_id: req.user!.id,
        college_id: req.user!.college_id, // NEVER trust a user-submitted college ID
        hackathon_name: d.hackathon_name,
        headline: d.headline,
        description: d.description,
        skills: JSON.stringify(d.skills),
        preferred_roles: JSON.stringify(d.preferred_roles),
        eligibility_rules: d.eligibility_rules,
      },
      include: includePublic,
    });
    return res.status(201).json({ success: true, data: formatPost(created), message: 'Your Looking for Team post is live.' });
  } catch (error: any) {
    if (error?.code === 'P2002') return res.status(409).json({ success: false, message: 'You already have a post for this hackathon. Close or manage that post first.' });
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to publish post.' });
  }
});

router.patch('/:id', authenticateToken, requireAuth, async (req: AuthRequest, res: Response) => {
  const status = req.body?.status;
  if (status !== 'OPEN' && status !== 'CLOSED') return res.status(400).json({ success: false, message: 'Status must be OPEN or CLOSED.' });
  try {
    const changed = await prisma.soloPost.updateMany({ where: { id: req.params.id, user_id: req.user!.id }, data: { status } });
    if (changed.count !== 1) return res.status(404).json({ success: false, message: 'Your post was not found.' });
    return res.json({ success: true, message: status === 'OPEN' ? 'Post reopened.' : 'Post closed.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to change status.' });
  }
});

export default router;
