import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios';
import type { ApiResponse } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // Handle 401 Unauthorized - try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken } = response.data.data;
          localStorage.setItem('accessToken', accessToken);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed - logout user
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// ============================================
// TABLE & QR CODE APIs
// ============================================

export interface TableInfo {
  id: string;
  restaurant_id: string;
  table_number: string;
  capacity: number;
  location: string;
  status: string;
  restaurant_name: string;
  restaurant_logo?: string;
  tax_rate: number;
  service_charge_rate: number;
}

/**
 * Get table information by QR code (Public)
 */
export const getTableByQRCode = async (qrCode: string): Promise<ApiResponse<TableInfo>> => {
  const response = await api.get(`/tables/scan/${qrCode}`);
  return response.data;
};

// ============================================
// SESSION APIs
// ============================================

export interface CreateSessionRequest {
  table_id: string;
  customer_name: string;
  customer_phone?: string;
}

export interface SessionData {
  session_id: string;
  session_token: string;
  table_id: string;
  restaurant_id: string;
  customer_name: string;
  status: string;
  started_at: string;
}

export interface SessionDetail {
  id: string;
  restaurant_id: string;
  table_id: string;
  session_token: string;
  customer_name: string;
  customer_phone?: string;
  status: string;
  started_at: string;
  completed_at?: string;
  table_number: string;
  capacity: number;
  location: string;
  restaurant_name: string;
  restaurant_logo?: string;
  tax_rate: number;
  service_charge_rate: number;
  currency: string;
  orders: any[];
}

/**
 * Create a new dining session (Public)
 */
export const createSession = async (data: CreateSessionRequest): Promise<ApiResponse<SessionData>> => {
  const response = await api.post('/sessions', data);
  return response.data;
};

/**
 * Get session details by token (Public)
 */
export const getSessionByToken = async (sessionToken: string): Promise<ApiResponse<SessionDetail>> => {
  const response = await api.get(`/sessions/${sessionToken}`);
  return response.data;
};

/**
 * Complete a dining session (Public)
 */
export const completeSession = async (sessionToken: string): Promise<ApiResponse<null>> => {
  const response = await api.patch(`/sessions/${sessionToken}/complete`);
  return response.data;
};

// ============================================
// MENU APIs
// ============================================

export interface Category {
  id: string;
  restaurant_id: string;
  name: string;
  description?: string;
  image_url?: string;
  display_order: number;
  is_active: boolean;
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  category_id: string;
  category_name?: string;
  name: string;
  description?: string;
  image_url?: string;
  base_price: string;
  preparation_time?: number;
  is_available: boolean;
  is_featured: boolean;
  dietary_info?: Record<string, boolean>;
  allergens?: string[];
  display_order: number;
}

export interface MenuItemsQuery {
  categoryId?: string;
  search?: string;
  isAvailable?: boolean;
  isFeatured?: boolean;
  restaurantId?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedMenuItems {
  data: MenuItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

/**
 * Get all categories (Public)
 */
export const getCategories = async (restaurantId?: string): Promise<ApiResponse<Category[]>> => {
  const params = restaurantId ? { restaurantId } : {};
  const response = await api.get('/menu/categories', { params });
  return response.data;
};

/**
 * Get menu items with filters (Public)
 */
export const getMenuItems = async (query: MenuItemsQuery = {}): Promise<ApiResponse<MenuItem[]> & { pagination?: any }> => {
  const response = await api.get('/menu/items', { params: query });
  return response.data;
};

/**
 * Get menu item by ID (Public)
 */
export const getMenuItemById = async (itemId: string): Promise<ApiResponse<any>> => {
  const response = await api.get(`/menu/items/${itemId}`);
  return response.data;
};

// ============================================
// ORDER APIs
// ============================================

export interface PlaceOrderRequest {
  session_token: string;
  order_type?: 'dine_in' | 'takeaway' | 'delivery';
  items: {
    menu_item_id: string;
    quantity: number;
    selected_variants?: Record<string, any>;
    special_instructions?: string;
  }[];
  special_instructions?: string;
}

export interface PlacedOrder {
  id: string;
  order_number: number;
  restaurant_id: string;
  session_id: string;
  status: string;
  order_type: string;
  subtotal: string;
  tax_amount: string;
  service_charge: string;
  discount_amount: string;
  total_amount: string;
  special_instructions?: string;
  created_at: string;
  items: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  menu_item_name: string;
  quantity: number;
  unit_price: string;
  selected_variants?: Record<string, any>;
  special_instructions?: string;
  status: string;
  total_price: string;
}

/**
 * Place a new order (Public)
 */
export const placeOrder = async (data: PlaceOrderRequest): Promise<ApiResponse<PlacedOrder>> => {
  const response = await api.post('/orders', data);
  return response.data;
};

/**
 * Get order by ID (Public)
 */
export const getOrderById = async (orderId: string): Promise<ApiResponse<PlacedOrder>> => {
  const response = await api.get(`/orders/${orderId}`);
  return response.data;
};

/**
 * Get all orders for a session (Public)
 */
export const getSessionOrders = async (sessionToken: string): Promise<ApiResponse<PlacedOrder[]>> => {
  const response = await api.get(`/sessions/${sessionToken}/orders`);
  return response.data;
};

export default api;
