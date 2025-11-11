/**
 * Admin Single Product API - JRM E-commerce Platform
 * Handles fetching, updating, and deleting individual products
 */

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { checkCSRF } from '@/lib/middleware/with-csrf';
import { dimensionsSchema } from '@/lib/validation/product-dimensions';

export const dynamic = 'force-dynamic';

import { requireAdminRole } from '@/lib/auth/authorization';
import { prisma } from '@/lib/db/prisma';
import { simplifiedTelegramService } from '@/lib/telegram/simplified-telegram-service';
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
  categoryIds: z
    .array(z.string().min(1, 'Category ID is required'))
    .min(1, 'At least one category is required')
    .optional(),
  regularPrice: z.number().min(0, 'Regular price must be positive').optional(),
  memberPrice: z
    .number()
    .min(0, 'Member price must be positive')
    .nullable()
    .optional(),
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
  weight: z
    .union([
      z.number().min(0.01, 'Weight must be at least 0.01 kg'),
      z
        .string()
        .min(1, 'Weight is required')
        .transform(val => parseFloat(val))
        .refine(
          val => !isNaN(val) && val >= 0.01,
          'Weight must be at least 0.01 kg'
        ),
    ])
    .optional(),
  dimensions: dimensionsSchema, // Use centralized schema (Single Source of Truth)
  status: z.enum(['DRAFT', 'ACTIVE', 'INACTIVE']).optional(),
  featured: z.boolean().optional(),
  isPromotional: z.boolean().optional(),
  isQualifyingForMembership: z.boolean().optional(),
  // Promotional pricing fields
  promotionalPrice: z
    .union([
      z.number().min(0, 'Promotional price must be positive'),
      z.string(),
      z.null(),
    ])
    .optional()
    .transform(val => {
      if (val === null || val === undefined || val === '') {
        return null;
      }
      if (typeof val === 'string') {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? null : parsed;
      }
      return val;
    })
    .refine(
      val => val === null || (typeof val === 'number' && val >= 0),
      'Promotional price must be a positive number or empty'
    ),
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
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  metaKeywords: z.array(z.string()).optional(),
});

