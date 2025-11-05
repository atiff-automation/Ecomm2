/**
 * Free Shipping Display Utilities
 *
 * Helper functions for displaying free shipping information dynamically
 * based on state-based eligibility settings.
 *
 * @module shipping/utils/free-shipping-display
 */

import { MALAYSIAN_STATES, type MalaysianStateCode } from '../constants';

/**
 * Get excluded state names for free shipping display
 *
 * @param eligibleStates - Array of eligible state codes, or undefined if all states eligible
 * @returns Array of excluded state names (full names, not codes)
 *
 * @example
 * // State restrictions configured
 * getExcludedStateNames(['kul', 'sgr', 'png']) // ['Johor', 'Kedah', ...]
 *
 * // No restrictions (all states eligible)
 * getExcludedStateNames(undefined) // []
 * getExcludedStateNames([]) // All states excluded (edge case)
 */
export function getExcludedStateNames(
  eligibleStates?: string[]
): string[] {
  // If undefined, all states are eligible (no exclusions)
  if (eligibleStates === undefined) {
    return [];
  }

  // Get all state codes
  const allStateCodes = Object.keys(MALAYSIAN_STATES);

  // Find excluded states (states NOT in eligible list)
  const excludedCodes = allStateCodes.filter(
    code => !eligibleStates.includes(code)
  );

  // Convert codes to full state names
  return excludedCodes
    .map(code => MALAYSIAN_STATES[code as MalaysianStateCode])
    .filter(Boolean); // Remove any undefined values
}

/**
 * Format excluded states for display
 *
 * Creates a grammatically correct comma-separated list with "and" before the last item.
 *
 * @param stateNames - Array of state names to format
 * @returns Formatted string (e.g., "Sabah & Sarawak" or "Sabah, Sarawak & Labuan")
 *
 * @example
 * formatExcludedStates(['Sabah', 'Sarawak']) // "Sabah & Sarawak"
 * formatExcludedStates(['Sabah', 'Sarawak', 'Labuan']) // "Sabah, Sarawak & Labuan"
 * formatExcludedStates(['Sabah']) // "Sabah"
 * formatExcludedStates([]) // ""
 */
export function formatExcludedStates(stateNames: string[]): string {
  if (stateNames.length === 0) {
    return '';
  }

  if (stateNames.length === 1) {
    return stateNames[0];
  }

  if (stateNames.length === 2) {
    return `${stateNames[0]} & ${stateNames[1]}`;
  }

  // 3 or more states: "State1, State2 & State3"
  const lastState = stateNames[stateNames.length - 1];
  const otherStates = stateNames.slice(0, -1).join(', ');
  return `${otherStates} & ${lastState}`;
}

/**
 * Generate free shipping text for product pages
 *
 * Creates a complete free shipping message based on threshold and eligible states.
 *
 * @param threshold - Minimum order amount for free shipping (in RM)
 * @param eligibleStates - Array of eligible state codes, or undefined if all states eligible
 * @param enabled - Whether free shipping is enabled
 * @returns Formatted free shipping message
 *
 * @example
 * // All states eligible
 * getFreeShippingText(150, undefined, true)
 * // "Free shipping for orders over RM 150"
 *
 * // State restrictions (excludes Sabah, Sarawak & Labuan)
 * getFreeShippingText(150, ['kul', 'sgr', 'png'], true)
 * // "Free shipping for orders over RM 150 (except for Sabah, Sarawak & Labuan)"
 *
 * // Disabled
 * getFreeShippingText(150, ['kul'], false)
 * // null
 */
export function getFreeShippingText(
  threshold: number | undefined,
  eligibleStates: string[] | undefined,
  enabled: boolean
): string | null {
  // If disabled or no threshold, don't show free shipping text
  if (!enabled || !threshold) {
    return null;
  }

  const excludedStates = getExcludedStateNames(eligibleStates);

  // Base message
  const baseMessage = `Free shipping for orders over RM ${threshold}`;

  // If no excluded states, return base message only
  if (excludedStates.length === 0) {
    return baseMessage;
  }

  // If all states excluded (edge case), don't show message
  if (excludedStates.length === Object.keys(MALAYSIAN_STATES).length) {
    return null;
  }

  // Format excluded states
  const formattedExclusions = formatExcludedStates(excludedStates);

  return `${baseMessage} (except for ${formattedExclusions})`;
}
