/**
 * Click Page Padding Utilities
 * Helper functions for container padding conversion and CSS generation
 * Single Source of Truth for padding-related operations
 */

import type { ContainerPadding } from '@/types/click-page-styles.types';
import { RESPONSIVE_BREAKPOINTS } from '@/lib/constants/click-page-style-constants';

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

/**
 * Responsive padding calculation constants
 * Based on industry standards (Elementor, Unbounce, ClickFunnels)
 */
const RESPONSIVE_PADDING_CONFIG = {
  // Tablet scaling: 40% of desktop value
  tablet: {
    scaleFactor: 0.4,
    minPadding: 24, // Minimum padding for tablet (px)
  },
  // Mobile scaling: Use safe minimum values
  mobile: {
    scaleFactor: 0.15, // 15% of desktop (rarely used, minimum takes precedence)
    minPadding: 16, // Minimum padding for mobile (px)
    maxPadding: 24, // Maximum padding for mobile sides (px)
  },
} as const;

/**
 * Calculate responsive padding value for a specific breakpoint
 * Follows industry best practice: smart auto-scaling with safety thresholds
 *
 * @param desktopValue - Original desktop padding value in pixels
 * @param breakpoint - Target device breakpoint
 * @returns Calculated responsive padding value
 */
export function calculateResponsivePadding(
  desktopValue: number,
  breakpoint: 'tablet' | 'mobile'
): number {
  const config = RESPONSIVE_PADDING_CONFIG[breakpoint];
  const scaledValue = Math.round(desktopValue * config.scaleFactor);

  // Ensure value is within safe range
  const safeValue = Math.max(scaledValue, config.minPadding);

  // For mobile, also enforce maximum to prevent excessive padding
  if (breakpoint === 'mobile') {
    return Math.min(safeValue, config.maxPadding);
  }

  return safeValue;
}

/**
 * Generate responsive CSS for container padding
 * Creates media queries for tablet and mobile with auto-scaled values
 *
 * @param padding - ContainerPadding configuration (desktop values)
 * @param containerClass - CSS class selector for the container
 * @returns CSS string with media queries for responsive padding
 */
export function generateResponsiveContainerPaddingCSS(
  padding: ContainerPadding,
  containerClass: string = '.click-page-blocks'
): string {
  // Calculate tablet padding values
  const tabletTop = calculateResponsivePadding(padding.top, 'tablet');
  const tabletRight = calculateResponsivePadding(padding.right, 'tablet');
  const tabletBottom = calculateResponsivePadding(padding.bottom, 'tablet');
  const tabletLeft = calculateResponsivePadding(padding.left, 'tablet');

  // Calculate mobile padding values
  const mobileTop = calculateResponsivePadding(padding.top, 'mobile');
  const mobileRight = calculateResponsivePadding(padding.right, 'mobile');
  const mobileBottom = calculateResponsivePadding(padding.bottom, 'mobile');
  const mobileLeft = calculateResponsivePadding(padding.left, 'mobile');

  return `
    /* Tablet Responsive Padding (${RESPONSIVE_BREAKPOINTS.TABLET.minWidth}px - ${RESPONSIVE_BREAKPOINTS.TABLET.maxWidth}px) */
    @media (max-width: ${RESPONSIVE_BREAKPOINTS.TABLET.maxWidth}px) {
      ${containerClass} {
        padding-top: ${tabletTop}px !important;
        padding-right: ${tabletRight}px !important;
        padding-bottom: ${tabletBottom}px !important;
        padding-left: ${tabletLeft}px !important;
      }
    }

    /* Mobile Responsive Padding (< ${RESPONSIVE_BREAKPOINTS.MOBILE.maxWidth + 1}px) */
    ${RESPONSIVE_BREAKPOINTS.MOBILE.mediaQuery} {
      ${containerClass} {
        padding-top: ${mobileTop}px !important;
        padding-right: ${mobileRight}px !important;
        padding-bottom: ${mobileBottom}px !important;
        padding-left: ${mobileLeft}px !important;
      }
    }
  `.trim();
}
