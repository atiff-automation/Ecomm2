'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, Gift, Percent, Calendar, Users } from 'lucide-react';
import { toast } from 'sonner';

interface DiscountCode {
  code: string;
  name: string;
  description: string | null;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING' | 'BUY_X_GET_Y';
  discountValue: number;
  minimumOrderValue: number | null;
  memberOnly: boolean;
  expiresAt: string | null;
}

interface DiscountBannerProps {
  showTitle?: boolean;
  maxItems?: number;
  className?: string;
}

export default function DiscountBanner({
  showTitle = true,
  maxItems = 3,
  className = '',
}: DiscountBannerProps) {
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchActiveDiscounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchActiveDiscounts = async () => {
    try {
      const response = await fetch('/api/discounts/public');
      if (!response.ok) {
        throw new Error('Failed to fetch discount codes');
      }
      const data = await response.json();
      setDiscountCodes(data.discountCodes?.slice(0, maxItems) || []);
    } catch (err) {
      console.error('Error fetching discount codes:', err);
      setError('Failed to load discount codes');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success(`Discount code "${code}" copied to clipboard!`);
    } catch {
      toast.error('Failed to copy discount code');
    }
  };

  const getDiscountTypeIcon = (type: string) => {
    switch (type) {
      case 'PERCENTAGE':
        return <Percent className="h-4 w-4" />;
      case 'FIXED_AMOUNT':
        return <Gift className="h-4 w-4" />;
      case 'FREE_SHIPPING':
        return <Gift className="h-4 w-4" />;
      default:
        return <Gift className="h-4 w-4" />;
    }
  };

  const getDiscountDisplayText = (discountCode: DiscountCode) => {
    switch (discountCode.discountType) {
      case 'PERCENTAGE':
        return `${discountCode.discountValue}% OFF`;
      case 'FIXED_AMOUNT':
        return `RM${discountCode.discountValue} OFF`;
      case 'FREE_SHIPPING':
        return 'FREE SHIPPING';
      case 'BUY_X_GET_Y':
        return 'BUY X GET Y';
      default:
        return 'DISCOUNT';
    }
  };

  const formatExpiryDate = (expiresAt: string | null) => {
    if (!expiresAt) {
      return 'No expiry';
    }
    const date = new Date(expiresAt);
    return `Expires ${date.toLocaleDateString('en-MY', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })}`;
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {showTitle && (
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Active Promotions</h3>
          </div>
        )}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="h-32 bg-gray-200 animate-pulse rounded-lg"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error || discountCodes.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {showTitle && (
        <div className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Active Promotions</h3>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {discountCodes.map(discount => (
          <Card
            key={discount.code}
            className="relative overflow-hidden border-dashed border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 hover:shadow-md transition-shadow"
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getDiscountTypeIcon(discount.discountType)}
                  <Badge variant="secondary" className="font-medium">
                    {getDiscountDisplayText(discount)}
                  </Badge>
                </div>
                {discount.memberOnly && (
                  <Badge variant="outline" className="text-xs">
                    <Users className="h-3 w-3 mr-1" />
                    Members
                  </Badge>
                )}
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-sm">{discount.name}</h4>
                {discount.description && (
                  <p className="text-xs text-muted-foreground">
                    {discount.description}
                  </p>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatExpiryDate(discount.expiresAt)}
                    </div>
                    {discount.minimumOrderValue && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Min order: RM{discount.minimumOrderValue}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-dashed border-primary/20">
                  <code className="flex-1 px-2 py-1 bg-primary/10 rounded text-sm font-mono font-bold text-primary">
                    {discount.code}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(discount.code)}
                    className="shrink-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
