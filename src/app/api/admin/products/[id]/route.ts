/**
 * Admin Single Product API - JRM E-commerce Platform
 * Handles fetching, updating, and deleting individual products
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { UserRole } from '@prisma/client';
// import { ProductStatus } from '@prisma/client'; // Not currently used
import { z } from 'zod';

const updateProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').optional(),
  slug: z.string().min(1, 'Product slug is required').optional(),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  sku: z.string().min(1, 'SKU is required').optional(),
  barcode: z.string().optional(),
  categoryId: z.string().min(1, 'Category is required').optional(),
  regularPrice: z.number().min(0, 'Regular price must be positive').optional(),
  memberPrice: z.number().min(0, 'Member price must be positive').optional(),
  costPrice: z.number().min(0, 'Cost price must be positive').optional(),
  stockQuantity: z
    .number()
    .int()
    .min(0, 'Stock quantity must be non-negative')
    .optional(),
  lowStockAlert: z
    .number()
    .int()
    .min(0, 'Low stock alert must be non-negative')
    .optional(),
  weight: z.number().optional(),
  dimensions: z.string().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'INACTIVE']).optional(),
  featured: z.boolean().optional(),
  isPromotional: z.boolean().optional(),
  isQualifyingForMembership: z.boolean().optional(),
  // Promotional pricing fields
  promotionalPrice: z.number().min(0, 'Promotional price must be positive').optional(),
  promotionStartDate: z.union([z.string().datetime(), z.null()]).optional(),
  promotionEndDate: z.union([z.string().datetime(), z.null()]).optional(),
  memberOnlyUntil: z.union([z.string().datetime(), z.null()]).optional(),
  earlyAccessStart: z.union([z.string().datetime(), z.null()]).optional(),
  images: z
    .array(
      z.object({
        url: z.string().min(1, 'Image URL is required'),
        altText: z.string().optional(),
        isPrimary: z.boolean().default(false),
      })
    )
    .optional(),
});

// GET - Fetch single product
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session?.user ||
      (session.user.role !== UserRole.ADMIN &&
        session.user.role !== UserRole.STAFF &&
        session.user.role !== UserRole.SUPERADMIN)
    ) {
      return NextResponse.json(
        { message: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        images: {
          select: {
            url: true,
            altText: true,
            isPrimary: true,
          },
          orderBy: {
            sortOrder: 'asc',
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

    return NextResponse.json({
      product,
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { message: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

// PUT - Update product
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session?.user ||
      (session.user.role !== UserRole.ADMIN &&
        session.user.role !== UserRole.STAFF &&
        session.user.role !== UserRole.SUPERADMIN)
    ) {
      return NextResponse.json(
        { message: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const productData = updateProductSchema.parse(body);

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: params.id },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { message: 'Product not found' },
        { status: 404 }
      );
    }

    // Check for slug conflicts (if slug is being updated)
    if (productData.slug && productData.slug !== existingProduct.slug) {
      const slugConflict = await prisma.product.findFirst({
        where: {
          slug: productData.slug,
          id: { not: params.id },
        },
      });

      if (slugConflict) {
        return NextResponse.json(
          { message: 'Product slug already exists', field: 'slug' },
          { status: 400 }
        );
      }
    }

    // Check for SKU conflicts (if SKU is being updated)
    if (productData.sku && productData.sku !== existingProduct.sku) {
      const skuConflict = await prisma.product.findFirst({
        where: {
          sku: productData.sku,
          id: { not: params.id },
        },
      });

      if (skuConflict) {
        return NextResponse.json(
          { message: 'SKU already exists', field: 'sku' },
          { status: 400 }
        );
      }
    }

    // Verify category exists (if category is being updated)
    if (productData.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: productData.categoryId },
      });

      if (!category) {
        return NextResponse.json(
          { message: 'Category not found', field: 'categoryId' },
          { status: 400 }
        );
      }
    }

    // Update product with transaction
    const result = await prisma.$transaction(async tx => {
      // Update the product
      const updatedProduct = await tx.product.update({
        where: { id: params.id },
        data: {
          ...(productData.name && { name: productData.name }),
          ...(productData.slug && { slug: productData.slug }),
          ...(productData.description !== undefined && {
            description: productData.description || null,
          }),
          ...(productData.shortDescription !== undefined && {
            shortDescription: productData.shortDescription || null,
          }),
          ...(productData.sku && { sku: productData.sku }),
          ...(productData.barcode !== undefined && {
            barcode: productData.barcode || null,
          }),
          ...(productData.categoryId && { categoryId: productData.categoryId }),
          ...(productData.regularPrice !== undefined && {
            regularPrice: productData.regularPrice,
          }),
          ...(productData.memberPrice !== undefined && {
            memberPrice: productData.memberPrice,
          }),
          ...(productData.costPrice !== undefined && {
            costPrice: productData.costPrice,
          }),
          ...(productData.stockQuantity !== undefined && {
            stockQuantity: productData.stockQuantity,
          }),
          ...(productData.lowStockAlert !== undefined && {
            lowStockAlert: productData.lowStockAlert,
          }),
          ...(productData.weight !== undefined && {
            weight: productData.weight || null,
          }),
          ...(productData.dimensions !== undefined && {
            dimensions: productData.dimensions || null,
          }),
          ...(productData.status && { status: productData.status }),
          ...(productData.featured !== undefined && {
            featured: productData.featured,
          }),
          ...(productData.isPromotional !== undefined && {
            isPromotional: productData.isPromotional,
          }),
          ...(productData.isQualifyingForMembership !== undefined && {
            isQualifyingForMembership: productData.isQualifyingForMembership,
          }),
          // Promotional pricing fields
          ...(productData.promotionalPrice !== undefined && {
            promotionalPrice: productData.promotionalPrice || null,
          }),
          ...(productData.promotionStartDate !== undefined && {
            promotionStartDate: productData.promotionStartDate ? new Date(productData.promotionStartDate) : null,
          }),
          ...(productData.promotionEndDate !== undefined && {
            promotionEndDate: productData.promotionEndDate ? new Date(productData.promotionEndDate) : null,
          }),
          ...(productData.memberOnlyUntil !== undefined && {
            memberOnlyUntil: productData.memberOnlyUntil ? new Date(productData.memberOnlyUntil) : null,
          }),
          ...(productData.earlyAccessStart !== undefined && {
            earlyAccessStart: productData.earlyAccessStart ? new Date(productData.earlyAccessStart) : null,
          }),
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Update product images if provided
      if (productData.images) {
        // Delete existing images
        await tx.productImage.deleteMany({
          where: { productId: params.id },
        });

        // Create new images
        if (productData.images.length > 0) {
          await tx.productImage.createMany({
            data: productData.images.map((image, index) => ({
              productId: params.id,
              url: image.url,
              altText: image.altText || updatedProduct.name,
              isPrimary: image.isPrimary || index === 0,
              sortOrder: index,
            })),
          });
        }
      }

      return updatedProduct;
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        resource: 'PRODUCT',
        resourceId: params.id,
        details: {
          productName: result.name,
          sku: result.sku,
          changes: productData,
        },
      },
    });

    return NextResponse.json({
      message: 'Product updated successfully',
      product: result,
    });
  } catch (error) {
    console.error('Error updating product:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid product data', errors: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Failed to update product' },
      { status: 500 }
    );
  }
}

// DELETE - Delete product
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session?.user ||
      (session.user.role !== UserRole.ADMIN &&
        session.user.role !== UserRole.SUPERADMIN)
    ) {
      return NextResponse.json(
        { message: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      select: { id: true, name: true, sku: true },
    });

    if (!product) {
      return NextResponse.json(
        { message: 'Product not found' },
        { status: 404 }
      );
    }

    // Delete product with transaction
    await prisma.$transaction(async tx => {
      // Delete related records first
      await tx.productImage.deleteMany({
        where: { productId: params.id },
      });

      await tx.cartItem.deleteMany({
        where: { productId: params.id },
      });

      await tx.wishlistItem.deleteMany({
        where: { productId: params.id },
      });

      // Delete the product
      await tx.product.delete({
        where: { id: params.id },
      });
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'DELETE',
        resource: 'PRODUCT',
        resourceId: params.id,
        details: {
          productName: product.name,
          sku: product.sku,
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
