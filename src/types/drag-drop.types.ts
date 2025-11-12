/**
 * Drag & Drop Types
 * Generic types for drag-drop reordering functionality
 */

/**
 * Base interface for any draggable item
 * Must have id and sortOrder properties
 */
export interface DraggableItem {
  id: string;
  sortOrder: number;
}

/**
 * Single item in reorder request
 */
export interface ReorderItem {
  id: string;
  sortOrder: number;
}

/**
 * Request body for reordering items
 */
export interface ReorderRequest {
  items: ReorderItem[];
}

/**
 * Response from reorder API
 */
export interface ReorderResponse {
  success: boolean;
  message: string;
  updatedCount: number;
}

/**
 * Drag event data
 */
export interface DragEventData {
  activeId: string;
  overId: string;
}
