import { NextRequest, NextResponse } from 'next/server';
import { checkCSRF } from '@/lib/middleware/with-csrf';
import { requireAdminRole } from '@/lib/auth/authorization';

export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/db/prisma';
import { UserRole } from '@prisma/client';

export async function POST(request: NextRequest) {
  // CSRF Protection
  const csrfCheck = await checkCSRF(request);
  if (csrfCheck) return csrfCheck;

  try {
    // Authorization check
    const { error, session } = await requireAdminRole();
    if (error) {
      return error;
    }

    const { orderIds, status } = await request.json();

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { error: 'Order IDs are required' },
        { status: 400 }
      );
    }

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = [
      'PENDING',
      'PROCESSING',
      'SHIPPED',
      'DELIVERED',
      'CANCELLED',
    ];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Update orders
    const result = await prisma.order.updateMany({
      where: {
        id: {
          in: orderIds,
        },
      },
      data: {
        status,
        updatedAt: new Date(),
      },
    });

    // Note: Admin activity logging would be implemented with AuditLog model
    // For now, we'll skip this until the model is properly set up

    return NextResponse.json({
      success: true,
      updatedCount: result.count,
    });
  } catch (error) {
    console.error('Bulk order update error:', error);
    return NextResponse.json(
      { error: 'Failed to update orders' },
      { status: 500 }
    );
  }
}
