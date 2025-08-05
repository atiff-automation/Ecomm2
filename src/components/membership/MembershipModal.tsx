/**
 * Membership Registration Modal - Malaysian E-commerce Platform
 * Modal for membership signup during checkout when qualified
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Award, Check, Star, ArrowRight, Gift } from 'lucide-react';

interface MembershipModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  qualifyingAmount: number;
  membershipThreshold: number;
  potentialSavings: number;
  onAccept: () => void;
  onDecline: () => void;
  isLoading?: boolean;
}

export function MembershipModal({
  isOpen,
  onOpenChange,
  qualifyingAmount,
  membershipThreshold,
  potentialSavings,
  onAccept,
  onDecline,
  isLoading = false,
}: MembershipModalProps) {
  const [selectedOption, setSelectedOption] = useState<
    'accept' | 'decline' | null
  >(null);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(price);
  };

  const membershipProgress = Math.min(
    (qualifyingAmount / membershipThreshold) * 100,
    100
  );

  const handleContinue = () => {
    if (selectedOption === 'accept') {
      onAccept();
    } else if (selectedOption === 'decline') {
      onDecline();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Award className="w-6 h-6 text-yellow-500" />
            🎉 You Qualify for Membership!
          </DialogTitle>
          <DialogDescription>
            Your cart qualifies for our exclusive membership program with
            instant benefits.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Qualification Status */}
          <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Qualification Progress
                  </span>
                  <Badge className="bg-green-600 text-white">
                    <Check className="w-3 h-3 mr-1" />
                    Qualified
                  </Badge>
                </div>

                <Progress value={membershipProgress} className="h-3" />

                <div className="flex justify-between text-sm">
                  <span className="text-green-700 font-medium">
                    {formatPrice(qualifyingAmount)}
                  </span>
                  <span className="text-muted-foreground">
                    {formatPrice(membershipThreshold)} required
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Membership Benefits */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" />
              Membership Benefits
            </h3>

            <div className="grid gap-3">
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center mt-0.5">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <div>
                  <p className="font-medium text-blue-900">
                    Exclusive Member Pricing
                  </p>
                  <p className="text-sm text-blue-700">
                    Save up to 15% on all products with special member prices
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center mt-0.5">
                  <Gift className="w-3 h-3 text-white" />
                </div>
                <div>
                  <p className="font-medium text-purple-900">
                    Early Access to Sales
                  </p>
                  <p className="text-sm text-purple-700">
                    Get first access to special promotions and new products
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center mt-0.5">
                  <Award className="w-3 h-3 text-white" />
                </div>
                <div>
                  <p className="font-medium text-green-900">
                    Priority Customer Service
                  </p>
                  <p className="text-sm text-green-700">
                    Dedicated support line and faster response times
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Immediate Savings */}
          {potentialSavings > 0 && (
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="pt-4">
                <div className="text-center">
                  <p className="text-sm text-yellow-800">
                    Activate membership now and save on this order:
                  </p>
                  <p className="text-2xl font-bold text-yellow-900">
                    {formatPrice(potentialSavings)}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Selection */}
          <div className="space-y-3">
            <div
              className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                selectedOption === 'accept'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
              onClick={() => setSelectedOption('accept')}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-4 h-4 rounded-full border-2 ${
                    selectedOption === 'accept'
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                  }`}
                >
                  {selectedOption === 'accept' && (
                    <Check className="w-2.5 h-2.5 text-white m-0.5" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-blue-900">
                    Yes, activate my membership! 🎉
                  </p>
                  <p className="text-sm text-blue-700">
                    Start saving immediately and enjoy all member benefits
                  </p>
                </div>
              </div>
            </div>

            <div
              className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                selectedOption === 'decline'
                  ? 'border-gray-500 bg-gray-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedOption('decline')}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-4 h-4 rounded-full border-2 ${
                    selectedOption === 'decline'
                      ? 'border-gray-500 bg-gray-500'
                      : 'border-gray-300'
                  }`}
                >
                  {selectedOption === 'decline' && (
                    <Check className="w-2.5 h-2.5 text-white m-0.5" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">Continue as guest</p>
                  <p className="text-sm text-gray-600">
                    Complete purchase without membership (you can join later)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleContinue}
              disabled={!selectedOption || isLoading}
              className="flex-1"
            >
              {isLoading ? (
                'Processing...'
              ) : (
                <>
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>

          {/* Terms */}
          <p className="text-xs text-muted-foreground text-center">
            By activating membership, you agree to our membership terms.
            Membership is free and can be cancelled anytime.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
