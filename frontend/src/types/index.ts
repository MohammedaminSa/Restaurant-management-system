// Enums
export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  RESTAURANT_ADMIN = 'restaurant_admin',
  KITCHEN_STAFF = 'kitchen_staff',
  WAITER = 'waiter',
  CASHIER = 'cashier',
}

export enum TableStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  RESERVED = 'reserved',
  MAINTENANCE = 'maintenance',
}

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  READY = 'ready',
  SERVED = 'served',
  CANCELLED = 'cancelled',
}

export enum OrderType {
  DINE_IN = 'dine_in',
  TAKEAWAY = 'takeaway',
  DELIVERY = 'delivery',
}

export enum SessionStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

// Models
export interface User {
  id: string;
  email: string;
  role: UserRole;
  restaurantId?: string;
  name: string;
  phone?: string;
  avatarUrl?: string;
  isActive: boolean;
}

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  address?: string;
  phone?: string;
  email?: string;
  timezone: string;
  currency: string;
  taxRate: number;
  serviceChargeRate: number;
  isActive: boolean;
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  categoryId: string;
  name: string;
  description?: string;
  imageUrl?: string;
  basePrice: number;
  preparationTime?: number;
  isAvailable: boolean;
  isFeatured: boolean;
  dietaryInfo?: Record<string, boolean>;
  allergens?: string[];
  displayOrder: number;
}

export interface Category {
  id: string;
  restaurantId: string;
  name: string;
  description?: string;
  imageUrl?: string;
  displayOrder: number;
  isActive: boolean;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  selectedVariants?: Record<string, any>;
  specialInstructions?: string;
}

export interface Order {
  id: string;
  restaurantId: string;
  sessionId: string;
  orderNumber: number;
  status: OrderStatus;
  orderType: OrderType;
  subtotal: number;
  taxAmount: number;
  serviceCharge: number;
  discountAmount: number;
  totalAmount: number;
  specialInstructions?: string;
  createdAt: string;
  items: OrderItem[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  quantity: number;
  unitPrice: number;
  selectedVariants?: Record<string, any>;
  specialInstructions?: string;
  status: string;
  totalPrice: number;
  menuItem?: MenuItem;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}
