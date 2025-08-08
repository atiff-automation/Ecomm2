/**
 * Member Benefits Page - JRM E-commerce Platform
 * Information about membership benefits and features
 */

'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Gift,
  Truck,
  Star,
  Shield,
  Clock,
  CreditCard,
  Users,
  Award,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import MemberPromotions from '@/components/member/MemberPromotions';

export default function MemberBenefitsPage() {
  const { data: session } = useSession();
  const isMember = session?.user?.isMember;

  const memberBenefits = [
    {
      icon: Star,
      title: 'Member Pricing',
      description: 'Enjoy exclusive discounts up to 15% off regular prices',
      status: isMember ? 'active' : 'available',
      details: 'Automatic member pricing applied on all products',
    },
    {
      icon: Truck,
      title: 'Free Shipping',
      description: 'Free delivery on orders over RM120 (vs RM150 for guests)',
      status: isMember ? 'active' : 'available',
      details: 'Reduced threshold for free shipping nationwide',
    },
    {
      icon: Clock,
      title: 'Priority Processing',
      description: 'Your orders are processed within 24 hours',
      status: isMember ? 'active' : 'available',
      details: 'Jump the queue with priority order processing',
    },
    {
      icon: Shield,
      title: 'Extended Warranty',
      description: 'Additional 6 months warranty on all purchases',
      status: isMember ? 'active' : 'available',
      details: 'Peace of mind with extended product protection',
    },
    {
      icon: Users,
      title: 'Priority Support',
      description: 'Dedicated member support line and faster response',
      status: isMember ? 'active' : 'available',
      details: '24/7 priority customer service',
    },
    {
      icon: Gift,
      title: 'Birthday Rewards',
      description: 'Special discounts and gifts during your birthday month',
      status: isMember ? 'active' : 'available',
      details: 'Exclusive birthday treats and surprise offers',
    },
    {
      icon: CreditCard,
      title: 'Flexible Payment',
      description: 'Access to installment plans and buy-now-pay-later options',
      status: isMember ? 'active' : 'available',
      details: 'More payment options for your convenience',
    },
    {
      icon: Award,
      title: 'Early Access',
      description: 'First access to new products and flash sales',
      status: isMember ? 'active' : 'coming-soon',
      details: 'Be the first to shop new arrivals and exclusive deals',
    },
  ];

  const upcomingFeatures = [
    {
      icon: Star,
      title: 'Member Tiers',
      description: 'Bronze, Silver, Gold tiers with increasing benefits',
      status: 'coming-soon',
    },
    {
      icon: Gift,
      title: 'Loyalty Points',
      description: 'Earn points on every purchase, redeem for rewards',
      status: 'coming-soon',
    },
    {
      icon: Users,
      title: 'Referral Program',
      description: 'Earn rewards for referring friends and family',
      status: 'coming-soon',
    },
  ];

  const getBadgeStyle = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'available':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'coming-soon':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getBadgeText = (status: string) => {
    switch (status) {
      case 'active':
        return '✓ Active';
      case 'available':
        return 'Available';
      case 'coming-soon':
        return 'Coming Soon';
      default:
        return status;
    }
  };

  return (
    <div className="container mx-auto px-4 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Member Benefits
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          {isMember
            ? "You're enjoying all these amazing member benefits!"
            : 'Discover the exclusive benefits waiting for you as a JRM E-commerce member.'}
        </p>
      </div>

      {/* Membership Status */}
      <Card
        className={`${isMember ? 'bg-gradient-to-r from-green-50 to-blue-50 border-green-200' : 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200'}`}
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center ${isMember ? 'bg-green-500' : 'bg-blue-500'}`}
              >
                <Award className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {isMember ? 'Active Member' : 'Become a Member'}
                </h2>
                <p className="text-gray-600">
                  {isMember
                    ? 'You have access to all member benefits below'
                    : 'Spend RM80 or more to unlock membership automatically'}
                </p>
              </div>
            </div>

            {!isMember && (
              <Link href="/products">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                  Start Shopping
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Current Benefits */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {isMember ? 'Your Active Benefits' : 'Member Benefits'}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {memberBenefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          benefit.status === 'active'
                            ? 'bg-green-100'
                            : 'bg-blue-100'
                        }`}
                      >
                        <Icon
                          className={`h-5 w-5 ${
                            benefit.status === 'active'
                              ? 'text-green-600'
                              : 'text-blue-600'
                          }`}
                        />
                      </div>
                      <CardTitle className="text-lg">{benefit.title}</CardTitle>
                    </div>
                    <Badge className={getBadgeStyle(benefit.status)}>
                      {getBadgeText(benefit.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-3">{benefit.description}</p>
                  <p className="text-sm text-gray-500">{benefit.details}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Upcoming Features */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Coming Soon</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {upcomingFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <Icon className="h-5 w-5 text-yellow-600" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </div>
                  <Badge className={getBadgeStyle(feature.status)}>
                    {getBadgeText(feature.status)}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Member Promotions - Only show for active members */}
      {isMember && (
        <div>
          <MemberPromotions />
        </div>
      )}

      {/* How to Become a Member */}
      {!isMember && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              <CheckCircle className="mr-2 h-6 w-6 text-blue-600" />
              How to Become a Member
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <div>
                  <p className="font-semibold">Shop for RM80 or more</p>
                  <p className="text-sm text-gray-600">
                    Add items to your cart and checkout with a minimum order of
                    RM80
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <div>
                  <p className="font-semibold">Complete your purchase</p>
                  <p className="text-sm text-gray-600">
                    Successfully complete your payment and order
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  ✓
                </div>
                <div>
                  <p className="font-semibold">Membership activated!</p>
                  <p className="text-sm text-gray-600">
                    Your membership is automatically activated and all benefits
                    apply immediately
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-blue-200">
              <Link href="/products">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                  Start Shopping Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
