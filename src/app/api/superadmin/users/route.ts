import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { UserRole } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { handleApiError } from '@/lib/error-handler';

export async function GET(request: NextRequest) {
  try {
    // Verify SuperAdmin access
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET!,
    });

    if (!token || token.role !== UserRole.SUPERADMIN) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Fetch only admin and staff users (no customers for security)
    const adminUsers = await prisma.user.findMany({
      where: {
        role: {
          in: [UserRole.ADMIN, UserRole.STAFF, UserRole.SUPERADMIN],
        },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: [
        { role: 'desc' }, // SuperAdmin first, then Admin, then Staff
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json(adminUsers);
  } catch (error) {
    console.error('SuperAdmin users fetch error:', error);
    return handleApiError(error);
  }
}
