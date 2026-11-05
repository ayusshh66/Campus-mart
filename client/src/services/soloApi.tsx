    export type SoloScope = 'OPEN_TO_ALL' | 'SAME_COLLEGE_ONLY';
export type SoloStatus = 'OPEN' | 'CLOSED';

export interface SoloPost {
  id: string;
  user_id: string;
  college_id: string;
  hackathon_name: string;
  headline: string;
  description: string;
  skills: string[];
  preferred_roles: string[];
  eligibility_rules: SoloScope;
  status: SoloStatus;
  created_at: string;
  user: {
    id: string;
    name: string;
    college: { id: string; code: string; name: string };
    hackathon_profile: {
      experience_level: string;
      github_url: string | null;
      portfolio_url: string | null;
    } | null;
  };
}

export type NewSoloPost = Pick<SoloPost,
  'hackathon_name' | 'headline' | 'description' | 'skills' | 'preferred_roles' | 'eligibility_rules'
>;

async function soloRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('campusmart_token');
  const response = await fetch(`/api/solo-posts${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
  const data = await response.json().catch(() => ({ message: 'Invalid response from server.' }));
  if (!response.ok) throw new Error(data.message || 'Request failed');
  return data as T;
}

export const soloApi = {
  browse: async (search = '', college = '', page = 1) => {
    const params = new URLSearchParams({ page: String(page) });
    if (search.trim()) params.set('search', search.trim());
    if (college) params.set('college', college);
    return soloRequest<{ success: true; count: number; page: number; data: SoloPost[] }>(`/?${params}`);
  },
  mine: async () => {
    const result = await soloRequest<{ success: true; data: SoloPost[] }>('/mine');
    return result.data;
  },
  create: async (post: NewSoloPost) => {
    return soloRequest<{ success: true; data: SoloPost; message: string }>('/', { method: 'POST', body: JSON.stringify(post) });
  },
  setStatus: async (id: string, status: SoloStatus) => {
    return soloRequest<{ success: true; message: string }>(`/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ status }) });
  },
};
