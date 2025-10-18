/**
 * Simple Tracking Configuration
 * Following @CLAUDE.md: Single Source of Truth, No Hardcoding
 */

import { OrderStatus } from '@prisma/client';

/**
 * Timeline stages mapping
 * Each status maps to a timeline stage number (1-5)
 */
export const ORDER_STATUS_TIMELINE: Record<OrderStatus, number | null> = {
  PENDING: null,           // Not on timeline - show "pending payment"
  PAID: 1,                 // Stage 1
  READY_TO_SHIP: 2,        // Stage 2
  IN_TRANSIT: 3,           // Stage 3
  OUT_FOR_DELIVERY: 4,     // Stage 4
  DELIVERED: 5,            // Stage 5
  CANCELLED: null,         // Not on timeline - show cancelled badge
  REFUNDED: null,          // Not on timeline - show refunded badge
};

/**
 * Timeline stage labels for display
 */
export const TIMELINE_STAGES = [
  { number: 1, label: 'Paid', description: 'Payment received' },
  { number: 2, label: 'Ready to Ship', description: 'Preparing for shipment' },
  { number: 3, label: 'In Transit', description: 'On the way' },
  { number: 4, label: 'Out for Delivery', description: 'Out for final delivery' },
  { number: 5, label: 'Delivered', description: 'Successfully delivered' },
] as const;

/**
 * Rate limiting configuration
 */
export const RATE_LIMIT_CONFIG = {
  MAX_REQUESTS: 10,
  WINDOW_MS: 60 * 60 * 1000, // 1 hour
} as const;

/**
 * Order number regex pattern
 * Format: ORD-YYYYMMDD-XXXX
 */
export const ORDER_NUMBER_PATTERN = /^ORD-\d{8}-[A-Z0-9]{4}$/i;

/**
 * Input validation
 */
export const TRACKING_INPUT_VALIDATION = {
  MIN_LENGTH: 1,
  MAX_LENGTH: 50,
} as const;

/**
 * UI Messages
 */
export const TRACKING_MESSAGES = {
  PENDING_PAYMENT: 'Order is pending payment confirmation',
  PREPARING_SHIPMENT: 'Preparing your order for shipment...',
  ORDER_NOT_FOUND: 'Order not found. Please check your order number and try again.',
  RATE_LIMITED: 'Too many tracking attempts. Please try again in {minutes} minutes.',
  CANCELLED: 'Order Cancelled',
  REFUNDED: 'Order Refunded',
} as const;
