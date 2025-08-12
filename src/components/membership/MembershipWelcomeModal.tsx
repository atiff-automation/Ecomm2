/**
 * Membership Welcome Modal - JRM E-commerce Platform
 * Welcome popup shown after successful membership activation
 */

'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Crown,
  Sparkles,
  Star,
  Gift,
  Percent,
  Zap,
  ArrowRight,
  X,
} from 'lucide-react';

interface MembershipWelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberInfo?: {
    name?: string;
    memberSince?: string | Date;
    orderValue?: number;
  };
}

export default function MembershipWelcomeModal({
  isOpen,
  onClose,
  memberInfo,
}: MembershipWelcomeModalProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(amount);
  };

  const handleViewBenefits = () => {
    onClose();
    // Navigate to membership page
    window.location.href = '/account/membership';
  };

  const handleContinueShopping = () => {
    onClose();
    // Navigate to products page
    window.location.href = '/products';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] overflow-hidden p-0">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full p-1 hover:bg-gray-100 transition-colors"
        >
          <X className="h-4 w-4 text-gray-500" />
        </button>

        {/* Header with gradient background */}
        <div className="bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 text-white p-8 text-center relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-4 left-4 opacity-20">
              <Sparkles className="h-8 w-8" />
            </div>
            <div className="absolute top-8 right-6 opacity-20">
              <Star className="h-6 w-6" />
            </div>
            <div className="absolute bottom-4 left-8 opacity-20">
              <Crown className="h-6 w-6" />
            </div>
            <div className="absolute bottom-6 right-4 opacity-20">
              <Gift className="h-8 w-8" />
            </div>
          </div>

          {/* Main content */}
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <Crown className="h-10 w-10 text-yellow-300" />
            </div>
            
            <h1 className="text-2xl font-bold mb-2">
              🎉 Welcome to Membership!
            </h1>
            
            {memberInfo?.name && (
              <p className="text-lg opacity-90 mb-1">
                Congratulations, {memberInfo.name}!
              </p>
            )}
            
            <p className="text-sm opacity-75">
              Your membership has been activated successfully
            </p>
            
            {memberInfo?.orderValue && (
              <div className="mt-4 inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                <Zap className="h-4 w-4 text-yellow-300" />
                <span className="text-sm font-medium">
                  Qualifying Purchase: {formatCurrency(memberInfo.orderValue)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Benefits section */}
        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
              Your Exclusive Member Benefits
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Percent className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-blue-900">Member Pricing</p>
                  <p className="text-sm text-blue-700">
                    Exclusive discounts on all products
                  </p>
                </div>
                <Badge variant="secondary" className="ml-auto">
                  Active
                </Badge>
              </div>

              <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-100">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <Zap className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-purple-900">Early Access</p>
                  <p className="text-sm text-purple-700">
                    First access to new products & sales
                  </p>
                </div>
                <Badge variant="secondary" className="ml-auto">
                  Active
                </Badge>
              </div>

              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Gift className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-green-900">Special Offers</p>
                  <p className="text-sm text-green-700">
                    Member-only promotions & rewards
                  </p>
                </div>
                <Badge variant="secondary" className="ml-auto">
                  Active
                </Badge>
              </div>

              <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
                <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                  <Star className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium text-amber-900">Priority Support</p>
                  <p className="text-sm text-amber-700">
                    Faster customer service response
                  </p>
                </div>
                <Badge variant="secondary" className="ml-auto">
                  Active
                </Badge>
              </div>
            </div>
          </div>

          {/* Important notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <Crown className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800 mb-1">
                  Important: Login Required
                </p>
                <p className="text-yellow-700">
                  To enjoy member pricing on future orders, make sure to log in to your account before shopping. 
                  Your member benefits are tied to your account!
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={handleViewBenefits}
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              <Crown className="h-4 w-4 mr-2" />
              View My Account
            </Button>
            <Button 
              onClick={handleContinueShopping}
              variant="outline"
              className="flex-1"
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Continue Shopping
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}