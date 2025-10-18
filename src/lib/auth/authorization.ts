/**
 * Centralized Authorization Helpers
 * Provides consistent role-based access control across all API routes
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { UserRole } from '@prisma/client';

// Define role hierarchies
export const ROLES = {
  SUPERADMIN_ONLY: [UserRole.SUPERADMIN],
  ADMIN_ROLES: [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.STAFF],
  MEMBER_ROLES: [
    UserRole.SUPERADMIN,
    UserRole.ADMIN,
    UserRole.STAFF,
    UserRole.USER,
  ],
} as const;

export interface AuthResult {
  error: NextResponse | null;
  session: any | null;
}

/**
 * Require admin-level access (SUPERADMIN, ADMIN, or STAFF)
 * Use this for all /api/admin/* endpoints
 */
export async function requireAdminRole(): Promise<AuthResult> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return {
      error: NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      ),
      session: null,
    };
  }

  if (!ROLES.ADMIN_ROLES.includes(session.user.role)) {
    return {
      error: NextResponse.json(
        { success: false, message: 'Unauthorized. Admin access required.' },
        { status: 403 }
      ),
      session: null,
    };
  }

  return { error: null, session };
}

/**
 * Require superadmin-only access
 * Use this for all /api/superadmin/* endpoints
 */
export async function requireSuperAdminRole(): Promise<AuthResult> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return {
      error: NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      ),
      session: null,
    };
  }

  if (session.user.role !== UserRole.SUPERADMIN) {
    return {
      error: NextResponse.json(
        {
          success: false,
          message: 'Unauthorized. SuperAdmin access required.',
        },
        { status: 403 }
      ),
      session: null,
    };
  }

  return { error: null, session };
}

/**
 * Require authenticated user (any role)
 * Use this for all authenticated endpoints that don't need specific roles
 */
export async function requireAuth(): Promise<AuthResult> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return {
      error: NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      ),
      session: null,
    };
  }

  return { error: null, session };
}

/**
 * Require member role (active membership)
 * Use this for member-only features
 */
export async function requireMemberRole(): Promise<AuthResult> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return {
      error: NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      ),
      session: null,
    };
  }

  if (
    !session.user.isMember &&
    !ROLES.ADMIN_ROLES.includes(session.user.role)
  ) {
    return {
      error: NextResponse.json(
        { success: false, message: 'Membership required for this feature' },
        { status: 403 }
      ),
      session: null,
    };
  }

  return { error: null, session };
}

/**
 * Check if user has specific role(s)
 * Use this for custom role requirements
 */
export function hasRole(session: any, roles: UserRole[]): boolean {
  return session?.user && roles.includes(session.user.role);
}

/**
 * Check if user is admin or higher
 */
export function isAdmin(session: any): boolean {
  return hasRole(session, ROLES.ADMIN_ROLES);
}

/**
 * Check if user is superadmin
 */
export function isSuperAdmin(session: any): boolean {
  return hasRole(session, ROLES.SUPERADMIN_ONLY);
}
