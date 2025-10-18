import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/superadmin/settings/admins - Get all admin accounts
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only superadmins can access admin management
    if (session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all admin accounts (exclude superadmins and customers)
    const admins = await prisma.user.findMany({
      where: {
        role: 'ADMIN',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        status: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        createdBy: true,
        _count: {
          select: {
            createdOrders: true,
            auditLogs: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' }, // Active first
        { createdAt: 'desc' }, // Newest first
      ],
    });

    return NextResponse.json({
      success: true,
      data: admins,
    });
  } catch (error) {
    console.error('Get admin accounts error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
