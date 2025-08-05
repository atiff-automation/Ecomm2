/**
 * Individual Product API Routes - Malaysian E-commerce Platform
 * Handles specific product operations by slug
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { z } from 'zod';

const updateProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').optional(),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  sku: z.string().min(1, 'SKU is required').optional(),
  barcode: z.string().optional(),
  regularPrice: z
    .number()
    .positive('Regular price must be positive')
    .optional(),
  memberPrice: z.number().positive('Member price must be positive').optional(),
  costPrice: z.number().positive('Cost price must be positive').optional(),
  stockQuantity: z
    .number()
    .int()
    .min(0, 'Stock quantity cannot be negative')
    .optional(),
  lowStockAlert: z
    .number()
    .int()
    .min(0, 'Low stock alert cannot be negative')
    .optional(),
  weight: z.number().positive().optional(),
  dimensions: z.string().optional(),
  categoryId: z.string().min(1, 'Category is required').optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  featured: z.boolean().optional(),
  isPromotional: z.boolean().optional(),
  status: z
    .enum(['DRAFT', 'ACTIVE', 'INACTIVE', 'OUT_OF_STOCK', 'DISCONTINUED'])
    .optional(),
});

/**
 * GET /api/products/[slug] - Get product by slug
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            isQualifyingCategory: true,
          },
        },
        images: {
          orderBy: { sortOrder: 'asc' },
        },
        variants: {
          orderBy: { createdAt: 'asc' },
        },
        reviews: {
          where: { isApproved: true },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            reviews: {
              where: { isApproved: true },
            },
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { message: 'Product not found' },
        { status: 404 }
      );
    }

    // Calculate average rating
    const approvedReviews = await prisma.review.findMany({
      where: {
        productId: product.id,
        isApproved: true,
      },
      select: {
        rating: true,
      },
    });

    const totalRating = approvedReviews.reduce(
      (sum, review) => sum + review.rating,
      0
    );
    const averageRating =
      approvedReviews.length > 0 ? totalRating / approvedReviews.length : 0;

    // Get related products from same category
    const relatedProducts = await prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        status: 'ACTIVE',
        id: { not: product.id },
      },
      include: {
        images: {
          where: { isPrimary: true },
          take: 1,
        },
      },
      take: 4,
      orderBy: { createdAt: 'desc' },
    });

    const productWithRating = {
      ...product,
      averageRating: Math.round(averageRating * 10) / 10,
      reviewCount: product._count.reviews,
      relatedProducts,
    };

    return NextResponse.json({ product: productWithRating });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { message: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/products/[slug] - Update product (Admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string } }
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

    const { slug } = params;
    const body = await request.json();
    const updateData = updateProductSchema.parse(body);

    // Find existing product
    const existingProduct = await prisma.product.findUnique({
      where: { slug },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { message: 'Product not found' },
        { status: 404 }
      );
    }

    // Check if SKU is being updated and is unique
    if (updateData.sku && updateData.sku !== existingProduct.sku) {
      const existingSku = await prisma.product.findUnique({
        where: { sku: updateData.sku },
      });

      if (existingSku) {
        return NextResponse.json(
          { message: 'SKU already exists', field: 'sku' },
          { status: 400 }
        );
      }
    }

    // Verify category exists if being updated
    if (updateData.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: updateData.categoryId },
      });

      if (!category) {
        return NextResponse.json(
          { message: 'Category not found', field: 'categoryId' },
          { status: 400 }
        );
      }
    }

    // Update product
    const updatedProduct = await prisma.product.update({
      where: { slug },
      data: updateData,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        images: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        resource: 'PRODUCT',
        resourceId: updatedProduct.id,
        details: {
          productName: updatedProduct.name,
          sku: updatedProduct.sku,
          updatedFields: Object.keys(updateData),
        },
      },
    });

    return NextResponse.json({
      message: 'Product updated successfully',
      product: updatedProduct,
    });
  } catch (error) {
    console.error('Error updating product:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid product data', errors: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Failed to update product' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/products/[slug] - Delete product (Admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session?.user ||
      !['ADMIN', 'SUPERADMIN'].includes(session.user.role)
    ) {
      return NextResponse.json(
        { message: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const { slug } = params;

    // Find existing product
    const existingProduct = await prisma.product.findUnique({
      where: { slug },
      include: {
        orderItems: true,
      },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { message: 'Product not found' },
        { status: 404 }
      );
    }

    // Check if product has orders - if so, deactivate instead of delete
    if (existingProduct.orderItems.length > 0) {
      const deactivatedProduct = await prisma.product.update({
        where: { slug },
        data: { status: 'DISCONTINUED' },
      });

      // Log the action
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'UPDATE',
          resource: 'PRODUCT',
          resourceId: deactivatedProduct.id,
          details: {
            productName: deactivatedProduct.name,
            sku: deactivatedProduct.sku,
            action: 'discontinued_due_to_orders',
          },
        },
      });

      return NextResponse.json({
        message: 'Product discontinued (has order history)',
        product: deactivatedProduct,
      });
    }

    // Safe to delete - no order history
    await prisma.product.delete({
      where: { slug },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'DELETE',
        resource: 'PRODUCT',
        resourceId: existingProduct.id,
        details: {
          productName: existingProduct.name,
          sku: existingProduct.sku,
        },
      },
    });

    return NextResponse.json({
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { message: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
