import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  hashPassword,
  validatePassword,
  sanitizeInput,
} from '@/lib/auth/utils';
import { validateMalaysianPhoneNumber } from '@/lib/utils';
import { UserStatus } from '@prisma/client';

interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: RegisterRequest = await request.json();

    const { email, password, firstName, lastName, phone } = body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { message: 'All required fields must be provided' },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const sanitizedData = {
      email: sanitizeInput(email.toLowerCase().trim()),
      firstName: sanitizeInput(firstName.trim()),
      lastName: sanitizeInput(lastName.trim()),
      phone: phone ? sanitizeInput(phone.trim()) : null,
    };

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedData.email)) {
      return NextResponse.json(
        { message: 'Invalid email format', field: 'email' },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { message: passwordValidation.errors[0], field: 'password' },
        { status: 400 }
      );
    }

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

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: sanitizedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'User with this email already exists', field: 'email' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: sanitizedData.email,
        password: hashedPassword,
        firstName: sanitizedData.firstName,
        lastName: sanitizedData.lastName,
        phone: sanitizedData.phone,
        status: UserStatus.ACTIVE, // Auto-activate for now, implement email verification later
        emailVerified: new Date(), // Set as verified for now
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
      },
    });

    // Log the registration
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE',
        resource: 'user',
        resourceId: user.id,
        details: {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        ipAddress:
          request.ip || request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json(
      {
        message: 'Account created successfully',
        user: {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);

    // Check for database constraint violations
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { message: 'User with this email already exists', field: 'email' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
