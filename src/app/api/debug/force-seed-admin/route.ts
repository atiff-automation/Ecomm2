import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    // Only allow this in production for debugging
    if (process.env.NODE_ENV !== 'production') {
      return NextResponse.json({ error: 'Debug endpoint only available in production' }, { status: 403 });
    }

    // Get admin password from environment or use default
    const adminPassword = process.env.ADMIN_PASSWORD || 'ParitRaja9396#$%';
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    console.log('🔧 Force seeding admin users...');
    console.log(`📧 Using password: ${adminPassword}`);

    // Upsert Super Admin
    const superAdmin = await prisma.user.upsert({
      where: { email: 'superadmin@jrm.com' },
      update: {
        password: hashedPassword,
        status: 'ACTIVE'
      },
      create: {
        email: 'superadmin@jrm.com',
        password: hashedPassword,
        firstName: 'Super',
        lastName: 'Admin',
        phone: '+60123456789',
        role: 'SUPERADMIN',
        status: 'ACTIVE',
        emailVerified: new Date(),
        isMember: true,
        memberSince: new Date(),
        membershipTotal: 5000.00,
      },
    });

    // Upsert Admin
    const admin = await prisma.user.upsert({
      where: { email: 'admin@jrm.com' },
      update: {
        password: hashedPassword,
        status: 'ACTIVE'
      },
      create: {
        email: 'admin@jrm.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        phone: '+60123456790',
        role: 'ADMIN',
        status: 'ACTIVE',
        emailVerified: new Date(),
        isMember: false,
      },
    });

    // Test the passwords immediately
    const superAdminTest = await bcrypt.compare(adminPassword, superAdmin.password);
    const adminTest = await bcrypt.compare(adminPassword, admin.password);

    return NextResponse.json({
      success: true,
      message: 'Admin users seeded successfully',
      debug: {
        adminPassword: adminPassword,
        users: [
          {
            email: superAdmin.email,
            role: superAdmin.role,
            status: superAdmin.status,
            passwordTest: superAdminTest
          },
          {
            email: admin.email,
            role: admin.role,
            status: admin.status,
            passwordTest: adminTest
          }
        ],
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Force seed error:', error);
    return NextResponse.json({
      error: 'Failed to seed admin users',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}