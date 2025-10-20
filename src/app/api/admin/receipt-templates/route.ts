/**

export const dynamic = 'force-dynamic';

 * Receipt Templates Management API
 * Admin endpoints for CRUD operations on receipt templates
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { receiptTemplateService } from '@/lib/receipts/template-service';
import { UserRole } from '@prisma/client';
import { CreateReceiptTemplateInput } from '@/types/receipt-templates';

/**
 * GET /api/admin/receipt-templates
 * Get all receipt templates with optional filtering
 */
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') === 'true';
    const templateType = searchParams.get('templateType') as any;

    const templates = await receiptTemplateService.getAvailableTemplates({
      activeOnly,
      templateType,
    });

    return NextResponse.json({
      success: true,
      templates,
      count: templates.length,
    });
  } catch (error) {
    console.error('GET receipt templates error:', error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to fetch templates',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/receipt-templates
 * Create a new receipt template
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

    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.templateType || !body.templateContent) {
      return NextResponse.json(
        {
          success: false,
          message: 'Name, templateType, and templateContent are required',
        },
        { status: 400 }
      );
    }

    const templateInput: CreateReceiptTemplateInput = {
      name: body.name,
      description: body.description,
      templateType: body.templateType,
      templateContent: body.templateContent,
      isDefault: body.isDefault || false,
      isActive: body.isActive !== undefined ? body.isActive : true,
      previewImage: body.previewImage,
    };

    const template = await receiptTemplateService.createTemplate(
      templateInput,
      session.user.id
    );

    return NextResponse.json(
      {
        success: true,
        template,
        message: 'Template created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST receipt template error:', error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to create template',
      },
      { status: 500 }
    );
  }
}
