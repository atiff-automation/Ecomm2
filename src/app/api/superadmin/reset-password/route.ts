import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { getToken } from 'next-auth/jwt';
import { UserRole } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { handleApiError } from '@/lib/error-handler';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    // Verify SuperAdmin access
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET!,
    });

    if (!token || token.role !== UserRole.SUPERADMIN) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { message: 'Email address is required' },
        { status: 400 }
      );
    }

    // Find user by email (only admin/staff users)
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'Admin user not found' },
        { status: 404 }
      );
    }

    // Only allow password reset for admin/staff (not customers)
    if (user.role === UserRole.CUSTOMER) {
      return NextResponse.json(
        {
          message:
            'Customer password resets must be handled through admin interface',
        },
        { status: 403 }
      );
    }

    // Generate temporary password
    const tempPassword = crypto.randomBytes(12).toString('hex');
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    // Update user password
    await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        // Set flag to force password change on next login (if you implement this feature)
        // forcePasswordChange: true,
      },
    });

    // Log the action for audit trail
    await prisma.auditLog.create({
      data: {
        userId: token.sub!,
        action: 'PASSWORD_RESET',
        resource: 'USER',
        details: {
          targetUserId: user.id,
          targetUserEmail: user.email,
          performedBy: token.email,
          resetType: 'EMERGENCY_RESET',
        },
        ipAddress: request.ip || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    // In a real implementation, you would send this via email
    // For now, we'll return it in the response (ONLY for development)
    // TODO: Implement actual email sending in production
    console.log(`Temporary password for ${email}: ${tempPassword}`);

    // In production, remove the tempPassword from response
    return NextResponse.json({
      message: 'Password reset successful',
      email: user.email,
      // Remove this line in production:
      tempPassword: tempPassword, // Only for development
    });
  } catch (error) {
    console.error('SuperAdmin password reset error:', error);
    return handleApiError(error);
  }
}
