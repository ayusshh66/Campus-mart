import { Router, Response } from 'express';
import prisma from '../db';
import { authenticateToken, requireAuth, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// Route-level errors are thrown inside transactions to ensure all writes roll back.
class TeamRouteError extends Error {
  constructor(public readonly statusCode: number, message: string) {
    super(message);
    this.name = 'TeamRouteError';
  }
}

function sendTeamError(error: unknown, res: Response, fallback: string) {
  if (error instanceof TeamRouteError) {
    return res.status(error.statusCode).json({ success: false, message: error.message });
  }

  // Prisma reports write conflicts/deadlocks as P2034. A client may retry safely.
  if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2034') {
    return res.status(409).json({
      success: false,
      message: 'Another update happened at the same time. Please retry.',
    });
  }

  console.error(fallback, error);
  return res.status(500).json({ success: false, message: fallback });
}

// Helper to safely parse JSON strings or arrays
function parseJsonArray(val: any): string[] {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [val];
    } catch {
      return val ? val.split(',').map((s) => s.trim()).filter(Boolean) : [];
    }
  }
  return [];
}

// ==========================================
// 1. SKILL PROFILE ENDPOINTS
// ==========================================

// GET /api/teams/profile/me - Get current user's hackathon skill profile
router.get('/profile/me', authenticateToken, requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const profile = await prisma.hackathonProfile.findUnique({
      where: { user_id: req.user!.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            college: true,
          },
        },
      },
    });

    if (!profile) {
      return res.json({
        success: true,
        data: null,
      });
    }

    return res.json({
      success: true,
      data: {
        ...profile,
        skills: parseJsonArray(profile.skills),
        preferred_roles: parseJsonArray(profile.preferred_roles),
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch skill profile', error: error.message });
  }
});

// POST or PUT /api/teams/profile - Create or update current user's hackathon skill profile
router.post('/profile', authenticateToken, requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { bio, skills, preferred_roles, github_url, portfolio_url, linkedin_url, experience_level } = req.body;

    const skillsArray = parseJsonArray(skills);
    const rolesArray = parseJsonArray(preferred_roles);

    const savedProfile = await prisma.hackathonProfile.upsert({
      where: { user_id: req.user!.id },
      create: {
        user_id: req.user!.id,
        bio: (bio || '').trim(),
        skills: JSON.stringify(skillsArray),
        preferred_roles: JSON.stringify(rolesArray),
        github_url: (github_url || '').trim() || null,
        portfolio_url: (portfolio_url || '').trim() || null,
        linkedin_url: (linkedin_url || '').trim() || null,
        experience_level: experience_level || 'Intermediate',
      },
      update: {
        bio: bio !== undefined ? (bio || '').trim() : undefined,
        skills: skills !== undefined ? JSON.stringify(skillsArray) : undefined,
        preferred_roles: preferred_roles !== undefined ? JSON.stringify(rolesArray) : undefined,
        github_url: github_url !== undefined ? (github_url || '').trim() || null : undefined,
        portfolio_url: portfolio_url !== undefined ? (portfolio_url || '').trim() || null : undefined,
        linkedin_url: linkedin_url !== undefined ? (linkedin_url || '').trim() || null : undefined,
        experience_level: experience_level || undefined,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            college: true,
          },
        },
      },
    });

    return res.json({
      success: true,
      message: 'Skill profile saved successfully',
      data: {
        ...savedProfile,
        skills: parseJsonArray(savedProfile.skills),
        preferred_roles: parseJsonArray(savedProfile.preferred_roles),
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to save skill profile', error: error.message });
  }
});

// GET /api/teams/profile/:userId - View another user's skill profile
router.get('/profile/:userId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const profile = await prisma.hackathonProfile.findUnique({
      where: { user_id: req.params.userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            college: true,
          },
        },
      },
    });

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Skill profile not found' });
    }

    return res.json({
      success: true,
      data: {
        ...profile,
        skills: parseJsonArray(profile.skills),
        preferred_roles: parseJsonArray(profile.preferred_roles),
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve profile', error: error.message });
  }
});

