import { Router, Response, NextFunction } from 'express';
import prisma from '../db';
import { authenticateToken, requireAuth, requireAdmin, AuthRequest } from '../middleware/auth';

/*
  CampusMart Hero Operations V1.
  Additive route: does not replace legacy /api/hero endpoints.
  Manager authorization is via scoped HeroManagerAssignment records.
  All student contact information is hidden until a hero owns the task.
*/
const router = Router();
router.use(authenticateToken, requireAuth);

type Access = { admin: boolean; hero: boolean; managerCollegeIds: string[] };
type OpsRequest = AuthRequest & { ops?: Access };
const ACTIVE = ['ASSIGNED', 'PICKED_UP', 'DELIVERED'];
const STATUSES = [...ACTIVE, 'COMPLETED', 'CANCELLED'];
const transitions: Record<string, string[]> = {
    ASSIGNED: ['PICKED_UP', 'CANCELLED'],
    PICKED_UP: ['DELIVERED', 'CANCELLED'],
    DELIVERED: ['COMPLETED', 'CANCELLED'],
    COMPLETED: [], CANCELLED: [],
};
const bad = (res: Response, code: number, message: string) => res.status(code).json({ success: false, message });
const safeString = (v: unknown, len = 1000) => typeof v === 'string' ? v.trim().slice(0, len) : '';
const parseArray = (v: unknown): string[] => {
    if (Array.isArray(v)) return v.filter(x => typeof x === 'string');
    if (typeof v === 'string') {
        try { const p = JSON.parse(v); return Array.isArray(p) ? p.filter(x => typeof x === 'string') : []; }
        catch { return []; }
    }
    return [];
};

const taskInclude = {
    product: true,
    college: { select: { id: true, code: true, name: true } },
    assigned_hero: { select: { id: true, name: true, email: true } },
    sell_request: { include: { user: { select: { id: true, name: true, phone: true, email: true } } } },
    buy_request: { include: { user: { select: { id: true, name: true, phone: true, email: true } } } },
} as const;

function showTask(t: any, viewerId: string, privileged: boolean) {
    const canSeeContacts = privileged || (t.assigned_hero_id && t.assigned_hero_id === viewerId);
    const party = (request: any) => request ? ({
        id: request.user.id, name: canSeeContacts ? request.user.name : 'Visible after claiming',
        phone: canSeeContacts ? request.user.phone : null,
        email: canSeeContacts ? request.user.email : null,
    }) : null;
    return {
        id: t.id, task_type: t.task_type, status: t.status,
        assigned_hero_id: t.assigned_hero_id, assigned_hero: t.assigned_hero ?? null,
        product: { id: t.product.id, name: t.product.name, category: t.product.category, image_url: t.product.image_url },
        college: t.college, seller: party(t.sell_request), buyer: party(t.buy_request),
        condition: canSeeContacts ? t.sell_request?.condition ?? null : null,
        description: canSeeContacts ? t.sell_request?.description ?? null : null,
        photos: canSeeContacts ? parseArray(t.sell_request?.images) : [],
        pickup_notes: canSeeContacts ? t.pickup_notes : null,
        delivery_notes: canSeeContacts ? t.delivery_notes : null,
        quality_verified: t.quality_verified, due_at: t.due_at,
        created_at: t.created_at, updated_at: t.updated_at,
    };
}

async function loadAccess(req: OpsRequest, res: Response, next: NextFunction) {
    try {
        const u = req.user!;
        const admin = u.role === 'ADMIN';
        const [approved, assignments] = await Promise.all([
            prisma.campusHeroApplication.findFirst({ where: { user_id: u.id, status: 'APPROVED' }, select: { id: true } }),
            prisma.heroManagerAssignment.findMany({ where: { user_id: u.id, is_active: true }, select: { college_id: true } }),
        ]);
        req.ops = { admin, hero: admin || Boolean(approved), managerCollegeIds: assignments.map(a => a.college_id) };
        next();
    } catch (err) { next(err); }
}
router.use(loadAccess);

