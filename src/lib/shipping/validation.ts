/**
 * Centralized Shipping Settings Validation
 *
 * Single source of truth for all shipping settings validation.
 * This schema is used across frontend forms, API routes, and service layer.
 *
 * @module shipping/validation
 */

import { z } from 'zod';
import { COURIER_SELECTION_STRATEGIES, PRIORITY_COURIER_CONFIG } from './constants';

/**
 * Shipping Settings Validation Schema
 *
 * Use this schema everywhere validation is needed:
 * - Frontend forms (React Hook Form)
 * - API route validation
 * - Service layer validation
 */
export const ShippingSettingsValidationSchema = z.object({
  // API Configuration
  apiKey: z
    .string()
    .min(1, 'API key is required')
    .regex(/^[A-Za-z0-9_\-+=/.]+$/, 'Invalid API key format'),

  environment: z.enum(['sandbox', 'production'], {
    errorMap: () => ({ message: 'Environment must be either "sandbox" or "production"' }),
  }),

  // Courier Selection
  courierSelectionMode: z.enum(
    [
      COURIER_SELECTION_STRATEGIES.CHEAPEST,
      COURIER_SELECTION_STRATEGIES.SHOW_ALL,
      COURIER_SELECTION_STRATEGIES.SELECTED,
      COURIER_SELECTION_STRATEGIES.PRIORITY,
    ],
    {
      errorMap: () => ({ message: 'Invalid courier selection mode' }),
    }
  ),

  selectedCouriers: z.array(z.string()).optional(),

  // Priority Couriers (for priority mode)
  priorityCouriers: z.object({
    first: z.string().min(1, '1st priority courier is required'),
    second: z.string().optional(),
    third: z.string().optional(),
  }).optional(),

  // Free Shipping
  freeShippingEnabled: z.boolean(),

  freeShippingThreshold: z
    .number()
    .min(1, 'Threshold must be at least RM 1')
    .max(10000, 'Threshold cannot exceed RM 10,000')
    .optional(),

  // Automation
  autoUpdateOrderStatus: z.boolean(),

  // Notifications
  whatsappNotificationsEnabled: z.boolean(),
})
  // Conditional validation: if courierSelectionMode is "selected", require selectedCouriers
  .refine(
    (data) => {
      if (data.courierSelectionMode === COURIER_SELECTION_STRATEGIES.SELECTED) {
        return data.selectedCouriers && data.selectedCouriers.length > 0;
      }
      return true;
    },
    {
      message: 'At least one courier must be selected when using "Selected Couriers" mode',
      path: ['selectedCouriers'],
    }
  )
  // Conditional validation: if courierSelectionMode is "priority", require priorityCouriers.first
  .refine(
    (data) => {
      if (data.courierSelectionMode === COURIER_SELECTION_STRATEGIES.PRIORITY) {
        return data.priorityCouriers && data.priorityCouriers.first;
      }
      return true;
    },
    {
      message: '1st priority courier is required when using "Priority Courier" mode',
      path: ['priorityCouriers', 'first'],
    }
  )
  // Conditional validation: priority couriers must be unique
  .refine(
    (data) => {
      if (data.courierSelectionMode === COURIER_SELECTION_STRATEGIES.PRIORITY && data.priorityCouriers) {
        const { first, second, third } = data.priorityCouriers;
        const couriers = [first, second, third].filter(Boolean);
        const uniqueCouriers = new Set(couriers);
        return couriers.length === uniqueCouriers.size;
      }
      return true;
    },
    {
      message: 'Priority couriers must be unique (cannot select the same courier multiple times)',
      path: ['priorityCouriers'],
    }
  )
  // Conditional validation: if freeShippingEnabled, require threshold
  .refine(
    (data) => {
      if (data.freeShippingEnabled) {
        return data.freeShippingThreshold !== undefined && data.freeShippingThreshold > 0;
      }
      return true;
    },
    {
      message: 'Free shipping threshold is required when free shipping is enabled',
      path: ['freeShippingThreshold'],
    }
  );

/**
 * Type inference from validation schema
 */
export type ShippingSettingsFormData = z.infer<typeof ShippingSettingsValidationSchema>;
