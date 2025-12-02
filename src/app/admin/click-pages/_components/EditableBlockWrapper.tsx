'use client';

/**
 * Editable Block Wrapper Component
 * Wraps BlockRenderer with editor-specific functionality:
 * - Visual selection state
 * - Drag-and-drop handles
 * - Hover controls (duplicate, delete)
 * - Click to select behavior
 */

import { memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  Trash2,
  Copy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { EDITOR_COLORS, EDITOR_ANIMATIONS } from '@/lib/constants/editor-constants';
import type { EditableBlockWrapperProps } from '@/types/editor.types';
import { BlockItem } from '@/components/click-pages/blocks';

/**
 * EditableBlockWrapper Component
 * Provides interactive editing UI around rendered blocks
 */
function EditableBlockWrapperComponent({
  block,
  isSelected,
  themeSettings,
  onSelect,
  onRemove,
  onDuplicate,
  onBlockClick,
}: EditableBlockWrapperProps) {
  // Setup drag-and-drop
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  // Transform for drag-and-drop
  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || `all ${EDITOR_ANIMATIONS.SELECTION}ms ease`,
  };

  /**
   * Handle block selection
   */
  const handleClick = (e: React.MouseEvent) => {
    // Only handle clicks on the wrapper, not on interactive elements inside
    if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.editable-block-wrapper-content')) {
      onSelect();
    }
  };

  /**
   * Handle remove with stop propagation
   */
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove();
  };

  /**
   * Handle duplicate with stop propagation
   */
  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDuplicate();
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative rounded-lg transition-all',
        'editable-block-wrapper',
        isSelected && 'ring-2 ring-offset-2 ring-blue-500',
        isDragging && 'opacity-50 scale-105 shadow-xl z-50',
        !isSelected && !isDragging && 'hover:ring-1 hover:ring-gray-300'
      )}
      onClick={handleClick}
    >
      {/* Control Bar - Shows on hover or selection */}
      <div
        className={cn(
          'absolute -top-10 left-0 right-0 flex items-center gap-2 px-2 py-1',
          'bg-white border rounded-t-lg shadow-sm z-10',
          'opacity-0 group-hover:opacity-100',
          isSelected && 'opacity-100'
        )}
        style={{
          transition: `opacity ${EDITOR_ANIMATIONS.HOVER}ms ease`,
        }}
      >
        {/* Drag Handle */}
        <button
          className="flex-shrink-0 p-1 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 transition-colors"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
        >
          <GripVertical className="w-4 h-4" />
        </button>

        {/* Block Type Label */}
        <span className="flex-1 text-xs font-medium text-gray-600 truncate">
          {block.type.replace(/_/g, ' ')}
        </span>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleDuplicate}
            aria-label="Duplicate block"
            title="Duplicate block"
          >
            <Copy className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
            onClick={handleRemove}
            aria-label="Delete block"
            title="Delete block"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Block Content - Uses BlockItem directly (no container padding) */}
      <div
        className={cn(
          'editable-block-wrapper-content',
          'relative overflow-hidden',
          isSelected && 'bg-blue-50/30'
        )}
      >
        <BlockItem
          block={block}
          themeSettings={themeSettings}
          onBlockClick={onBlockClick}
        />
      </div>

      {/* Selection Indicator Overlay */}
      {isSelected && (
        <div
          className="absolute inset-0 pointer-events-none rounded-lg"
          style={{
            boxShadow: `inset 0 0 0 2px ${EDITOR_COLORS.SELECTION}`,
          }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

/**
 * Memoized export for performance
 */
export const EditableBlockWrapper = memo(EditableBlockWrapperComponent);
