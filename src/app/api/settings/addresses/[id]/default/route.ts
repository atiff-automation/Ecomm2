import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { AuditLogger } from '@/lib/security';
import { z } from 'zod';

const setDefaultSchema = z.object({
  type: z.enum(['billing', 'shipping'])
});

/**
 * POST /api/settings/addresses/[id]/default - Set address as default
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only customers can set default addresses
    if (session.user.role !== 'CUSTOMER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const addressId = params.id;
    const body = await request.json();
    
    // Validate request body
    const { type } = setDefaultSchema.parse(body);

    // Check if address exists and belongs to user
    const existingAddress = await prisma.address.findFirst({
      where: {
        id: addressId,
        userId: session.user.id
      }
    });

    if (!existingAddress) {
      return NextResponse.json(
        { error: 'Address not found' },
        { status: 404 }
      );
    }

    // Verify address type matches requested type
    if (existingAddress.type !== type) {
      return NextResponse.json(
        { error: `Address type mismatch. This is a ${existingAddress.type} address, but you requested to set it as default ${type} address.` },
        { status: 400 }
      );
    }

    // If already default, no action needed
    if (existingAddress.isDefault) {
      return NextResponse.json({
        success: true,
        message: 'Address is already set as default'
      });
    }

    // Use transaction to ensure consistency
    await prisma.$transaction(async (tx) => {
      // Remove default from all other addresses of the same type
      await tx.address.updateMany({
        where: {
          userId: session.user.id,
          type: type,
          id: { not: addressId }
        },
        data: {
          isDefault: false
        }
      });

      // Set this address as default
      await tx.address.update({
        where: { id: addressId },
        data: {
          isDefault: true,
          updatedAt: new Date()
        }
      });
    });

    // Log the change for audit
    await AuditLogger.logUserSettingsChange(
      session.user.id,
      'ADDRESS',
      {
        action: 'SET_DEFAULT_ADDRESS',
        addressId,
        oldDefault: false
      },
      {
        action: 'SET_DEFAULT_ADDRESS',
        addressId,
        type: type,
        newDefault: true
      },
      request
    );

    return NextResponse.json({
      success: true,
      message: `Default ${type} address updated successfully`
    });

  } catch (error) {
    console.error('Set default address error:', error);
    
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