/**
 * User Validation Cache
 * Reduces database queries by caching user validation and session data
 */

import { LRUCache } from 'lru-cache';

// User validation cache - prevents DB query on every request
const userValidationCache = new LRUCache<string, boolean>({
  max: 5000, // Cache up to 5000 users
  ttl: 60 * 1000, // 1 minute TTL
  updateAgeOnGet: false,
  updateAgeOnHas: false,
});

export function getCachedUserValidation(userId: string): boolean | undefined {
  return userValidationCache.get(userId);
}

export function setCachedUserValidation(userId: string, isValid: boolean): void {
  userValidationCache.set(userId, isValid);
}

export function invalidateUserValidation(userId: string): void {
  userValidationCache.delete(userId);
}

export function clearUserValidationCache(): void {
  userValidationCache.clear();
}

// Session data cache - reduces DB queries for user info
const sessionDataCache = new LRUCache<string, {
  role: string;
  isMember: boolean;
  memberSince: Date | null;
  status: string;
}>({
  max: 5000,
  ttl: 5 * 60 * 1000, // 5 minute TTL for session data
});

export function getCachedSessionData(userId: string) {
  return sessionDataCache.get(userId);
}

export function setCachedSessionData(userId: string, data: {
  role: string;
  isMember: boolean;
  memberSince: Date | null;
  status: string;
}): void {
  sessionDataCache.set(userId, data);
}

export function invalidateSessionData(userId: string): void {
  sessionDataCache.delete(userId);
}

export function clearSessionDataCache(): void {
  sessionDataCache.clear();
}

/**
 * Invalidate all caches for a user
 * Call this when user data changes (role, status, membership, etc.)
 */
export function invalidateUserCache(userId: string): void {
  invalidateUserValidation(userId);
  invalidateSessionData(userId);
  console.log(`🔄 Invalidated cache for user: ${userId}`);
}

/**
 * Get cache statistics for monitoring
 */
export function getCacheStats() {
  return {
    userValidation: {
      size: userValidationCache.size,
      max: userValidationCache.max,
    },
    sessionData: {
      size: sessionDataCache.size,
      max: sessionDataCache.max,
    },
  };
}