function requireHero(req: OpsRequest, res: Response, next: NextFunction) {
    return req.ops?.hero ? next() : bad(res, 403, 'Approved Campus Hero access is required.');
}
function requireManager(req: OpsRequest, res: Response, next: NextFunction) {
    return req.ops?.admin || req.ops?.managerCollegeIds.length ? next() : bad(res, 403, 'Campus Hero Manager assignment is required.');
}
function targetCollege(req: OpsRequest) {
    const id = safeString(req.query.college_id, 100);
    if (req.ops?.admin) return id || req.user!.college_id;
    if (id && req.ops?.managerCollegeIds.includes(id)) return id;
    return req.ops?.managerCollegeIds[0] || null;
}
function errResponse(res: Response, err: unknown, label: string) {
    console.error(label, err);
    return bad(res, 500, `${label}. Please try again.`);
}

router.get('/me', async (req: OpsRequest, res) => {
    try {
        const u = await prisma.user.findUnique({ where: { id: req.user!.id }, include: { college: true } });
        return res.json({
            success: true, data: {
                user: u ? {
                    id: u.id, name: u.name, email: u.email, phone: u.phone,
                    college: { id: u.college.id, code: u.college.code, name: u.college.name }, role: u.role
                } : null,
                canHero: req.ops!.hero, canManage: req.ops!.admin || req.ops!.managerCollegeIds.length > 0,
                managerColleges: req.ops!.admin
                    ? await prisma.college.findMany({ select: { id: true, code: true, name: true }, orderBy: { code: 'asc' } })
                    : await prisma.college.findMany({ where: { id: { in: req.ops!.managerCollegeIds } }, select: { id: true, code: true, name: true } }),
            }
        });
    } catch (e) { return errResponse(res, e, 'Unable to load operations access'); }
});

const formatEvent = (e: any) => ({
    id: e.id, task_id: e.task_id, action: e.action, from_status: e.from_status,
    to_status: e.to_status, details: e.details, created_at: e.created_at,
    actor: { id: e.actor.id, name: e.actor.name },
});
const formatIssue = (i: any) => ({
    id: i.id, task_id: i.task_id, reporter: i.reporter?.name,
    category: i.category, severity: i.severity, description: i.description,
    status: i.status, resolution_notes: i.resolution_notes, created_at: i.created_at, updated_at: i.updated_at
});

router.get('/hero/overview', requireHero, async (req: OpsRequest, res) => {
    try {
        const id = req.user!.id, collegeId = req.user!.college_id;
        const [tasks, issues, events, availability, announcements] = await Promise.all([
            prisma.deliveryTask.findMany({
                where: { college_id: collegeId, OR: [{ assigned_hero_id: id }, { assigned_hero_id: null, status: { in: ACTIVE } }] },
                include: taskInclude, orderBy: { created_at: 'desc' }, take: 180,
            }),
            prisma.heroTaskIssue.findMany({ where: { reporter_id: id }, include: { reporter: { select: { name: true } } }, orderBy: { created_at: 'desc' }, take: 50 }),
            prisma.heroTaskEvent.findMany({ where: { task: { assigned_hero_id: id } }, include: { actor: { select: { id: true, name: true } } }, orderBy: { created_at: 'desc' }, take: 30 }),
            prisma.heroAvailability.findUnique({ where: { user_id: id } }),
            prisma.heroAnnouncement.findMany({ where: { college_id: collegeId }, orderBy: { created_at: 'desc' }, take: 10 }),
        ]);
        const mine = tasks.filter(t => t.assigned_hero_id === id);
        const active = mine.filter(t => ACTIVE.includes(t.status));
        return res.json({
            success: true, data: {
                tasks: tasks.map(t => showTask(t, id, req.ops!.admin)),
                issues: issues.map(formatIssue), events: events.map(formatEvent), announcements,
                availability: availability?.status ?? 'AVAILABLE',
                stats: {
                    available: tasks.filter(t => !t.assigned_hero_id && ACTIVE.includes(t.status)).length,
                    active: active.length, pickups: active.filter(t => t.status === 'ASSIGNED').length,
                    completed: mine.filter(t => t.status === 'COMPLETED').length, issues: issues.filter(i => i.status !== 'RESOLVED').length
                },
            }
        });
    } catch (e) { return errResponse(res, e, 'Could not load Hero dashboard'); }
});

