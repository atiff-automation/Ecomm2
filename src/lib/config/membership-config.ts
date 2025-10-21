/**
 * Membership Configuration Service - Malaysian E-commerce Platform
 * Single source of truth for membership configuration
 * Provides caching to avoid repeated database queries
 *
 * Following @CLAUDE.md principles:
 * - Single Responsibility: Only handles membership config
 * - DRY: Eliminates hardcoded values across multiple files
 * - Centralized: Single source of truth for membership rules
 */

import { prisma } from '@/lib/db/prisma';
import config from '@/lib/config/app-config';

export interface MembershipConfig {
  membershipThreshold: number;
  enablePromotionalExclusion: boolean;
  requireQualifyingProducts: boolean;
}

// In-memory cache with TTL
let cachedConfig: MembershipConfig | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

/**
 * Get membership configuration from database with caching
 * This is the ONLY function that should read membership config
 */
export async function getMembershipConfiguration(): Promise<MembershipConfig> {
  const now = Date.now();

  // Return cached config if still valid
  if (cachedConfig && (now - cacheTimestamp) < CACHE_TTL_MS) {
    return cachedConfig;
  }

  // Fetch from database
  const configs = await prisma.systemConfig.findMany({
    where: {
      key: {
        in: [
          'membership_threshold',
          'enable_promotional_exclusion',
          'require_qualifying_categories',
        ],
      },
    },
  });

  const configMap = configs.reduce(
    (acc, config) => {
      acc[config.key] = config.value;
      return acc;
    },
    {} as Record<string, string>
  );

  // Parse and construct config object with defaults
  const membershipConfig: MembershipConfig = {
    membershipThreshold: configMap.membership_threshold
      ? parseFloat(configMap.membership_threshold)
      : config.business.membership.threshold,
    enablePromotionalExclusion: configMap.enable_promotional_exclusion
      ? configMap.enable_promotional_exclusion === 'true'
      : true,
    requireQualifyingProducts: configMap.require_qualifying_categories
      ? configMap.require_qualifying_categories === 'true'
      : true,
  };

  // Update cache
  cachedConfig = membershipConfig;
  cacheTimestamp = now;

  return membershipConfig;
}

/**
 * Invalidate cache - call this after updating membership config
 */
export function invalidateMembershipConfigCache(): void {
  cachedConfig = null;
  cacheTimestamp = 0;
}

/**
 * Get cached config synchronously (use only when config was pre-fetched)
 * Returns null if cache is empty or expired
 */
export function getCachedMembershipConfig(): MembershipConfig | null {
  const now = Date.now();

  if (cachedConfig && (now - cacheTimestamp) < CACHE_TTL_MS) {
    return cachedConfig;
  }

  return null;
}
