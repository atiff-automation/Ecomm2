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
  const { data: session, update } = useSession();
  const [eligibility, setEligibility] = useState<MembershipEligibility | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [hasJustRegistered, setHasJustRegistered] = useState(false);

  // Check eligibility only when cart items actually change (not on every render)
  useEffect(() => {
    if (cartItems.length > 0) {
      checkEligibility();
    }
  }, [cartItems.length]); // Only depend on length, not the entire array

  // Handle session storage flag separately to avoid API calls
  useEffect(() => {
    // Check if user just registered for membership
    const registrationFlag = sessionStorage.getItem('membershipJustRegistered');
    const registrationTimestamp = sessionStorage.getItem(
      'membershipJustRegisteredTime'
    );

    if (registrationFlag === 'true') {
      // Check if registration flag is older than 5 minutes (300000 ms) - reduced time
      const now = Date.now();
      const registrationTime = registrationTimestamp
        ? parseInt(registrationTimestamp)
        : 0;
      const timeElapsed = now - registrationTime;

      // Also check if there's no timestamp (old format) or elapsed time is too long
      if (!registrationTimestamp || timeElapsed > 300000) {
        // 5 minutes
        if (process.env.NODE_ENV === 'development') {
          console.log(
            '🧹 Clearing expired or invalid membershipJustRegistered flag'
          );
        }
        sessionStorage.removeItem('membershipJustRegistered');
        sessionStorage.removeItem('membershipJustRegisteredTime');
        setHasJustRegistered(false);
      } else {
        // Additional validation: check if user is actually signed in
        // If showing registration complete but user isn't signed in, it's stale
        if (!session?.user) {
          if (process.env.NODE_ENV === 'development') {
            console.log(
              '🧹 Clearing membershipJustRegistered flag - user not signed in'
            );
          }
          sessionStorage.removeItem('membershipJustRegistered');
          sessionStorage.removeItem('membershipJustRegisteredTime');
          setHasJustRegistered(false);
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.log(
              '🔄 Found valid membershipJustRegistered flag, setting hasJustRegistered to true'
            );
          }
          setHasJustRegistered(true);
        }
      }
    }
  }, [session?.user?.id]); // Only depend on user ID, not entire session

  const checkEligibility = async () => {
    // Skip if no cart items or already loading
    if (cartItems.length === 0 || loading) {
      return;
    }

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

  const handleMembershipSuccess = async (membershipData: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🎯 handleMembershipSuccess called', membershipData);
    }

    // Mark that user just registered for membership
    setHasJustRegistered(true);

    // Persist registration state across component re-renders with timestamp
    const now = Date.now().toString();
    sessionStorage.setItem('membershipJustRegistered', 'true');
    sessionStorage.setItem('membershipJustRegisteredTime', now);

    if (process.env.NODE_ENV === 'development') {
      console.log(
        '✅ Set membershipJustRegistered flag in sessionStorage with timestamp'
      );
    }

    // Refresh session to get updated user data
    try {
      await update();
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Session updated');
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Failed to refresh session:', error);
      }
    }

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
    // Clear registration flag if user is now an actual member
    if (session?.user?.isMember) {
      sessionStorage.removeItem('membershipJustRegistered');
    }
    return null;
  }

  // If user just registered, show success message instead of join button
  if (hasJustRegistered) {
    return (
      <div
        className={`bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 ${className}`}
      >
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-green-100 rounded-full">
            <Crown className="h-6 w-6 text-green-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-green-800">
                🎉 Registration Complete!
              </h3>
              <Sparkles className="h-4 w-4 text-green-600" />
            </div>
            <p className="text-green-700 text-sm">
              Your membership will be activated after completing this purchase.
              You'll enjoy member benefits starting immediately after payment!
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (eligibility.eligible) {
    // Check if user is logged in
    if (session?.user) {
      // Logged-in user qualifies - show automatic activation message
      return (
        <div
          className={`bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 ${className}`}
        >
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-green-100 rounded-full">
              <Crown className="h-6 w-6 text-green-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-green-800">
                  🎉 Membership Will Be Activated!
                </h3>
                <Sparkles className="h-4 w-4 text-green-600" />
              </div>
              <p className="text-green-700 text-sm mb-3">
                Great news! With {formatCurrency(eligibility.qualifyingTotal)}{' '}
                in eligible purchases, your membership will be automatically
                activated when your payment is completed successfully.
              </p>
              <div className="bg-green-100 rounded-lg p-3 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">
                    What happens next:
                  </span>
                </div>
                <ul className="text-sm text-green-700 space-y-1 ml-6 list-disc">
                  <li>Complete your purchase to activate membership</li>
                  <li>Log in for future orders to enjoy member pricing</li>
                  <li>Access exclusive deals and early product releases</li>
                </ul>
              </div>
              <div className="flex items-center gap-2 text-xs text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>
                  Membership activation is subject to successful payment
                  completion
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    } else {
      // Guest user qualifies - show join modal option
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
                  purchases, you can create an account and unlock exclusive
                  member pricing on all future orders!
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => setShowModal(true)}
                    size="sm"
                    className="bg-yellow-600 hover:bg-yellow-700 text-white"
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    Create Account & Join
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
    }
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
