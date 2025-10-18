/**
 * Auth Module - Main Export
 * Re-exports auth configuration and utilities
 * Following CLAUDE.md principle: Only export what exists
 */

// Core auth configuration
export { authOptions } from './config';

// Authorization helpers (all exist in authorization.ts)
export {
  isAdmin,
  isSuperAdmin,
  hasRole,
  requireAuth,
  requireAdminRole,
  requireSuperAdminRole,
  requireMemberRole,
  ROLES,
  type AuthResult,
} from './authorization';

// Route protection (all exist in protect.ts)
export {
  requireAuth as protectAuth,
  requireRole,
  requireMember,
  requireSuperAdmin as protectSuperAdmin,
  requireUserAccount,
} from './protect';

// Password utilities (all exist in utils.ts)
export {
  hashPassword,
  verifyPassword,
  validatePassword,
  hasRole as checkUserRole,
  generateSecureToken,
  sanitizeInput,
} from './utils';
