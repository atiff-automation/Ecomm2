/**
 * Auth Module - Main Export
 * Re-exports auth configuration and utilities
 */

export { authOptions } from './config';
export { isAdmin, isAdminOrSelf, isSelfOrAdmin } from './authorization';
export { protectRoute } from './protect';
export { hashPassword, comparePasswords, generateToken } from './utils';
