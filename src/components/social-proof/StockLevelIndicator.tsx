'use client';

import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  TrendingUp,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StockLevel {
  productId: string;
  currentStock: number;
  isLowStock: boolean;
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
  lowStockThreshold: number;
}

interface StockLevelIndicatorProps {
  productId: string;
  showPurchaseCount?: boolean;
  className?: string;
  variant?: 'default' | 'compact' | 'detailed';
}

export default function StockLevelIndicator({
  productId,
  showPurchaseCount = true,
  className,
  variant = 'default',
}: StockLevelIndicatorProps) {
  const [stockLevel, setStockLevel] = useState<StockLevel | null>(null);
  const [purchaseCount, setPurchaseCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (productId) {
      fetchStockData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const fetchStockData = async () => {
    try {
      setLoading(true);

      // Fetch stock level
      const stockResponse = await fetch(
        `/api/social-proof/stock-levels?productIds=${productId}`
      );

      if (stockResponse.ok) {
        const stockData = await stockResponse.json();
        setStockLevel(stockData.stockLevels[productId] || null);
      }

      // Fetch purchase count if enabled
      if (showPurchaseCount) {
        const purchaseResponse = await fetch(
          `/api/social-proof/purchase-count?productId=${productId}`
        );

        if (purchaseResponse.ok) {
          const purchaseData = await purchaseResponse.json();
          setPurchaseCount(purchaseData.count || 0);
        }
      }
    } catch (error) {
      console.error('Error fetching stock data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStockIcon = () => {
    if (!stockLevel) {
      return null;
    }

    switch (stockLevel.stockStatus) {
      case 'out_of_stock':
        return <XCircle className="h-3 w-3 text-red-500" />;
      case 'low_stock':
        return <AlertCircle className="h-3 w-3 text-orange-500" />;
      case 'in_stock':
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      default:
        return null;
    }
  };

  const getStockBadgeVariant = () => {
    if (!stockLevel) {
      return 'secondary';
    }

    switch (stockLevel.stockStatus) {
      case 'out_of_stock':
        return 'destructive';
      case 'low_stock':
        return 'outline';
      case 'in_stock':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getStockMessage = () => {
    if (!stockLevel) {
      return 'Loading...';
    }

    switch (stockLevel.stockStatus) {
      case 'out_of_stock':
        return 'Out of stock';
      case 'low_stock':
        return `Only ${stockLevel.currentStock} left in stock!`;
      case 'in_stock':
        if (stockLevel.currentStock < 50) {
          return `${stockLevel.currentStock} in stock`;
        }
        return 'In stock';
      default:
        return 'In stock';
    }
  };

  const getPurchaseMessage = () => {
    if (purchaseCount === 0) {
      return null;
    }

    if (purchaseCount === 1) {
      return '1 person bought this in the last 24 hours';
    }

    return `${purchaseCount} people bought this in the last 24 hours`;
  };

  if (loading) {
    return (
      <div className={cn('space-y-1', className)}>
        <div className="h-5 w-20 bg-gray-200 animate-pulse rounded" />
        {showPurchaseCount && (
          <div className="h-4 w-32 bg-gray-200 animate-pulse rounded" />
        )}
      </div>
    );
  }

  if (!stockLevel) {
    return null;
  }

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Badge variant={getStockBadgeVariant()} className="text-xs">
          {getStockIcon()}
          <span className="ml-1">{getStockMessage()}</span>
        </Badge>
        {showPurchaseCount && purchaseCount > 0 && (
          <div className="flex items-center text-xs text-green-600">
            <TrendingUp className="h-3 w-3 mr-1" />
            <span>{purchaseCount} sold today</span>
          </div>
        )}
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div
        className={cn('space-y-3 p-3 bg-gray-50 rounded-lg border', className)}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            Availability
          </span>
          {getStockIcon()}
        </div>

        <div className="space-y-2">
          <Badge
            variant={getStockBadgeVariant()}
            className="w-full justify-center"
          >
            {getStockMessage()}
          </Badge>

          {showPurchaseCount && purchaseCount > 0 && (
            <div className="flex items-center justify-center gap-1 text-sm text-green-600 bg-green-50 p-2 rounded">
              <Users className="h-4 w-4" />
              <span>{getPurchaseMessage()}</span>
            </div>
          )}

          {stockLevel.isLowStock && (
            <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded text-center">
              ⚡ High demand - Limited stock remaining
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2">
        <Badge variant={getStockBadgeVariant()} className="text-xs">
          {getStockIcon()}
          <span className="ml-1">{getStockMessage()}</span>
        </Badge>

        {stockLevel.isLowStock && (
          <div className="flex items-center text-xs text-orange-600">
            <AlertCircle className="h-3 w-3 mr-1" />
            <span>Hurry up!</span>
          </div>
        )}
      </div>

      {showPurchaseCount && (
        <div className="space-y-1">
          {purchaseCount > 0 && (
            <div className="flex items-center text-sm text-green-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              <span>{getPurchaseMessage()}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
