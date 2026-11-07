import { Router, Response } from 'express';
import prisma from '../db';
import { authenticateToken, requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

class InviteError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

function fail(error: unknown, res: Response) {
  if (error instanceof InviteError) {
    return res.status(error.status).json({ success: false, message: error.message });
  }
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code?: string }).code;
    if (code === 'P2002') return res.status(409).json({ success: false, message: 'An invitation for this student and team already exists.' });
    if (code === 'P2034') return res.status(409).json({ success: false, message: 'Another team update happened at the same time. Please retry.' });
  }
  console.error('Solo invitation error:', error);
  return res.status(500).json({ success: false, message: 'Could not process the invitation.' });
}

// Individual students can see ONLY invitations sent to their own account.
router.get('/received', authenticateToken, requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const invitations = await prisma.soloInvitation.findMany({
      where: { recipient_id: req.user!.id },
      select: {
        id: true, status: true, message: true, role_offered: true, created_at: true,
        team_post: { select: { id: true, team_title: true, hackathon_name: true, status: true, application_deadline: true } },
        sender: { select: { id: true, name: true } },
        solo_post: { select: { id: true, headline: true } },
      },
      orderBy: { created_at: 'desc' },
    });
    return res.json({ success: true, data: invitations });
  } catch (error) { return fail(error, res); }
});

// Team owners can invite an available student to one of THEIR open teams.
router.post('/', authenticateToken, requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { solo_post_id, team_post_id, message, role_offered } = req.body ?? {};
    if (typeof solo_post_id !== 'string' || !solo_post_id || typeof team_post_id !== 'string' || !team_post_id) {
      throw new InviteError(400, 'Choose a student and one of your teams.');
    }
    if (typeof role_offered !== 'string' || role_offered.trim().length < 2 || role_offered.trim().length > 80) {
      throw new InviteError(400, 'Select a role to offer (2–80 characters).');
    }
    if (message !== undefined && (typeof message !== 'string' || message.length > 500)) {
      throw new InviteError(400, 'Invitation message must be 500 characters or less.');
    }

    const [solo, team] = await Promise.all([
      prisma.soloPost.findUnique({ where: { id: solo_post_id } }),
      prisma.teamPost.findUnique({ where: { id: team_post_id } }),
    ]);
    if (!solo || solo.status !== 'OPEN') throw new InviteError(404, 'That student is no longer available.');
    if (!team) throw new InviteError(404, 'Team not found.');
    if (team.creator_id !== req.user!.id) throw new InviteError(403, 'Only the team owner can invite students.');
    if (solo.user_id === req.user!.id) throw new InviteError(400, 'You cannot invite yourself.');
    if (team.status !== 'OPEN' || team.application_deadline <= new Date()) {
      throw new InviteError(409, 'This team is not currently accepting new members.');
    }
    if (solo.eligibility_rules === 'SAME_COLLEGE_ONLY' && solo.college_id !== team.college_id) {
      throw new InviteError(403, 'This student is available only for their own college.');
    }
    if (team.eligibility_rules === 'SAME_COLLEGE_ONLY' && team.college_id !== solo.college_id) {
      throw new InviteError(403, 'Your team only accepts students from its college.');
    }
    const accepted = await prisma.teamApplication.count({ where: { team_post_id: team.id, status: 'ACCEPTED' } });
    if (accepted + 1 >= team.max_team_size) throw new InviteError(409, 'Your team is already full.');
    const existingMember = await prisma.teamApplication.findUnique({
      where: { team_post_id_applicant_id: { team_post_id: team.id, applicant_id: solo.user_id } },
    });
    if (existingMember?.status === 'ACCEPTED') throw new InviteError(409, 'This student is already in your team.');

    const invitation = await prisma.soloInvitation.create({
      data: {
        solo_post_id: solo.id, team_post_id: team.id, sender_id: req.user!.id,
        recipient_id: solo.user_id, role_offered: role_offered.trim(), message: typeof message === 'string' ? message.trim() : '',
      },
      select: { id: true, status: true },
    });
    return res.status(201).json({ success: true, message: 'Invitation sent to the student.', data: invitation });
  } catch (error) { return fail(error, res); }
});

