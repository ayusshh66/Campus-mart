/* Typed API client for /api/hero-ops. Shares CampusMart's existing bearer token. */
const ROOT = '/api/hero-ops';
export type TaskStatus = 'ASSIGNED' | 'PICKED_UP' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED';
export type HeroAvailability = 'AVAILABLE' | 'BUSY' | 'OFF_DUTY';
export type HeroTask = {
  id: string; task_type: string; status: TaskStatus; assigned_hero_id: string | null;
  assigned_hero: { id: string; name: string; email?: string } | null;
  product: { id: string; name: string; image_url: string; category: string };
  college: { id: string; code: string; name: string };
  seller: { id: string; name: string; phone: string | null; email: string | null } | null;
  buyer: { id: string; name: string; phone: string | null; email: string | null } | null;
  photos: string[]; description: string | null; condition: string | null;
  pickup_notes: string | null; delivery_notes: string | null;
  quality_verified: boolean; due_at: string | null; created_at: string; updated_at: string;
};
export type OpsIssue = {
  id: string; task_id: string; reporter: string; category: string; severity: string;
  description: string; status: string; resolution_notes: string | null; created_at: string; updated_at: string;
};
export type OpsEvent = { id: string; task_id: string; actor: { id: string; name: string }; action: string;
  from_status: string | null; to_status: string | null; details: string | null; created_at: string };
export type OpsProof = { id: string; task_id: string; kind: string; image_url: string;
  note: string | null; created_at: string; uploader?: { name: string }; review_status: string; review_note?: string | null };
export type OpsAnnouncement = { id: string; title: string; content: string; priority: string; created_at: string };
export type OpsHero = { id: string; name: string; email: string; phone: string;
  availability: HeroAvailability; active_tasks: number; completed_tasks: number };
export type HeroOverview = { tasks: HeroTask[]; issues: OpsIssue[]; events: OpsEvent[];
  announcements: OpsAnnouncement[]; availability: HeroAvailability;
  stats: { available: number; active: number; pickups: number; completed: number; issues: number } };
export type ManagerOverview = { college: { id: string; name: string; code: string };
  tasks: HeroTask[]; heroes: OpsHero[]; issues: OpsIssue[]; events: OpsEvent[];
  announcements: OpsAnnouncement[]; proofs: OpsProof[];
  stats: { heroes: number; active: number; unassigned: number; completed: number; aging: number; open_issues: number } };
export type OpsMe = { canHero: boolean; canManage: boolean;
  user: { id: string; name: string; email: string; phone: string; role: string; college: { id: string; name: string; code: string } };
  managerColleges: Array<{ id: string; code: string; name: string }> };
export type OpsMessage = { id: string; content: string; created_at: string;
  sender_id: string; sender_name: string; is_mine: boolean };

async function call<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('campusmart_token');
  const response = await fetch(`${ROOT}${endpoint}`, {
    ...options, headers: { 'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok || !body?.success) throw new Error(body?.message || `Request failed (${response.status})`);
  return body.data as T;
}
const json = (value: unknown) => JSON.stringify(value);
export const heroOps = {
  me: () => call<OpsMe>('/me'),
  heroOverview: () => call<HeroOverview>('/hero/overview'),
  managerOverview: (collegeId?: string) => call<ManagerOverview>(`/manager/overview${collegeId ? '?college_id=' + encodeURIComponent(collegeId) : ''}`),
  availability: (status: HeroAvailability) => call<{ status: HeroAvailability }>('/hero/availability', { method: 'PATCH', body: json({ status }) }),
  claim: (id: string) => call<HeroTask>(`/hero/tasks/${id}/claim`, { method: 'POST' }),
  status: (id: string, status: TaskStatus, quality_verified = false, notes = '') => call<HeroTask>(`/hero/tasks/${id}/status`, {
    method: 'PATCH', body: json({ status, quality_verified, notes }) }),
  reportIssue: (id: string, category: string, severity: string, description: string) => call<OpsIssue>(`/hero/tasks/${id}/issues`, {
    method: 'POST', body: json({ category, severity, description }) }),
  addProof: (id: string, kind: 'PICKUP' | 'HANDOVER', image_url: string, note = '') => call<OpsProof>(`/hero/tasks/${id}/proofs`, {
    method: 'POST', body: json({ kind, image_url, note }) }),
  taskHistory: (id: string) => call<{ proofs: OpsProof[]; events: OpsEvent[] }>(`/tasks/${id}/proofs`),
  taskMessages: (id: string) => call<OpsMessage[]>(`/tasks/${id}/messages`),
  sendMessage: (id: string, receiver_id: string, content: string) => call<OpsMessage>(`/tasks/${id}/messages`, {
    method: 'POST', body: json({ receiver_id, content }) }),
  assign: (taskId: string, hero_id: string | null, reason = '') => call<HeroTask>(`/manager/tasks/${taskId}/assign`, {
    method: 'PATCH', body: json({ hero_id, reason }) }),
  resolveIssue: (id: string, status: string, resolution_notes = '') => call<OpsIssue>(`/manager/issues/${id}`, {
    method: 'PATCH', body: json({ status, resolution_notes }) }),
  reviewProof: (id: string, review_status: string, review_note = '') => call<OpsProof>(`/manager/proofs/${id}/review`, {
    method: 'PATCH', body: json({ review_status, review_note }) }),
  announce: (college_id: string, title: string, content: string, priority = 'NORMAL') => call<OpsAnnouncement>('/manager/announcements', {
    method: 'POST', body: json({ college_id, title, content, priority }) }),
  listManagers: () => call<any[]>('/admin/managers'),
  addManager: (user_id: string, college_id: string) => call<any>('/admin/managers', { method: 'POST', body: json({ user_id, college_id }) }),
  removeManager: (id: string) => call<any>(`/admin/managers/${id}`, { method: 'DELETE' }),
  // Uses the existing single-image upload endpoint; no new file-storage service required.
  upload: async (file: File): Promise<string> => {
    const form = new FormData(); form.append('image', file);
    const token = localStorage.getItem('campusmart_token');
    const res = await fetch('/api/upload', { method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {}, body: form });
    const data = await res.json();
    if (!res.ok || !data?.success) throw new Error(data?.message || 'Image upload failed');
    return data.data.url;
  },
};
