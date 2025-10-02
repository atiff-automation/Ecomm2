/**

export const dynamic = 'force-dynamic';

 * Member Profile API - Malaysian E-commerce Platform
 * Handles member profile retrieval and updates
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

/**
 * GET /api/member/profile - Get member profile information
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Allow all authenticated users to access their profile
    // Membership only affects pricing, not access to user account features

    // Get user profile information
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        dateOfBirth: true,
        memberSince: true,
        membershipTotal: true,
      },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const profile = {
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email,
      phone: user.phone,
      dateOfBirth: user.dateOfBirth?.toISOString().split('T')[0] || null,
      memberSince: user.memberSince?.toISOString() || null,
      membershipTotal: Number(user.membershipTotal || 0),
    };

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Error fetching member profile:', error);
    return NextResponse.json(
      { message: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/member/profile - Update member profile information
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Allow all authenticated users to access their profile
    // Membership only affects pricing, not access to user account features

    const body = await request.json();
    const { firstName, lastName, email, phone, dateOfBirth } = body;

    // Validate required fields
    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { message: 'First name, last name, and email are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if email is already taken by another user
    const existingUser = await prisma.user.findFirst({
      where: {
        email: email,
        id: { not: session.user.id },
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'Email is already taken' },
        { status: 400 }
      );
    }

    // Validate phone format (Malaysian format)
    if (phone && phone.trim()) {
      const phoneRegex = /^(\+?6?0)?1[0-9]-?[0-9]{7,8}$/;
      if (!phoneRegex.test(phone.replace(/[\s-]/g, ''))) {
        return NextResponse.json(
          { message: 'Invalid Malaysian phone number format' },
          { status: 400 }
        );
      }
    }

    // Validate date of birth
    let parsedDateOfBirth = null;
    if (dateOfBirth && dateOfBirth.trim()) {
      parsedDateOfBirth = new Date(dateOfBirth);
      if (isNaN(parsedDateOfBirth.getTime())) {
        return NextResponse.json(
          { message: 'Invalid date of birth format' },
          { status: 400 }
        );
      }

      // Check if date is not in the future
      if (parsedDateOfBirth > new Date()) {
        return NextResponse.json(
          { message: 'Date of birth cannot be in the future' },
          { status: 400 }
        );
      }

      // Check if date is reasonable (not older than 120 years)
      const minDate = new Date();
      minDate.setFullYear(minDate.getFullYear() - 120);
      if (parsedDateOfBirth < minDate) {
        return NextResponse.json(
          { message: 'Date of birth is not valid' },
          { status: 400 }
        );
      }
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone && phone.trim() ? phone.trim() : null,
        dateOfBirth: parsedDateOfBirth,
        updatedAt: new Date(),
      },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        dateOfBirth: true,
        memberSince: true,
        membershipTotal: true,
      },
    });

    // Create audit log for profile update (only log field names, not sensitive values)
    const updatedFields = [];
    if (firstName.trim()) {
      updatedFields.push('firstName');
    }
    if (lastName.trim()) {
      updatedFields.push('lastName');
    }
    if (email.trim()) {
      updatedFields.push('email');
    }
    if (phone && phone.trim()) {
      updatedFields.push('phone');
    }
    if (parsedDateOfBirth) {
      updatedFields.push('dateOfBirth');
    }

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        resource: 'UserProfile',
        resourceId: session.user.id,
        details: {
          updatedFields,
          fieldCount: updatedFields.length,
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    const profile = {
      firstName: updatedUser.firstName || '',
      lastName: updatedUser.lastName || '',
      email: updatedUser.email,
      phone: updatedUser.phone,
      dateOfBirth: updatedUser.dateOfBirth?.toISOString().split('T')[0] || null,
      memberSince: updatedUser.memberSince?.toISOString() || null,
      membershipTotal: Number(updatedUser.membershipTotal || 0),
    };

    return NextResponse.json({
      message: 'Profile updated successfully',
      profile,
    });
  } catch (error) {
    console.error('Error updating member profile:', error);
    return NextResponse.json(
      { message: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
