import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { AuditLogger } from '@/lib/security';

/**
 * POST /api/superadmin/settings/admins/[id]/activate - Activate admin account
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

    // Only superadmins can activate admin accounts
    if (session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const adminId = params.id;

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

    // Check if already active
    if (adminUser.status === 'ACTIVE') {
      return NextResponse.json({
        success: true,
        message: 'Admin account is already active'
      });
    }

    // Activate the admin account
    const updatedAdmin = await prisma.user.update({
      where: { id: adminId },
      data: {
        status: 'ACTIVE',
        updatedAt: new Date(),
        updatedBy: session.user.id
      }
    });

    // Log the activation for audit
    await AuditLogger.logUserSettingsChange(
      session.user.id,
      'ADMIN_MANAGEMENT',
      {
        action: 'ACTIVATE_ADMIN_ACCOUNT',
        targetAdminId: adminId,
        targetAdminEmail: adminUser.email,
        previousStatus: adminUser.status
      },
      {
        action: 'ACTIVATE_ADMIN_ACCOUNT',
        targetAdminId: adminId,
        targetAdminEmail: adminUser.email,
        newStatus: 'ACTIVE',
        timestamp: new Date()
      },
      request
    );

    return NextResponse.json({
      success: true,
      message: 'Admin account activated successfully',
      data: {
        id: updatedAdmin.id,
        email: updatedAdmin.email,
        status: updatedAdmin.status
      }
    });

  } catch (error) {
    console.error('Activate admin account error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}