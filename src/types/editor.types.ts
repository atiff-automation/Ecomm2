/**
 * Editor Type Definitions
 * Type-safe interfaces for the interactive editor
 */

import type { Block } from './click-page.types';
import type { ThemeSettings } from './click-page-styles.types';
import type { DeviceMode } from '@/lib/constants/editor-constants';

/**
 * Editor state interface
 */
export interface EditorState {
  /** Currently selected block ID */
  selectedBlockId: string | null;
  /** Current device preview mode */
  deviceMode: DeviceMode;
  /** Current zoom level (percentage) */
  zoomLevel: number;
  /** Whether editor is in preview mode */
  isPreviewMode: boolean;
}

/**
 * Editable block wrapper props
 */
export interface EditableBlockWrapperProps {
  /** Block data */
  block: Block;
  /** Whether this block is currently selected */
  isSelected: boolean;
  /** Theme settings for rendering */
  themeSettings?: ThemeSettings;
  /** Callback when block is selected */
  onSelect: () => void;
  /** Callback when block should be removed */
  onRemove: () => void;
  /** Callback when block should be duplicated */
  onDuplicate: () => void;
  /** Callback when a clickable element in block is clicked */
  onBlockClick?: (blockId: string, blockType: string, targetUrl?: string) => void;
}

/**
 * Device preview component props
 */
export interface DevicePreviewProps {
  /** Current device mode */
  mode: DeviceMode;
  /** Current zoom level (percentage) */
  zoom: number;
  /** Callback when device mode changes */
  onModeChange: (mode: DeviceMode) => void;
  /** Callback when zoom level changes */
  onZoomChange: (zoom: number) => void;
  /** Child content to render in preview */
  children: React.ReactNode;
}

/**
 * Device preview toolbar props
 */
export interface DevicePreviewToolbarProps {
  /** Current device mode */
  mode: DeviceMode;
  /** Current zoom level (percentage) */
  zoom: number;
  /** Callback when device mode changes */
  onModeChange: (mode: DeviceMode) => void;
  /** Callback when zoom level changes */
  onZoomChange: (zoom: number) => void;
}

/**
 * Block control actions
 */
export interface BlockControls {
  /** Remove the block */
  onRemove: () => void;
  /** Duplicate the block */
  onDuplicate: () => void;
  /** Move block up in order */
  onMoveUp?: () => void;
  /** Move block down in order */
  onMoveDown?: () => void;
}

/**
 * Editor keyboard event handler
 */
export type EditorKeyboardHandler = (event: KeyboardEvent) => void;

/**
 * Editor viewport dimensions
 */
export interface EditorViewport {
  /** Width in pixels */
  width: number;
  /** Height in pixels (optional, auto if not specified) */
  height?: number;
  /** Scale factor (for zoom) */
  scale: number;
}