router.patch('/hero/availability', requireHero, async (req: OpsRequest, res) => {
    const status = safeString(req.body?.status, 20);
    if (!['AVAILABLE', 'BUSY', 'OFF_DUTY'].includes(status)) return bad(res, 400, 'Availability must be AVAILABLE, BUSY or OFF_DUTY');
    try {
        const data = await prisma.heroAvailability.upsert({
            where: { user_id: req.user!.id },
            create: { user_id: req.user!.id, status }, update: { status }
        });
        return res.json({ success: true, data });
    } catch (e) { return errResponse(res, e, 'Could not update availability'); }
});

router.post('/hero/tasks/:id/claim', requireHero, async (req: OpsRequest, res) => {
    try {
        const taskId = req.params.id, actor = req.user!.id;
        const out = await prisma.$transaction(async tx => {
            const changed = await tx.deliveryTask.updateMany({
                where: {
                    id: taskId, college_id: req.user!.college_id, assigned_hero_id: null, status: 'ASSIGNED',
                }, data: { assigned_hero_id: actor }
            });
            if (changed.count !== 1) return null;
            await tx.heroTaskEvent.create({ data: { task_id: taskId, actor_id: actor, action: 'TASK_CLAIMED', details: 'Claimed an unassigned campus task' } });
            return tx.deliveryTask.findUnique({ where: { id: taskId }, include: taskInclude });
        });
        if (!out) return bad(res, 409, 'Task is unavailable, already claimed, or outside your college. Refresh and try again.');
        return res.json({ success: true, data: showTask(out, actor, req.ops!.admin) });
    } catch (e) { return errResponse(res, e, 'Could not claim task'); }
});

router.patch('/hero/tasks/:id/status', requireHero, async (req: OpsRequest, res) => {
    const nextStatus = safeString(req.body?.status, 30);
    if (!STATUSES.includes(nextStatus)) return bad(res, 400, 'Invalid task status.');
    try {
        const actor = req.user!.id;
        const task = await prisma.deliveryTask.findUnique({ where: { id: req.params.id } });
        if (!task) return bad(res, 404, 'Task not found');
        if (task.college_id !== req.user!.college_id || task.assigned_hero_id !== actor)
            return bad(res, 403, 'Only the assigned Hero can update this campus task.');
        if (!transitions[task.status]?.includes(nextStatus))
            return bad(res, 409, `Cannot transition from ${task.status} to ${nextStatus}.`);
        if (nextStatus === 'PICKED_UP' && req.body?.quality_verified !== true)
            return bad(res, 400, 'Confirm the physical item inspection before marking picked up.');
        const notes = safeString(req.body?.notes, 1200);
        const updated = await prisma.$transaction(async tx => {
            const changed = await tx.deliveryTask.updateMany({
                where: { id: task.id, assigned_hero_id: actor, status: task.status },
                data: {
                    status: nextStatus, ...(nextStatus === 'PICKED_UP' ? { quality_verified: true, pickup_notes: notes || task.pickup_notes } : {}),
                    ...(nextStatus === 'DELIVERED' || nextStatus === 'COMPLETED' ? { delivery_notes: notes || task.delivery_notes } : {})
                }
            });
            if (changed.count !== 1) return null;
            if (nextStatus === 'COMPLETED' && task.buy_request_id) {
                await tx.buyRequest.update({ where: { id: task.buy_request_id }, data: { status: 'COMPLETED' } });
            }
            await tx.heroTaskEvent.create({
                data: {
                    task_id: task.id, actor_id: actor, action: `TASK_${nextStatus}`,
                    from_status: task.status, to_status: nextStatus, details: notes || null
                }
            });
            return tx.deliveryTask.findUnique({ where: { id: task.id }, include: taskInclude });
        });
        if (!updated) return bad(res, 409, 'Task changed during update. Refresh and retry.');
        return res.json({ success: true, data: showTask(updated, actor, req.ops!.admin) });
    } catch (e) { return errResponse(res, e, 'Could not update task'); }
});