// A student may accept or decline ONLY their own pending invitation.
router.patch('/:id/respond', authenticateToken, requireAuth, async (req: AuthRequest, res: Response) => {
  const decision = req.body?.status;
  if (decision !== 'ACCEPTED' && decision !== 'DECLINED') {
    return res.status(400).json({ success: false, message: 'Choose ACCEPTED or DECLINED.' });
  }
  try {
    if (decision === 'DECLINED') {
      const result = await prisma.soloInvitation.updateMany({
        where: { id: req.params.id, recipient_id: req.user!.id, status: 'PENDING' },
        data: { status: 'DECLINED' },
      });
      if (result.count !== 1) throw new InviteError(404, 'Pending invitation not found.');
      return res.json({ success: true, message: 'Invitation declined.' });
    }

    await prisma.$transaction(async (tx) => {
      const invite = await tx.soloInvitation.findUnique({ where: { id: req.params.id } });
      if (!invite || invite.recipient_id !== req.user!.id || invite.status !== 'PENDING') {
        throw new InviteError(404, 'Pending invitation not found.');
      }

      // Same row-lock strategy as the existing team capacity fix (Bug 8).
      // Concurrent accept/approve operations for the same team cannot both take the last seat.
      const team = await tx.teamPost.update({
        where: { id: invite.team_post_id }, data: { updated_at: new Date() },
      });
      const solo = await tx.soloPost.findUnique({ where: { id: invite.solo_post_id } });
      const recipient = await tx.user.findUnique({ where: { id: invite.recipient_id }, select: { college_id: true } });
      if (!solo || solo.status !== 'OPEN' || !recipient) throw new InviteError(409, 'This student post is no longer available.');
      if (team.status !== 'OPEN' || team.application_deadline <= new Date()) {
        throw new InviteError(409, 'The team is no longer accepting members.');
      }
      if (team.eligibility_rules === 'SAME_COLLEGE_ONLY' && team.college_id !== recipient.college_id) {
        throw new InviteError(403, 'You are not eligible for this team’s college scope.');
      }
      if (solo.eligibility_rules === 'SAME_COLLEGE_ONLY' && team.college_id !== solo.college_id) {
        throw new InviteError(403, 'This invitation does not match your campus preference.');
      }

      const existing = await tx.teamApplication.findUnique({
        where: { team_post_id_applicant_id: { team_post_id: team.id, applicant_id: invite.recipient_id } },
      });
      if (existing?.status === 'ACCEPTED') throw new InviteError(409, 'You are already a member of this team.');
      const accepted = await tx.teamApplication.count({ where: { team_post_id: team.id, status: 'ACCEPTED' } });
      if (accepted + 1 >= team.max_team_size) throw new InviteError(409, 'This team is now full.');

      // Claim availability atomically. Two invitations to different teams cannot both be accepted.
      const claimed = await tx.soloPost.updateMany({ where: { id: solo.id, status: 'OPEN' }, data: { status: 'CLOSED' } });
      if (claimed.count !== 1) throw new InviteError(409, 'This student post was already matched to a team.');

      await tx.teamApplication.upsert({
        where: { team_post_id_applicant_id: { team_post_id: team.id, applicant_id: invite.recipient_id } },
        create: {
          team_post_id: team.id, applicant_id: invite.recipient_id,
          role_applied: invite.role_offered, message: `Accepted team invitation: ${invite.message || 'Invited by the team leader.'}`,
          status: 'ACCEPTED',
        },
        update: {
          role_applied: invite.role_offered, message: `Accepted team invitation: ${invite.message || 'Invited by the team leader.'}`,
          status: 'ACCEPTED', rejection_reason: null,
        },
      });
      await tx.soloInvitation.update({ where: { id: invite.id }, data: { status: 'ACCEPTED' } });
      await tx.soloInvitation.updateMany({
        where: { solo_post_id: solo.id, id: { not: invite.id }, status: 'PENDING' },
        data: { status: 'DECLINED' },
      });
      if (accepted + 2 >= team.max_team_size) {
        await tx.teamPost.update({ where: { id: team.id }, data: { status: 'FULL' } });
      }
    });

    return res.json({ success: true, message: 'Invitation accepted! You have joined the team.' });
  } catch (error) { return fail(error, res); }
});

export default router;
