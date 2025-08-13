/**
 * Member Referrals Page - Malaysian E-commerce Platform
 * Member dashboard for referral tracking and management
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Gift,
  Users,
  TrendingUp,
  Copy,
  Share2,
  UserPlus,
  Star,
  Clock,
  CheckCircle,
  Mail,
  DollarSign,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';

interface ReferralMetrics {
  totalReferrals: number;
  successfulReferrals: number;
  pendingReferrals: number;
  totalRewards: number;
  conversionRate: number;
}

interface ReferralData {
  id: string;
  referralCode: string;
  referredEmail: string;
  status: string;
  referralDate: string;
  registeredDate?: string;
  firstOrderDate?: string;
  firstOrderAmount?: number;
  referred?: {
    name: string;
    email: string;
  };
}

interface ReferralReward {
  id: string;
  rewardType: string;
  rewardAmount: number;
  status: string;
  description: string;
  createdAt: string;
  expiresAt?: string;
}

export default function MemberReferralsPage() {
  const [metrics, setMetrics] = useState<ReferralMetrics | null>(null);
  const [referralCode, setReferralCode] = useState<string>('');
  const [referralUrl, setReferralUrl] = useState<string>('');
  const [referrals, setReferrals] = useState<ReferralData[]>([]);
  const [rewards, setRewards] = useState<ReferralReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [newReferralEmail, setNewReferralEmail] = useState('');
  const [sendingReferral, setSendingReferral] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    try {
      const [overviewResponse, historyResponse, rewardsResponse] =
        await Promise.all([
          fetch('/api/member/referrals?type=overview'),
          fetch('/api/member/referrals?type=history&limit=10'),
          fetch('/api/member/referrals/rewards'),
        ]);

      if (overviewResponse.ok) {
        const overviewData = await overviewResponse.json();
        setMetrics(overviewData.metrics);
        setReferralCode(overviewData.referralCode);
        setReferralUrl(overviewData.referralUrl);
      }

      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        setReferrals(historyData.referrals);
      }

      if (rewardsResponse.ok) {
        const rewardsData = await rewardsResponse.json();
        setRewards(rewardsData.rewards);
      }
    } catch (error) {
      console.error('Failed to fetch referral data:', error);
      toast.error('Failed to load referral data');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyReferralUrl = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      toast.success('Referral link copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy referral link');
    }
  };

  const handleShareReferral = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join our amazing shopping community!',
          text: 'I found this great shopping platform with exclusive member benefits. Join using my referral link and get special welcome rewards!',
          url: referralUrl,
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      handleCopyReferralUrl();
    }
  };

  const handleSendReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReferralEmail) {
      return;
    }

    setSendingReferral(true);
    try {
      const response = await fetch('/api/member/referrals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: newReferralEmail,
        }),
      });

      if (response.ok) {
        toast.success('Referral invitation sent successfully!');
        setNewReferralEmail('');
        fetchReferralData();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to send referral');
      }
    } catch (error) {
      toast.error('Failed to send referral invitation');
    } finally {
      setSendingReferral(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'REGISTERED':
        return 'bg-blue-100 text-blue-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-MY');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Referral Program</h1>
        <p className="text-muted-foreground">
          Share the love and earn rewards by inviting your friends!
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="flex border-b">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'invite', label: 'Invite Friends' },
            { id: 'history', label: 'Referral History' },
            { id: 'rewards', label: 'My Rewards' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && metrics && (
        <div className="space-y-6">
          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Referrals
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.totalReferrals}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Successful
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {metrics.successfulReferrals}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Conversion Rate
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.conversionRate.toFixed(1)}%
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Rewards
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatPrice(metrics.totalRewards)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Referral Link Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="w-5 h-5" />
                Your Referral Link
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium">Referral Code</label>
                  <div className="font-mono text-lg font-bold text-primary">
                    {referralCode}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Input
                  value={referralUrl}
                  readOnly
                  className="flex-1 font-mono text-sm"
                />
                <Button onClick={handleCopyReferralUrl} variant="outline">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
                <Button onClick={handleShareReferral}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Invite Tab */}
      {activeTab === 'invite' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Invite a Friend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendReferral} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Friend's Email Address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={newReferralEmail}
                    onChange={e => setNewReferralEmail(e.target.value)}
                    placeholder="Enter your friend's email"
                    required
                  />
                </div>

                <Button type="submit" disabled={sendingReferral}>
                  {sendingReferral ? 'Sending...' : 'Send Invitation'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Mail className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold mb-2">1. Invite</h3>
                  <p className="text-sm text-muted-foreground">
                    Send your referral link to friends and family
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <UserPlus className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold mb-2">2. They Join</h3>
                  <p className="text-sm text-muted-foreground">
                    Your friends register and make their first purchase
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Gift className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold mb-2">3. Get Rewards</h3>
                  <p className="text-sm text-muted-foreground">
                    Both you and your friend receive special rewards
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <Card>
          <CardHeader>
            <CardTitle>Referral History</CardTitle>
          </CardHeader>
          <CardContent>
            {referrals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No referrals yet. Start inviting your friends!</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Friend</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Invited Date</TableHead>
                    <TableHead>First Order</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referrals.map(referral => (
                    <TableRow key={referral.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {referral.referred?.name || 'Pending Registration'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {referral.referredEmail}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(referral.status)}>
                          {referral.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(referral.referralDate)}</TableCell>
                      <TableCell>
                        {referral.firstOrderDate ? (
                          <div>
                            <div className="text-sm">
                              {formatDate(referral.firstOrderDate)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatPrice(referral.firstOrderAmount || 0)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Rewards Tab */}
      {activeTab === 'rewards' && (
        <Card>
          <CardHeader>
            <CardTitle>My Rewards</CardTitle>
          </CardHeader>
          <CardContent>
            {rewards.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Gift className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No rewards yet. Start referring friends to earn rewards!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {rewards.map(reward => (
                  <div
                    key={reward.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{reward.description}</div>
                      <div className="text-sm text-muted-foreground">
                        {reward.rewardType} • {formatDate(reward.createdAt)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">
                        {formatPrice(reward.rewardAmount)}
                      </div>
                      <Badge className={getStatusColor(reward.status)}>
                        {reward.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