router.post('/hero/tasks/:id/issues', requireHero, async (req: OpsRequest, res) => {
    const category = safeString(req.body?.category, 80), description = safeString(req.body?.description, 1500);
    const severity = safeString(req.body?.severity, 20) || 'MEDIUM';
    if (!category || description.length < 10 || !['LOW', 'MEDIUM', 'HIGH'].includes(severity))
        return bad(res, 400, 'Provide a category, description (10+ characters), and valid severity.');
    try {
        const t = await prisma.deliveryTask.findUnique({ where: { id: req.params.id }, select: { college_id: true, assigned_hero_id: true } });
        if (!t) return bad(res, 404, 'Task not found');
        if (t.college_id !== req.user!.college_id || t.assigned_hero_id !== req.user!.id)
            return bad(res, 403, 'Only the assigned campus Hero can report this issue.');
        const issue = await prisma.$transaction(async tx => {
            const result = await tx.heroTaskIssue.create({ data: { task_id: req.params.id, reporter_id: req.user!.id, category, description, severity, status: 'OPEN' } });
            await tx.heroTaskEvent.create({ data: { task_id: req.params.id, actor_id: req.user!.id, action: 'ISSUE_REPORTED', details: category } });
            return result;
        });
        return res.status(201).json({ success: true, data: issue });
    } catch (e) { return errResponse(res, e, 'Could not report issue'); }
});

router.post('/hero/tasks/:id/proofs', requireHero, async (req: OpsRequest, res) => {
    const kind = safeString(req.body?.kind, 20), imageUrl = safeString(req.body?.image_url, 1000);
    if (!['PICKUP', 'HANDOVER'].includes(kind) || !(/^(https?:\/\/|\/uploads\/)/i.test(imageUrl)))
        return bad(res, 400, 'Choose PICKUP or HANDOVER and upload a valid image first.');
    try {
        const task = await prisma.deliveryTask.findUnique({ where: { id: req.params.id } });
        if (!task) return bad(res, 404, 'Task not found');
        if (task.college_id !== req.user!.college_id || task.assigned_hero_id !== req.user!.id)
            return bad(res, 403, 'This task is not assigned to you.');
        const proof = await prisma.$transaction(async tx => {
            const data = await tx.heroTaskProof.create({
                data: {
                    task_id: task.id, uploader_id: req.user!.id, kind, image_url: imageUrl,
                    note: safeString(req.body?.note, 500) || null
                }
            });
            await tx.heroTaskEvent.create({ data: { task_id: task.id, actor_id: req.user!.id, action: 'PROOF_UPLOADED', details: kind } });
            return data;
        });
        return res.status(201).json({ success: true, data: proof });
    } catch (e) { return errResponse(res, e, 'Could not upload task proof'); }
});

// Secure task conversation: hero must own task; manager must be assigned to college.
router.get('/tasks/:id/messages', async (req: OpsRequest, res) => {
    try {
        const task = await prisma.deliveryTask.findUnique({ where: { id: req.params.id }, select: { college_id: true, assigned_hero_id: true } });
        if (!task) return bad(res, 404, 'Task not found');
        const allowed = req.ops!.admin || req.ops!.managerCollegeIds.includes(task.college_id) || task.assigned_hero_id === req.user!.id;
        if (!allowed) return bad(res, 403, 'Not authorized for this conversation.');
        const messages = await prisma.message.findMany({
            where: { task_id: req.params.id }, include: { sender: { select: { id: true, name: true } } },
            orderBy: { created_at: 'asc' }, take: 200
        });
        return res.json({
            success: true, data: messages.map(m => ({
                id: m.id, content: m.content, created_at: m.created_at,
                sender_id: m.sender_id, sender_name: m.sender.name, is_mine: m.sender_id === req.user!.id
            }))
        });
    } catch (e) { return errResponse(res, e, 'Could not load messages'); }
});
router.post('/tasks/:id/messages', async (req: OpsRequest, res) => {
    const content = safeString(req.body?.content, 2000), receiverId = safeString(req.body?.receiver_id, 100);
    if (!content || !receiverId) return bad(res, 400, 'Receiver and message are required.');
    try {
        const task = await prisma.deliveryTask.findUnique({
            where: { id: req.params.id }, include: {
                sell_request: { select: { user_id: true } }, buy_request: { select: { user_id: true } },
            }
        });
        if (!task) return bad(res, 404, 'Task not found');
        const manager = req.ops!.admin || req.ops!.managerCollegeIds.includes(task.college_id);
        if (!manager && task.assigned_hero_id !== req.user!.id) return bad(res, 403, 'Not assigned to this task.');
        const recipients = [task.sell_request?.user_id, task.buy_request?.user_id,
        ...(manager ? [task.assigned_hero_id] : [])].filter(Boolean);
        if (!recipients.includes(receiverId)) return bad(res, 403, 'Recipient must be an authorized participant in this task.');
        const msg = await prisma.message.create({
            data: {
                sender_id: req.user!.id, receiver_id: receiverId,
                sender_display_name: manager ? 'Campus Operations Manager' : 'Operations Team — Campus Hero',
                task_id: task.id, sell_request_id: task.sell_request_id, buy_request_id: task.buy_request_id, content
            }
        });
        return res.status(201).json({ success: true, data: msg });
    } catch (e) { return errResponse(res, e, 'Could not send message'); }
});

