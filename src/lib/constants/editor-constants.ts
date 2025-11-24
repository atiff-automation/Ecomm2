/**
 * Editor Constants
 * Single source of truth for editor configuration
 */

/**
 * Device preview modes
 */
export const DEVICE_MODES = {
  DESKTOP: 'desktop',
  TABLET: 'tablet',
  MOBILE: 'mobile',
} as const;

export type DeviceMode = (typeof DEVICE_MODES)[keyof typeof DEVICE_MODES];

/**
 * Device viewport widths (in pixels)
 */
export const DEVICE_WIDTHS = {
  [DEVICE_MODES.DESKTOP]: 1440,
  [DEVICE_MODES.TABLET]: 768,
  [DEVICE_MODES.MOBILE]: 375,
} as const;

/**
 * Device labels for UI display
 */
export const DEVICE_LABELS = {
  [DEVICE_MODES.DESKTOP]: 'Desktop',
  [DEVICE_MODES.TABLET]: 'Tablet',
  [DEVICE_MODES.MOBILE]: 'Mobile',
} as const;

/**
 * Zoom level presets (in percentage)
 */
export const ZOOM_LEVELS = {
  MIN: 25,
  SMALL: 50,
  MEDIUM: 75,
  NORMAL: 100,
  LARGE: 125,
  XLARGE: 150,
  MAX: 200,
} as const;

/**
 * Available zoom options for dropdown
 */
export const ZOOM_OPTIONS = [
  { value: ZOOM_LEVELS.SMALL, label: '50%' },
  { value: ZOOM_LEVELS.MEDIUM, label: '75%' },
  { value: ZOOM_LEVELS.NORMAL, label: '100%' },
  { value: ZOOM_LEVELS.LARGE, label: '125%' },
  { value: ZOOM_LEVELS.XLARGE, label: '150%' },
] as const;

/**
 * Default zoom level
 */
export const DEFAULT_ZOOM = ZOOM_LEVELS.NORMAL;

/**
 * Default device mode
 */
export const DEFAULT_DEVICE_MODE = DEVICE_MODES.DESKTOP;

/**
 * Editor keyboard shortcuts
 */
export const EDITOR_SHORTCUTS = {
  DELETE: ['Delete', 'Backspace'],
  DUPLICATE: ['d'],
  ARROW_UP: ['ArrowUp'],
  ARROW_DOWN: ['ArrowDown'],
  ESCAPE: ['Escape'],
} as const;

/**
 * Editor animation durations (in milliseconds)
 */
export const EDITOR_ANIMATIONS = {
  SELECTION: 200,
  HOVER: 150,
  DRAG: 300,
} as const;

/**
 * Editor debounce delays (in milliseconds)
 */
export const EDITOR_DEBOUNCE = {
  TEXT_INPUT: 300,
  STYLE_UPDATE: 150,
  SEARCH: 400,
} as const;

/**
 * Editor color palette for UI elements
 */
export const EDITOR_COLORS = {
  SELECTION: '#3B82F6', // blue-500
  HOVER: '#93C5FD', // blue-300
  DANGER: '#EF4444', // red-500
  SUCCESS: '#10B981', // green-500
} as const;
