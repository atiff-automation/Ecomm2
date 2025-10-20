/**
 * Bulk Delete Modal Component - JRM E-commerce Platform
 * Confirmation modal for bulk delete operations following CLAUDE.md principles
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import {
  BULK_OPERATIONS_CONFIG,
  formatMessage,
} from '@/lib/config/bulk-operations';

interface ProductSummary {
  id: string;
  name: string;
  sku: string;
}

interface DeletionSummary {
  products: ProductSummary[];
  totalCount: number;
  canDelete: boolean;
  warnings?: string[];
}

interface BulkDeleteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productIds: string[];
  onConfirm: (productIds: string[]) => Promise<void>;
  loading?: boolean;
}

/**
 * Fetches product deletion summary from the API
 */
async function fetchDeletionSummary(
  productIds: string[]
): Promise<DeletionSummary> {
  const response = await fetch(
    `/api/admin/products/bulk?productIds=${productIds.join(',')}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch product information');
  }

  return response.json();
}

/**
 * Main bulk delete confirmation modal
 */
export function BulkDeleteModal({
  open,
  onOpenChange,
  productIds,
  onConfirm,
  loading = false,
}: BulkDeleteModalProps) {
  const [summary, setSummary] = useState<DeletionSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch product summary when modal opens
  useEffect(() => {
    if (open && productIds.length > 0) {
      setLoadingSummary(true);
      setError(null);

      fetchDeletionSummary(productIds)
        .then(setSummary)
        .catch(err => {
          console.error('Failed to fetch deletion summary:', err);
          setError('Failed to load product information');
        })
        .finally(() => setLoadingSummary(false));
    }
  }, [open, productIds]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setSummary(null);
      setError(null);
    }
  }, [open]);

  const handleConfirm = async () => {
    if (!summary?.canDelete || loading) {
      return;
    }

    try {
      await onConfirm(productIds);
      onOpenChange(false);
    } catch (err) {
      console.error('Bulk delete failed:', err);
      // Error handling is done by parent component
    }
  };

  const handleCancel = () => {
    if (loading) {
      return;
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Confirm Bulk Delete
          </DialogTitle>
          <DialogDescription>
            {formatMessage(
              BULK_OPERATIONS_CONFIG.CONFIRMATION_MESSAGES.DELETE,
              {
                count: productIds.length,
              }
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Loading state */}
          {loadingSummary && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2 text-sm text-muted-foreground">
                Loading product information...
              </span>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Summary content */}
          {summary && !loadingSummary && (
            <div className="space-y-4">
              {/* Product count */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Products to delete:</span>
                <Badge variant="destructive">{summary.totalCount}</Badge>
              </div>

              {/* Warnings */}
              {summary.warnings && summary.warnings.length > 0 && (
                <div className="p-3 bg-orange-50 dark:bg-orange-950/10 border border-orange-200 dark:border-orange-800 rounded-md">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div className="space-y-1">
                      {summary.warnings.map((warning, index) => (
                        <p
                          key={index}
                          className="text-sm text-orange-700 dark:text-orange-300"
                        >
                          {warning}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Product list preview (first few items) */}
              {summary.products.length > 0 && (
                <div className="space-y-2">
                  <span className="text-sm font-medium">Products:</span>
                  <div className="max-h-32 overflow-y-auto border rounded-md p-2 bg-muted/20">
                    {summary.products.slice(0, 5).map(product => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between text-sm py-1"
                      >
                        <span className="truncate">{product.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {product.sku}
                        </Badge>
                      </div>
                    ))}
                    {summary.products.length > 5 && (
                      <div className="text-xs text-muted-foreground pt-1 border-t">
                        ... and {summary.products.length - 5} more products
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Cannot delete message */}
              {!summary.canDelete && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                  <p className="text-sm text-destructive">
                    These products cannot be deleted. Please check the warnings
                    above.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCancel} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={
              loading || loadingSummary || !summary?.canDelete || error !== null
            }
            className="flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Delete {productIds.length} Product
                {productIds.length > 1 ? 's' : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface BulkDeleteConfirmationProps {
  productCount: number;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

/**
 * Simple confirmation component (alternative to modal)
 */
export function BulkDeleteConfirmation({
  productCount,
  onConfirm,
  onCancel,
  loading = false,
}: BulkDeleteConfirmationProps) {
  return (
    <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
      <div className="flex items-center gap-3 mb-3">
        <AlertTriangle className="h-5 w-5 text-destructive" />
        <h3 className="font-medium text-destructive">Confirm Deletion</h3>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        {formatMessage(BULK_OPERATIONS_CONFIG.CONFIRMATION_MESSAGES.DELETE, {
          count: productCount,
        })}
      </p>

      <div className="flex gap-2">
        <Button
          variant="destructive"
          size="sm"
          onClick={onConfirm}
          disabled={loading}
          className="flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Deleting...
            </>
          ) : (
            <>
              <Trash2 className="h-4 w-4" />
              Delete
            </>
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
