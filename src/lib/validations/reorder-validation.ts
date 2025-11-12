/**
 * Reorder Validation Schemas
 * Zod schemas for validating reorder API requests
 * Following CLAUDE.md: All user inputs must be validated with Zod schemas
 */

import { z } from 'zod';
import { DRAG_DROP_CONSTANTS } from '@/lib/constants/drag-drop-constants';

/**
 * Schema for a single reorder item
 * Must have valid ID (CUID format) and non-negative sortOrder
 */
export const reorderItemSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  sortOrder: z.number().int().min(0, 'Sort order must be non-negative'),
});

/**
 * Schema for reorder request body
 * Must contain 1-100 items (max limit from constants)
 */
export const reorderRequestSchema = z.object({
  items: z
    .array(reorderItemSchema)
    .min(1, 'At least one item is required')
    .max(
      DRAG_DROP_CONSTANTS.CONFIG.MAX_ITEMS_PER_REQUEST,
      `Cannot reorder more than ${DRAG_DROP_CONSTANTS.CONFIG.MAX_ITEMS_PER_REQUEST} items at once`
    ),
});

/**
 * Type inference from schemas
 */
export type ReorderItemData = z.infer<typeof reorderItemSchema>;
export type ReorderRequestData = z.infer<typeof reorderRequestSchema>;
