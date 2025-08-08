/**
 * Member Promotions Component - Malaysian E-commerce Platform
 * Displays member-exclusive promotions and benefits
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Gift,
  Crown,
  Clock,
  Star,
  TrendingUp,
  Calendar,
  Percent,
  DollarSign
} from 'lucide-react';
// Local utility function
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 2,
  }).format(price);
};

interface MemberPromotion {
  code: string;
  name: string;
  description: string | null;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';
  discountValue: number;
  minimumOrderValue: number | null;
  expiresAt: string | null;
  isAutoApply: boolean;
}

interface MemberBenefits {
  totalSavings: number;
  exclusiveOffers: number;
  memberSince: string;
  orderCount: number;
  averageOrderValue: number;
  nextBenefitUnlock?: {
    name: string;
    requirement: string;
    progress: number;
    target: number;
  };
}

export default function MemberPromotions() {
  const [promotions, setPromotions] = useState<MemberPromotion[]>([]);
  const [benefits, setBenefits] = useState<MemberBenefits | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingBenefits, setCheckingBenefits] = useState(false);

  useEffect(() => {
    fetchPromotions();
    fetchBenefits();
  }, []);

  const fetchPromotions = async () => {
    try {
      const response = await fetch('/api/member/promotions');
      if (response.ok) {
        const data = await response.json();
        setPromotions(data.promotions || []);
      }
    } catch (error) {
      console.error('Failed to fetch member promotions:', error);
    }
  };

  const fetchBenefits = async () => {
    try {
      const response = await fetch('/api/member/promotions?type=benefits');
      if (response.ok) {
        const data = await response.json();
        setBenefits(data.benefits);
      }
    } catch (error) {
      console.error('Failed to fetch member benefits:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkForNewBenefits = async () => {
    setCheckingBenefits(true);
    try {
      const response = await fetch('/api/member/promotions?type=check-benefits');
      if (response.ok) {
        const data = await response.json();
        if (data.newBenefits > 0) {
          await fetchPromotions();
          await fetchBenefits();
        }
      }
    } catch (error) {
      console.error('Failed to check for new benefits:', error);
    } finally {
      setCheckingBenefits(false);
    }
  };

  const getDiscountIcon = (type: string) => {
    switch (type) {
      case 'PERCENTAGE':
        return <Percent className="h-4 w-4" />;
      case 'FIXED_AMOUNT':
        return <DollarSign className="h-4 w-4" />;
      case 'FREE_SHIPPING':
        return <Gift className="h-4 w-4" />;
      default:
        return <Star className="h-4 w-4" />;
    }
  };

  const formatDiscountValue = (type: string, value: number) => {
    switch (type) {
      case 'PERCENTAGE':
        return `${value}% OFF`;
      case 'FIXED_AMOUNT':
        return `${formatPrice(value)} OFF`;
      case 'FREE_SHIPPING':
        return 'FREE SHIPPING';
      default:
        return `${value}`;
    }
  };

  const formatExpiryDate = (expiresAt: string | null) => {
    if (!expiresAt) return 'No expiry';
    
    const date = new Date(expiresAt);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 1) return 'Expires today';
    if (diffDays === 1) return 'Expires tomorrow';
    if (diffDays <= 7) return `Expires in ${diffDays} days`;
    
    return date.toLocaleDateString('en-MY');
  };

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {benefits && (
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-800">
              <Crown className="h-5 w-5" />
              Your Member Benefits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {formatPrice(benefits.totalSavings)}
                </div>
                <div className="text-sm text-gray-600">Total Saved</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {benefits.exclusiveOffers}
                </div>
                <div className="text-sm text-gray-600">Exclusive Offers Used</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {benefits.orderCount}
                </div>
                <div className="text-sm text-gray-600">Orders Placed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {formatPrice(benefits.averageOrderValue)}
                </div>
                <div className="text-sm text-gray-600">Avg Order Value</div>
              </div>
            </div>

            {benefits.nextBenefitUnlock && (
              <div className="mt-4 p-4 bg-white rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">
                    Next Unlock: {benefits.nextBenefitUnlock.name}
                  </span>
                  <Button
                    onClick={checkForNewBenefits}
                    disabled={checkingBenefits}
                    size="sm"
                    variant="outline"
                  >
                    <TrendingUp className="h-4 w-4 mr-1" />
                    {checkingBenefits ? 'Checking...' : 'Check Progress'}
                  </Button>
                </div>
                <div className="mb-2">
                  <Progress 
                    value={(benefits.nextBenefitUnlock.progress / benefits.nextBenefitUnlock.target) * 100} 
                    className="h-2"
                  />
                </div>
                <div className="text-sm text-gray-600">
                  {benefits.nextBenefitUnlock.requirement} 
                  ({benefits.nextBenefitUnlock.progress}/{benefits.nextBenefitUnlock.target})
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Your Exclusive Member Promotions
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Special offers available only to members like you
          </p>
        </CardHeader>
        <CardContent>
          {promotions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">No exclusive promotions right now</p>
              <p className="text-sm">Check back later for new member offers!</p>
              <Button
                onClick={checkForNewBenefits}
                disabled={checkingBenefits}
                className="mt-4"
                variant="outline"
              >
                Check for New Benefits
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {promotions.map((promotion) => (
                <Card key={promotion.code} className="border-l-4 border-l-green-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getDiscountIcon(promotion.discountType)}
                          <h3 className="font-semibold text-lg">{promotion.name}</h3>
                          {promotion.isAutoApply && (
                            <Badge variant="secondary" className="text-xs">
                              Auto-Apply
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-gray-600 mb-3">{promotion.description}</p>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <span className="font-medium">
                              {formatDiscountValue(promotion.discountType, promotion.discountValue)}
                            </span>
                          </div>
                          
                          {promotion.minimumOrderValue && (
                            <div className="flex items-center gap-1">
                              <span>Min: {formatPrice(promotion.minimumOrderValue)}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{formatExpiryDate(promotion.expiresAt)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="ml-4 text-right">
                        <div className="font-mono text-lg font-bold text-green-600 mb-2">
                          {promotion.code}
                        </div>
                        <Button
                          onClick={() => copyToClipboard(promotion.code)}
                          size="sm"
                          variant="outline"
                        >
                          Copy Code
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}