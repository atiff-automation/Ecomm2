import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest) {
  try {
    // Only allow this in production for debugging
    if (process.env.NODE_ENV !== 'production') {
      return NextResponse.json({ error: 'Debug endpoint only available in production' }, { status: 403 });
    }

    // Check if admin users exist
    const adminUsers = await prisma.user.findMany({
      where: {
        role: {
          in: ['ADMIN', 'SUPERADMIN']
        }
      },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        password: true, // We'll hash-check this
        createdAt: true,
        updatedAt: true
      }
    });

    // Test password hashing
    const testPassword = 'ParitRaja9396#$%';
    const testHash = await bcrypt.hash(testPassword, 12);

    const debugInfo = {
      adminUsersFound: adminUsers.length,
      users: adminUsers.map(user => ({
        email: user.email,
        role: user.role,
        status: user.status,
        passwordLength: user.password.length,
        passwordStartsWith: user.password.substring(0, 7),
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      })),
      testPasswordHash: {
        testPassword,
        generatedHash: testHash,
        hashLength: testHash.length
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasAdminPassword: !!process.env.ADMIN_PASSWORD,
        adminPasswordLength: process.env.ADMIN_PASSWORD?.length || 0
      }
    };

    return NextResponse.json(debugInfo);
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({
      error: 'Failed to fetch debug info',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}