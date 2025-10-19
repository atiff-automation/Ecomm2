/**
 * Bulk Selection Hook - JRM E-commerce Platform
 * Reusable hook for managing bulk selection state following CLAUDE.md principles
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import { BULK_OPERATIONS_CONFIG } from '@/lib/config/bulk-operations';

export interface BulkSelectionState<T = string> {
  selectedItems: Set<T>;
  isAllSelected: boolean;
  isPartiallySelected: boolean;
  selectedCount: number;
  canSelectMore: boolean;
  maxSelectionReached: boolean;
}

export interface BulkSelectionActions<T = string> {
  selectItem: (item: T) => void;
  unselectItem: (item: T) => void;
  toggleItem: (item: T) => void;
  selectAll: (items: T[]) => void;
  unselectAll: () => void;
  toggleAll: (items: T[]) => void;
  clearSelection: () => void;
  isSelected: (item: T) => boolean;
}

export interface UseBulkSelectionOptions {
  maxSelection?: number;
  onSelectionChange?: (selectedItems: Set<string>) => void;
  onMaxSelectionExceeded?: () => void;
}

export interface UseBulkSelectionReturn<T = string>
  extends BulkSelectionState<T>,
    BulkSelectionActions<T> {}

/**
 * Hook for managing bulk selection state with validation and limits
 */
export function useBulkSelection<T = string>(
  options: UseBulkSelectionOptions = {}
): UseBulkSelectionReturn<T> {
  const {
    maxSelection = BULK_OPERATIONS_CONFIG.MAX_SELECTION_SIZE,
    onSelectionChange,
    onMaxSelectionExceeded,
  } = options;

  const [selectedItems, setSelectedItems] = useState<Set<T>>(new Set());

  // Derived state
  const state = useMemo((): BulkSelectionState<T> => {
    const selectedCount = selectedItems.size;
    const maxSelectionReached = selectedCount >= maxSelection;
    const canSelectMore = selectedCount < maxSelection;

    return {
      selectedItems,
      isAllSelected: false, // Will be calculated per context
      isPartiallySelected: selectedCount > 0,
      selectedCount,
      canSelectMore,
      maxSelectionReached,
    };
  }, [selectedItems, maxSelection]);

  // Selection actions
  const selectItem = useCallback(
    (item: T) => {
      setSelectedItems(prev => {
        if (prev.has(item)) {
          return prev;
        } // Already selected

        if (prev.size >= maxSelection) {
          onMaxSelectionExceeded?.();
          return prev; // Don't exceed limit
        }

        const newSelection = new Set(prev);
        newSelection.add(item);
        onSelectionChange?.(newSelection as Set<string>);
        return newSelection;
      });
    },
    [maxSelection, onSelectionChange, onMaxSelectionExceeded]
  );

  const unselectItem = useCallback(
    (item: T) => {
      setSelectedItems(prev => {
        if (!prev.has(item)) {
          return prev;
        } // Not selected

        const newSelection = new Set(prev);
        newSelection.delete(item);
        onSelectionChange?.(newSelection as Set<string>);
        return newSelection;
      });
    },
    [onSelectionChange]
  );

  const toggleItem = useCallback(
    (item: T) => {
      if (selectedItems.has(item)) {
        unselectItem(item);
      } else {
        selectItem(item);
      }
    },
    [selectedItems, selectItem, unselectItem]
  );

  const selectAll = useCallback(
    (items: T[]) => {
      setSelectedItems(prev => {
        // Limit selection to maxSelection items
        const itemsToSelect = items.slice(0, maxSelection);
        const newSelection = new Set([...prev, ...itemsToSelect]);

        // If we exceeded the limit, keep only the first maxSelection items
        if (newSelection.size > maxSelection) {
          const limitedSelection = new Set(
            Array.from(newSelection).slice(0, maxSelection)
          );
          if (newSelection.size > maxSelection) {
            onMaxSelectionExceeded?.();
          }
          onSelectionChange?.(limitedSelection as Set<string>);
          return limitedSelection;
        }

        onSelectionChange?.(newSelection as Set<string>);
        return newSelection;
      });
    },
    [maxSelection, onSelectionChange, onMaxSelectionExceeded]
  );

  const unselectAll = useCallback(() => {
    setSelectedItems(prev => {
      if (prev.size === 0) {
        return prev;
      }

      const newSelection = new Set<T>();
      onSelectionChange?.(newSelection as Set<string>);
      return newSelection;
    });
  }, [onSelectionChange]);

  const toggleAll = useCallback(
    (items: T[]) => {
      if (selectedItems.size === 0) {
        selectAll(items);
      } else {
        unselectAll();
      }
    },
    [selectedItems.size, selectAll, unselectAll]
  );

  const clearSelection = useCallback(() => {
    unselectAll();
  }, [unselectAll]);

  const isSelected = useCallback(
    (item: T): boolean => {
      return selectedItems.has(item);
    },
    [selectedItems]
  );

  return {
    // State
    ...state,
    // Actions
    selectItem,
    unselectItem,
    toggleItem,
    selectAll,
    unselectAll,
    toggleAll,
    clearSelection,
    isSelected,
  };
}

/**
 * Hook specifically for product bulk selection with additional context
 */
export function useProductBulkSelection(
  availableProducts: Array<{ id: string }> = [],
  options: UseBulkSelectionOptions = {}
) {
  const bulkSelection = useBulkSelection<string>(options);

  // Calculate isAllSelected based on available products
  const isAllSelected = useMemo(() => {
    if (availableProducts.length === 0) {
      return false;
    }
    return availableProducts.every(product =>
      bulkSelection.isSelected(product.id)
    );
  }, [availableProducts, bulkSelection.selectedItems]);

  // Calculate isPartiallySelected more precisely
  const isPartiallySelected = useMemo(() => {
    if (availableProducts.length === 0) {
      return false;
    }
    const selectedAvailableCount = availableProducts.filter(product =>
      bulkSelection.isSelected(product.id)
    ).length;
    return (
      selectedAvailableCount > 0 &&
      selectedAvailableCount < availableProducts.length
    );
  }, [availableProducts, bulkSelection.selectedItems]);

  // Helper to select all available products
  const selectAllAvailable = useCallback(() => {
    const availableIds = availableProducts.map(p => p.id);
    bulkSelection.selectAll(availableIds);
  }, [availableProducts, bulkSelection.selectAll]);

  // Helper to toggle all available products
  const toggleAllAvailable = useCallback(() => {
    const availableIds = availableProducts.map(p => p.id);
    bulkSelection.toggleAll(availableIds);
  }, [availableProducts, bulkSelection.toggleAll]);

  return {
    ...bulkSelection,
    isAllSelected,
    isPartiallySelected,
    selectAllAvailable,
    toggleAllAvailable,
    availableCount: availableProducts.length,
  };
}
