import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { addressSchema } from '@/lib/validation/settings';
import { AuditLogger } from '@/lib/security';

/**
 * GET /api/settings/addresses - Get user addresses
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only customers can access their addresses
    if (session.user.role !== 'CUSTOMER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const addresses = await prisma.address.findMany({
      where: { userId: session.user.id },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json({
      success: true,
      data: addresses
    });

  } catch (error) {
    console.error('Get addresses error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/settings/addresses - Add new address
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only customers can add addresses
    if (session.user.role !== 'CUSTOMER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    
    // Validate request body
    const validatedData = addressSchema.parse(body);

    // If this is set as default, remove default from other addresses of same type
    if (validatedData.isDefault) {
      await prisma.address.updateMany({
        where: {
          userId: session.user.id,
          type: validatedData.type
        },
        data: {
          isDefault: false
        }
      });
    }

    // Create new address
    const newAddress = await prisma.address.create({
      data: {
        userId: session.user.id,
        type: validatedData.type,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        company: validatedData.company || null,
        addressLine1: validatedData.addressLine1,
        addressLine2: validatedData.addressLine2 || null,
        city: validatedData.city,
        state: validatedData.state,
        postalCode: validatedData.postalCode,
        country: validatedData.country,
        phone: validatedData.phone || null,
        isDefault: validatedData.isDefault
      }
    });

    // Log the action for audit
    await AuditLogger.logUserSettingsChange(
      session.user.id,
      'ADDRESS',
      {},
      {
        action: 'CREATE_ADDRESS',
        addressId: newAddress.id,
        type: validatedData.type,
        city: validatedData.city,
        state: validatedData.state
      },
      request
    );

    return NextResponse.json({
      success: true,
      message: 'Address added successfully',
      data: newAddress
    });

  } catch (error) {
    console.error('Create address error:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input data', details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}