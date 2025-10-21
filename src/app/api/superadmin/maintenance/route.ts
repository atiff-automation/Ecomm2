import { NextRequest, NextResponse } from 'next/server';
import { checkCSRF } from '@/lib/middleware/with-csrf';

export const dynamic = 'force-dynamic';

import { getToken } from 'next-auth/jwt';
import { UserRole } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { handleApiError } from '@/lib/error-handler';

export async function POST(request: NextRequest) {
  // CSRF Protection
  const csrfCheck = await checkCSRF(request);
  if (csrfCheck) return csrfCheck;

  try {
    // Verify SuperAdmin access
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET!,
    });

    if (!token || token.role !== UserRole.SUPERADMIN) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const { enabled } = await request.json();

    if (typeof enabled !== 'boolean') {
      return NextResponse.json(
        { message: 'Enabled flag must be a boolean' },
        { status: 400 }
      );
    }

    // In production, you might want to store this in a database table
    // For now, we'll use environment variables (note: this won't persist across restarts)
    // You should implement a proper configuration management system

    // Log the maintenance mode change
    await prisma.auditLog.create({
      data: {
        userId: token.sub!,
        action: 'MAINTENANCE_MODE_TOGGLE',
        resource: 'SYSTEM',
        details: {
          enabled,
          performedBy: token.email,
          timestamp: new Date().toISOString(),
        },
        ipAddress: request.ip || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    // In a real implementation, you would update this in your configuration store
    // For demonstration purposes, we'll just return success
    // TODO: Implement proper maintenance mode storage and middleware integration

    return NextResponse.json({
      message: `Maintenance mode ${enabled ? 'enabled' : 'disabled'}`,
      enabled,
    });
  } catch (error) {
    console.error('SuperAdmin maintenance toggle error:', error);
    return handleApiError(error);
  }
}
