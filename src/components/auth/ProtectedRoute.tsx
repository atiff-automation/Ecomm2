'use client';

import { useSession } from 'next-auth/react';
import { UserRole } from '@prisma/client';
import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole;
  requireMember?: boolean;
  fallback?: ReactNode;
  redirectTo?: string;
}

export default function ProtectedRoute({
  children,
  requiredRole,
  requireMember = false,
  fallback,
  redirectTo = '/auth/signin',
}: ProtectedRouteProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') {
      return; // Still loading
    }

    if (!session) {
      router.push(
        `${redirectTo}?callbackUrl=${encodeURIComponent(window.location.pathname)}`
      );
      return;
    }

    // Check role requirements
    if (requiredRole) {
      const roleHierarchy = {
        [UserRole.CUSTOMER]: 0,
        [UserRole.STAFF]: 1,
        [UserRole.ADMIN]: 2,
        [UserRole.SUPERADMIN]: 3,
      };

      const userLevel = roleHierarchy[session.user.role];
      const requiredLevel = roleHierarchy[requiredRole];

      if (userLevel < requiredLevel) {
        router.push('/unauthorized');
        return;
      }
    }

    // Check member requirements
    if (
      requireMember &&
      !session.user.isMember &&
      session.user.role === UserRole.CUSTOMER
    ) {
      router.push('/membership-required');
      return;
    }
  }, [session, status, router, requiredRole, requireMember, redirectTo]);

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Not authenticated
  if (!session) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Authentication Required
            </h2>
            <p className="text-gray-600">Redirecting to login...</p>
          </div>
        </div>
      )
    );
  }

  // Role check failed
  if (requiredRole) {
    const roleHierarchy = {
      [UserRole.CUSTOMER]: 0,
      [UserRole.STAFF]: 1,
      [UserRole.ADMIN]: 2,
      [UserRole.SUPERADMIN]: 3,
    };

    const userLevel = roleHierarchy[session.user.role];
    const requiredLevel = roleHierarchy[requiredRole];

    if (userLevel < requiredLevel) {
      return (
        fallback || (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Access Denied
              </h2>
              <p className="text-gray-600">
                You don&apos;t have permission to access this page.
              </p>
            </div>
          </div>
        )
      );
    }
  }

  // Member check failed
  if (
    requireMember &&
    !session.user.isMember &&
    session.user.role === UserRole.CUSTOMER
  ) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Member Access Required
            </h2>
            <p className="text-gray-600">
              This page is only available to members.
            </p>
          </div>
        </div>
      )
    );
  }

  return <>{children}</>;
}

// Convenience components for common protection patterns
export function AdminRoute({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute requiredRole={UserRole.ADMIN}>{children}</ProtectedRoute>
  );
}

export function SuperAdminRoute({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute requiredRole={UserRole.SUPERADMIN}>
      {children}
    </ProtectedRoute>
  );
}

export function MemberRoute({ children }: { children: ReactNode }) {
  return <ProtectedRoute requireMember={true}>{children}</ProtectedRoute>;
}