router.get('/tasks/:id/proofs', async (req: OpsRequest, res) => {
    try {
        const task = await prisma.deliveryTask.findUnique({ where: { id: req.params.id }, select: { college_id: true, assigned_hero_id: true } });
        if (!task) return bad(res, 404, 'Task not found');
        if (!(req.ops!.admin || req.ops!.managerCollegeIds.includes(task.college_id) || task.assigned_hero_id === req.user!.id))
            return bad(res, 403, 'Not authorized to view evidence.');
        const [proofs, events] = await Promise.all([
            prisma.heroTaskProof.findMany({ where: { task_id: req.params.id }, orderBy: { created_at: 'desc' }, include: { uploader: { select: { name: true } } } }),
            prisma.heroTaskEvent.findMany({ where: { task_id: req.params.id }, orderBy: { created_at: 'desc' }, include: { actor: { select: { id: true, name: true } } } }),
        ]);
        return res.json({ success: true, data: { proofs, events: events.map(formatEvent) } });
    } catch (e) { return errResponse(res, e, 'Could not load evidence'); }
});

router.get('/manager/overview', requireManager, async (req: OpsRequest, res) => {
    const collegeId = targetCollege(req);
    if (!collegeId) return bad(res, 403, 'No assigned college');
    try {
        const [college, tasks, issues, events, approvedApps, availability, announcements, proofs] = await Promise.all([
            prisma.college.findUnique({ where: { id: collegeId }, select: { id: true, name: true, code: true } }),
            prisma.deliveryTask.findMany({ where: { college_id: collegeId }, include: taskInclude, orderBy: { created_at: 'desc' }, take: 400 }),
            prisma.heroTaskIssue.findMany({ where: { task: { college_id: collegeId } }, include: { reporter: { select: { name: true } } }, orderBy: { created_at: 'desc' }, take: 150 }),
            prisma.heroTaskEvent.findMany({ where: { task: { college_id: collegeId } }, include: { actor: { select: { id: true, name: true } } }, orderBy: { created_at: 'desc' }, take: 150 }),
            prisma.campusHeroApplication.findMany({ where: { college_id: collegeId, status: 'APPROVED' }, include: { user: { select: { id: true, name: true, email: true, phone: true } } } }),
            prisma.heroAvailability.findMany({ where: { user: { college_id: collegeId } } }),
            prisma.heroAnnouncement.findMany({ where: { college_id: collegeId }, orderBy: { created_at: 'desc' }, take: 20 }),
            prisma.heroTaskProof.findMany({ where: { task: { college_id: collegeId } }, include: { uploader: { select: { name: true } } }, orderBy: { created_at: 'desc' }, take: 70 }),
        ]);
        const availableMap = new Map(availability.map(a => [a.user_id, a.status]));
        const heroes = approvedApps.map(a => ({
            id: a.user.id, name: a.user.name, email: a.user.email,
            phone: a.user.phone, availability: availableMap.get(a.user.id) ?? 'AVAILABLE',
            active_tasks: tasks.filter(t => t.assigned_hero_id === a.user.id && ACTIVE.includes(t.status)).length,
            completed_tasks: tasks.filter(t => t.assigned_hero_id === a.user.id && t.status === 'COMPLETED').length
        }));
        const open = tasks.filter(t => ACTIVE.includes(t.status));
        const aging = open.filter(t => (Date.now() - new Date(t.created_at).getTime()) > 48 * 60 * 60 * 1000);
        return res.json({
            success: true, data: {
                college, tasks: tasks.map(t => showTask(t, req.user!.id, true)), heroes,
                issues: issues.map(formatIssue), events: events.map(formatEvent), announcements, proofs,
                stats: {
                    heroes: heroes.length, active: open.length, unassigned: open.filter(t => !t.assigned_hero_id).length,
                    completed: tasks.filter(t => t.status === 'COMPLETED').length, aging: aging.length,
                    open_issues: issues.filter(i => i.status !== 'RESOLVED').length
                },
            }
        });
    } catch (e) { return errResponse(res, e, 'Could not load Manager dashboard'); }
});

