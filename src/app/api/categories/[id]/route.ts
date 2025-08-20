/**
 * Category by ID API Routes - Malaysian E-commerce Platform
 * Handles individual category operations (GET, PUT, DELETE)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { z } from 'zod';

const updateCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  slug: z.string().min(1, 'Category slug is required'),
  description: z.string().optional(),
  image: z.string().optional(),
  parentId: z.string().optional(),
  isQualifyingCategory: z.boolean().default(false),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
});

/**
 * GET /api/categories/[id] - Get single category
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            products: {
              where: { status: 'ACTIVE' },
            },
          },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { message: 'Category not found' },
        { status: 404 }
      );
    }

    const categoryWithCount = {
      ...category,
      productCount: category._count.products,
    };

    return NextResponse.json({ category: categoryWithCount });
  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json(
      { message: 'Failed to fetch category' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/categories/[id] - Update category (Admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session?.user ||
      !['ADMIN', 'STAFF', 'SUPERADMIN'].includes(session.user.role)
    ) {
      return NextResponse.json(
        { message: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const categoryData = updateCategorySchema.parse(body);

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { message: 'Category not found' },
        { status: 404 }
      );
    }

    // Check if slug already exists (excluding current category)
    if (categoryData.slug !== existingCategory.slug) {
      const existingSlug = await prisma.category.findFirst({
        where: {
          slug: categoryData.slug,
          id: { not: id },
        },
      });

      if (existingSlug) {
        return NextResponse.json(
          { message: 'Category slug already exists', field: 'slug' },
          { status: 400 }
        );
      }
    }

    // Verify parent category exists if provided and different from current
    if (
      categoryData.parentId &&
      categoryData.parentId !== existingCategory.parentId
    ) {
      // Prevent setting parent to self or descendant
      if (categoryData.parentId === id) {
        return NextResponse.json(
          { message: 'Category cannot be its own parent', field: 'parentId' },
          { status: 400 }
        );
      }

      const parentCategory = await prisma.category.findUnique({
        where: { id: categoryData.parentId },
      });

      if (!parentCategory) {
        return NextResponse.json(
          { message: 'Parent category not found', field: 'parentId' },
          { status: 400 }
        );
      }
    }

    // Update category
    const category = await prisma.category.update({
      where: { id },
      data: {
        ...categoryData,
        description: categoryData.description || null,
        image: categoryData.image || null,
        parentId: categoryData.parentId || null,
        metaTitle: categoryData.metaTitle || null,
        metaDescription: categoryData.metaDescription || null,
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    // Log the action (skip if audit log fails)
    try {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'UPDATE',
          resource: 'CATEGORY',
          resourceId: category.id,
          details: {
            categoryName: category.name,
            slug: category.slug,
            changes: categoryData,
          },
        },
      });
    } catch (auditError) {
      console.warn('Failed to create audit log:', auditError);
      // Continue execution - audit log failure should not block category update
    }

    return NextResponse.json({
      message: 'Category updated successfully',
      category,
    });
  } catch (error) {
    console.error('Error updating category:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid category data', errors: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Failed to update category' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/categories/[id] - Delete category (Admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session?.user ||
      !['ADMIN', 'STAFF', 'SUPERADMIN'].includes(session.user.role)
    ) {
      return NextResponse.json(
        { message: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const { id } = params;

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            products: true,
            children: true,
          },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { message: 'Category not found' },
        { status: 404 }
      );
    }

    // Prevent deletion if category has products
    if (category._count.products > 0) {
      return NextResponse.json(
        {
          message: `Cannot delete category. It contains ${category._count.products} products. Please move or delete the products first.`,
        },
        { status: 400 }
      );
    }

    // Prevent deletion if category has subcategories
    if (category._count.children > 0) {
      return NextResponse.json(
        {
          message: `Cannot delete category. It has ${category._count.children} subcategories. Please move or delete the subcategories first.`,
        },
        { status: 400 }
      );
    }

    // Delete category
    await prisma.category.delete({
      where: { id },
    });

    // Log the action (skip if audit log fails)
    try {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'DELETE',
          resource: 'CATEGORY',
          resourceId: id,
          details: {
            categoryName: category.name,
            slug: category.slug,
          },
        },
      });
    } catch (auditError) {
      console.warn('Failed to create audit log:', auditError);
      // Continue execution - audit log failure should not block category deletion
    }

    return NextResponse.json({
      message: 'Category deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { message: 'Failed to delete category' },
      { status: 500 }
    );
  }
}
