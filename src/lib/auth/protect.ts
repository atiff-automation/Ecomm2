import { getServerSession } from 'next-auth/next';
import { authOptions } from './config';
import { UserRole } from '@prisma/client';
import { NextResponse } from 'next/server';

/**
 * Server-side protection for API routes
 */
export async function requireAuth() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json(
      { message: 'Authentication required' },
      { status: 401 }
    );
  }

  return session;
}

/**
 * Server-side role-based protection for API routes
 */
export async function requireRole(requiredRole: UserRole) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json(
      { message: 'Authentication required' },
      { status: 401 }
    );
  }

  const roleHierarchy = {
    [UserRole.CUSTOMER]: 0,
    [UserRole.STAFF]: 1,
    [UserRole.ADMIN]: 2,
    [UserRole.SUPERADMIN]: 3,
  };

  const userLevel = roleHierarchy[session.user.role];
  const requiredLevel = roleHierarchy[requiredRole];

  if (userLevel < requiredLevel) {
    return NextResponse.json(
      { message: 'Insufficient privileges' },
      { status: 403 }
    );
  }

  return session;
}

/**
 * Server-side member protection for API routes
 */
export async function requireMember() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json(
      { message: 'Authentication required' },
      { status: 401 }
    );
  }

  if (!session.user.isMember && session.user.role === UserRole.CUSTOMER) {
    return NextResponse.json(
      { message: 'Member access required' },
      { status: 403 }
    );
  }

  return session;
}

/**
 * SuperAdmin-only protection (emergency access only)
 */
export async function requireSuperAdmin() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json(
      { message: 'Authentication required' },
      { status: 401 }
    );
  }

  if (session.user.role !== UserRole.SUPERADMIN) {
    return NextResponse.json(
      { message: 'SuperAdmin access required' },
      { status: 403 }
    );
  }

  return session;
}
