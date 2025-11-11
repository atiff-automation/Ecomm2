/**
 * API Types - Malaysian E-commerce Platform
 * Centralized type definitions for API operations and responses
 *
 * This file consolidates all API-related types that were previously
 * scattered across multiple components and services.
 */

// Base API Response Types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
  pagination?: PaginationMeta;
  timestamp: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// API Error Types
export interface APIError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  path?: string;
  method?: string;
}

export type APIErrorCode =
  | 'VALIDATION_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'AUTHORIZATION_ERROR'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMIT_EXCEEDED'
  | 'SERVER_ERROR'
  | 'NETWORK_ERROR'
  | 'TIMEOUT_ERROR'
  | 'UNKNOWN_ERROR';

// Request Configuration
export interface APIRequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  cache?: boolean;
  cacheKey?: string;
  cacheTTL?: number;
}

// API Client Configuration
export interface APIClientConfig {
  baseURL: string;
  timeout: number;
  retries: number;
  retryDelay: number;
  enableCache: boolean;
  defaultCacheTTL: number;
  enableLogging: boolean;
  enableMetrics: boolean;
}

// Product API Types
export interface ProductListParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  featured?: boolean;
  sortBy?: 'created' | 'name' | 'price' | 'rating';
  sortOrder?: 'asc' | 'desc';
  priceMin?: number;
  priceMax?: number;
  inStock?: boolean;
  features?: ('featured' | 'promotional' | 'member-qualifying')[];
}

export interface ProductExportParams {
  // Export specific product IDs (takes precedence over filters)
  productIds?: string[];
  // Filter-based export parameters (only used if productIds is empty)
  search?: string;
  categoryId?: string;
  status?: string;
}

export interface ProductResponse {
  id: string;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  sku: string;
  regularPrice: number;
  memberPrice: number;
  promotionalPrice?: number;
  stockQuantity: number;
  featured: boolean;
  isPromotional: boolean;
  isQualifyingForMembership: boolean;
  promotionStartDate?: string;
  promotionEndDate?: string;
  memberOnlyUntil?: string;
  earlyAccessStart?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: any;
  averageRating: number;
  reviewCount: number;
  categories: CategoryResponse[];
  images: ProductImageResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductImageResponse {
  id: string;
  url: string;
  altText?: string;
  sortOrder: number;
  isPrimary: boolean;
}

export interface CategoryResponse {
  id: string;
  name: string;
  slug: string;
  description?: string;
  productCount?: number;
  parentId?: string;
  children?: CategoryResponse[];
}

// Cart API Types
export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  product: ProductResponse;
  createdAt: string;
  updatedAt: string;
}

export interface CartResponse {
  id: string;
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  memberDiscount: number;
  promotionalDiscount: number;
  total: number;
  // Membership qualification data (optional for backward compatibility)
  qualifyingTotal?: number;
  membershipThreshold?: number;
  qualifiesForMembership?: boolean;
  membershipProgress?: number;
  membershipRemaining?: number;
  updatedAt: string;
}

export interface AddToCartRequest {
  productId: string;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

// Review API Types
export interface ReviewResponse {
  id: string;
  rating: number;
  title?: string;
  comment?: string;
  isVerifiedPurchase: boolean;
  productId: string;
  userId: string;
  user: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateReviewRequest {
  productId: string;
  rating: number;
  title?: string;
  comment?: string;
}

// Order API Types
export interface OrderResponse {
  id: string;
  orderNumber: string;
  status:
    | 'PENDING'
    | 'CONFIRMED'
    | 'PROCESSING'
    | 'SHIPPED'
    | 'DELIVERED'
    | 'CANCELLED';
  items: OrderItem[];
  subtotal: number;
  memberDiscount: number;
  promotionalDiscount: number;
  shippingFee: number;
  total: number;
  shippingAddress: AddressResponse;
  billingAddress?: AddressResponse;
  paymentMethod: string;
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  product: ProductResponse;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface AddressResponse {
  id: string;
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

// Cache Types
export interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
  key: string;
}

export interface CacheManager {
  get<T>(key: string): T | null;
  set<T>(key: string, data: T, ttl?: number): void;
  delete(key: string): void;
  clear(): void;
  has(key: string): boolean;
  size(): number;
}

// Metrics Types
export interface APIMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  cacheHitRate: number;
  errorsByCode: Record<APIErrorCode, number>;
  requestsByEndpoint: Record<string, number>;
}

// Event Types
export type APIEvent =
  | 'REQUEST_START'
  | 'REQUEST_SUCCESS'
  | 'REQUEST_ERROR'
  | 'CACHE_HIT'
  | 'CACHE_MISS'
  | 'RETRY_ATTEMPT';

export interface APIEventPayload {
  event: APIEvent;
  url: string;
  method: string;
  duration?: number;
  error?: APIError;
  cacheKey?: string;
  retryCount?: number;
  timestamp: Date;
}

export type APIEventListener = (payload: APIEventPayload) => void;

// Validation Types
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string[]>;
}

export interface FieldValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

export interface ValidationSchema {
  [field: string]: FieldValidation;
}
