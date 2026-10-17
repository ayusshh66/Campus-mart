// CampusMart API Client

const API_BASE = '/api';

export interface College {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'USER' | 'ADMIN' | 'CAMPUS_HERO';
  college: {
    id: string;
    code: string;
    name: string;
  };
}

export interface Product {
  id: string;
  name: string;
  description: string;
  image_url: string;
  images?: string[];
  category: string;
  buy_price: number;
  upto_buy_price?: number;
  sell_price: number;
  is_buying_enabled: boolean;
  is_active?: boolean;
  is_available?: boolean;
  available_units?: number;
  quality_questions?: Array<{
    id: string;
    question: string;
    options: Array<{ label: string; deduction: number }>;
  }>;
  college_id?: string | null;
  college_code?: string | null;
  college_name?: string | null;
  _count?: {
    sell_requests: number;
    buy_requests: number;
  };
}

export interface SellRequestItem {
  id: string;
  user_id?: string;
  student_name?: string;
  student_email?: string;
  student_phone?: string;
  college_id?: string;
  college_code?: string;
  college_name?: string;
  product_id: string;
  product_name: string;
  product_image?: string;
  condition: string;
  description: string | null;
  images: string[];
  quality_answers?: Record<string, string>;
  estimated_price?: number;
  admin_buy_price: number;
  admin_sell_price?: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
  updated_at: string;
}

export interface BuyRequestItem {
  id: string;
  buyer_name?: string;
  buyer_email?: string;
  buyer_phone?: string;
  college_code?: string;
  college_name?: string;
  product_id?: string;
  product_name: string;
  product_image?: string;
  selling_price: number;
  status: 'PENDING' | 'APPROVED' | 'COMPLETED' | 'REJECTED';
  notes?: string | null;
  created_at: string;
}

export interface CampusHeroItem {
  id: string;
  user_id?: string;
  applicant_name?: string;
  applicant_email?: string;
  phone: string;
  college_code?: string;
  college_name?: string;
  branch: string;
  year: string;
  instagram?: string | null;
  linkedin?: string | null;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
}

export interface AdminStats {
  totalStudents: number;
  totalSellRequests: number;
  pendingSellRequests: number;
  totalBuyRequests: number;
  pendingBuyRequests: number;
  activeProducts: number;
  totalHeroApplications: number;
  pendingHeroApplications: number;
}

export interface MessageItem {
  id: string;
  task_id?: string;
  sender_id: string;
  sender_name: string;
  sender_display_name: string;
  receiver_id: string;
  receiver_name?: string;
  content: string;
  is_read: boolean;
  is_from_me?: boolean;
  is_hero_sender?: boolean;
  product_name?: string;
  created_at: string;
}

export interface DeliveryTaskItem {
  id: string;
  task_type: 'PICKUP' | 'DROP' | 'MATCHED_EXCHANGE';
  status: 'ASSIGNED' | 'PICKED_UP' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED';
  quality_verified: boolean;
  pickup_notes?: string;
  delivery_notes?: string;
  created_at: string;
  updated_at: string;
  product: {
    id: string;
    name: string;
    category: string;
    image_url: string;
    buy_price: number;
    sell_price: number;
  };
  seller: {
    id: string;
    name: string;
    phone: string;
    email: string;
    condition: string;
    estimated_payout: number;
    images: string[];
    quality_answers: Record<string, string>;
    description?: string;
    sell_request_id: string;
  } | null;
  buyer: {
    id: string;
    name: string;
    phone: string;
    email: string;
    price_to_collect: number;
    notes?: string;
    buy_request_id: string;
  } | null;
  messages: MessageItem[];
}

export interface HeroDashboardData {
  hero: {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    college_code?: string;
    college_name?: string;
  };
  stats: {
    active_tasks_count: number;
    completed_tasks_count: number;
    pending_pickups_count: number;
    pending_drops_count: number;
    unread_messages_count: number;
  };
  tasks: DeliveryTaskItem[];
}

export interface AutoMatchRule {
  id: string;
  name: string;
  category: string;
  image_url: string;
  buy_price: number;
  upto_buy_price?: number;
  sell_price: number;
  auto_match_enabled: boolean;
  max_campus_inventory: number;
  auto_accept_conditions: string[];
  require_photos_for_auto: boolean;
  min_payout_for_auto?: number;
}

// Request helper
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('campusmart_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'API request failed');
  }

  return data;
}

