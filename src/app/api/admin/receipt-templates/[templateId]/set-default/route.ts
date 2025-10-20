/**

export const dynamic = 'force-dynamic';

 * Set Default Template API
 * Set a specific template as the default
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { receiptTemplateService } from '@/lib/receipts/template-service';
import { UserRole } from '@prisma/client';

interface RouteParams {
  params: {
    templateId: string;
  };
}

/**
 * PUT /api/admin/receipt-templates/[templateId]/set-default
 * Set a template as the default
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
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

    const template = await receiptTemplateService.setDefaultTemplate(
      params.templateId,
      session.user.id
    );

    return NextResponse.json({
      success: true,
      template,
      message: 'Default template updated successfully',
    });
  } catch (error) {
    console.error('Set default template error:', error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to set default template',
      },
      { status: 500 }
    );
  }
}
