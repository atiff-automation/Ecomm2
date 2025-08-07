import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/protect';
import { prisma } from '@/lib/db/prisma';
import { sanitizeInput } from '@/lib/auth/utils';
import { validateMalaysianPhoneNumber } from '@/lib/utils';

// GET /api/user/profile - Get current user profile
export async function GET() {
  const session = await requireAuth();

  if (session instanceof NextResponse) {
    return session; // Return error response
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        isMember: true,
        memberSince: true,
        membershipTotal: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/user/profile - Update current user profile
export async function PUT(request: NextRequest) {
  const session = await requireAuth();

  if (session instanceof NextResponse) {
    return session; // Return error response
  }

  try {
    const body = await request.json();
    const { firstName, lastName, phone } = body;

    // Validate required fields
    if (!firstName || !lastName) {
      return NextResponse.json(
        { message: 'First name and last name are required' },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const sanitizedData = {
      firstName: sanitizeInput(firstName.trim()),
      lastName: sanitizeInput(lastName.trim()),
      phone: phone ? sanitizeInput(phone.trim()) : null,
    };

    // Validate phone number if provided
    if (
      sanitizedData.phone &&
      !validateMalaysianPhoneNumber(sanitizedData.phone)
    ) {
      return NextResponse.json(
        { message: 'Invalid Malaysian phone number format', field: 'phone' },
        { status: 400 }
      );
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        firstName: sanitizedData.firstName,
        lastName: sanitizedData.lastName,
        phone: sanitizedData.phone,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        isMember: true,
        memberSince: true,
        membershipTotal: true,
      },
    });

    // Log the profile update
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        resource: 'user',
        resourceId: session.user.id,
        details: {
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          phone: updatedUser.phone,
        },
        ipAddress:
          request.ip || request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Failed to update user profile:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