export const api = {
  // Colleges
  getColleges: async () => {
    const res = await request<{ success: boolean; data: College[] }>('/colleges');
    return res.data;
  },

  // Auth
  register: async (payload: { name: string; email: string; phone: string; password: string; college_id: string }) => {
    return request<{ success: boolean; message: string; data: { token: string; user: User } }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  login: async (payload: { email: string; password: string }) => {
    return request<{ success: boolean; message: string; data: { token: string; user: User } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getMe: async () => {
    const res = await request<{ success: boolean; data: User }>('/auth/me');
    return res.data;
  },

  // Products
  getProducts: async (college_id?: string) => {
    const query = college_id ? `?college_id=${encodeURIComponent(college_id)}` : '';
    const res = await request<{ success: boolean; college?: any; data: Product[] }>(`/products${query}`);
    return res;
  },

  getProductById: async (id: string, college_id?: string) => {
    const query = college_id ? `?college_id=${encodeURIComponent(college_id)}` : '';
    const res = await request<{ success: boolean; data: Product }>(`/products/${id}${query}`);
    return res.data;
  },

  // Sell Requests
  submitSellRequest: async (payload: {
    product_id: string;
    condition: string;
    images?: string[];
    description?: string;
    quality_answers?: Record<string, string>;
    estimated_price?: number;
  }) => {
    return request<{ success: boolean; message: string; data: any }>('/sell-requests', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getMySellRequests: async () => {
    const res = await request<{ success: boolean; data: SellRequestItem[] }>('/sell-requests/my');
    return res.data;
  },

  // Buy Requests
  submitBuyRequest: async (payload: { product_id: string; notes?: string }) => {
    return request<{ success: boolean; message: string; data: any }>('/buy-requests', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getMyBuyRequests: async () => {
    const res = await request<{ success: boolean; data: BuyRequestItem[] }>('/buy-requests/my');
    return res.data;
  },

  // Campus Heroes
  applyCampusHero: async (payload: { branch: string; year: string; phone?: string; instagram?: string; linkedin?: string; reason: string }) => {
    return request<{ success: boolean; message: string; data: any }>('/campus-heroes/apply', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getMyCampusHeroApplication: async () => {
    const res = await request<{ success: boolean; data: CampusHeroItem | null }>('/campus-heroes/my');
    return res.data;
  },

  // File Upload
  uploadImage: async (file: File) => {
    const token = localStorage.getItem('campusmart_token');
    const formData = new FormData();
    formData.append('image', file);

    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Image upload failed');
    }
    return data.data; // { url: '/uploads/...' }
  },

  // Admin APIs
  admin: {
    getStats: async () => {
      const res = await request<{ success: boolean; data: AdminStats }>('/admin/stats');
      return res.data;
    },

    getSellRequests: async (status?: string) => {
      const query = status ? `?status=${encodeURIComponent(status)}` : '';
      const res = await request<{ success: boolean; data: SellRequestItem[] }>(`/admin/sell-requests${query}`);
      return res.data;
    },

    reviewSellRequest: async (id: string, status: 'APPROVED' | 'REJECTED', admin_buy_price?: number, admin_sell_price?: number) => {
      return request<{ success: boolean; message: string; data: any }>(`/admin/sell-requests/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status, admin_buy_price, admin_sell_price }),
      });
    },

    getBuyRequests: async () => {
      const res = await request<{ success: boolean; data: BuyRequestItem[] }>('/admin/buy-requests');
      return res.data;
    },

    reviewBuyRequest: async (id: string, status: 'PENDING' | 'APPROVED' | 'COMPLETED' | 'REJECTED', notes?: string) => {
      return request<{ success: boolean; message: string; data: any }>(`/admin/buy-requests/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status, notes }),
      });
    },

    getProducts: async () => {
      const res = await request<{ success: boolean; data: Product[] }>('/admin/products');
      return res.data;
    },

    createProduct: async (payload: {
      name: string;
      category: string;
      description: string;
      image_url: string;
      buy_price: number;
      upto_buy_price?: number;
      sell_price: number;
      images?: string[];
      quality_questions?: any[];
      is_buying_enabled: boolean;
      is_active: boolean;
    }) => {
      return request<{ success: boolean; message: string; data: Product }>('/admin/products', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    updateProduct: async (id: string, payload: Partial<Product>) => {
      return request<{ success: boolean; message: string; data: Product }>(`/admin/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    },

    deleteProduct: async (id: string) => {
      return request<{ success: boolean; message: string }>(`/admin/products/${id}`, {
        method: 'DELETE',
      });
    },

    getCampusHeroes: async () => {
      const res = await request<{ success: boolean; data: CampusHeroItem[] }>('/admin/campus-heroes');
      return res.data;
    },

    reviewCampusHero: async (id: string, status: 'APPROVED' | 'REJECTED') => {
      return request<{ success: boolean; message: string; data: any }>(`/admin/campus-heroes/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
    },

    getAutoMatchRules: async () => {
      const res = await request<{ success: boolean; data: AutoMatchRule[] }>('/admin/auto-match/rules');
      return res.data;
    },

    updateAutoMatchRule: async (productId: string, payload: Partial<AutoMatchRule>) => {
      return request<{ success: boolean; message: string; data: any }>(`/admin/auto-match/rules/${productId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    },

    runAutoMatchScan: async () => {
      return request<{ success: boolean; message: string; data: any }>('/admin/auto-match/run', {
        method: 'POST',
      });
    },

    getDeliveryTasks: async () => {
      const res = await request<{ success: boolean; data: any[] }>('/admin/delivery-tasks');
      return res.data;
    },
  },

  // Campus Hero Dashboard APIs
  hero: {
    getDashboard: async () => {
      const res = await request<{ success: boolean; data: HeroDashboardData }>('/hero/dashboard');
      return res.data;
    },

    updateTaskStatus: async (
      id: string,
      payload: {
        status?: string;
        quality_verified?: boolean;
        pickup_notes?: string;
        delivery_notes?: string;
      }
    ) => {
      return request<{ success: boolean; message: string; data: any }>(`/hero/tasks/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    },

    sendMessage: async (taskId: string, payload: { receiver_id: string; content: string }) => {
      return request<{ success: boolean; message: string; data: any }>(`/hero/tasks/${taskId}/message`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
  },

  // Student In-Website Messages APIs
  messages: {
    getMyMessages: async () => {
      const res = await request<{ success: boolean; data: MessageItem[] }>('/messages/my');
      return res.data;
    },

    sendReply: async (payload: { task_id: string; content: string }) => {
      return request<{ success: boolean; message: string; data: any }>('/messages/reply', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
  },
};

