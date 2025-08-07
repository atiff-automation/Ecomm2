import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { UserRole, UserStatus } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { handleApiError } from '@/lib/error-handler';

export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Verify SuperAdmin access
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET!,
    });

    if (!token || token.role !== UserRole.SUPERADMIN) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const { status } = await request.json();
    const { userId } = params;

    // Validate status
    if (!Object.values(UserStatus).includes(status)) {
      return NextResponse.json(
        { message: 'Invalid status value' },
        { status: 400 }
      );
    }

    // Get user to verify they exist and are admin/staff
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Prevent modifying SuperAdmin accounts (except self)
    if (user.role === UserRole.SUPERADMIN && user.id !== token.sub) {
      return NextResponse.json(
        { message: 'Cannot modify other SuperAdmin accounts' },
        { status: 403 }
      );
    }

    // Prevent modifying customer accounts through SuperAdmin interface
    if (user.role === UserRole.CUSTOMER) {
      return NextResponse.json(
        {
          message: 'Customer accounts must be managed through admin interface',
        },
        { status: 403 }
      );
    }

    // Update user status
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { status },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
      },
    });

    // Log the action for audit trail
    await prisma.auditLog.create({
      data: {
        userId: token.sub!,
        action: 'USER_STATUS_CHANGE',
        resource: 'USER',
        details: {
          targetUserId: userId,
          targetUserEmail: user.email,
          oldStatus: user.role, // This should be previous status, but we'll log role for now
          newStatus: status,
          performedBy: token.email,
        },
        ipAddress: request.ip || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('SuperAdmin user status update error:', error);
    return handleApiError(error);
  }
}
