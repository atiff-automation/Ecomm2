/**

export const dynamic = 'force-dynamic';

 * Individual Receipt Template Management API
 * Admin endpoints for specific template operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { receiptTemplateService } from '@/lib/receipts/template-service';
import { UserRole } from '@prisma/client';
import { UpdateReceiptTemplateInput } from '@/types/receipt-templates';

interface RouteParams {
  params: {
    templateId: string;
  };
}

/**
 * GET /api/admin/receipt-templates/[templateId]
 * Get a specific receipt template
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
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

    const template = await receiptTemplateService.getTemplateById(
      params.templateId
    );

    if (!template) {
      return NextResponse.json(
        {
          success: false,
          message: 'Template not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      template,
    });
  } catch (error) {
    console.error('GET receipt template error:', error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to fetch template',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/receipt-templates/[templateId]
 * Update a receipt template
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    const body = await request.json();

    const updateInput: UpdateReceiptTemplateInput = {
      ...(body.name && { name: body.name }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.templateContent && { templateContent: body.templateContent }),
      ...(body.isDefault !== undefined && { isDefault: body.isDefault }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
      ...(body.previewImage !== undefined && {
        previewImage: body.previewImage,
      }),
    };

    const template = await receiptTemplateService.updateTemplate(
      params.templateId,
      updateInput,
      session.user.id
    );

    return NextResponse.json({
      success: true,
      template,
      message: 'Template updated successfully',
    });
  } catch (error) {
    console.error('PATCH receipt template error:', error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to update template',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/receipt-templates/[templateId]
 * Delete a receipt template
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    await receiptTemplateService.deleteTemplate(params.templateId);

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully',
    });
  } catch (error) {
    console.error('DELETE receipt template error:', error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to delete template',
      },
      { status: 500 }
    );
  }
}
