const API_BASE = '/api/hero-ops';

export interface ManagerCollege {
    id: string;
    name: string;
    code: string;
}

export interface ManagerAccess {
    user: {
        id: string;
        name: string;
        email: string;
        phone: string;
        role: string;
        college: ManagerCollege;
    } | null;
    canHero: boolean;
    canManage: boolean;
    managerColleges: ManagerCollege[];
}

export interface CampusHero {
    id: string;
    name: string;
    email: string;
    phone: string;
    availability: string;
    active_tasks: number;
    completed_tasks: number;
}

interface Participant {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
}

export interface ManagerTask {
    id: string;
    task_type: string;
    status: string;
    assigned_hero_id: string | null;
    assigned_hero: Participant | null;
    college: ManagerCollege;
    product: {
        id: string;
        name: string;
        category: string;
        image_url: string;
    };
    seller: Participant | null;
    buyer: Participant | null;
    condition: string | null;
    description: string | null;
    pickup_notes: string | null;
    delivery_notes: string | null;
    photos: string[];
    quality_verified: boolean;
    due_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface ManagerEvent {
    id: string;
    task_id: string;
    action: string;
    details: string | null;
    from_status: string | null;
    to_status: string | null;
    created_at: string;
    actor: {
        id: string;
        name: string;
    };
}

export interface ManagerIssue {
    id: string;
    task_id: string;
    reporter: string;
    category: string;
    severity: string;
    description: string;
    status: string;
    resolution_notes: string | null;
    created_at: string;
}

export interface ManagerProof {
    id: string;
    task_id: string;
    kind: string;
    image_url: string;
    review_status: string;
    review_note: string | null;
    created_at: string;
    uploader?: {
        name: string;
    };
}

export interface ManagerAnnouncement {
    id: string;
    title: string;
    content: string;
    priority: string;
    created_at: string;
}

export interface ManagerMessage {
    id: string;
    sender_name: string;
    content: string;
    created_at: string;
    is_mine: boolean;
}

export interface ManagerAssignment {
    id: string;
    is_active: boolean;
    user: Participant;
    college: {
        id: string;
        code: string;
    };
}

export interface ManagerOverview {
    college: ManagerCollege;
    heroes: CampusHero[];
    tasks: ManagerTask[];
    events: ManagerEvent[];
    issues: ManagerIssue[];
    proofs: ManagerProof[];
    announcements: ManagerAnnouncement[];

    stats: {
        heroes: number;
        active: number;
        unassigned: number;
        completed: number;
        aging: number;
        open_issues: number;
    };
}

async function request<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const token = localStorage.getItem('campusmart_token');

    const headers = new Headers(options.headers);

    headers.set('Content-Type', 'application/json');

    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(
        `${API_BASE}${endpoint}`,
        {
            ...options,
            headers,
        }
    );

    const result = await response.json().catch(() => null);

    if (
        !response.ok ||
        !result ||
        result.success === false
    ) {
        throw new Error(
            result?.message ||
            `Request failed (${response.status})`
        );
    }

    return result.data as T;
}

export const heroManagerApi = {
    getAccess: () =>
        request<ManagerAccess>('/me'),

    getOverview: (collegeId: string) =>
        request<ManagerOverview>(
            `/manager/overview?college_id=${encodeURIComponent(collegeId)}`
        ),

    assignTask: (
        taskId: string,
        heroId: string | null,
        reason: string
    ) =>
        request<unknown>(
            `/manager/tasks/${taskId}/assign`,
            {
                method: 'PATCH',
                body: JSON.stringify({
                    hero_id: heroId,
                    reason,
                }),
            }
        ),

    resolveIssue: (
        issueId: string,
        status: string,
        notes: string
    ) =>
        request<unknown>(
            `/manager/issues/${issueId}`,
            {
                method: 'PATCH',
                body: JSON.stringify({
                    status,
                    resolution_notes: notes,
                }),
            }
        ),

    reviewProof: (
        proofId: string,
        status: string,
        note: string
    ) =>
        request<unknown>(
            `/manager/proofs/${proofId}/review`,
            {
                method: 'PATCH',
                body: JSON.stringify({
                    review_status: status,
                    review_note: note,
                }),
            }
        ),

    publishAnnouncement: (
        collegeId: string,
        title: string,
        content: string,
        priority: string
    ) =>
        request<ManagerAnnouncement>(
            '/manager/announcements',
            {
                method: 'POST',
                body: JSON.stringify({
                    college_id: collegeId,
                    title,
                    content,
                    priority,
                }),
            }
        ),

    getTaskHistory: (taskId: string) =>
        request<{
            events: ManagerEvent[];
            proofs: ManagerProof[];
        }>(`/tasks/${taskId}/proofs`),

    getMessages: (taskId: string) =>
        request<ManagerMessage[]>(
            `/tasks/${taskId}/messages`
        ),

    sendMessage: (
        taskId: string,
        receiverId: string,
        content: string
    ) =>
        request<unknown>(
            `/tasks/${taskId}/messages`,
            {
                method: 'POST',
                body: JSON.stringify({
                    receiver_id: receiverId,
                    content,
                }),
            }
        ),

    getManagers: () =>
        request<ManagerAssignment[]>(
            '/admin/managers'
        ),

    grantManagerAccess: (
        userId: string,
        collegeId: string
    ) =>
        request<unknown>(
            '/admin/managers',
            {
                method: 'POST',
                body: JSON.stringify({
                    user_id: userId,
                    college_id: collegeId,
                }),
            }
        ),

    revokeManagerAccess: (assignmentId: string) =>
        request<unknown>(
            `/admin/managers/${assignmentId}`,
            {
                method: 'DELETE',
            }
        ),
};