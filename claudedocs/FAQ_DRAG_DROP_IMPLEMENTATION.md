# FAQ Drag & Drop Reordering - Implementation Plan

**Date:** 2025-01-12
**Feature:** Drag & Drop reordering for FAQ Categories and FAQ items
**Status:** Planning Phase

---

## 📋 Overview

Replace manual numeric `sortOrder` input with intuitive drag & drop reordering for:
1. FAQ Categories (in list page)
2. FAQ items within categories (in FAQ list page)

---

## 🎯 Requirements

### Functional Requirements
- ✅ Drag & drop to reorder categories in admin list
- ✅ Drag & drop to reorder FAQs in admin list
- ✅ Visual feedback during drag (highlight, opacity)
- ✅ Auto-save new order on drop
- ✅ Mobile-friendly (touch support)
- ✅ Optimistic UI updates
- ✅ Error handling with rollback on failure

### Non-Functional Requirements
- ✅ Follow SOLID principles (separation of concerns)
- ✅ Single Source of Truth (centralized logic)
- ✅ DRY (reusable components)
- ✅ Type-safe TypeScript
- ✅ Zod validation for API
- ✅ Proper error handling
- ✅ No hardcoded values

---

## 🏗️ Architecture Design

### Layer Structure (Three-Layer Architecture)

```
┌─────────────────────────────────────────────────────┐
│                  PRESENTATION LAYER                  │
│  - Reusable DragDropTable Component                 │
│  - FAQ Categories Page (uses component)             │
│  - FAQ List Page (uses component)                   │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│                    API LAYER                         │
│  - PUT /api/admin/faq-categories/reorder            │
│  - PUT /api/admin/faqs/reorder                      │
│  - Zod validation schemas                           │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│                  DATABASE LAYER                      │
│  - Prisma transactions for bulk updates             │
│  - Atomic sortOrder updates                         │
└─────────────────────────────────────────────────────┘
```

---

## 📦 Library Selection

**Library:** `@dnd-kit/core` + `@dnd-kit/sortable`

**Why @dnd-kit?**
- ✅ Modern, maintained, React 18+ compatible
- ✅ Accessibility built-in (keyboard navigation)
- ✅ Touch device support
- ✅ Lightweight (smaller than react-beautiful-dnd)
- ✅ Flexible API
- ✅ TypeScript first-class support

**Installation:**
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

---

## 🗂️ File Structure

```
src/
├── types/
│   └── drag-drop.types.ts              # NEW: DnD types
│
├── lib/
│   ├── constants/
│   │   └── drag-drop-constants.ts      # NEW: DnD config
│   │
│   ├── validations/
│   │   └── reorder-validation.ts       # NEW: Reorder schemas
│   │
│   └── utils/
│       └── drag-drop-utils.ts          # NEW: Helper functions
│
├── components/
│   └── admin/
│       └── DragDropTable.tsx           # NEW: Reusable component
│
├── app/
│   └── api/
│       └── admin/
│           ├── faq-categories/
│           │   └── reorder/
│           │       └── route.ts         # NEW: Reorder API
│           │
│           └── faqs/
│               └── reorder/
│                   └── route.ts         # NEW: Reorder API
│
└── app/admin/content/
    ├── faq-categories/
    │   └── page.tsx                     # UPDATE: Add drag-drop
    │
    └── faqs/
        └── page.tsx                     # UPDATE: Add drag-drop
```

---

## 📝 Implementation Steps

### Phase 1: Foundation (Types, Constants, Validation)

#### 1.1 Create Types (`src/types/drag-drop.types.ts`)
```typescript
// Generic drag-drop item type
export interface DraggableItem {
  id: string;
  sortOrder: number;
}

// Reorder request/response types
export interface ReorderRequest {
  items: Array<{ id: string; sortOrder: number }>;
}

export interface ReorderResponse {
  success: boolean;
  message: string;
  updatedCount: number;
}
```

