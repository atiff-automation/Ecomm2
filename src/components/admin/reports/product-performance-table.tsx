/**
 * Product Performance Table Component
 * Displays product analytics with Malaysian currency formatting
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Package, TrendingUp, TrendingDown } from 'lucide-react';
import type { ProductPerformance } from '@/lib/types/sales-reports';

interface ProductPerformanceTableProps {
  startDate: Date;
  endDate: Date;
  limit?: number;
}

export function ProductPerformanceTable({
  startDate,
  endDate,
  limit = 20,
}: ProductPerformanceTableProps) {
  const [products, setProducts] = useState<ProductPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProductPerformance();
  }, [startDate, endDate, limit]);

  const fetchProductPerformance = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: limit.toString(),
      });

      const response = await fetch(
        `/api/admin/reports/sales/products?${params}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch product performance');
      }

      const result = await response.json();

      if (result.success) {
        setProducts(result.data);
      } else {
        throw new Error(
          result.message || 'Failed to fetch product performance'
        );
      }
    } catch (error) {
      console.error('Failed to fetch product performance:', error);
      setError(
        error instanceof Error ? error.message : 'An unexpected error occurred'
      );
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ms-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ms-MY').format(num);
  };

  const getProfitColor = (margin: number) => {
    if (margin > 0) return 'text-green-600';
    if (margin < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getMemberPercentage = (memberSales: number, totalRevenue: number) => {
    if (totalRevenue === 0) return 0;
    return (memberSales / totalRevenue) * 100;
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Package className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground">
          No product data found
        </h3>
        <p className="text-sm text-muted-foreground">
          No products were sold during the selected period.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">#</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead className="text-right">Qty Sold</TableHead>
              <TableHead className="text-right">Total Revenue</TableHead>
              <TableHead className="text-right">Profit Margin</TableHead>
              <TableHead className="text-center">Member/Non-Member</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product, index) => (
              <TableRow key={product.productId}>
                <TableCell className="font-medium">{index + 1}</TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium">{product.productName}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-mono text-xs">
                    {product.sku}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatNumber(product.totalQuantitySold)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(product.totalRevenue)}
                </TableCell>
                <TableCell
                  className={`text-right font-medium ${getProfitColor(product.profitMargin)}`}
                >
                  <div className="flex items-center justify-end space-x-1">
                    {product.profitMargin > 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : product.profitMargin < 0 ? (
                      <TrendingDown className="h-3 w-3" />
                    ) : null}
                    <span>{formatCurrency(product.profitMargin)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center space-x-2">
                    <div className="text-center">
                      <div className="text-sm font-medium text-blue-600">
                        {formatCurrency(product.memberSales)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {getMemberPercentage(
                          product.memberSales,
                          product.totalRevenue
                        ).toFixed(0)}
                        % Member
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">/</div>
                    <div className="text-center">
                      <div className="text-sm font-medium text-gray-600">
                        {formatCurrency(product.nonMemberSales)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {(
                          100 -
                          getMemberPercentage(
                            product.memberSales,
                            product.totalRevenue
                          )
                        ).toFixed(0)}
                        % Non-Member
                      </div>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div>Showing top {products.length} products by revenue</div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <TrendingUp className="h-3 w-3 text-green-600" />
            <span>Profitable</span>
          </div>
          <div className="flex items-center space-x-1">
            <TrendingDown className="h-3 w-3 text-red-600" />
            <span>Loss</span>
          </div>
        </div>
      </div>
    </div>
  );
}
