/**
 * Bulk Operations Service
 * Centralized service for all bulk operations following CLAUDE.md principles
 * Handles transaction safety, related data cleanup, and audit logging
 */

import { prisma } from '@/lib/db/prisma';
import {
  BULK_OPERATIONS_CONFIG,
  BulkOperationResult,
  formatMessage,
} from '@/lib/config/bulk-operations';

export interface BulkDeleteOptions {
  productIds: string[];
  userId: string;
  batchSize?: number;
}

export interface DeletedProductInfo {
  id: string;
  name: string;
  sku: string;
}

/**
 * Bulk delete products with transaction safety and comprehensive cleanup
 * Follows systematic approach with proper error handling and audit logging
 */
export class BulkOperationsService {
  /**
   * Delete multiple products in a transaction-safe manner
   * Handles all related data cleanup systematically
   */
  async bulkDeleteProducts(
    options: BulkDeleteOptions
  ): Promise<BulkOperationResult> {
    const {
      productIds,
      userId,
      batchSize = BULK_OPERATIONS_CONFIG.BATCH_SIZE,
    } = options;

    // Validate input parameters
    const validation = this.validateBulkDeleteRequest(productIds);
    if (!validation.valid) {
      return {
        success: false,
        message: validation.error || 'Invalid request',
        processedCount: 0,
        failedCount: productIds.length,
      };
    }

    const deletedProducts: DeletedProductInfo[] = [];
    const failedDeletions: Array<{ id: string; error: string }> = [];

    try {
      // Process deletions in batches to prevent database timeouts
      for (let i = 0; i < productIds.length; i += batchSize) {
        const batch = productIds.slice(i, i + batchSize);

        try {
          const batchResult = await this.processBatch(batch, userId);
          deletedProducts.push(...batchResult.deleted);
          failedDeletions.push(...batchResult.failed);
        } catch (error) {
          // If entire batch fails, mark all items as failed
          batch.forEach(id => {
            failedDeletions.push({
              id,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          });
        }
      }

      // Create audit log for the bulk operation
      if (deletedProducts.length > 0) {
        await this.createBulkDeleteAuditLog(userId, deletedProducts);
      }

      const successCount = deletedProducts.length;
      const failureCount = failedDeletions.length;

      return {
        success: successCount > 0,
        message: this.generateResultMessage(successCount, failureCount),
        processedCount: successCount,
        failedCount: failureCount,
        errors: failedDeletions.length > 0 ? failedDeletions : undefined,
      };
    } catch (error) {
      console.error('Bulk delete operation failed:', error);
      return {
        success: false,
        message: BULK_OPERATIONS_CONFIG.ERROR_MESSAGES.OPERATION_FAILED,
        processedCount: 0,
        failedCount: productIds.length,
      };
    }
  }

  /**
   * Process a batch of products for deletion
   * Uses transaction to ensure data consistency
   */
  private async processBatch(
    productIds: string[],
    userId: string
  ): Promise<{
    deleted: DeletedProductInfo[];
    failed: Array<{ id: string; error: string }>;
  }> {
    const deleted: DeletedProductInfo[] = [];
    const failed: Array<{ id: string; error: string }> = [];

    return await prisma.$transaction(async tx => {
      // First, get product information for audit logging
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true, sku: true },
      });

      // Create a map for quick lookup
      const productMap = new Map(products.map(p => [p.id, p]));

      for (const productId of productIds) {
        try {
          const product = productMap.get(productId);
          if (!product) {
            failed.push({ id: productId, error: 'Product not found' });
            continue;
          }

          // Systematic cleanup of related data in correct order
          await this.cleanupRelatedData(tx, productId);

          // Delete the product itself
          await tx.product.delete({
            where: { id: productId },
          });

          deleted.push(product);
        } catch (error) {
          console.error(`Failed to delete product ${productId}:`, error);
          failed.push({
            id: productId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      return { deleted, failed };
    });
  }

  /**
   * Systematic cleanup of all related data
   * Follows the order specified in the implementation plan
   */
  private async cleanupRelatedData(tx: any, productId: string): Promise<void> {
    // Order matters - clean up dependent records first
    await Promise.all([
      // Product-specific data
      tx.productImage.deleteMany({ where: { productId } }),
      tx.productCategory.deleteMany({ where: { productId } }),
      tx.productVariant.deleteMany({ where: { productId } }),

      // User interaction data
      tx.cartItem.deleteMany({ where: { productId } }),
      tx.wishlistItem.deleteMany({ where: { productId } }),
      tx.recentlyViewed.deleteMany({ where: { productId } }),

      // Review and order data
      tx.review.deleteMany({ where: { productId } }),
      // Note: We don't delete order items as they are historical records
      // Instead, we could set a flag or handle differently based on business rules
    ]);
  }

  /**
   * Create comprehensive audit log for bulk delete operation
   */
  private async createBulkDeleteAuditLog(
    userId: string,
    deletedProducts: DeletedProductInfo[]
  ): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'BULK_DELETE',
          resource: 'PRODUCT',
          resourceId: 'BULK_OPERATION',
          details: {
            operation: 'BULK_DELETE',
            count: deletedProducts.length,
            deletedProducts: deletedProducts.map(p => ({
              id: p.id,
              name: p.name,
              sku: p.sku,
            })),
            timestamp: new Date().toISOString(),
          },
        },
      });
    } catch (error) {
      // Audit log failure should not fail the entire operation
      console.error('Failed to create audit log for bulk delete:', error);
    }
  }

  /**
   * Validate bulk delete request parameters
   */
  private validateBulkDeleteRequest(productIds: string[]): {
    valid: boolean;
    error?: string;
  } {
    if (!Array.isArray(productIds)) {
      return { valid: false, error: 'Product IDs must be an array' };
    }

    if (productIds.length === 0) {
      return { valid: false, error: 'No products selected for deletion' };
    }

    if (productIds.length > BULK_OPERATIONS_CONFIG.MAX_SELECTION_SIZE) {
      return {
        valid: false,
        error: formatMessage(
          BULK_OPERATIONS_CONFIG.ERROR_MESSAGES.MAX_SELECTION_EXCEEDED,
          {
            max: BULK_OPERATIONS_CONFIG.MAX_SELECTION_SIZE,
          }
        ),
      };
    }

    // Validate that all IDs are strings and not empty
    const invalidIds = productIds.filter(
      id => typeof id !== 'string' || id.trim() === ''
    );
    if (invalidIds.length > 0) {
      return { valid: false, error: 'All product IDs must be valid strings' };
    }

    return { valid: true };
  }

  /**
   * Generate appropriate result message based on operation outcome
   */
  private generateResultMessage(
    successCount: number,
    failureCount: number
  ): string {
    if (failureCount === 0) {
      return formatMessage(BULK_OPERATIONS_CONFIG.SUCCESS_MESSAGES.DELETE, {
        count: successCount,
      });
    }

    if (successCount === 0) {
      return 'Failed to delete any products. Please check the error details.';
    }

    return formatMessage(
      BULK_OPERATIONS_CONFIG.SUCCESS_MESSAGES.DELETE_PARTIAL,
      {
        successCount,
        failureCount,
      }
    );
  }

  /**
   * Get product deletion summary for confirmation
   * Used by the frontend to display confirmation details
   */
  async getProductDeletionSummary(productIds: string[]): Promise<{
    products: Array<{ id: string; name: string; sku: string }>;
    totalCount: number;
    canDelete: boolean;
    warnings?: string[];
  }> {
    try {
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: {
          id: true,
          name: true,
          sku: true,
          // Add fields to check for potential issues
          _count: {
            select: {
              orderItems: true,
            },
          },
        },
      });

      const warnings: string[] = [];

      // Check for products with order history
      const productsWithOrders = products.filter(p => p._count.orderItems > 0);
      if (productsWithOrders.length > 0) {
        warnings.push(
          `${productsWithOrders.length} product(s) have order history. Deletion will not affect existing orders.`
        );
      }

      return {
        products: products.map(p => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
        })),
        totalCount: products.length,
        canDelete: products.length > 0,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error) {
      console.error('Failed to get product deletion summary:', error);
      return {
        products: [],
        totalCount: 0,
        canDelete: false,
        warnings: ['Failed to load product information'],
      };
    }
  }
}
