/**
 * useFreshMembership Hook - Get Fresh Membership Status
 * NOW USES REACT QUERY for automatic caching and deduplication
 *
 * This file is kept for backward compatibility but delegates to the new
 * React Query-based hook in hooks/queries/use-membership-status.ts
 */

export { useFreshMembership } from './queries/use-membership-status';