#### 1.2 Create Constants (`src/lib/constants/drag-drop-constants.ts`)
```typescript
export const DRAG_DROP_CONSTANTS = {
  API_ROUTES: {
    REORDER_CATEGORIES: '/api/admin/faq-categories/reorder',
    REORDER_FAQS: '/api/admin/faqs/reorder',
  },

  CONFIG: {
    ANIMATION_DURATION: 200, // ms
    COLLISION_DETECTION: 'closestCenter' as const,
    SCROLL_THRESHOLD: 0.5,
  },

  MESSAGES: {
    SUCCESS: 'Order updated successfully',
    ERROR: 'Failed to update order',
    OPTIMISTIC_UPDATE: 'Updating order...',
  },

  ACCESSIBILITY: {
    DRAG_HANDLE_LABEL: 'Drag to reorder',
    KEYBOARD_INSTRUCTIONS: 'Press space to pick up, arrow keys to move, space to drop',
  },
} as const;
```

#### 1.3 Create Validation (`src/lib/validations/reorder-validation.ts`)
```typescript
import { z } from 'zod';

// Reorder item schema
export const reorderItemSchema = z.object({
  id: z.string().uuid(),
  sortOrder: z.number().int().min(0),
});

// Reorder request schema
export const reorderRequestSchema = z.object({
  items: z.array(reorderItemSchema).min(1).max(100),
});

export type ReorderRequestData = z.infer<typeof reorderRequestSchema>;
```

#### 1.4 Create Utilities (`src/lib/utils/drag-drop-utils.ts`)
```typescript
import type { DraggableItem } from '@/types/drag-drop.types';

/**
 * Recalculate sortOrder for all items after reorder
 * Ensures sequential ordering (0, 1, 2, 3...)
 */
export function recalculateSortOrder<T extends DraggableItem>(
  items: T[],
  activeId: string,
  overId: string
): T[] {
  const oldIndex = items.findIndex(item => item.id === activeId);
  const newIndex = items.findIndex(item => item.id === overId);

  if (oldIndex === -1 || newIndex === -1) return items;

  // Reorder array
  const reordered = arrayMove(items, oldIndex, newIndex);

  // Recalculate sortOrder
  return reordered.map((item, index) => ({
    ...item,
    sortOrder: index,
  }));
}

/**
 * Move array element from one index to another
 */
function arrayMove<T>(array: T[], from: number, to: number): T[] {
  const newArray = [...array];
  const item = newArray.splice(from, 1)[0];
  newArray.splice(to, 0, item);
  return newArray;
}

/**
 * Extract only id and sortOrder for API payload
 */
export function prepareReorderPayload<T extends DraggableItem>(
  items: T[]
): Array<{ id: string; sortOrder: number }> {
  return items.map(({ id, sortOrder }) => ({ id, sortOrder }));
}
```

---

### Phase 2: API Layer

#### 2.1 FAQ Categories Reorder API (`src/app/api/admin/faq-categories/reorder/route.ts`)
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { reorderRequestSchema } from '@/lib/validations/reorder-validation';
import { DRAG_DROP_CONSTANTS } from '@/lib/constants/drag-drop-constants';

export async function PUT(request: NextRequest) {
  try {
    // Parse and validate request
    const body = await request.json();
    const validated = reorderRequestSchema.parse(body);

    // Update sortOrder in transaction (atomic operation)
    const result = await prisma.$transaction(
      validated.items.map(item =>
        prisma.fAQCategory.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        })
      )
    );

    return NextResponse.json({
      success: true,
      message: DRAG_DROP_CONSTANTS.MESSAGES.SUCCESS,
      updatedCount: result.length,
    });
  } catch (error) {
    console.error('Reorder categories error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: DRAG_DROP_CONSTANTS.MESSAGES.ERROR },
      { status: 500 }
    );
  }
}
```

#### 2.2 FAQs Reorder API (`src/app/api/admin/faqs/reorder/route.ts`)
```typescript
// Similar structure to categories reorder
// Update FAQ.sortOrder instead
```

---

### Phase 3: Reusable Component

#### 3.1 DragDropTable Component (`src/components/admin/DragDropTable.tsx`)
```typescript
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
  items: T[];
  onReorder: (items: T[]) => Promise<void>;
  renderItem: (item: T) => React.ReactNode;
  keyExtractor?: (item: T) => string;
}

