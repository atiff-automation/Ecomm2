/**
 * Customer Tracking Type Definitions
 * Centralized type definitions to eliminate duplication
 * Based on CUSTOMER_TRACKING_IMPLEMENTATION_PLAN.md
 */

// Core tracking data structures
export interface TrackingEvent {
  eventName: string;
  description: string;
  timestamp: string;
  location?: string;
  eventCode?: string;
}

export interface ShipmentInfo {
  id?: string;
  trackingNumber?: string;
  status?: string;
  courierName?: string;
  serviceName?: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
}

export interface OrderBasicInfo {
  id: string;
  orderNumber: string;
  status: string;
  orderDate: string;
}

// Customer tracking interfaces
export interface CustomerTrackingData extends OrderBasicInfo {
  trackingNumber?: string;
  courierName?: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
  hasShipment: boolean;
  trackingEvents: TrackingEvent[];
}

// Guest tracking interfaces (filtered data)
export interface GuestTrackingData extends OrderBasicInfo {
  hasShipment: boolean;
  courierName?: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
  basicEvents?: Array<{
    eventName: string;
    timestamp: string;
  }>;
}

// API Request/Response types
export interface GuestTrackingRequest {
  orderNumber: string;
  email?: string;
  phone?: string;
}

export interface CustomerTrackingResponse {
  success: boolean;
  tracking?: CustomerTrackingData;
  error?: string;
}

export interface GuestTrackingResponse {
  success: boolean;
  tracking?: GuestTrackingData;
  error?: string;
  retryAfter?: number;
  rateLimitInfo?: {
    remaining: number;
    resetTime: number;
  };
}

// Rate limiting types
export interface RateLimitInfo {
  allowed: boolean;
  remaining?: number;
  resetTime?: number;
  totalRequests?: number;
}

export interface RateLimitStorage {
  [key: string]: {
    requests: number;
    resetTime: number;
  };
}

// Component prop types
export interface OrderTrackingCardProps {
  order: {
    id: string;
    orderNumber: string;
    status: string;
    shipment?: {
      trackingNumber?: string;
      status?: string;
      courierName?: string;
      estimatedDelivery?: string;
    };
  };
  className?: string;
  showFullDetails?: boolean;
}

export interface TrackingTimelineProps {
  events: TrackingEvent[];
  currentStatus: string;
  estimatedDelivery?: string;
  className?: string;
  maxEvents?: number;
}

export interface TrackingStatusProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'badge' | 'text' | 'full';
  showIcon?: boolean;
  className?: string;
}

export interface GuestTrackingFormProps {
  onSubmit: (data: GuestTrackingRequest) => void;
  loading?: boolean;
  error?: string;
  className?: string;
}

export interface GuestTrackingResultsProps {
  tracking: GuestTrackingData;
  onRefresh?: () => void;
  onBack?: () => void;
  refreshing?: boolean;
  className?: string;
}

// Status mapping types
export type StatusMapping = {
  keywords: string[];
  color: string;
  icon: string;
  priority: number;
  isTerminal: boolean;
};

export type StatusKey =
  | 'DELIVERED'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'PROCESSING'
  | 'PENDING'
  | 'EXCEPTION'
  | 'UNKNOWN';

// Validation types
export interface ValidationResult {
  isValid: boolean;
  error?: string;
  data?: any;
}

export interface FormValidationErrors {
  [field: string]: string;
}

// Security types
export interface SecurityLog {
  timestamp: string;
  ip: string;
  userAgent?: string;
  orderNumber?: string;
  success: boolean;
  error?: string;
  rateLimited?: boolean;
}

// Performance monitoring types
export interface TrackingMetrics {
  apiResponseTime: number;
  cacheHitRate: number;
  errorRate: number;
  requestVolume: number;
  timestamp: string;
}

// Courier integration types
export interface CourierInfo {
  displayName: string;
  color: string;
  category: 'postal' | 'express' | 'international' | 'other';
  supportedFeatures: {
    realTimeTracking: boolean;
    estimatedDelivery: boolean;
    locationTracking: boolean;
  };
}

export interface DeliveryEstimate {
  min: number;
  max: number;
  unit: 'hours' | 'days';
}

// Environment configuration types
export interface TrackingEnvironmentConfig {
  isDevelopment: boolean;
  isProduction: boolean;
  isTest: boolean;
  apiUrl: string;
  enableLogging: boolean;
  enableMetrics: boolean;
}

// Error types
export class TrackingError extends Error {
  code: string;
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, code: string, statusCode = 500) {
    super(message);
    this.name = 'TrackingError';
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

export class RateLimitError extends TrackingError {
  retryAfter: number;

  constructor(message: string, retryAfter: number) {
    super(message, 'RATE_LIMIT_EXCEEDED', 429);
    this.retryAfter = retryAfter;
  }
}

export class ValidationError extends TrackingError {
  field?: string;

  constructor(message: string, field?: string) {
    super(message, 'VALIDATION_ERROR', 400);
    this.field = field;
  }
}

export class AuthorizationError extends TrackingError {
  constructor(message: string) {
    super(message, 'UNAUTHORIZED', 401);
  }
}