// GET - Fetch single product
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authorization check
    const { error, session } = await requireAdminRole();
    if (error) {
      return error;
    }

    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        categories: {
          select: {
            category: {
              select: {
                id: true,
                name: true,
              },
            },
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
  // CSRF Protection
  const csrfCheck = await checkCSRF(request);
  if (csrfCheck) return csrfCheck;

  try {
    // Authorization check
    const { error, session } = await requireAdminRole();
    if (error) {
      return error;
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

    // Verify categories exist (if categories are being updated)
    let categories: any[] = [];
    if (productData.categoryIds) {
      categories = await prisma.category.findMany({
        where: { id: { in: productData.categoryIds } },
      });

      if (categories.length !== productData.categoryIds.length) {
        const foundIds = categories.map(c => c.id);
        const missingIds = productData.categoryIds.filter(
          id => !foundIds.includes(id)
        );
        return NextResponse.json(
          {
            message: `Categories not found: ${missingIds.join(', ')}`,
            field: 'categoryIds',
          },
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
          ...(productData.regularPrice !== undefined && {
            regularPrice: productData.regularPrice,
          }),
          ...(productData.memberPrice !== undefined && {
            memberPrice:
              productData.memberPrice || productData.regularPrice || 0,
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
            promotionStartDate: productData.promotionStartDate
              ? new Date(productData.promotionStartDate)
              : null,
          }),
          ...(productData.promotionEndDate !== undefined && {
            promotionEndDate: productData.promotionEndDate
              ? new Date(productData.promotionEndDate)
              : null,
          }),
          ...(productData.memberOnlyUntil !== undefined && {
            memberOnlyUntil: productData.memberOnlyUntil
              ? new Date(productData.memberOnlyUntil)
              : null,
          }),
          ...(productData.earlyAccessStart !== undefined && {
            earlyAccessStart: productData.earlyAccessStart
              ? new Date(productData.earlyAccessStart)
              : null,
          }),
          // SEO & Meta fields
          ...(productData.metaTitle !== undefined && {
            metaTitle: productData.metaTitle || null,
          }),
          ...(productData.metaDescription !== undefined && {
            metaDescription: productData.metaDescription || null,
          }),
          ...(productData.metaKeywords !== undefined && {
            metaKeywords: productData.metaKeywords || null,
          }),
        },
        include: {
          categories: {
            select: {
              category: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      // Update product categories if provided
      if (productData.categoryIds) {
        // Remove existing category relationships
        await tx.productCategory.deleteMany({
          where: { productId: params.id },
        });

        // Create new category relationships
        await tx.productCategory.createMany({
          data: productData.categoryIds.map(categoryId => ({
            productId: params.id,
            categoryId: categoryId,
          })),
        });
      }

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

    // LOW STOCK ALERT: Only send if stock CROSSED threshold (above → below)
    // KISS: Simple threshold crossing detection without database timestamps
    if (
      productData.stockQuantity !== undefined &&
      result.lowStockAlert > 0 &&
      existingProduct.stockQuantity > result.lowStockAlert && // Was ABOVE threshold
      productData.stockQuantity <= result.lowStockAlert // Now BELOW threshold
    ) {
      try {
        await simplifiedTelegramService.sendLowStockAlert(
          result.name,
          productData.stockQuantity,
          result.sku
        );

        console.log(
          `⚠️ Low stock alert: ${result.name} crossed threshold (${existingProduct.stockQuantity} → ${productData.stockQuantity}, threshold: ${result.lowStockAlert})`
        );
      } catch (lowStockError) {
        console.error('❌ Failed to send low stock alert:', lowStockError);
        // Don't fail the product update if notification fails
      }
    }

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

    // CACHE INVALIDATION: Revalidate Next.js Data Cache (DRY - Single Source of Truth)
    // This ensures individual product page and listing page immediately show updated data
    try {
      // Get the product slug for revalidation
      const productSlug = productData.slug || existingProduct.slug;

      // Revalidate individual product page
      revalidatePath(`/products/${productSlug}`);

      // Revalidate products listing page
      revalidatePath('/products');

      // Revalidate admin product pages
      revalidatePath('/admin/products');
      revalidatePath(`/admin/products/${params.id}/edit`);
    } catch (revalidationError) {
      // Don't fail the update if revalidation fails
      console.error('Failed to revalidate paths:', revalidationError);
    }

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
  // CSRF Protection
  const csrfCheck = await checkCSRF(request);
  if (csrfCheck) return csrfCheck;

  try {
    // Authorization check
    const { error, session } = await requireAdminRole();
    if (error) {
      return error;
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

    // BUSINESS RULE: Check if product has existing orders
    // Products with order history cannot be deleted to preserve:
    // - Customer purchase history
    // - Financial/tax records compliance
    // - Audit trail integrity
    const orderItemCount = await prisma.orderItem.count({
      where: { productId: params.id },
    });

    if (orderItemCount > 0) {
      return NextResponse.json(
        {
          message: `Cannot delete product "${product.name}" because it has ${orderItemCount} order ${orderItemCount === 1 ? 'item' : 'items'} in the system. Products with existing orders cannot be deleted to preserve order history and financial records. Please set the product status to INACTIVE instead.`,
          code: 'PRODUCT_HAS_ORDERS',
          details: {
            productName: product.name,
            sku: product.sku,
            orderItemCount,
          },
        },
        { status: 400 }
      );
    }

    // Delete product with transaction
    // NOTE: Only products without order history can reach this point
    await prisma.$transaction(async tx => {
      // Delete related records first (following database cascade order)
      // Being explicit about deletions for audit trail and clarity

      await tx.review.deleteMany({
        where: { productId: params.id },
      });

      await tx.productImage.deleteMany({
        where: { productId: params.id },
      });

      await tx.cartItem.deleteMany({
        where: { productId: params.id },
      });

      await tx.wishlistItem.deleteMany({
        where: { productId: params.id },
      });

      await tx.productCategory.deleteMany({
        where: { productId: params.id },
      });

      // Delete the product (safe now - no order dependencies)
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

    // Enhanced error handling with specific messages
    let errorMessage = 'Failed to delete product';
    let errorCode = 'DELETE_FAILED';

    // Prisma-specific error handling
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as { code: string; meta?: any };

      switch (prismaError.code) {
        case 'P2003':
          // Foreign key constraint violation
          const constraintName =
            prismaError.meta?.constraint || 'unknown constraint';
          errorMessage = `Cannot delete product due to existing references in the database (${constraintName}). This product may have associated records that must be removed first.`;
          errorCode = 'FOREIGN_KEY_CONSTRAINT';
          break;

        case 'P2025':
          // Record not found
          errorMessage = 'Product not found or already deleted';
          errorCode = 'NOT_FOUND';
          break;

        default:
          errorMessage = `Database error: ${prismaError.code}`;
          errorCode = 'DATABASE_ERROR';
      }
    }

    return NextResponse.json(
      {
        message: errorMessage,
        code: errorCode,
      },
      { status: 500 }
    );
  }
}
