/**
 * Price Display Component - Malaysian E-commerce Platform
 * Shows dual pricing (regular/member) with membership encouragement
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Award, Info } from 'lucide-react';
import Link from 'next/link';

interface PriceDisplayProps {
  regularPrice: number;
  memberPrice: number;
  isMember?: boolean;
  isLoggedIn?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showMembershipPrompt?: boolean;
  className?: string;
}

export function PriceDisplay({
  regularPrice,
  memberPrice,
  isMember = false,
  isLoggedIn = false,
  size = 'md',
  showMembershipPrompt = true,
  className = '',
}: PriceDisplayProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(price);
  };

  const savings = regularPrice - memberPrice;
  const savingsPercentage = Math.round((savings / regularPrice) * 100);

  // Size-based styling
  const sizeClasses = {
    sm: {
      price: 'text-base',
      member: 'text-sm',
      badge: 'text-xs',
      savings: 'text-xs',
    },
    md: {
      price: 'text-lg',
      member: 'text-base',
      badge: 'text-xs',
      savings: 'text-sm',
    },
    lg: {
      price: 'text-xl',
      member: 'text-lg',
      badge: 'text-sm',
      savings: 'text-base',
    },
  };

  const styles = sizeClasses[size];

  // If user is a member, show member pricing prominently
  if (isMember) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center gap-2">
          <span className={`font-bold text-green-600 ${styles.price}`}>
            {formatPrice(memberPrice)}
          </span>
          <Badge
            variant="secondary"
            className={`${styles.badge} bg-green-100 text-green-800`}
          >
            <Award className="w-3 h-3 mr-1" />
            Member Price
          </Badge>
        </div>

        {savings > 0 && (
          <div className="flex items-center gap-2">
            <span
              className={`text-muted-foreground line-through ${styles.member}`}
            >
              {formatPrice(regularPrice)}
            </span>
            <span className={`text-green-600 font-medium ${styles.savings}`}>
              Save {formatPrice(savings)} ({savingsPercentage}%)
            </span>
          </div>
        )}
      </div>
    );
  }

  // If user is logged in but not a member, show regular price with member price info
  if (isLoggedIn && !isMember) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center gap-2">
          <span className={`font-bold ${styles.price}`}>
            {formatPrice(regularPrice)}
          </span>
        </div>

        {savings > 0 && (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`text-blue-600 font-medium ${styles.member}`}>
                Member price: {formatPrice(memberPrice)}
              </span>
              <Badge
                variant="outline"
                className={`${styles.badge} border-blue-200 text-blue-700`}
              >
                Save {formatPrice(savings)}
              </Badge>
            </div>

            {showMembershipPrompt && (
              <div className={`text-muted-foreground ${styles.savings}`}>
                <Info className="w-3 h-3 inline mr-1" />
                Become a member to unlock this price
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // If user is not logged in, show both prices to encourage signup
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2">
        <span className={`font-bold ${styles.price}`}>
          {formatPrice(regularPrice)}
        </span>
      </div>

      {savings > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className={`text-blue-600 font-medium ${styles.member}`}>
              Member price: {formatPrice(memberPrice)}
            </span>
            <Badge
              variant="outline"
              className={`${styles.badge} border-blue-200 text-blue-700`}
            >
              Save {formatPrice(savings)}
            </Badge>
          </div>

          {showMembershipPrompt && (
            <div className="space-y-1">
              <div className={`text-muted-foreground ${styles.savings}`}>
                <Info className="w-3 h-3 inline mr-1" />
                Sign up and spend RM 80 to unlock member pricing
              </div>
              <Link href="/auth/signup">
                <Button
                  variant="outline"
                  size="sm"
                  className={`${styles.savings} h-6 px-2`}
                >
                  Join as Member
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Compact Price Display for product cards
 */
export function CompactPriceDisplay({
  regularPrice,
  memberPrice,
  isMember = false,
  isLoggedIn = false,
  className = '',
}: Omit<PriceDisplayProps, 'size' | 'showMembershipPrompt'>) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(price);
  };

  const savings = regularPrice - memberPrice;

  if (isMember) {
    return (
      <div className={`space-y-1 ${className}`}>
        <div className="flex items-center gap-2">
          <span className="font-bold text-green-600">
            {formatPrice(memberPrice)}
          </span>
          <Badge
            variant="secondary"
            className="text-xs bg-green-100 text-green-800"
          >
            Member
          </Badge>
        </div>
        {savings > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground line-through">
              {formatPrice(regularPrice)}
            </span>
            <span className="text-xs text-green-600 font-medium">
              Save {formatPrice(savings)}
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-1 ${className}`}>
      <span className="font-bold text-base">{formatPrice(regularPrice)}</span>
      {savings > 0 && (
        <div className="text-xs text-muted-foreground">
          Member: {formatPrice(memberPrice)}
          {!isLoggedIn && ' (Sign up required)'}
        </div>
      )}
    </div>
  );
}
