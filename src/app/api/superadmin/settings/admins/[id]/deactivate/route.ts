import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { AuditLogger } from '@/lib/security';

/**
 * POST /api/superadmin/settings/admins/[id]/deactivate - Deactivate admin account
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only superadmins can deactivate admin accounts
    if (session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const adminId = params.id;
    const body = await request.json();
    const { reason } = body;

    if (!reason || typeof reason !== 'string' || reason.trim() === '') {
      return NextResponse.json(
        { error: 'Deactivation reason is required' },
        { status: 400 }
      );
    }

    // Prevent superadmins from deactivating themselves
    if (adminId === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot deactivate your own account' },
        { status: 400 }
      );
    }

    // Check if admin exists and is actually an admin
    const adminUser = await prisma.user.findFirst({
      where: {
        id: adminId,
        role: 'ADMIN'
      }
    });

    if (!adminUser) {
      return NextResponse.json(
        { error: 'Admin account not found' },
        { status: 404 }
      );
    }

    // Check if already inactive
    if (adminUser.status === 'INACTIVE') {
      return NextResponse.json({
        success: true,
        message: 'Admin account is already inactive'
      });
    }

    // Deactivate the admin account
    const updatedAdmin = await prisma.user.update({
      where: { id: adminId },
      data: {
        status: 'INACTIVE',
        updatedAt: new Date(),
        updatedBy: session.user.id
      }
    });

    // Log the deactivation for audit
    await AuditLogger.logUserSettingsChange(
      session.user.id,
      'ADMIN_MANAGEMENT',
      {
        action: 'DEACTIVATE_ADMIN_ACCOUNT',
        targetAdminId: adminId,
        targetAdminEmail: adminUser.email,
        previousStatus: adminUser.status,
        reason: reason.trim()
      },
      {
        action: 'DEACTIVATE_ADMIN_ACCOUNT',
        targetAdminId: adminId,
        targetAdminEmail: adminUser.email,
        newStatus: 'INACTIVE',
        reason: reason.trim(),
        timestamp: new Date()
      },
      request
    );

    // TODO: Invalidate all sessions for this admin user
    // This would require session management implementation
    // For now, the user will be blocked on next request due to status check

    return NextResponse.json({
      success: true,
      message: 'Admin account deactivated successfully',
      data: {
        id: updatedAdmin.id,
        email: updatedAdmin.email,
        status: updatedAdmin.status,
        reason: reason.trim()
      }
    });

  } catch (error) {
    console.error('Deactivate admin account error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}