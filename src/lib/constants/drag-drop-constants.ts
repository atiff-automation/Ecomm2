/**
 * Drag & Drop Constants
 * Single source of truth for all drag-drop configuration
 * Following CLAUDE.md: No hardcoding, centralized configuration
 */

export const DRAG_DROP_CONSTANTS = {
  /**
   * API Routes for reordering
   */
  API_ROUTES: {
    REORDER_CATEGORIES: '/api/admin/faq-categories/reorder',
    REORDER_FAQS: '/api/admin/faqs/reorder',
  },

  /**
   * Drag & Drop Configuration
   */
  CONFIG: {
    /** Animation duration in milliseconds */
    ANIMATION_DURATION: 200,

    /** Collision detection algorithm */
    COLLISION_DETECTION: 'closestCenter' as const,

    /** Scroll sensitivity threshold (0-1) */
    SCROLL_THRESHOLD: 0.5,

    /** Maximum items allowed in single reorder request */
    MAX_ITEMS_PER_REQUEST: 100,
  },

  /**
   * User-facing messages
   */
  MESSAGES: {
    SUCCESS: 'Order updated successfully',
    ERROR: 'Failed to update order. Please try again.',
    OPTIMISTIC_UPDATE: 'Updating order...',
    VALIDATION_ERROR: 'Invalid reorder data',
    NETWORK_ERROR: 'Network error. Changes have been reverted.',
  },

  /**
   * Accessibility labels and instructions
   */
  ACCESSIBILITY: {
    DRAG_HANDLE_LABEL: 'Drag to reorder',
    KEYBOARD_INSTRUCTIONS: 'Press space to pick up, arrow keys to move, space to drop',
    ANNOUNCE_PICKUP: 'Item picked up. Use arrow keys to move, space to drop.',
    ANNOUNCE_DROP: 'Item dropped. New position saved.',
    ANNOUNCE_CANCEL: 'Reordering cancelled.',
  },

  /**
   * Visual styling
   */
  STYLES: {
    DRAGGING_OPACITY: 0.5,
    DROP_ZONE_HIGHLIGHT: 'bg-blue-50',
    DRAG_HANDLE_SIZE: 'w-4 h-4',
    DRAG_HANDLE_COLOR: 'text-gray-400',
  },
} as const;
