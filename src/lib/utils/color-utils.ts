/**
 * Color Utilities
 * Accessibility and color manipulation helpers
 */

/**
 * Calculate relative luminance of a color (WCAG formula)
 * Used for contrast ratio calculation
 * @param hexColor Hex color code (e.g., '#FFFFFF')
 * @returns Relative luminance (0-1)
 */
export function getRelativeLuminance(hexColor: string): number {
  // Remove # if present
  const hex = hexColor.replace('#', '');

  // Parse RGB values
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  // Apply gamma correction
  const rLinear = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
  const gLinear = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
  const bLinear = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

  // Calculate relative luminance
  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

/**
 * Calculate contrast ratio between two colors (WCAG formula)
 * @param color1 First hex color
 * @param color2 Second hex color
 * @returns Contrast ratio (1-21)
 */
export function getContrastRatio(color1: string, color2: string): number {
  const lum1 = getRelativeLuminance(color1);
  const lum2 = getRelativeLuminance(color2);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if color contrast meets WCAG AA standard (4.5:1 for normal text)
 * @param backgroundColor Background hex color
 * @param textColor Text hex color
 * @returns True if contrast is sufficient
 */
export function hasGoodContrast(
  backgroundColor: string,
  textColor: string
): boolean {
  const ratio = getContrastRatio(backgroundColor, textColor);
  return ratio >= 4.5; // WCAG AA standard for normal text
}

/**
 * Get optimal text color (black or white) for a given background
 * Automatically determines which provides better contrast
 * @param backgroundColor Background hex color
 * @returns '#000000' or '#FFFFFF'
 */
export function getOptimalTextColor(backgroundColor: string): string {
  const whiteContrast = getContrastRatio(backgroundColor, '#FFFFFF');
  const blackContrast = getContrastRatio(backgroundColor, '#000000');

  return whiteContrast > blackContrast ? '#FFFFFF' : '#000000';
}

/**
 * Validate hex color format
 * @param color Color string to validate
 * @returns True if valid hex color
 */
export function isValidHexColor(color: string): boolean {
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return hexRegex.test(color);
}

/**
 * Format hex color to standard 6-digit format
 * Converts 3-digit hex to 6-digit and ensures # prefix
 * @param color Hex color (with or without #)
 * @returns Formatted hex color (#RRGGBB)
 */
export function formatHexColor(color: string): string {
  let hex = color.trim();

  // Add # if missing
  if (!hex.startsWith('#')) {
    hex = '#' + hex;
  }

  // Convert 3-digit to 6-digit
  if (hex.length === 4) {
    hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
  }

  return hex.toUpperCase();
}

/**
 * Generate CSS style string for CTA button
 * @param backgroundColor Background hex color
 * @param textColor Text hex color
 * @param borderColor Optional border hex color
 * @returns CSS style string
 */
export function generateCTAButtonStyle(
  backgroundColor: string,
  textColor: string,
  borderColor?: string
): string {
  const styles = [
    `background-color: ${backgroundColor}`,
    `color: ${textColor}`,
  ];

  if (borderColor) {
    styles.push(`border: 2px solid ${borderColor}`);
  }

  return styles.join('; ');
}
