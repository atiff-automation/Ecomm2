'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  Users,
  Package,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';

interface SocialProofData {
  productId: string;
  message: string;
  stockLevel: {
    currentStock: number;
    isLowStock: boolean;
    stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
  } | null;
  purchaseCount: number;
}

interface SocialProofIndicatorProps {
  productId: string;
  className?: string;
  showRecentPurchases?: boolean;
  showStockLevel?: boolean;
}

export function SocialProofIndicator({
  productId,
  className = '',
  showRecentPurchases = true,
  showStockLevel = true,
}: SocialProofIndicatorProps) {
  const [socialProofData, setSocialProofData] =
    useState<SocialProofData | null>(null);
  const [recentPurchases, setRecentPurchases] = useState<
    Array<{
      productName: string;
      customerLocation: string;
      purchasedAt: Date;
    }>
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSocialProofData();
  }, [productId]);

  const fetchSocialProofData = async () => {
    try {
      setLoading(true);

      // Fetch stock levels and purchase counts
      const stockResponse = await fetch('/api/social-proof/stock-levels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productIds: [productId] }),
      });

      if (stockResponse.ok) {
        const stockData = await stockResponse.json();
        setSocialProofData(stockData.socialProofData[productId] || null);
      }

      // Fetch recent purchases if enabled
      if (showRecentPurchases) {
        const purchasesResponse = await fetch(
          `/api/social-proof/recent-purchases?productId=${productId}`
        );

        if (purchasesResponse.ok) {
          const purchasesData = await purchasesResponse.json();
          setRecentPurchases(purchasesData.recentPurchases.slice(0, 1)); // Show only the most recent
        }
      }
    } catch (error) {
      console.error('Error fetching social proof data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !socialProofData) {
    return null;
  }

  const getStockIcon = (stockStatus: string) => {
    switch (stockStatus) {
      case 'out_of_stock':
        return <AlertTriangle className="h-3 w-3" />;
      case 'low_stock':
        return <Package className="h-3 w-3" />;
      case 'in_stock':
        return <CheckCircle className="h-3 w-3" />;
      default:
        return <Package className="h-3 w-3" />;
    }
  };

  const getStockBadgeVariant = (stockStatus: string) => {
    switch (stockStatus) {
      case 'out_of_stock':
        return 'destructive';
      case 'low_stock':
        return 'secondary';
      case 'in_stock':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Stock Level Indicator */}
      {showStockLevel && socialProofData.stockLevel && (
        <div className="flex items-center gap-2">
          <Badge
            variant={getStockBadgeVariant(
              socialProofData.stockLevel.stockStatus
            )}
            className="flex items-center gap-1 text-xs"
          >
            {getStockIcon(socialProofData.stockLevel.stockStatus)}
            {socialProofData.message}
          </Badge>
        </div>
      )}

      {/* Purchase Count */}
      {showRecentPurchases && socialProofData.purchaseCount > 0 && (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Users className="h-3 w-3" />
          <span>
            {socialProofData.purchaseCount} people bought this in the last 24
            hours
          </span>
        </div>
      )}

      {/* Recent Purchase */}
      {showRecentPurchases && recentPurchases.length > 0 && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>
            Recently purchased in {recentPurchases[0].customerLocation}
          </span>
        </div>
      )}
    </div>
  );
}
