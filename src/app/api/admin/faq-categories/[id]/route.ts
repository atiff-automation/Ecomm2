/**
 * Admin API: Individual FAQ Category Management
 * GET /api/admin/faq-categories/[id] - Get category
 * PUT /api/admin/faq-categories/[id] - Update category
 * DELETE /api/admin/faq-categories/[id] - Delete category
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAdminRole } from '@/lib/auth/authorization';
import { faqCategoryUpdateSchema } from '@/lib/validations/faq-category-validation';
import { ZodError } from 'zod';

/**
 * GET /api/admin/faq-categories/[id]
 * Get single FAQ category
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

    const category = await prisma.fAQCategory.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { faqs: true },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: 'FAQ category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ category });
  } catch (error) {
    console.error('Error fetching FAQ category:', error);
    return NextResponse.json(
      { error: 'Failed to fetch FAQ category' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/faq-categories/[id]
 * Update FAQ category
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error, session } = await requireAdminRole();
    if (error) {
      return error;
    }

    const body = await request.json();
    const validatedData = faqCategoryUpdateSchema.parse(body);

    // Check if category exists
    const existing = await prisma.fAQCategory.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'FAQ category not found' },
        { status: 404 }
      );
    }

    // Check if name is being changed and if it conflicts
    if (
      validatedData.name &&
      validatedData.name !== existing.name
    ) {
      const nameConflict = await prisma.fAQCategory.findUnique({
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
    const category = await prisma.fAQCategory.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        updatedBy: session.user.id,
      },
    });

    return NextResponse.json({
      category,
      message: 'FAQ category updated successfully',
    });
  } catch (error) {
    console.error('Error updating FAQ category:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update FAQ category' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/faq-categories/[id]
 * Delete FAQ category
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await requireAdminRole();
    if (error) {
      return error;
    }

    // Check if category exists
    const existing = await prisma.fAQCategory.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { faqs: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'FAQ category not found' },
        { status: 404 }
      );
    }

    // Prevent deletion if category has FAQs (due to onDelete: Restrict in schema)
    if (existing._count.faqs > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete category with ${existing._count.faqs} FAQ(s). Please reassign or delete the FAQs first.`,
        },
        { status: 400 }
      );
    }

    // Delete category
    await prisma.fAQCategory.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      message: 'FAQ category deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting FAQ category:', error);
    return NextResponse.json(
      { error: 'Failed to delete FAQ category' },
      { status: 500 }
    );
  }
}