// ==========================================
// 2. TEAM POSTS RECRUITMENT ENDPOINTS
// ==========================================

// GET /api/teams - Browse, search, and filter team recruitment posts
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { hackathon, college, skill, role, status, search } = req.query;

    const whereClause: any = {};

    // Filter by post status (default to non-removed posts)
    if (status && typeof status === 'string' && status !== 'ALL') {
      whereClause.status = status;
    } else {
      whereClause.status = { not: 'REMOVED' };
    }

    // Filter by college ID or code
    if (college && typeof college === 'string') {
      whereClause.college = {
        OR: [
          { id: college },
          { code: college.toUpperCase() },
        ],
      };
    }

    // Filter by hackathon name
    if (hackathon && typeof hackathon === 'string' && hackathon.trim()) {
      whereClause.hackathon_name = {
        contains: hackathon.trim(),
      };
    }

    // Keyword search across title, hackathon, description
    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      whereClause.OR = [
        { team_title: { contains: q } },
        { hackathon_name: { contains: q } },
        { description: { contains: q } },
        { skills_needed: { contains: q } },
        { required_roles: { contains: q } },
      ];
    }

    const posts = await prisma.teamPost.findMany({
      where: whereClause,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            college: true,
            hackathon_profile: true,
          },
        },
        college: true,
        applications: {
          select: {
            id: true,
            status: true,
            applicant_id: true,
            role_applied: true,
            applicant: {
              select: {
                id: true,
                name: true,
                college: true,
              },
            },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    const now = new Date();

    const formattedPosts = posts
      .map((post) => {
        const skillsArr = parseJsonArray(post.skills_needed);
        const rolesArr = parseJsonArray(post.required_roles);
        const acceptedApps = post.applications.filter((a) => a.status === 'ACCEPTED');
        const acceptedCount = 1 + acceptedApps.length; // 1 (creator) + accepted teammates
        const openSeats = Math.max(0, post.max_team_size - acceptedCount);
        const isExpired = new Date(post.application_deadline) < now;

        // Skill filter (in-memory JSON check)
        if (skill && typeof skill === 'string' && skill.trim()) {
          const sLower = skill.trim().toLowerCase();
          const matchSkill = skillsArr.some((s) => s.toLowerCase().includes(sLower));
          if (!matchSkill) return null;
        }

        // Role filter
        if (role && typeof role === 'string' && role.trim()) {
          const rLower = role.trim().toLowerCase();
          const matchRole = rolesArr.some((r) => r.toLowerCase().includes(rLower));
          if (!matchRole) return null;
        }

        // Check if current user has applied
        let myApplication = null;
        if (req.user) {
          const found = post.applications.find((a) => a.applicant_id === req.user!.id);
          if (found) {
            myApplication = {
              id: found.id,
              status: found.status,
              role_applied: found.role_applied,
            };
          }
        }

        return {
          id: post.id,
          creator_id: post.creator_id,
          creator: {
            id: post.creator.id,
            name: post.creator.name,
            college: post.creator.college,
            experience_level: post.creator.hackathon_profile?.experience_level || 'Intermediate',
          },
          college: post.college,
          hackathon_name: post.hackathon_name,
          team_title: post.team_title,
          description: post.description,
          skills_needed: skillsArr,
          required_roles: rolesArr,
          max_team_size: post.max_team_size,
          current_team_size: acceptedCount,
          open_seats: openSeats,
          eligibility_rules: post.eligibility_rules,
          eligibility_notes: post.eligibility_notes,
          application_deadline: post.application_deadline,
          status: post.status,
          is_expired: isExpired,
          is_owner: req.user ? post.creator_id === req.user.id : false,
          my_application: myApplication,
          accepted_members: [
            {
              id: post.creator.id,
              name: post.creator.name,
              college: post.creator.college,
              role: 'Team Lead',
            },
            ...acceptedApps.map((a) => ({
              id: a.applicant.id,
              name: a.applicant.name,
              college: a.applicant.college,
              role: a.role_applied,
            })),
          ],
          total_applications_count: post.applications.length,
          created_at: post.created_at,
          updated_at: post.updated_at,
        };
      })
      .filter(Boolean);

    return res.json({
      success: true,
      count: formattedPosts.length,
      data: formattedPosts,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch team recruitment posts', error: error.message });
  }
});

// POST /api/teams - Create a new team recruitment post
router.post('/', authenticateToken, requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const {
      hackathon_name,
      team_title,
      description,
      skills_needed,
      required_roles,
      max_team_size,
      eligibility_rules,
      eligibility_notes,
      application_deadline,
    } = req.body;

    if (!hackathon_name || !hackathon_name.trim()) {
      return res.status(400).json({ success: false, message: 'Hackathon name is required.' });
    }
    if (!team_title || !team_title.trim()) {
      return res.status(400).json({ success: false, message: 'Team title is required.' });
    }
    if (!description || !description.trim()) {
      return res.status(400).json({ success: false, message: 'Team description is required.' });
    }
    if (!application_deadline) {
      return res.status(400).json({ success: false, message: 'Application deadline is required.' });
    }

    const deadline = new Date(application_deadline);
    if (isNaN(deadline.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid application deadline date format.' });
    }

    const teamSize = Number(max_team_size) || 6;
    if (teamSize < 2 || teamSize > 15) {
      return res.status(400).json({ success: false, message: 'Max team size must be between 2 and 15 members.' });
    }

    const validRules = ['OPEN_TO_ALL', 'SAME_COLLEGE_ONLY'];
    const rule = validRules.includes(eligibility_rules) ? eligibility_rules : 'OPEN_TO_ALL';

    const skillsArray = parseJsonArray(skills_needed);
    const rolesArray = parseJsonArray(required_roles);

    const post = await prisma.teamPost.create({
      data: {
        creator_id: req.user!.id,
        college_id: req.user!.college_id, // Safe server-side binding
        hackathon_name: hackathon_name.trim(),
        team_title: team_title.trim(),
        description: description.trim(),
        skills_needed: JSON.stringify(skillsArray),
        required_roles: JSON.stringify(rolesArray),
        max_team_size: teamSize,
        eligibility_rules: rule,
        eligibility_notes: eligibility_notes ? eligibility_notes.trim() : null,
        application_deadline: deadline,
        status: 'OPEN',
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            college: true,
          },
        },
        college: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Team recruitment post created successfully!',
      data: {
        ...post,
        skills_needed: skillsArray,
        required_roles: rolesArray,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to create team post', error: error.message });
  }
});

// GET /api/teams/my/all - Get all teams created by me, applied to by me, and my skill profile
router.get('/my/all', authenticateToken, requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // 1. Teams created by current user
    const createdPosts = await prisma.teamPost.findMany({
      where: { creator_id: userId, status: { not: 'REMOVED' } },
      include: {
        college: true,
        applications: {
          include: {
            applicant: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                college: true,
                hackathon_profile: true,
              },
            },
          },
          orderBy: { created_at: 'desc' },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    // 2. Teams applied to by current user
    const myApplications = await prisma.teamApplication.findMany({
      where: { applicant_id: userId },
      include: {
        team_post: {
          include: {
            creator: {
              select: {
                id: true,
                name: true,
                email: true,
                college: true,
              },
            },
            college: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    // 3. Current user skill profile
    const profile = await prisma.hackathonProfile.findUnique({
      where: { user_id: userId },
    });

    const formattedCreated = createdPosts.map((post) => {
      const skillsArr = parseJsonArray(post.skills_needed);
      const rolesArr = parseJsonArray(post.required_roles);
      const acceptedApps = post.applications.filter((a) => a.status === 'ACCEPTED');
      const acceptedCount = 1 + acceptedApps.length;
      const openSeats = Math.max(0, post.max_team_size - acceptedCount);

      return {
        id: post.id,
        team_title: post.team_title,
        hackathon_name: post.hackathon_name,
        description: post.description,
        skills_needed: skillsArr,
        required_roles: rolesArr,
        max_team_size: post.max_team_size,
        current_team_size: acceptedCount,
        open_seats: openSeats,
        eligibility_rules: post.eligibility_rules,
        eligibility_notes: post.eligibility_notes,
        application_deadline: post.application_deadline,
        status: post.status,
        college: post.college,
        created_at: post.created_at,
        applications: post.applications.map((app) => ({
          id: app.id,
          role_applied: app.role_applied,
          message: app.message,
          status: app.status,
          rejection_reason: app.rejection_reason,
          created_at: app.created_at,
          applicant: {
            id: app.applicant.id,
            name: app.applicant.name,
            email: app.applicant.email,
            phone: app.applicant.phone,
            college: app.applicant.college,
            hackathon_profile: app.applicant.hackathon_profile ? {
              ...app.applicant.hackathon_profile,
              skills: parseJsonArray(app.applicant.hackathon_profile.skills),
              preferred_roles: parseJsonArray(app.applicant.hackathon_profile.preferred_roles),
            } : null,
          },
        })),
      };
    });

    const formattedApplied = myApplications.map((app) => ({
      id: app.id,
      role_applied: app.role_applied,
      message: app.message,
      status: app.status,
      rejection_reason: app.rejection_reason,
      created_at: app.created_at,
      team_post: {
        id: app.team_post.id,
        team_title: app.team_post.team_title,
        hackathon_name: app.team_post.hackathon_name,
        description: app.team_post.description,
        status: app.team_post.status,
        application_deadline: app.team_post.application_deadline,
        creator: app.team_post.creator,
        college: app.team_post.college,
      },
    }));

    return res.json({
      success: true,
      data: {
        created_teams: formattedCreated,
        applied_teams: formattedApplied,
        profile: profile ? {
          ...profile,
          skills: parseJsonArray(profile.skills),
          preferred_roles: parseJsonArray(profile.preferred_roles),
        } : null,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch user teams', error: error.message });
  }
});

// GET /api/teams/:id - Detailed view of a team recruitment post
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const post = await prisma.teamPost.findUnique({
      where: { id: req.params.id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            college: true,
            hackathon_profile: true,
          },
        },
        college: true,
        applications: {
          include: {
            applicant: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                college: true,
                hackathon_profile: true,
              },
            },
          },
          orderBy: { created_at: 'desc' },
        },
      },
    });

    if (!post || post.status === 'REMOVED') {
      return res.status(404).json({ success: false, message: 'Team recruitment post not found.' });
    }

    const isOwner = req.user ? post.creator_id === req.user.id : false;
    const isAdmin = req.user ? req.user.role === 'ADMIN' : false;

    const skillsArr = parseJsonArray(post.skills_needed);
    const rolesArr = parseJsonArray(post.required_roles);
    const acceptedApps = post.applications.filter((a) => a.status === 'ACCEPTED');
    const acceptedCount = 1 + acceptedApps.length;
    const openSeats = Math.max(0, post.max_team_size - acceptedCount);
    const isExpired = new Date(post.application_deadline) < new Date();

    // Determine current user's application
    let myApplication = null;
    if (req.user) {
      const userApp = post.applications.find((a) => a.applicant_id === req.user!.id);
      if (userApp) {
        myApplication = {
          id: userApp.id,
          role_applied: userApp.role_applied,
          message: userApp.message,
          status: userApp.status,
          rejection_reason: userApp.rejection_reason,
          created_at: userApp.created_at,
        };
      }
    }

    // Only owner or admin gets the full application queue with contact info and rejection reasons
    const applicationsList = (isOwner || isAdmin)
      ? post.applications.map((app) => ({
          id: app.id,
          role_applied: app.role_applied,
          message: app.message,
          status: app.status,
          rejection_reason: app.rejection_reason,
          created_at: app.created_at,
          applicant: {
            id: app.applicant.id,
            name: app.applicant.name,
            email: app.applicant.email,
            phone: app.applicant.phone,
            college: app.applicant.college,
            hackathon_profile: app.applicant.hackathon_profile ? {
              ...app.applicant.hackathon_profile,
              skills: parseJsonArray(app.applicant.hackathon_profile.skills),
              preferred_roles: parseJsonArray(app.applicant.hackathon_profile.preferred_roles),
            } : null,
          },
        }))
      : [];

    return res.json({
      success: true,
      data: {
        id: post.id,
        creator_id: post.creator_id,
        creator: {
          id: post.creator.id,
          name: post.creator.name,
          email: post.creator.email,
          college: post.creator.college,
          hackathon_profile: post.creator.hackathon_profile ? {
            ...post.creator.hackathon_profile,
            skills: parseJsonArray(post.creator.hackathon_profile.skills),
            preferred_roles: parseJsonArray(post.creator.hackathon_profile.preferred_roles),
          } : null,
        },
        college: post.college,
        hackathon_name: post.hackathon_name,
        team_title: post.team_title,
        description: post.description,
        skills_needed: skillsArr,
        required_roles: rolesArr,
        max_team_size: post.max_team_size,
        current_team_size: acceptedCount,
        open_seats: openSeats,
        eligibility_rules: post.eligibility_rules,
        eligibility_notes: post.eligibility_notes,
        application_deadline: post.application_deadline,
        status: post.status,
        is_expired: isExpired,
        is_owner: isOwner,
        is_admin: isAdmin,
        my_application: myApplication,
        accepted_members: [
          {
            id: post.creator.id,
            name: post.creator.name,
            college: post.creator.college,
            role: 'Team Lead',
            is_lead: true,
          },
          ...acceptedApps.map((a) => ({
            id: a.applicant.id,
            name: a.applicant.name,
            college: a.applicant.college,
            role: a.role_applied,
            is_lead: false,
          })),
        ],
        applications: applicationsList,
        created_at: post.created_at,
        updated_at: post.updated_at,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve team details', error: error.message });
  }
});

// PUT /api/teams/:id - Update team recruitment post (Owner or Admin only)
router.put('/:id', authenticateToken, requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const updated = await prisma.$transaction(async (tx) => {
      const existing = await tx.teamPost.findUnique({
        where: { id: req.params.id },
      });

      if (!existing) {
        throw new TeamRouteError(404, 'Team recruitment post not found.');
      }
      if (existing.creator_id !== req.user!.id && req.user!.role !== 'ADMIN') {
        throw new TeamRouteError(403, 'Unauthorized. Only team owner or admin can edit this post.');
      }

      // Lock this team row *before* checking members; other approval/edit
      // transactions touching this team wait for our transaction to finish.
      // PostgreSQL holds the UPDATE row lock until commit; SQLite serializes writes.
      await tx.teamPost.update({
        where: { id: existing.id },
        data: { updated_at: new Date() },
      });

      // Re-read after the lock to avoid using stale capacity/status values.
      const post = await tx.teamPost.findUniqueOrThrow({
        where: { id: existing.id },
      });

      const {
        hackathon_name, team_title, description, skills_needed,
        required_roles, max_team_size, eligibility_rules,
        eligibility_notes, application_deadline, status,
      } = req.body ?? {};

      const updateData: any = {};

      for (const [key, value] of Object.entries({ hackathon_name, team_title, description })) {
        if (value !== undefined) {
          if (typeof value !== 'string' || !value.trim()) {
            throw new TeamRouteError(400, `${key} must be non-empty text.`);
          }
          updateData[key] = value.trim();
        }
      }

      if (skills_needed !== undefined) updateData.skills_needed = JSON.stringify(parseJsonArray(skills_needed));
      if (required_roles !== undefined) updateData.required_roles = JSON.stringify(parseJsonArray(required_roles));

      if (max_team_size !== undefined) {
        const size = Number(max_team_size);
        if (!Number.isInteger(size) || size < 2 || size > 15) {
          throw new TeamRouteError(400, 'Max team size must be a whole number between 2 and 15.');
        }
        updateData.max_team_size = size;
      }

      if (eligibility_rules !== undefined) {
        if (!['OPEN_TO_ALL', 'SAME_COLLEGE_ONLY'].includes(eligibility_rules)) {
          throw new TeamRouteError(400, 'Invalid eligibility rule.');
        }
        updateData.eligibility_rules = eligibility_rules;
      }

      if (eligibility_notes !== undefined) {
        if (eligibility_notes !== null && typeof eligibility_notes !== 'string') {
          throw new TeamRouteError(400, 'Eligibility notes must be text.');
        }
        updateData.eligibility_notes = eligibility_notes?.trim() || null;
      }

      if (application_deadline !== undefined) {
        const deadline = new Date(application_deadline);
        if (Number.isNaN(deadline.getTime())) {
          throw new TeamRouteError(400, 'Invalid application deadline.');
        }
        updateData.application_deadline = deadline;
      }

      if (status !== undefined) {
        if (!['OPEN', 'FULL', 'CLOSED', 'REMOVED'].includes(status)) {
          throw new TeamRouteError(400, 'Invalid team status.');
        }
        updateData.status = status;
      }

      // Re-check capacity after locking the team, so editing team size
      // cannot race against approving an applicant.
      const acceptedCount = await tx.teamApplication.count({
        where: { team_post_id: existing.id, status: 'ACCEPTED' },
      });
      const currentMembers = 1 + acceptedCount; // Include team creator
      const nextMaxSize = updateData.max_team_size ?? post.max_team_size;

      if (nextMaxSize < currentMembers) {
        throw new TeamRouteError(
          400,
          `Team already has ${currentMembers} members. Maximum size cannot be lower than this.`,
        );
      }

      if (updateData.status === 'OPEN' && currentMembers >= nextMaxSize) {
        throw new TeamRouteError(400, 'A full team cannot be marked OPEN.');
      }

      // If only capacity changes, automatically sync FULL/OPEN display state.
      if (updateData.status === undefined && updateData.max_team_size !== undefined &&
          ['OPEN', 'FULL'].includes(post.status)) {
        updateData.status = currentMembers >= nextMaxSize ? 'FULL' : 'OPEN';
      }

      return tx.teamPost.update({
        where: { id: existing.id },
        data: updateData,
      });
    });

    return res.json({
      success: true,
      message: 'Team post updated successfully',
      data: updated,
    });
  } catch (error: unknown) {
    return sendTeamError(error, res, 'Failed to update team post');
  }
});

// DELETE /api/teams/:id - Close or remove team recruitment post (Owner or Admin only)
router.delete('/:id', authenticateToken, requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const post = await prisma.teamPost.findUnique({
      where: { id: req.params.id },
    });

    if (!post) {
      return res.status(404).json({ success: false, message: 'Team recruitment post not found.' });
    }

    if (post.creator_id !== req.user!.id && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Unauthorized. Only team owner or admin can close this post.' });
    }

    await prisma.teamPost.update({
      where: { id: post.id },
      data: { status: 'CLOSED' },
    });

    return res.json({
      success: true,
      message: 'Team recruitment closed successfully.',
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to close team post', error: error.message });
  }
});

// ==========================================
// 3. TEAM APPLICATION WORKFLOW
// ==========================================

// POST /api/teams/:id/apply - Apply to join a team
router.post('/:id/apply', authenticateToken, requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { role_applied, message } = req.body;

    if (!role_applied || !role_applied.trim()) {
      return res.status(400).json({ success: false, message: 'Please select or specify the role you are applying for.' });
    }
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide a short message explaining your interest and qualifications.' });
    }

    const post = await prisma.teamPost.findUnique({
      where: { id: req.params.id },
      include: {
        college: true,
        applications: {
          select: {
            id: true,
            status: true,
            applicant_id: true,
          },
        },
      },
    });

    if (!post || post.status === 'REMOVED') {
      return res.status(404).json({ success: false, message: 'Team recruitment post does not exist.' });
    }

    // 1. Prevent owner applying to own team
    if (post.creator_id === req.user!.id) {
      return res.status(400).json({ success: false, message: 'You are the creator of this team post. You do not need to apply.' });
    }

    // 2. Check if team is open
    if (post.status !== 'OPEN') {
      return res.status(400).json({ success: false, message: `This team recruitment is currently ${post.status.toLowerCase()}. Applications are not accepted.` });
    }

    // 3. Check application deadline
    if (new Date(post.application_deadline) < new Date()) {
      return res.status(400).json({ success: false, message: 'The application deadline for this team recruitment has passed.' });
    }

    // 4. Institution-specific eligibility validation
    if (post.eligibility_rules === 'SAME_COLLEGE_ONLY') {
      if (req.user!.college_id !== post.college_id) {
        return res.status(403).json({
          success: false,
          message: `Eligibility Restriction: This team recruitment is restricted strictly to students from ${post.college.name} (${post.college.code}). Your registered college is ${req.user!.college_name || req.user!.college_code}.`,
        });
      }
    }

    // 5. Capacity check (creator + accepted members)
    const acceptedCount = 1 + post.applications.filter((a) => a.status === 'ACCEPTED').length;
    if (acceptedCount >= post.max_team_size) {
      // Mark team as FULL if not already
      await prisma.teamPost.update({
        where: { id: post.id },
        data: { status: 'FULL' },
      });
      return res.status(400).json({
        success: false,
        message: `This team has already reached its maximum capacity of ${post.max_team_size} members.`,
      });
    }

    // 6. Prevent duplicate application
    const existing = post.applications.find((a) => a.applicant_id === req.user!.id);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `You have already applied to this team (Status: ${existing.status}). Duplicate applications are prohibited.`,
      });
    }

    const newApplication = await prisma.teamApplication.create({
      data: {
        team_post_id: post.id,
        applicant_id: req.user!.id,
        role_applied: role_applied.trim(),
        message: message.trim(),
        status: 'PENDING',
      },
      include: {
        applicant: {
          select: {
            id: true,
            name: true,
            email: true,
            college: true,
          },
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Application submitted successfully! The team lead will review your profile.',
      data: newApplication,
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, message: 'You have already submitted an application to this team.' });
    }
    return res.status(500).json({ success: false, message: 'Failed to submit application', error: error.message });
  }
});

