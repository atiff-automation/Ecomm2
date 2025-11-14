/**
 * Admin API: Individual Article Category Management
 * GET /api/admin/article-categories/[id] - Get category
 * PUT /api/admin/article-categories/[id] - Update category
 * DELETE /api/admin/article-categories/[id] - Delete category
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAdminRole } from '@/lib/auth/authorization';
import { articleCategoryUpdateSchema } from '@/lib/validations/article-validation';
import { ZodError } from 'zod';
import { checkCSRF } from '@/lib/middleware/with-csrf';

/**
 * GET /api/admin/article-categories/[id]
 * Get single article category
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await requireAdminRole();
    if (error) {
      return error;
    }

    const category = await prisma.articleCategory.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { articles: true },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Article category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ category });
  } catch (error) {
    console.error('Error fetching article category:', error);
    return NextResponse.json(
      { error: 'Failed to fetch article category' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/article-categories/[id]
 * Update article category
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // CSRF Protection
  const csrfCheck = await checkCSRF(request);
  if (csrfCheck) return csrfCheck;

  try {
    const { error, session } = await requireAdminRole();
    if (error) {
      return error;
    }

    const body = await request.json();
    const validatedData = articleCategoryUpdateSchema.parse(body);

    // Check if category exists
    const existing = await prisma.articleCategory.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Article category not found' },
        { status: 404 }
      );
    }

    // Check if name is being changed and if it conflicts
    if (
      validatedData.name &&
      validatedData.name !== existing.name
    ) {
      const nameConflict = await prisma.articleCategory.findUnique({
        where: { name: validatedData.name },
      });

      if (nameConflict) {
        return NextResponse.json(
          { error: 'A category with this name already exists' },
          { status: 400 }
        );
      }
    }

    // Update category
    const category = await prisma.articleCategory.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        updatedBy: session.user.id,
      },
    });

    return NextResponse.json({
      category,
      message: 'Article category updated successfully',
    });
  } catch (error) {
    console.error('Error updating article category:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update article category' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/article-categories/[id]
 * Delete article category
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // CSRF Protection
  const csrfCheck = await checkCSRF(request);
  if (csrfCheck) return csrfCheck;

  try {
    const { error } = await requireAdminRole();
    if (error) {
      return error;
    }

    // Check if category exists
    const existing = await prisma.articleCategory.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { articles: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Article category not found' },
        { status: 404 }
      );
    }

    // Prevent deletion if category has articles (due to onDelete: Restrict in schema)
    if (existing._count.articles > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete category with ${existing._count.articles} article(s). Please reassign or delete the articles first.`,
        },
        { status: 400 }
      );
    }

    // Delete category
    await prisma.articleCategory.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      message: 'Article category deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting article category:', error);
    return NextResponse.json(
      { error: 'Failed to delete article category' },
      { status: 500 }
    );
  }
}
