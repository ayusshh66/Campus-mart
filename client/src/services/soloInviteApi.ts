export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED';

export interface ReceivedSoloInvitation {
  id: string;
  status: InvitationStatus;
  role_offered: string;
  message: string;
  created_at: string;
  sender: { id: string; name: string };
  team_post: {
    id: string;
    team_title: string;
    hackathon_name: string;
    status: string;
    application_deadline: string;
  };
  solo_post: { id: string; headline: string };
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('campusmart_token');
  const response = await fetch(`/api/solo-invites${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const result = await response.json().catch(() => ({ message: 'Invalid server response' }));
  if (!response.ok) throw new Error(result.message || 'Could not process invitation');
  return result as T;
}

export const soloInviteApi = {
  send: (payload: { solo_post_id: string; team_post_id: string; role_offered: string; message: string }) =>
    request<{ success: true; message: string }>('/', { method: 'POST', body: JSON.stringify(payload) }),
  received: async () => {
    const result = await request<{ success: true; data: ReceivedSoloInvitation[] }>('/received');
    return result.data;
  },
  respond: (id: string, status: 'ACCEPTED' | 'DECLINED') =>
    request<{ success: true; message: string }>(`/${encodeURIComponent(id)}/respond`, {
      method: 'PATCH', body: JSON.stringify({ status }),
    }),
};