export function DragDropTable<T extends DraggableItem>({
  items: initialItems,
  onReorder,
  renderItem,
  keyExtractor = (item) => item.id,
}: DragDropTableProps<T>) {
  const [items, setItems] = useState(initialItems);
  const [isUpdating, setIsUpdating] = useState(false);

  // Configure sensors for mouse, touch, and keyboard
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex(item => keyExtractor(item) === active.id);
    const newIndex = items.findIndex(item => keyExtractor(item) === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Optimistic update
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

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map(keyExtractor)}
        strategy={verticalListSortingStrategy}
      >
        <div className={isUpdating ? 'opacity-50 pointer-events-none' : ''}>
          {items.map(item => (
            <SortableRow key={keyExtractor(item)} id={keyExtractor(item)}>
              {renderItem(item)}
            </SortableRow>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

// Sortable row wrapper
function SortableRow({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <button
        className="absolute left-2 top-1/2 -translate-y-1/2 cursor-move touch-none p-1 hover:bg-gray-100 rounded"
        {...attributes}
        {...listeners}
        aria-label={DRAG_DROP_CONSTANTS.ACCESSIBILITY.DRAG_HANDLE_LABEL}
      >
        <GripVertical className="w-4 h-4 text-gray-400" />
      </button>
      <div className="pl-10">{children}</div>
    </div>
  );
}
```

---

### Phase 4: Integration

#### 4.1 Update FAQ Categories Page
```typescript
// Add drag-drop to category table
// Use DragDropTable component
// Call reorder API
```

#### 4.2 Update FAQs Page
```typescript
// Add drag-drop to FAQ cards
// Use DragDropTable component
// Call reorder API with category filter
```

---

## ✅ Testing Checklist

- [ ] Drag & drop works with mouse
- [ ] Drag & drop works with touch (mobile)
- [ ] Keyboard navigation works (space to pick, arrows to move)
- [ ] Visual feedback during drag
- [ ] Optimistic UI updates
- [ ] Rollback on API failure
- [ ] Error messages display correctly
- [ ] Success toast shows
- [ ] Order persists after page reload
- [ ] Multiple rapid reorders handled correctly
- [ ] Works on mobile (responsive)
- [ ] Accessible (screen readers)

---

## 🔒 Security Considerations

- ✅ Validate all reorder requests with Zod
- ✅ Check user authentication/authorization
- ✅ Use Prisma transactions (atomic updates)
- ✅ Limit max items in single reorder (100)
- ✅ Rate limiting on reorder endpoint

---

## 📊 Database Migration

**No migration needed** - Using existing `sortOrder` column.

Just ensure:
- `FAQCategory.sortOrder` is indexed
- `FAQ.sortOrder` is indexed

---

## 🎨 UI/UX Considerations

1. **Visual Feedback:**
   - Drag handle (≡) visible on hover
   - Opacity change during drag
   - Smooth animations (200ms)
   - Drop zone highlighting

2. **Mobile:**
   - Touch-friendly drag handles
   - Larger hit areas (48px minimum)
   - No hover states (use pressed states)

3. **Accessibility:**
   - Keyboard navigation support
   - Screen reader announcements
   - Focus indicators
   - ARIA labels

---

## 📈 Future Enhancements

- [ ] Undo/Redo functionality
- [ ] Bulk actions (select multiple, reorder group)
- [ ] Drag between categories (FAQs)
- [ ] Keyboard shortcuts (Cmd+Z for undo)
- [ ] Animation preferences (respect prefers-reduced-motion)

---

## 🚀 Implementation Order

1. ✅ Install @dnd-kit packages
2. ✅ Create types, constants, validation
3. ✅ Create utility functions
4. ✅ Build reusable DragDropTable component
5. ✅ Create reorder API endpoints
6. ✅ Integrate into FAQ Categories page
7. ✅ Integrate into FAQs page
8. ✅ Test thoroughly
9. ✅ Document usage

---

**End of Implementation Plan**
