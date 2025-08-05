/**
 * Membership Status Component - Malaysian E-commerce Platform
 * Shows membership qualification progress and status
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Award, TrendingUp, Gift } from 'lucide-react';

interface MembershipStatusProps {
  isMember: boolean;
  isLoggedIn: boolean;
  qualifyingTotal: number;
  membershipThreshold: number;
  membershipProgress: number;
  amountNeededForMembership: number;
  className?: string;
}

export function MembershipStatus({
  isMember,
  isLoggedIn,
  qualifyingTotal,
  membershipThreshold,
  membershipProgress,
  amountNeededForMembership,
  className = '',
}: MembershipStatusProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(price);
  };

  // Don't show anything if user is not logged in
  if (!isLoggedIn) {
    return null;
  }

  // If user is already a member, show member status
  if (isMember) {
    return (
      <Card
        className={`bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 ${className}`}
      >
        <CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
              <Award className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-green-900">
                  Active Member
                </span>
                <Badge className="bg-green-600 text-white text-xs">
                  Premium
                </Badge>
              </div>
              <p className="text-sm text-green-700">
                Enjoying exclusive member pricing and benefits
              </p>
            </div>
            <Gift className="w-5 h-5 text-green-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show membership qualification progress
  const isEligible = qualifyingTotal >= membershipThreshold;

  return (
    <Card
      className={`bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 ${className}`}
    >
      <CardContent className="pt-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span className="font-semibold text-blue-900">
                {isEligible ? 'Membership Qualified!' : 'Membership Progress'}
              </span>
            </div>
            {isEligible && (
              <Badge className="bg-blue-600 text-white">
                <Award className="w-3 h-3 mr-1" />
                Eligible
              </Badge>
            )}
          </div>

          <Progress value={membershipProgress} className="h-2" />

          <div className="flex justify-between items-center text-sm">
            <span className="text-blue-700 font-medium">
              {formatPrice(qualifyingTotal)}
            </span>
            <span className="text-muted-foreground">
              {formatPrice(membershipThreshold)} required
            </span>
          </div>

          {isEligible ? (
            <div className="bg-blue-100 rounded-lg p-3">
              <p className="text-sm text-blue-800 font-medium">
                🎉 Congratulations! You qualify for membership benefits.
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Complete your purchase to activate membership and start saving!
              </p>
            </div>
          ) : (
            <div className="bg-gray-100 rounded-lg p-3">
              <p className="text-sm text-gray-700">
                Add {formatPrice(amountNeededForMembership)} more in qualifying
                items to unlock membership.
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Members save up to 15% with exclusive pricing on all products.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Compact Membership Progress for cart sidebar
 */
export function CompactMembershipStatus({
  isMember,
  isLoggedIn,
  qualifyingTotal,
  membershipThreshold,
  membershipProgress,
  amountNeededForMembership,
  className = '',
}: MembershipStatusProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(price);
  };

  if (!isLoggedIn || isMember) {
    return null;
  }

  const isEligible = qualifyingTotal >= membershipThreshold;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-blue-800">
          {isEligible ? 'Membership Qualified!' : 'Membership Progress'}
        </span>
        {isEligible && (
          <Badge
            variant="secondary"
            className="text-xs bg-blue-100 text-blue-800"
          >
            Eligible
          </Badge>
        )}
      </div>

      <Progress value={membershipProgress} className="h-2" />

      <div className="flex justify-between text-xs">
        <span className="text-blue-700 font-medium">
          {formatPrice(qualifyingTotal)}
        </span>
        <span className="text-muted-foreground">
          {formatPrice(membershipThreshold)}
        </span>
      </div>

      {isEligible ? (
        <p className="text-xs text-blue-800 font-medium">
          🎉 Complete purchase to activate membership!
        </p>
      ) : (
        <p className="text-xs text-gray-600">
          Add {formatPrice(amountNeededForMembership)} more to qualify
        </p>
      )}
    </div>
  );
}