router.patch('/manager/tasks/:id/assign', requireManager, async (req: OpsRequest, res) => {
    const heroId = typeof req.body?.hero_id === 'string' ? req.body.hero_id.trim() : null;
    const reason = safeString(req.body?.reason, 600);
    try {
        const t = await prisma.deliveryTask.findUnique({ where: { id: req.params.id } });
        if (!t) return bad(res, 404, 'Task not found');
        if (!(req.ops!.admin || req.ops!.managerCollegeIds.includes(t.college_id))) return bad(res, 403, 'Outside assigned college');
        if (!ACTIVE.includes(t.status)) return bad(res, 409, 'Cannot reassign completed or cancelled tasks.');
        if (t.status !== 'ASSIGNED') {
  return bad(
    res,
    409,
    'A task cannot be reassigned after the pickup has started.'
  );
}
        if (t.assigned_hero_id && t.assigned_hero_id !== heroId && reason.length < 8)
            return bad(res, 400, 'Provide an 8+ character reassignment reason.');
        if (heroId) {
            const approved = await prisma.campusHeroApplication.findFirst({ where: { user_id: heroId, college_id: t.college_id, status: 'APPROVED' } });
            if (!approved) return bad(res, 400, 'Hero must be approved at the task college.');
            const availability = await prisma.heroAvailability.findUnique({ where: { user_id: heroId } });
            if (availability?.status === 'OFF_DUTY') return bad(res, 409, 'Hero is currently off duty.');
        }
        if (t.assigned_hero_id === heroId) return res.json({ success: true, message: 'No change needed' });
        const result = await prisma.$transaction(async tx => {
            const changed = await tx.deliveryTask.updateMany({
                where: { id: t.id, assigned_hero_id: t.assigned_hero_id, status: t.status },
                data: { assigned_hero_id: heroId }
            });
            if (changed.count !== 1) return null;
            await tx.heroTaskEvent.create({
                data: {
                    task_id: t.id, actor_id: req.user!.id,
                    action: t.assigned_hero_id ? 'TASK_REASSIGNED' : 'TASK_ASSIGNED',
                    details: `${t.assigned_hero_id || 'unassigned'} -> ${heroId || 'unassigned'}${reason ? ' | ' + reason : ''}`
                }
            });
            return tx.deliveryTask.findUnique({ where: { id: t.id }, include: taskInclude });
        });
        if (!result) return bad(res, 409, 'Task changed; reload and retry.');
        return res.json({ success: true, data: showTask(result, req.user!.id, true) });
    } catch (e) { return errResponse(res, e, 'Could not assign task'); }
});

router.patch('/manager/issues/:id', requireManager, async (req: OpsRequest, res) => {
    const status = safeString(req.body?.status, 30), notes = safeString(req.body?.resolution_notes, 1800);
    if (!['OPEN', 'UNDER_REVIEW', 'ESCALATED', 'RESOLVED'].includes(status)) return bad(res, 400, 'Invalid issue status.');
    if (status === 'RESOLVED' && notes.length < 10) return bad(res, 400, 'Resolution requires a note of 10+ characters.');
    try {
        const issue = await prisma.heroTaskIssue.findUnique({ where: { id: req.params.id }, include: { task: { select: { college_id: true } } } });
        if (!issue) return bad(res, 404, 'Issue not found');
        if (!(req.ops!.admin || req.ops!.managerCollegeIds.includes(issue.task.college_id))) return bad(res, 403, 'Outside assigned college');
        const result = await prisma.$transaction(async tx => {
            const updated = await tx.heroTaskIssue.update({ where: { id: issue.id }, data: { status, resolution_notes: notes || issue.resolution_notes } });
            await tx.heroTaskEvent.create({ data: { task_id: issue.task_id, actor_id: req.user!.id, action: `ISSUE_${status}`, details: notes || null } });
            return updated;
        });
        return res.json({ success: true, data: result });
    } catch (e) { return errResponse(res, e, 'Could not update issue'); }
});

