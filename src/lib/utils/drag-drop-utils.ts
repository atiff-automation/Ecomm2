/**
 * Drag & Drop Utility Functions
 * Reusable helper functions for drag-drop operations
 * Following CLAUDE.md: DRY principle - extract common patterns
 */

import type { DraggableItem } from '@/types/drag-drop.types';

/**
 * Move array element from one index to another
 * Pure function - does not mutate original array
 *
 * @param array - Source array
 * @param from - Source index
 * @param to - Destination index
 * @returns New array with element moved
 */
export function arrayMove<T>(array: T[], from: number, to: number): T[] {
  const newArray = [...array];
  const [item] = newArray.splice(from, 1);
  newArray.splice(to, 0, item);
  return newArray;
}

/**
 * Recalculate sortOrder for all items after reorder
 * Ensures sequential ordering (0, 1, 2, 3...)
 *
 * @param items - Array of draggable items
 * @param activeId - ID of item being dragged
 * @param overId - ID of item being dragged over
 * @returns New array with recalculated sortOrder
 */
export function recalculateSortOrder<T extends DraggableItem>(
  items: T[],
  activeId: string,
  overId: string
): T[] {
  const oldIndex = items.findIndex((item) => item.id === activeId);
  const newIndex = items.findIndex((item) => item.id === overId);

  // Invalid indices - return original array
  if (oldIndex === -1 || newIndex === -1) {
    return items;
  }

  // Reorder array
  const reordered = arrayMove(items, oldIndex, newIndex);

  // Recalculate sortOrder to ensure sequential ordering
  return reordered.map((item, index) => ({
    ...item,
    sortOrder: index,
  }));
}

/**
 * Extract only id and sortOrder for API payload
 * Reduces payload size by removing unnecessary data
 *
 * @param items - Array of draggable items
 * @returns Minimal array with only id and sortOrder
 */
export function prepareReorderPayload<T extends DraggableItem>(
  items: T[]
): Array<{ id: string; sortOrder: number }> {
  return items.map(({ id, sortOrder }) => ({ id, sortOrder }));
}

/**
 * Check if two arrays have the same order
 * Useful for detecting if reordering actually changed anything
 *
 * @param arr1 - First array
 * @param arr2 - Second array
 * @returns True if arrays have same order
 */
export function isSameOrder<T extends DraggableItem>(
  arr1: T[],
  arr2: T[]
): boolean {
  if (arr1.length !== arr2.length) return false;

  return arr1.every((item, index) => item.id === arr2[index].id);
}

/**
 * Validate that sortOrder values are sequential starting from 0
 * Used for data integrity checks
 *
 * @param items - Array of draggable items
 * @returns True if sortOrder is valid
 */
export function isValidSortOrder<T extends DraggableItem>(
  items: T[]
): boolean {
  const sorted = [...items].sort((a, b) => a.sortOrder - b.sortOrder);

  return sorted.every((item, index) => item.sortOrder === index);
}
