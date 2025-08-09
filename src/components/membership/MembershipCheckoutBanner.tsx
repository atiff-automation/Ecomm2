'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Crown, Sparkles, ArrowRight, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import MembershipRegistrationModal from './MembershipRegistrationModal';

interface CartItem {
  productId: string;
  quantity: number;
}

interface MembershipEligibility {
  eligible: boolean;
  qualifyingTotal: number;
  threshold: number;
  remaining: number;
  message: string;
  qualifyingItems: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
    subtotal: number;
  }>;
  isExistingMember: boolean;
}

interface MembershipCheckoutBannerProps {
  cartItems: CartItem[];
  onMembershipActivated?: (membershipData: any) => void;
  className?: string;
}

export default function MembershipCheckoutBanner({
  cartItems,
  onMembershipActivated,
  className = '',
}: MembershipCheckoutBannerProps) {
  const { data: session } = useSession();
  const [eligibility, setEligibility] = useState<MembershipEligibility | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (cartItems.length > 0) {
      checkEligibility();
    }
  }, [cartItems]);

  const checkEligibility = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/cart/membership-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItems }),
      });

      if (response.ok) {
        const data = await response.json();
        setEligibility(data);
      }
    } catch (error) {
      console.error('Error checking membership eligibility:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(amount);
  };

  const handleMembershipSuccess = (membershipData: any) => {
    // Refresh eligibility status
    checkEligibility();
    // Notify parent component
    onMembershipActivated?.(membershipData);
  };

  if (loading) {
    return (
      <div
        className={`bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 ${className}`}
      >
        <div className="animate-pulse flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-200 rounded-full"></div>
          <div className="flex-1">
            <div className="h-4 bg-blue-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-blue-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!eligibility || eligibility.isExistingMember) {
    return null;
  }

  if (eligibility.eligible) {
    // User qualifies for membership
    return (
      <>
        <div
          className={`bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4 ${className}`}
        >
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-yellow-100 rounded-full">
              <Crown className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-yellow-800">
                  🎉 You Qualify for Membership!
                </h3>
                <Sparkles className="h-4 w-4 text-yellow-600" />
              </div>
              <p className="text-yellow-700 text-sm mb-3">
                With {formatCurrency(eligibility.qualifyingTotal)} in eligible
                purchases, you can join as a member and unlock exclusive pricing
                on all future orders!
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => setShowModal(true)}
                  size="sm"
                  className="bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Join Now
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                  onClick={() => {
                    /* Show benefits details */
                  }}
                >
                  <Gift className="h-4 w-4 mr-2" />
                  View Benefits
                </Button>
              </div>
            </div>
          </div>
        </div>

        <MembershipRegistrationModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSuccess={handleMembershipSuccess}
          eligibility={eligibility}
          cartItems={cartItems}
        />
      </>
    );
  } else {
    // User is close to qualifying or needs more to qualify
    const progress =
      (eligibility.qualifyingTotal / eligibility.threshold) * 100;
    const isClose = progress > 50; // Consider "close" if over 50%

    return (
      <div
        className={`bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 ${className}`}
      >
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-blue-100 rounded-full">
            <Crown className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-blue-800">
                {isClose ? '🔥 Almost There!' : '👑 Become a Member'}
              </h3>
              <Sparkles className="h-4 w-4 text-blue-600" />
            </div>
            <p className="text-blue-700 text-sm mb-3">
              {isClose
                ? `Add just ${formatCurrency(eligibility.remaining)} more in eligible products to unlock member pricing!`
                : `Spend ${formatCurrency(eligibility.threshold)} in eligible products and unlock exclusive member benefits.`}
            </p>

            {/* Progress Bar */}
            <div className="mb-3">
              <div className="flex justify-between text-xs text-blue-600 mb-1">
                <span>{formatCurrency(eligibility.qualifyingTotal)}</span>
                <span>{formatCurrency(eligibility.threshold)}</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Member Benefits Preview */}
            <div className="flex flex-wrap gap-1 text-xs text-blue-600 mb-3">
              <span className="bg-blue-100 px-2 py-1 rounded">
                ✨ Member Pricing
              </span>
              <span className="bg-blue-100 px-2 py-1 rounded">
                🎁 Early Access
              </span>
              <span className="bg-blue-100 px-2 py-1 rounded">
                ⭐ Special Offers
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="border-blue-300 text-blue-700 hover:bg-blue-50"
              onClick={() => {
                // Navigate back to shopping to add more items
                window.location.href = '/products';
              }}
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Add More Items
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
