/**
 * Click Page Padding Utilities
 * Helper functions for container padding conversion and CSS generation
 * Single Source of Truth for padding-related operations
 */

import type { ContainerPadding } from '@/types/click-page-styles.types';

/**
 * Convert ContainerPadding object to CSS padding string
 * @param padding - ContainerPadding configuration
 * @returns CSS padding string (e.g., "24px 24px 24px 24px")
 */
export function containerPaddingToCSS(padding: ContainerPadding): string {
  return `${padding.top}px ${padding.right}px ${padding.bottom}px ${padding.left}px`;
}

/**
 * Convert ContainerPadding object to inline style object
 * @param padding - ContainerPadding configuration
 * @returns React.CSSProperties object with padding
 */
export function containerPaddingToStyle(padding: ContainerPadding): React.CSSProperties {
  return {
    paddingTop: `${padding.top}px`,
    paddingRight: `${padding.right}px`,
    paddingBottom: `${padding.bottom}px`,
    paddingLeft: `${padding.left}px`,
  };
}

/**
 * Create default ContainerPadding with uniform value
 * @param value - Uniform padding value for all sides
 * @returns ContainerPadding object
 */
export function createUniformPadding(value: number): ContainerPadding {
  return {
    linked: true,
    top: value,
    right: value,
    bottom: value,
    left: value,
  };
}

/**
 * Migrate old single-value containerPadding to new structure
 * Handles backward compatibility for existing data
 * @param padding - Old number value or new ContainerPadding object
 * @returns ContainerPadding object
 */
export function migrateContainerPadding(
  padding: number | ContainerPadding | undefined
): ContainerPadding {
  // If undefined, return default
  if (padding === undefined) {
    return createUniformPadding(24);
  }

  // If number (old format), convert to new structure
  if (typeof padding === 'number') {
    return createUniformPadding(padding);
  }

  // Already in new format
  return padding;
}

/**
 * Check if all sides of padding are equal
 * @param padding - ContainerPadding configuration
 * @returns true if all sides are equal
 */
export function isPaddingUniform(padding: ContainerPadding): boolean {
  return (
    padding.top === padding.right &&
    padding.right === padding.bottom &&
    padding.bottom === padding.left
  );
}

/**
 * Update padding values based on linked state
 * If linked, all sides get the same value
 * @param padding - Current ContainerPadding configuration
 * @param side - Which side to update ('top' | 'right' | 'bottom' | 'left' | 'all')
 * @param value - New value
 * @returns Updated ContainerPadding object
 */
export function updateContainerPadding(
  padding: ContainerPadding,
  side: 'top' | 'right' | 'bottom' | 'left' | 'all',
  value: number
): ContainerPadding {
  // If updating 'all', set all sides and mark as linked
  if (side === 'all') {
    return {
      linked: true,
      top: value,
      right: value,
      bottom: value,
      left: value,
    };
  }

  // If linked, update all sides
  if (padding.linked) {
    return {
      linked: true,
      top: value,
      right: value,
      bottom: value,
      left: value,
    };
  }

  // If unlinked, update only specified side
  return {
    ...padding,
    [side]: value,
  };
}

/**
 * Toggle linked state
 * @param padding - Current ContainerPadding configuration
 * @returns Updated ContainerPadding with toggled linked state
 */
export function togglePaddingLinked(padding: ContainerPadding): ContainerPadding {
  const newLinked = !padding.linked;

  // If becoming linked, set all sides to top value
  if (newLinked) {
    return {
      linked: true,
      top: padding.top,
      right: padding.top,
      bottom: padding.top,
      left: padding.top,
    };
  }

  // If becoming unlinked, keep current values
  return {
    ...padding,
    linked: false,
  };
}