router.patch('/manager/proofs/:id/review', requireManager, async (req: OpsRequest, res) => {
    const status = safeString(req.body?.review_status, 30), note = safeString(req.body?.review_note, 700);
    if (!['APPROVED', 'NEEDS_MORE_EVIDENCE', 'FLAGGED'].includes(status)) return bad(res, 400, 'Invalid proof review status.');
    if (status !== 'APPROVED' && note.length < 8) return bad(res, 400, 'Please explain why evidence needs further review.');
    try {
        const proof = await prisma.heroTaskProof.findUnique({ where: { id: req.params.id }, include: { task: { select: { college_id: true } } } });
        if (!proof) return bad(res, 404, 'Evidence not found');
        if (!(req.ops!.admin || req.ops!.managerCollegeIds.includes(proof.task.college_id))) return bad(res, 403, 'Outside assigned college');
        const result = await prisma.$transaction(async tx => {
            const updated = await tx.heroTaskProof.update({
                where: { id: proof.id }, data: {
                    review_status: status, review_note: note || null, reviewed_by: req.user!.id, reviewed_at: new Date(),
                }
            });
            await tx.heroTaskEvent.create({ data: { task_id: proof.task_id, actor_id: req.user!.id, action: 'PROOF_' + status, details: note || proof.kind } });
            return updated;
        });
        return res.json({ success: true, data: result });
    } catch (e) { return errResponse(res, e, 'Could not review proof'); }
});

router.post('/manager/announcements', requireManager, async (req: OpsRequest, res) => {
    const collegeId = safeString(req.body?.college_id, 100) || targetCollege(req);
    if (!collegeId || !(req.ops!.admin || req.ops!.managerCollegeIds.includes(collegeId))) return bad(res, 403, 'Outside assigned college');
    const title = safeString(req.body?.title, 120), content = safeString(req.body?.content, 1200);
    const priority = safeString(req.body?.priority, 20) || 'NORMAL';
    if (title.length < 3 || content.length < 10 || !['NORMAL', 'URGENT'].includes(priority))
        return bad(res, 400, 'Provide title, message and valid priority.');
    try {
        const announcement = await prisma.heroAnnouncement.create({ data: { college_id: collegeId, author_id: req.user!.id, title, content, priority } });
        return res.status(201).json({ success: true, data: announcement });
    } catch (e) { return errResponse(res, e, 'Could not publish announcement'); }
});

// Admin-only manager onboarding. Manager may retain USER/CAMPUS_HERO role; no global-role escalation.
router.get('/admin/managers', requireAdmin, async (_req, res) => {
    try { return res.json({ success: true, data: await prisma.heroManagerAssignment.findMany({ include: { user: { select: { id: true, name: true, email: true } }, college: { select: { id: true, code: true } } } }) }); }
    catch (e) { return errResponse(res, e, 'Could not list manager assignments'); }
});
router.post('/admin/managers', requireAdmin, async (req: OpsRequest, res) => {
    const userId = safeString(req.body?.user_id, 100), collegeId = safeString(req.body?.college_id, 100);
    if (!userId || !collegeId) return bad(res, 400, 'user_id and college_id are required.');
    try {
        const [user, college] = await Promise.all([prisma.user.findUnique({ where: { id: userId } }), prisma.college.findUnique({ where: { id: collegeId } })]);
        if (!user || !college) return bad(res, 404, 'User or college not found.');
        const assigned = await prisma.heroManagerAssignment.upsert({
            where: { user_id_college_id: { user_id: userId, college_id: collegeId } },
            update: { is_active: true }, create: { user_id: userId, college_id: collegeId, is_active: true }
        });
        return res.status(201).json({ success: true, data: assigned });
    } catch (e) { return errResponse(res, e, 'Could not assign manager'); }
});
router.delete('/admin/managers/:id', requireAdmin, async (req, res) => {
    try {
        const result = await prisma.heroManagerAssignment.update({ where: { id: req.params.id }, data: { is_active: false } });
        return res.json({ success: true, data: result });
    } catch (e) { return errResponse(res, e, 'Could not revoke manager access'); }
});

export default router;
