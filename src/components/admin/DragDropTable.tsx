/**
 * Reusable Drag & Drop Table Component
 * Generic component for drag-drop reordering functionality
 *
 * Following CLAUDE.md:
 * - DRY principle: Single reusable component for all drag-drop needs
 * - Type-safe with TypeScript generics
 * - No hardcoded values (uses constants)
 * - Proper error handling
 */

'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { DRAG_DROP_CONSTANTS } from '@/lib/constants/drag-drop-constants';
import type { DraggableItem } from '@/types/drag-drop.types';

interface DragDropTableProps<T extends DraggableItem> {
  /** Array of items to be reordered */
  items: T[];

  /** Callback function when items are reordered - should save to backend */
  onReorder: (items: T[]) => Promise<void>;

  /** Render function for each item */
  renderItem: (item: T, isDragging: boolean) => React.ReactNode;

  /** Optional key extractor function (defaults to item.id) */
  keyExtractor?: (item: T) => string;

  /** Optional className for the container */
  className?: string;

  /** Whether the component is currently disabled */
  disabled?: boolean;
}

/**
 * DragDropTable Component
 * Reusable drag & drop table for reordering items
 */
export function DragDropTable<T extends DraggableItem>({
  items: initialItems,
  onReorder,
  renderItem,
  keyExtractor = (item) => item.id,
  className = '',
  disabled = false,
}: DragDropTableProps<T>) {
  const [items, setItems] = useState(initialItems);
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Configure sensors for mouse, touch, and keyboard
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required to start drag (prevents accidental drags)
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200, // 200ms press required for touch (prevents scroll interference)
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveId(null);

    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((item) => keyExtractor(item) === active.id);
    const newIndex = items.findIndex((item) => keyExtractor(item) === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Optimistic update - show new order immediately
    const reordered = arrayMove(items, oldIndex, newIndex).map((item, index) => ({
      ...item,
      sortOrder: index,
    }));

    setItems(reordered);
    setIsUpdating(true);

    try {
      await onReorder(reordered);
      toast.success(DRAG_DROP_CONSTANTS.MESSAGES.SUCCESS);
    } catch (error) {
      // Rollback on error
      setItems(initialItems);
      toast.error(DRAG_DROP_CONSTANTS.MESSAGES.ERROR);
      console.error('Reorder failed:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  // Find the active item for drag overlay
  const activeItem = activeId
    ? items.find((item) => keyExtractor(item) === activeId)
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext
        items={items.map(keyExtractor)}
        strategy={verticalListSortingStrategy}
        disabled={disabled || isUpdating}
      >
        <div
          className={`${className} ${
            isUpdating ? 'opacity-50 pointer-events-none' : ''
          }`}
        >
          {items.map((item) => (
            <SortableRow
              key={keyExtractor(item)}
              id={keyExtractor(item)}
              disabled={disabled || isUpdating}
            >
              {renderItem(item, keyExtractor(item) === activeId)}
            </SortableRow>
          ))}
        </div>
      </SortableContext>

      {/* Drag overlay for smooth dragging experience */}
      <DragOverlay>
        {activeItem ? (
          <div className="opacity-50">{renderItem(activeItem, true)}</div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

/**
 * SortableRow Component
 * Individual draggable row wrapper
 */
interface SortableRowProps {
  id: string;
  children: React.ReactNode;
  disabled?: boolean;
}

function SortableRow({ id, children, disabled }: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? DRAG_DROP_CONSTANTS.STYLES.DRAGGING_OPACITY : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      {/* Drag Handle */}
      <button
        className={`
          absolute left-2 top-1/2 -translate-y-1/2 z-10
          cursor-move touch-none p-1.5 rounded
          opacity-0 group-hover:opacity-100 md:opacity-100
          hover:bg-gray-100 active:bg-gray-200
          transition-opacity duration-200
          ${disabled ? 'cursor-not-allowed opacity-30' : ''}
        `}
        {...attributes}
        {...listeners}
        aria-label={DRAG_DROP_CONSTANTS.ACCESSIBILITY.DRAG_HANDLE_LABEL}
        disabled={disabled}
        type="button"
      >
        <GripVertical
          className={`${DRAG_DROP_CONSTANTS.STYLES.DRAG_HANDLE_SIZE} ${DRAG_DROP_CONSTANTS.STYLES.DRAG_HANDLE_COLOR}`}
        />
      </button>

      {/* Content with padding for drag handle */}
      <div className="pl-10 md:pl-12">{children}</div>
    </div>
  );
}
