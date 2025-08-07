/**
 * Development User Creation API - JRM E-commerce Platform
 * DEVELOPMENT ONLY - Creates users with specified roles
 * This endpoint should be removed in production
 */

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db/prisma';
import { UserRole } from '@prisma/client';

export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { message: 'This endpoint is not available in production' },
      { status: 403 }
    );
  }

  try {
    const { email, password, firstName, lastName, role, isMember } =
      await request.json();

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !role) {
      return NextResponse.json(
        { message: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate role
    if (!Object.values(UserRole).includes(role)) {
      return NextResponse.json(
        { message: 'Invalid role specified' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user with specified role
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role,
        isMember: Boolean(isMember),
        memberSince: isMember ? new Date() : null,
        emailVerified: new Date(), // Auto-verify for dev accounts
        status: 'ACTIVE',
      },
    });

    return NextResponse.json(
      {
        message: 'User created successfully',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isMember: user.isMember,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating dev user:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
