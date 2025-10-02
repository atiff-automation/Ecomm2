/**

export const dynamic = 'force-dynamic';

 * toyyibPay Category Management API
 * Admin endpoints for managing toyyibPay categories
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { toyyibPayCategoryService } from '@/lib/services/toyyibpay-category';
import { toyyibPayCredentialsService } from '@/lib/services/toyyibpay-credentials';
import { z } from 'zod';

// Validation schemas
const createCategorySchema = z.object({
  categoryName: z
    .string()
    .min(1, 'Category name is required')
    .max(50, 'Category name too long'),
  categoryDescription: z
    .string()
    .min(1, 'Category description is required')
    .max(100, 'Category description too long'),
});

const getCategorySchema = z.object({
  categoryCode: z.string().min(1, 'Category code is required'),
});

/**
 * GET - Get category details or list
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const categoryCode = searchParams.get('categoryCode');
    const action = searchParams.get('action');

    console.log('🔍 Admin requesting category operation:', {
      categoryCode,
      action,
    });

    // Check if credentials are configured
    const credentialStatus =
      await toyyibPayCredentialsService.getCredentialStatus();
    if (!credentialStatus.hasCredentials) {
      return NextResponse.json(
        {
          success: false,
          error: 'toyyibPay credentials not configured',
        },
        { status: 400 }
      );
    }

    if (action === 'default') {
      // Get or create default category
      console.log('🔍 Getting or creating default category');
      const result =
        await toyyibPayCategoryService.getOrCreateDefaultCategory();

      return NextResponse.json({
        success: result.success,
        categoryCode: result.categoryCode,
        error: result.error,
      });
    } else if (categoryCode) {
      // Get specific category details
      console.log(`🔍 Getting category details for: ${categoryCode}`);
      const result = await toyyibPayCategoryService.getCategory(categoryCode);

      return NextResponse.json({
        success: result.success,
        category: result.category,
        error: result.error,
      });
    } else {
      // Return current default category from credentials
      return NextResponse.json({
        success: true,
        currentCategory: credentialStatus.categoryCode || null,
        hasCredentials: credentialStatus.hasCredentials,
        environment: credentialStatus.environment,
      });
    }
  } catch (error) {
    console.error('Error in category GET operation:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process category request',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Create new category
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log('🔍 Admin creating toyyibPay category:', body.categoryName);

    // Validate request body
    const validationResult = createCategorySchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { categoryName, categoryDescription } = validationResult.data;

    // Check if credentials are configured
    const credentialStatus =
      await toyyibPayCredentialsService.getCredentialStatus();
    if (!credentialStatus.hasCredentials) {
      return NextResponse.json(
        {
          success: false,
          error:
            'toyyibPay credentials not configured. Please configure credentials first.',
        },
        { status: 400 }
      );
    }

    // Create category
    const result = await toyyibPayCategoryService.createCategory(
      categoryName,
      categoryDescription
    );

    if (result.success && result.categoryCode) {
      // Log the operation
      await toyyibPayCredentialsService.logCredentialOperation(
        'CREATE_CATEGORY',
        session.user.id,
        {
          categoryName,
          categoryCode: result.categoryCode,
          environment: credentialStatus.environment,
        }
      );

      console.log(`✅ Category created successfully: ${result.categoryCode}`);

      return NextResponse.json({
        success: true,
        message: 'Category created successfully',
        categoryCode: result.categoryCode,
        categoryName: categoryName,
        categoryDescription: categoryDescription,
      });
    } else {
      console.log(`❌ Category creation failed: ${result.error}`);
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to create category',
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error creating toyyibPay category:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create category',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update category (set as default)
 */
export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { categoryCode, action } = body;

    console.log('🔍 Admin updating category:', { categoryCode, action });

    if (action === 'setDefault' && categoryCode) {
      // Validate that the category exists
      const categoryResult =
        await toyyibPayCategoryService.getCategory(categoryCode);

      if (!categoryResult.success) {
        return NextResponse.json(
          {
            success: false,
            error: 'Category not found or invalid',
          },
          { status: 400 }
        );
      }

      // Update the stored category code in credentials
      const { prisma } = await import('@/lib/db/prisma');

      await prisma.systemConfig.upsert({
        where: { key: 'toyyibpay_category_code' },
        update: {
          value: categoryCode,
          updatedAt: new Date(),
        },
        create: {
          key: 'toyyibpay_category_code',
          value: categoryCode,
          type: 'string',
        },
      });

      // Log the operation
      await toyyibPayCredentialsService.logCredentialOperation(
        'SET_DEFAULT_CATEGORY',
        session.user.id,
        {
          categoryCode,
          categoryName: categoryResult.category?.categoryName,
        }
      );

      console.log(`✅ Default category updated to: ${categoryCode}`);

      return NextResponse.json({
        success: true,
        message: 'Default category updated successfully',
        categoryCode: categoryCode,
        category: categoryResult.category,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid action or missing category code',
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update category',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
