/**

export const dynamic = 'force-dynamic';

 * Initialize Default Templates API
 * Create default receipt templates in the system
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { receiptTemplateService } from '@/lib/receipts/template-service';
import { UserRole } from '@prisma/client';

/**
 * POST /api/admin/receipt-templates/initialize
 * Initialize the system with default templates
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check admin authentication
    if (
      !session?.user ||
      ![UserRole.ADMIN, UserRole.SUPERADMIN].includes(
        session.user.role as UserRole
      )
    ) {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      );
    }

    // Initialize default templates
    await receiptTemplateService.initializeDefaultTemplates(session.user.id);

    // Get the created templates
    const templates = await receiptTemplateService.getAvailableTemplates();

    return NextResponse.json(
      {
        success: true,
        message: 'Default templates initialized successfully',
        templates,
        count: templates.length,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Initialize templates error:', error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to initialize default templates',
      },
      { status: 500 }
    );
  }
}
