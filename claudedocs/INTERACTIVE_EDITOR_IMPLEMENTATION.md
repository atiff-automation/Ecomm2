# Interactive Editor Implementation Plan (Option A: Live Preview Canvas)

## Overview
Transform the Click Page Editor from a label-based block list to a fully interactive visual editor with real-time preview using the existing BlockRenderer components.

## Current Architecture
```
ClickPageEditor.tsx
├─ Left Panel: BlockPalette (add blocks)
├─ Center Canvas: SortableBlock list (labels/icons only)
└─ Right Panel: BlockSettingsPanel (configuration)
```

**Problem**: No visual feedback when editing. Changes only visible on public preview page.

## Target Architecture
```
ClickPageEditor.tsx
├─ Left Panel: BlockPalette (unchanged)
├─ Center Canvas: EditableBlockWrapper + BlockRenderer (VISUAL PREVIEW)
│   ├─ Device preview modes (desktop/tablet/mobile)
│   ├─ Zoom controls
│   └─ Real-time block rendering
└─ Right Panel: BlockSettingsPanel (unchanged)
```

## Implementation Steps

### Phase 1: Core Components

#### Step 1.1: Create EditableBlockWrapper Component
**Location**: `src/app/(admin)/admin/click-pages/_components/EditableBlockWrapper.tsx`

**Purpose**: Wrap BlockRenderer with editor functionality
- Selection state (highlight selected block)
- Drag-and-drop handles
- Hover controls (duplicate, delete, move)
- Click to select and show settings

**Requirements**:
- Use dnd-kit for drag-and-drop
- Maintain existing sortable behavior
- Add visual selection indicator
- Show controls on hover
- Support keyboard navigation

**Type Safety**:
```typescript
interface EditableBlockWrapperProps {
  block: Block;
  isSelected: boolean;
  themeSettings?: ThemeSettings;
  onSelect: () => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onBlockClick?: (blockId: string, blockType: string, targetUrl?: string) => void;
}
```

#### Step 1.2: Create DevicePreview Component
**Location**: `src/app/(admin)/admin/click-pages/_components/DevicePreview.tsx`

**Purpose**: Control device preview modes
- Toggle between desktop/tablet/mobile
- Apply responsive width constraints
- Visual device frame (optional)

**Type Safety**:
```typescript
type DeviceMode = 'desktop' | 'tablet' | 'mobile';

interface DevicePreviewProps {
  mode: DeviceMode;
  zoom: number;
  onModeChange: (mode: DeviceMode) => void;
  onZoomChange: (zoom: number) => void;
  children: React.ReactNode;
}
```

### Phase 2: Editor Integration

#### Step 2.1: Update ClickPageEditor Canvas
**File**: `src/app/(admin)/admin/click-pages/_components/ClickPageEditor.tsx`

**Changes**:
1. Replace `<SortableBlock>` with `<EditableBlockWrapper>`
2. Integrate `<BlockRenderer>` inside wrapper
3. Pass theme settings to renderer
4. Add device preview controls
5. Add zoom controls

**State Management**:
```typescript
// Add to ClickPageEditor state
const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');
const [zoomLevel, setZoomLevel] = useState(100);
```

#### Step 2.2: Canvas Layout Adjustments
**Updates**:
- Add device preview toolbar above canvas
- Add zoom controls (50%, 75%, 100%, 150%)
- Apply device width constraints
- Center content in canvas
- Add subtle device frame visual

### Phase 3: Performance Optimizations

#### Step 3.1: Memoization
**Files**: All relevant components

**Optimizations**:
- Memoize BlockRenderer components
- Memoize EditableBlockWrapper
- Use React.memo for block components
- Memoize theme settings transformations

#### Step 3.2: Debouncing
**Purpose**: Reduce re-renders on rapid edits

**Implementation**:
- Debounce text input changes (300ms)
- Debounce style updates (150ms)
- Immediate updates for critical actions (select, delete)

### Phase 4: User Experience Enhancements

#### Step 4.1: Visual Feedback
- Smooth selection animations
- Hover state styling
- Drag preview overlay
- Loading states for heavy blocks

#### Step 4.2: Keyboard Shortcuts
- Delete: Remove selected block
- Cmd/Ctrl + D: Duplicate block
- Arrow keys: Navigate between blocks
- Escape: Deselect block

## Technical Considerations

### Coding Standards Compliance

#### Single Source of Truth
- Device sizes defined in constants file
- Zoom levels in constants
- No duplicated component logic

#### Type Safety
- Strict TypeScript types (no `any`)
- Proper prop interfaces
- Type guards where needed

#### SOLID Principles
- EditableBlockWrapper: Single responsibility (editing UI)
- BlockRenderer: Single responsibility (visual display)
- Separation of concerns maintained

#### Performance
- Memoization for expensive operations
- Debouncing for rapid updates
- Lazy loading for heavy blocks (if needed)

### Existing Code Preservation
- Do NOT modify BlockRenderer logic
- Do NOT change block component interfaces
- Maintain backward compatibility
- Keep SortableBlock for future reference

## File Structure

```
src/app/(admin)/admin/click-pages/_components/
├─ EditableBlockWrapper.tsx       [NEW] - Editable block wrapper
├─ DevicePreview.tsx               [NEW] - Device mode controls
├─ ClickPageEditor.tsx             [UPDATE] - Integrate new components
├─ SortableBlock.tsx               [KEEP] - Reference (may deprecate later)
└─ BlockSettingsPanel.tsx          [NO CHANGE] - Settings panel

src/lib/constants/
└─ editor-constants.ts             [NEW] - Device sizes, zoom levels

src/types/
└─ editor.types.ts                 [NEW] - Editor-specific types
```

## Testing Checklist

### Functional Testing
- [ ] All block types render correctly
- [ ] Selection works (click to select)
- [ ] Drag-and-drop reordering works
- [ ] Delete block works
- [ ] Duplicate block works
- [ ] Real-time edit updates work
- [ ] Device mode switching works
- [ ] Zoom controls work

### Visual Testing
- [ ] Selection highlight visible
- [ ] Hover controls appear
- [ ] Drag preview shows
- [ ] Device preview accurate
- [ ] Responsive styles apply correctly

### Performance Testing
- [ ] No lag with 10+ blocks
- [ ] Smooth scrolling
- [ ] No memory leaks
- [ ] Debouncing working

### Type Safety
- [ ] No TypeScript errors
- [ ] Build succeeds
- [ ] No `any` types used

## Rollback Plan

If issues arise:
1. Previous implementation preserved in git
2. SortableBlock still available as fallback
3. Feature flag approach possible (toggle between old/new)

## Success Criteria

1. ✅ Users see visual preview of blocks in editor
2. ✅ Real-time updates when editing (no delay)
3. ✅ Smooth drag-and-drop experience
4. ✅ Device preview modes work
5. ✅ Performance remains acceptable (<100ms update time)
6. ✅ No TypeScript errors
7. ✅ Follows all coding standards

## Timeline

- **Phase 1**: 2-3 hours (Core components)
- **Phase 2**: 1-2 hours (Integration)
- **Phase 3**: 1 hour (Optimization)
- **Phase 4**: 1 hour (UX polish)
- **Testing**: 1 hour
**Total**: ~6-8 hours

## Notes

- Keep changes incremental and testable
- Commit after each major step
- Test in browser frequently
- Maintain coding standards throughout
- Document any deviations or issues