// PATCH /api/teams/:id/applications/:appId - Accept or reject a team application
router.patch('/:id/applications/:appId', authenticateToken, requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { status, rejection_reason } = req.body ?? {};
    if (status !== 'ACCEPTED' && status !== 'REJECTED') {
      return res.status(400).json({
        success: false,
        message: "Status must be either 'ACCEPTED' or 'REJECTED'.",
      });
    }
    if (rejection_reason !== undefined && rejection_reason !== null && typeof rejection_reason !== 'string') {
      return res.status(400).json({ success: false, message: 'Rejection reason must be text.' });
    }

    const updatedApp = await prisma.$transaction(async (tx) => {
      const original = await tx.teamPost.findUnique({
        where: { id: req.params.id },
      });

      if (!original) {
        throw new TeamRouteError(404, 'Team post not found.');
      }
      if (original.creator_id !== req.user!.id && req.user!.role !== 'ADMIN') {
        throw new TeamRouteError(403, 'Only the team owner or an admin can decide on applications.');
      }

      // Acquire a write lock on the same team row used by the edit endpoint.
      // This serializes decisions for this team before reading the member count.
      await tx.teamPost.update({
        where: { id: original.id },
        data: { updated_at: new Date() },
      });

      // Refresh values after taking the lock. This is important under
      // PostgreSQL READ COMMITTED when another approval just committed.
      const post = await tx.teamPost.findUniqueOrThrow({
        where: { id: original.id },
      });
      const application = await tx.teamApplication.findFirst({
        where: { id: req.params.appId, team_post_id: post.id },
      });

      if (!application) {
        throw new TeamRouteError(404, 'Application not found on this team.');
      }
      if (application.status === status) {
        throw new TeamRouteError(400, `Application is already marked as ${status}.`);
      }
      if (status === 'ACCEPTED' && (post.status === 'CLOSED' || post.status === 'REMOVED')) {
        throw new TeamRouteError(400, 'Cannot accept applicants for a closed or removed team.');
      }

      // Only accepted applications count as members, plus the creator.
      const acceptedCount = await tx.teamApplication.count({
        where: { team_post_id: post.id, status: 'ACCEPTED' },
      });
      if (status === 'ACCEPTED' && 1 + acceptedCount >= post.max_team_size) {
        throw new TeamRouteError(
          400,
          `Cannot accept application. Team capacity of ${post.max_team_size} is full.`,
        );
      }

      const updated = await tx.teamApplication.update({
        where: { id: application.id },
        data: {
          status,
          rejection_reason: status === 'REJECTED' ? rejection_reason?.trim() || null : null,
        },
        include: {
          applicant: {
            select: { id: true, name: true, email: true, college: true },
          },
        },
      });

      const newAcceptedCount = acceptedCount +
        (status === 'ACCEPTED' ? 1 : application.status === 'ACCEPTED' ? -1 : 0);

      // Keep team capacity status in sync; preserve manual CLOSED/REMOVED.
      if (post.status === 'OPEN' || post.status === 'FULL') {
        const nextStatus = 1 + newAcceptedCount >= post.max_team_size ? 'FULL' : 'OPEN';
        if (nextStatus !== post.status) {
          await tx.teamPost.update({
            where: { id: post.id },
            data: { status: nextStatus },
          });
        }
      }
      return updated;
    });

    return res.json({
      success: true,
      message: `Application ${status.toLowerCase()} successfully!`,
      data: updatedApp,
    });
  } catch (error: unknown) {
    return sendTeamError(error, res, 'Failed to update application decision');
  }
});

// ==========================================
// 4. ADMIN MODERATION ENDPOINTS
// ==========================================

// GET /api/teams/admin/all - Admin moderation view of all team posts
router.get('/admin/all', authenticateToken, requireAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const posts = await prisma.teamPost.findMany({
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            college: true,
          },
        },
        college: true,
        _count: {
          select: {
            applications: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    const formatted = posts.map((p) => ({
      ...p,
      skills_needed: parseJsonArray(p.skills_needed),
      required_roles: parseJsonArray(p.required_roles),
    }));

    return res.json({
      success: true,
      data: formatted,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch admin team posts', error: error.message });
  }
});

// PATCH /api/teams/admin/:id/status - Admin status change (e.g. REMOVED, OPEN, CLOSED)
router.patch('/admin/:id/status', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    if (!['OPEN', 'FULL', 'CLOSED', 'REMOVED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid team status' });
    }

    const post = await prisma.teamPost.update({
      where: { id: req.params.id },
      data: { status },
    });

    return res.json({
      success: true,
      message: `Team post marked as ${status}`,
      data: post,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to moderate team post', error: error.message });
  }
});

export default router;
