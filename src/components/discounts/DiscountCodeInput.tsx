'use client';
import { fetchWithCSRF } from '@/lib/utils/fetch-with-csrf';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Tag, X, Check, Gift } from 'lucide-react';
import { toast } from 'sonner';

interface CartItem {
  productId: string;
  categoryId: string;
  quantity: number;
  regularPrice: number;
  memberPrice: number;
  appliedPrice: number;
}

interface AppliedDiscount {
  code: string;
  amount: number;
  discountType: string;
}

interface DiscountCodeInputProps {
  cartItems: CartItem[];
  subtotal: number;
  appliedDiscounts: AppliedDiscount[];
  onDiscountApply: (discount: AppliedDiscount) => void;
  onDiscountRemove: (code: string) => void;
  className?: string;
}

export default function DiscountCodeInput({
  cartItems,
  subtotal,
  appliedDiscounts,
  onDiscountApply,
  onDiscountRemove,
  className = '',
}: DiscountCodeInputProps) {
  const [discountCode, setDiscountCode] = useState('');
  const [loading, setLoading] = useState(false);

  const validateAndApplyDiscount = async () => {
    if (!discountCode.trim()) {
      toast.error('Please enter a discount code');
      return;
    }

    // Check if code is already applied
    if (appliedDiscounts.some(d => d.code === discountCode.toUpperCase())) {
      toast.error('This discount code is already applied');
      return;
    }

    setLoading(true);

    try {
      const response = await fetchWithCSRF('/api/discounts/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: discountCode,
          cartItems,
          subtotal,
        }),
      });

      const data = await response.json();

      if (data.valid) {
        onDiscountApply({
          code: data.discountCode.code,
          amount: data.discountAmount,
          discountType: data.discountType,
        });
        setDiscountCode('');
        toast.success(
          `Discount code "${data.discountCode.code}" applied successfully!`
        );
      } else {
        toast.error(data.errors?.[0] || 'Invalid discount code');
      }
    } catch (error) {
      console.error('Error validating discount code:', error);
      toast.error('Failed to validate discount code');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      validateAndApplyDiscount();
    }
  };

  const getDiscountDisplayText = (discount: AppliedDiscount) => {
    switch (discount.discountType) {
      case 'PERCENTAGE':
        return `${discount.amount}% OFF`;
      case 'FIXED_AMOUNT':
        return `RM${discount.amount.toFixed(2)} OFF`;
      case 'FREE_SHIPPING':
        return 'FREE SHIPPING';
      default:
        return 'DISCOUNT';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium">
          <Tag className="h-4 w-4" />
          Discount Code
        </label>

        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Enter discount code"
            value={discountCode}
            onChange={e => setDiscountCode(e.target.value.toUpperCase())}
            onKeyPress={handleKeyPress}
            disabled={loading}
            className="flex-1"
          />
          <Button
            onClick={validateAndApplyDiscount}
            disabled={loading || !discountCode.trim()}
            size="default"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
          </Button>
        </div>
      </div>

      {appliedDiscounts.length > 0 && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Gift className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-800">
                Applied Discounts
              </span>
            </div>

            <div className="space-y-2">
              {appliedDiscounts.map(discount => (
                <div
                  key={discount.code}
                  className="flex items-center justify-between bg-white rounded p-3 border border-green-200"
                >
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-800"
                    >
                      <Check className="h-3 w-3 mr-1" />
                      {discount.code}
                    </Badge>
                    <span className="text-sm text-green-700">
                      {getDiscountDisplayText(discount)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-green-800">
                      -RM{discount.amount.toFixed(2)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDiscountRemove(discount.code)}
                      className="h-6 w-6 p-0 text-green-600 hover:text-green-800 hover:bg-green-100"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 pt-3 border-t border-green-200">
              <div className="flex justify-between items-center">
                <span className="font-medium text-green-800">
                  Total Discount:
                </span>
                <span className="font-bold text-green-800">
                  -RM
                  {appliedDiscounts
                    .reduce((sum, d) => sum + d.amount, 0)
                    .toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
