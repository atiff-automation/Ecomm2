'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Crown,
  Users,
  Gift,
  Copy,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Calendar,
  Share2,
} from 'lucide-react';
import { SettingsLayout } from '@/components/settings';

/**
 * Membership Dashboard - Customer Settings Phase 2
 * Following @CLAUDE.md principles - systematic, DRY, single source of truth
 */

interface MembershipStatus {
  isMember: boolean;
  memberSince?: Date;
  membershipTotal: number;
  currentTier?: string;
  nextTierThreshold?: number;
}

interface ReferralData {
  referralCode: string;
  totalReferrals: number;
  pendingReferrals: number;
  completedReferrals: number;
  totalRewards: number;
  availableRewards: number;
  recentReferrals: Array<{
    id: string;
    referredEmail?: string;
    status: string;
    rewardAmount?: number;
    createdAt: Date;
  }>;
}

interface MemberBenefit {
  id: string;
  title: string;
  description: string;
  isActive: boolean;
  icon: string;
}

export default function MembershipPage() {
  const { data: session } = useSession();
  const [membershipStatus, setMembershipStatus] = useState<MembershipStatus | null>(null);
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [benefits, setBenefits] = useState<MemberBenefit[]>([]);
  const [loading, setLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      fetchMembershipData();
    }
  }, [session]);

  const fetchMembershipData = async () => {
    try {
      setLoading(true);
      
      // Parallel API calls for optimal performance
      const [membershipRes, referralRes, benefitsRes] = await Promise.all([
        fetch('/api/settings/membership/status'),
        fetch('/api/settings/membership/referrals'),
        fetch('/api/settings/membership/benefits'),
      ]);

      if (membershipRes.ok) {
        const membershipData = await membershipRes.json();
        setMembershipStatus(membershipData.data);
      }

      if (referralRes.ok) {
        const referralResult = await referralRes.json();
        setReferralData(referralResult.data);
      }

      if (benefitsRes.ok) {
        const benefitsResult = await benefitsRes.json();
        setBenefits(benefitsResult.data);
      }
    } catch (error) {
      console.error('Error fetching membership data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralCode = async () => {
    if (referralData?.referralCode) {
      try {
        await navigator.clipboard.writeText(referralData.referralCode);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (error) {
        console.error('Failed to copy referral code:', error);
      }
    }
  };

  const generateReferralLink = () => {
    if (referralData?.referralCode) {
      return `${window.location.origin}/auth/signup?ref=${referralData.referralCode}`;
    }
    return '';
  };

  const shareReferralLink = async () => {
    const referralLink = generateReferralLink();
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join JRM E-commerce',
          text: 'Join JRM E-commerce and get exclusive member benefits!',
          url: referralLink,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback to copying link
      await navigator.clipboard.writeText(referralLink);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  if (loading) {
    return (
      <SettingsLayout title="Membership" subtitle="Manage your membership status and referrals">
        <div className="space-y-6">
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-gray-200 rounded-lg"></div>
            <div className="h-48 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </SettingsLayout>
    );
  }

  return (
    <SettingsLayout title="Membership" subtitle="Manage your membership status and referrals">
      <div className="space-y-6">
        {/* Membership Status Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Crown className={`h-6 w-6 ${membershipStatus?.isMember ? 'text-yellow-500' : 'text-gray-400'}`} />
              <div>
                <CardTitle>Membership Status</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Your current membership tier and progress
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {membershipStatus?.isMember ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                      <Crown className="h-3 w-3 mr-1" />
                      Active Member
                    </Badge>
                    {membershipStatus.memberSince && (
                      <span className="text-sm text-muted-foreground">
                        Since {new Date(membershipStatus.memberSince).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-900">Total Spent</span>
                    </div>
                    <p className="text-2xl font-bold text-green-900">
                      RM {membershipStatus.membershipTotal.toFixed(2)}
                    </p>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Gift className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-900">Current Tier</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-900">
                      {membershipStatus.currentTier || 'Member'}
                    </p>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4 text-purple-600" />
                      <span className="font-medium text-purple-900">Member Benefits</span>
                    </div>
                    <p className="text-sm text-purple-700">Exclusive discounts & early access</p>
                  </div>
                </div>

                {membershipStatus.nextTierThreshold && (
                  <div className="bg-gray-50 rounded-lg p-4 border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Next Tier Progress</span>
                      <span className="text-sm text-muted-foreground">
                        RM {membershipStatus.membershipTotal.toFixed(2)} / RM {membershipStatus.nextTierThreshold}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${Math.min(
                            (membershipStatus.membershipTotal / membershipStatus.nextTierThreshold) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      RM {Math.max(membershipStatus.nextTierThreshold - membershipStatus.membershipTotal, 0).toFixed(2)} more to next tier
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Not a Member Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Spend RM 80 to unlock exclusive member benefits and discounts
                </p>
                <div className="bg-gray-50 rounded-lg p-4 border max-w-md mx-auto">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Progress to Membership</span>
                    <span className="text-sm text-muted-foreground">
                      RM {membershipStatus?.membershipTotal.toFixed(2) || '0.00'} / RM 80.00
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${Math.min(((membershipStatus?.membershipTotal || 0) / 80) * 100, 100)}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    RM {Math.max(80 - (membershipStatus?.membershipTotal || 0), 0).toFixed(2)} more to become a member
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs for Referrals and Benefits */}
        <Tabs defaultValue="referrals" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="referrals" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Referrals
            </TabsTrigger>
            <TabsTrigger value="benefits" className="flex items-center gap-2">
              <Gift className="h-4 w-4" />
              Benefits
            </TabsTrigger>
          </TabsList>

          <TabsContent value="referrals" className="space-y-6">
            {referralData && (
              <>
                {/* Referral Code Management */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Share2 className="h-5 w-5" />
                      Your Referral Code
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Share your code and earn rewards when friends join
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Label htmlFor="referralCode">Referral Code</Label>
                        <div className="flex gap-2 mt-1">
                          <Input
                            id="referralCode"
                            value={referralData.referralCode}
                            readOnly
                            className="font-mono"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={copyReferralCode}
                            className="shrink-0"
                          >
                            {copySuccess ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={shareReferralLink} className="flex-1">
                        <Share2 className="h-4 w-4 mr-2" />
                        Share Referral Link
                      </Button>
                    </div>

                    {copySuccess && (
                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                          Referral code copied to clipboard!
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>

                {/* Referral Statistics */}
                <Card>
                  <CardHeader>
                    <CardTitle>Referral Statistics</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Track your referral success and rewards
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="text-2xl font-bold text-blue-900">
                          {referralData.totalReferrals}
                        </div>
                        <div className="text-sm text-blue-700">Total Referrals</div>
                      </div>
                      <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <div className="text-2xl font-bold text-yellow-900">
                          {referralData.pendingReferrals}
                        </div>
                        <div className="text-sm text-yellow-700">Pending</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="text-2xl font-bold text-green-900">
                          {referralData.completedReferrals}
                        </div>
                        <div className="text-sm text-green-700">Completed</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <div className="text-2xl font-bold text-purple-900">
                          RM {referralData.totalRewards.toFixed(2)}
                        </div>
                        <div className="text-sm text-purple-700">Total Rewards</div>
                      </div>
                    </div>

                    {referralData.availableRewards > 0 && (
                      <Alert className="mt-4 border-green-200 bg-green-50">
                        <Gift className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">
                          You have RM {referralData.availableRewards.toFixed(2)} in available rewards!
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Referrals */}
                {referralData.recentReferrals.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Referrals</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {referralData.recentReferrals.map((referral) => (
                          <div
                            key={referral.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                          >
                            <div className="flex items-center gap-3">
                              <Users className="h-4 w-4 text-gray-500" />
                              <div>
                                <div className="font-medium">
                                  {referral.referredEmail || 'Referral'}
                                </div>
                                <div className="text-sm text-muted-foreground flex items-center gap-2">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(referral.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {referral.rewardAmount && (
                                <span className="text-sm font-medium text-green-600">
                                  +RM {referral.rewardAmount.toFixed(2)}
                                </span>
                              )}
                              <Badge
                                variant={referral.status === 'COMPLETED' ? 'default' : 'secondary'}
                                className={
                                  referral.status === 'COMPLETED'
                                    ? 'bg-green-100 text-green-800 border-green-200'
                                    : ''
                                }
                              >
                                {referral.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="benefits" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  Member Benefits
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {membershipStatus?.isMember
                    ? 'Enjoy these exclusive benefits as a member'
                    : 'Benefits you\'ll unlock when you become a member'}
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {benefits.length > 0 ? (
                    benefits.map((benefit) => (
                      <div
                        key={benefit.id}
                        className={`p-4 rounded-lg border ${
                          benefit.isActive && membershipStatus?.isMember
                            ? 'bg-green-50 border-green-200'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="text-2xl">{benefit.icon}</div>
                          <div>
                            <h3 className="font-semibold mb-1">{benefit.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {benefit.description}
                            </p>
                            {benefit.isActive && membershipStatus?.isMember && (
                              <Badge variant="default" className="mt-2 bg-green-100 text-green-800 border-green-200">
                                Active
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-8">
                      <Gift className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        Member benefits information will be available soon
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </SettingsLayout>
  );
}