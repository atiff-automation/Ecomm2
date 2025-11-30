/**
 * Click Page Padding Utilities
 * Helper functions for container padding conversion and CSS generation
 * Single Source of Truth for padding-related operations
 *
 * KEY BEHAVIORS:
 * ===============
 * 1. EXPLICIT ZERO RESPECT: When padding is set to 0px on desktop, it remains 0px
 *    on tablet and mobile. This allows users to create edge-to-edge layouts without
 *    minimum padding constraints.
 *
 * 2. SMART SCALING FOR NON-ZERO: When padding is non-zero on desktop, intelligent
 *    responsive scaling is applied with safety minimums (tablet: 24px, mobile: 16px)
 *    to prevent overly tight layouts on smaller screens.
 *
 * 3. SINGLE SOURCE OF TRUTH: All padding calculations flow through
 *    calculateResponsivePadding() which ensures consistent behavior across the app.
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
 *
 * NOTE: These minimums only apply to NON-ZERO values.
 * Explicit zero values (0px) are always respected to allow edge-to-edge layouts.
 */
const RESPONSIVE_PADDING_CONFIG = {
  // Tablet scaling: 40% of desktop value
  tablet: {
    scaleFactor: 0.4,
    minPadding: 24, // Minimum padding for tablet (px) - only for non-zero values
  },
  // Mobile scaling: Use safe minimum values
  mobile: {
    scaleFactor: 0.15, // 15% of desktop (rarely used, minimum takes precedence)
    minPadding: 16, // Minimum padding for mobile (px) - only for non-zero values
    maxPadding: 24, // Maximum padding for mobile sides (px) - only for non-zero values
  },
} as const;

/**
 * Calculate responsive padding value for a specific breakpoint
 * Follows industry best practice: smart auto-scaling with safety thresholds
 *
 * IMPORTANT: Respects explicit zero values (0px = 0px on all breakpoints)
 * This allows users to create edge-to-edge layouts when intentionally desired,
 * while maintaining smart minimums for non-zero values to prevent overly tight layouts.
 *
 * @param desktopValue - Original desktop padding value in pixels
 * @param breakpoint - Target device breakpoint
 * @returns Calculated responsive padding value
 *
 * @example
 * // Explicit zero is respected
 * calculateResponsivePadding(0, 'mobile') // Returns 0
 *
 * @example
 * // Non-zero values use smart scaling with minimums
 * calculateResponsivePadding(32, 'mobile') // Returns 16 (minimum enforced)
 * calculateResponsivePadding(100, 'mobile') // Returns 24 (maximum enforced)
 */
export function calculateResponsivePadding(
  desktopValue: number,
  breakpoint: 'tablet' | 'mobile'
): number {
  // EXPLICIT ZERO HANDLING: Respect user's intent for edge-to-edge layouts
  // When user explicitly sets 0px, return 0px on all breakpoints
  // This enables flush layouts without minimum padding constraints
  if (desktopValue === 0) {
    return 0;
  }

  // SMART SCALING: For non-zero values, apply intelligent responsive behavior
  const config = RESPONSIVE_PADDING_CONFIG[breakpoint];
  const scaledValue = Math.round(desktopValue * config.scaleFactor);

  // Ensure value is within safe range (prevents overly tight layouts)
  const safeValue = Math.max(scaledValue, config.minPadding);

  // For mobile, also enforce maximum to prevent excessive padding
  if (breakpoint === 'mobile' && 'maxPadding' in config) {
    return Math.min(safeValue, config.maxPadding);
  }

  return safeValue;
}

/**
 * Generate responsive CSS for container padding
 * Creates media queries for tablet and mobile with auto-scaled values
 *
 * BEHAVIOR:
 * - Explicit 0px values: Rendered as 0px on all breakpoints (respects user intent)
 * - Non-zero values: Smart scaling with minimums applied (prevents overly tight layouts)
 *
 * @param padding - ContainerPadding configuration (desktop values)
 * @param containerClass - CSS class selector for the container
 * @returns CSS string with media queries for responsive padding
 *
 * @example
 * // With 0px left/right padding (edge-to-edge layout)
 * const padding = { top: 24, right: 0, bottom: 24, left: 0, linked: false };
 * // Tablet: padding: 24px 0px 24px 0px
 * // Mobile: padding: 16px 0px 16px 0px
 *
 * @example
 * // With non-zero padding (smart minimums applied)
 * const padding = { top: 48, right: 48, bottom: 48, left: 48, linked: true };
 * // Tablet: padding: 24px 24px 24px 24px (minimum enforced)
 * // Mobile: padding: 16px 16px 16px 16px (minimum enforced)
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
