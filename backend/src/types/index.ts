import { Request } from 'express';

// Extend Express Request to include user from JWT
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    restaurantId?: string;
  };
}

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

export enum OrderItemStatus {
  PENDING = 'pending',
  PREPARING = 'preparing',
  READY = 'ready',
  SERVED = 'served',
  CANCELLED = 'cancelled',
}

export enum SessionStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  DIGITAL_WALLET = 'digital_wallet',
  ONLINE = 'online',
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED_AMOUNT = 'fixed_amount',
}

export enum VariantType {
  SINGLE_SELECT = 'single_select',
  MULTI_SELECT = 'multi_select',
}

export enum InventoryTransactionType {
  RESTOCK = 'restock',
  CONSUMPTION = 'consumption',
  ADJUSTMENT = 'adjustment',
  WASTAGE = 'wastage',
}

// Database Models
export interface User {
  id: string;
  email: string;
  password_hash: string;
  role: UserRole;
  restaurant_id?: string;
  name: string;
  phone?: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  address?: string;
  phone?: string;
  email?: string;
  timezone: string;
  currency: string;
  tax_rate: number;
  service_charge_rate: number;
  is_active: boolean;
  opening_hours?: any;
  settings?: any;
  created_at: Date;
  updated_at: Date;
}

export interface Table {
  id: string;
  restaurant_id: string;
  table_number: string;
  qr_code: string;
  capacity: number;
  location?: string;
  status: TableStatus;
  current_session_id?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Category {
  id: string;
  restaurant_id: string;
  name: string;
  description?: string;
  image_url?: string;
  display_order: number;
  is_active: boolean;
  parent_category_id?: string;
  created_at: Date;
  updated_at: Date;
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  category_id: string;
  name: string;
  description?: string;
  image_url?: string;
  base_price: number;
  preparation_time?: number;
  is_available: boolean;
  is_featured: boolean;
  dietary_info?: any;
  allergens?: any;
  nutritional_info?: any;
  display_order: number;
  created_at: Date;
  updated_at: Date;
}

export interface OrderSession {
  id: string;
  restaurant_id: string;
  table_id: string;
  session_token: string;
  customer_name?: string;
  customer_phone?: string;
  status: SessionStatus;
  started_at: Date;
  completed_at?: Date;
}

export interface Order {
  id: string;
  restaurant_id: string;
  session_id: string;
  order_number: number;
  status: OrderStatus;
  order_type: OrderType;
  subtotal: number;
  tax_amount: number;
  service_charge: number;
  discount_amount: number;
  total_amount: number;
  special_instructions?: string;
  created_by_user_id?: string;
  assigned_to_waiter_id?: string;
  created_at: Date;
  updated_at: Date;
  confirmed_at?: Date;
  completed_at?: Date;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  unit_price: number;
  selected_variants?: any;
  special_instructions?: string;
  status: OrderItemStatus;
  total_price: number;
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
