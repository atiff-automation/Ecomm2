import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    // Only allow this in production for debugging
    if (process.env.NODE_ENV !== 'production') {
      return NextResponse.json({ error: 'Debug endpoint only available in production' }, { status: 403 });
    }

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        role: true,
        status: true,
        firstName: true,
        lastName: true
      }
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
        debug: {
          searchedEmail: email,
          userExists: false
        }
      });
    }

    // Test password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    // Test with various password variations
    const passwordTests = {
      exact: await bcrypt.compare(password, user.password),
      withoutSpecialChars: await bcrypt.compare(password.replace(/[#$%]/g, ''), user.password),
      lowercase: await bcrypt.compare(password.toLowerCase(), user.password),
      default: await bcrypt.compare('password123', user.password)
    };

    return NextResponse.json({
      success: isPasswordValid,
      debug: {
        userFound: true,
        userEmail: user.email,
        userRole: user.role,
        userStatus: user.status,
        passwordTests,
        providedPassword: password,
        storedPasswordHash: user.password.substring(0, 20) + '...',
        storedPasswordLength: user.password.length
      }
    });

  } catch (error) {
    console.error('Test login error:', error);
    return NextResponse.json({
      error: 'Failed to test login',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}