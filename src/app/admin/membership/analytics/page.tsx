/**
 * Admin Member Analytics Dashboard - Malaysian E-commerce Platform
 * Comprehensive analytics and insights for membership program
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  TrendingUp,
  Award,
  DollarSign,
  Target,
  Calendar,
  BarChart3,
  PieChart,
  Download,
  RefreshCw,
  // Settings, // Not currently used
} from 'lucide-react';
import { AdminPageLayout, TabConfig } from '@/components/admin/layout';

interface MemberStats {
  totalMembers: number;
  newMembersThisMonth: number;
  averageOrderValue: number;
  totalSavingsGiven: number;
  conversionRate: number;
  memberOrdersThisMonth: number;
  topCategories: Array<{
    categoryName: string;
    quantity: number;
  }>;
  memberGrowthTrend: Array<{
    month: string;
    newMembers: number;
  }>;
  insights: {
    avgSavingsPerMember: number;
    avgOrdersPerMember: number;
    totalMemberOrders: number;
  };
}

interface MemberDetails {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  memberSince: string;
  totalOrders: number;
  totalSpent: number;
  totalSavings: number;
  favoriteCategory: string;
}

export default function MemberAnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [stats, setStats] = useState<MemberStats | null>(null);
  const [recentMembers, setRecentMembers] = useState<MemberDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<
    '3M' | '6M' | '1Y' | 'ALL'
  >('6M');
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  useEffect(() => {
    if (status === 'loading') {
      return;
    }

    if (!session?.user) {
      router.push('/auth/signin?callbackUrl=/admin/membership/analytics');
      return;
    }

    if (session.user.role !== 'ADMIN') {
      router.push('/');
      return;
    }

    fetchData();
  }, [session, status, router]);

  const fetchData = async () => {
    try {
      const [statsResponse, membersResponse] = await Promise.all([
        fetch('/api/admin/membership/stats'),
        fetch('/api/admin/membership/members?limit=10&sort=recent'),
      ]);

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.stats);
      }

      if (membersResponse.ok) {
        const membersData = await membersResponse.json();
        setRecentMembers(membersData.members);
      }
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleExportData = async () => {
    try {
      const response = await fetch('/api/admin/membership/export');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `membership-analytics-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to export data:', error);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-MY', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(dateString));
  };

  // Helper function to filter growth data based on selected period
  const getFilteredGrowthData = () => {
    if (!stats?.memberGrowthTrend) {
      return [];
    }

    const data = [...stats.memberGrowthTrend];
    const monthsToShow =
      selectedPeriod === '3M'
        ? 3
        : selectedPeriod === '6M'
          ? 6
          : selectedPeriod === '1Y'
            ? 12
            : data.length;

    return data.slice(-monthsToShow);
  };

  // Helper function to calculate growth rate
  const calculateGrowthRate = (current: number, previous: number) => {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }
    return ((current - previous) / previous) * 100;
  };

  // Helper function to get growth insights
  const getGrowthInsights = () => {
    const data = getFilteredGrowthData();
    if (data.length < 2) {
      return { trend: 'stable', totalGrowth: 0, avgGrowth: 0 };
    }

    const totalCurrent = data[data.length - 1]?.newMembers || 0;
    const totalPrevious = data[data.length - 2]?.newMembers || 0;
    const totalGrowth = calculateGrowthRate(totalCurrent, totalPrevious);

    let positiveMonths = 0;
    let totalChange = 0;

    for (let i = 1; i < data.length; i++) {
      const change = calculateGrowthRate(
        data[i].newMembers,
        data[i - 1].newMembers
      );
      totalChange += change;
      if (change > 0) {
        positiveMonths++;
      }
    }

    const avgGrowth = totalChange / (data.length - 1);
    const trend =
      avgGrowth > 10 ? 'growing' : avgGrowth < -10 ? 'declining' : 'stable';

    return { trend, totalGrowth, avgGrowth };
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Define contextual tabs following ADMIN_LAYOUT_STANDARD.md - Customers section
  const tabs: TabConfig[] = [
    { id: 'directory', label: 'Directory', href: '/admin/customers' },
    { id: 'membership', label: 'Membership', href: '/admin/membership' },
    { id: 'analytics', label: 'Analytics', href: '/admin/membership/analytics' },
    { id: 'referrals', label: 'Referrals', href: '/admin/member-promotions' },
  ];

  // Extract page actions
  const pageActions = (
    <div className="flex gap-2">
      <Button
        variant="outline"
        onClick={handleRefresh}
        disabled={refreshing}
        size="sm"
      >
        <RefreshCw
          className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
        />
        Refresh Data
      </Button>
      <Button
        onClick={handleExportData}
        size="sm"
      >
        <Download className="w-4 h-4 mr-2" />
        Export
      </Button>
    </div>
  );

  return (
    <AdminPageLayout
      title="Member Analytics"
      subtitle="Comprehensive insights into membership program performance"
      actions={pageActions}
      tabs={tabs}
      loading={loading}
    >

      {stats && (
        <>
          {/* Key Metrics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Members</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.totalMembers.toLocaleString()}
                    </p>
                    <p className="text-sm text-green-600">
                      +{stats.newMembersThisMonth} this month
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Avg Order Value</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatPrice(stats.averageOrderValue)}
                    </p>
                    <p className="text-sm text-gray-600">Member orders only</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Award className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Savings Given</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatPrice(stats.totalSavingsGiven)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatPrice(stats.insights.avgSavingsPerMember)} per
                      member
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Target className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Conversion Rate</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {(stats.conversionRate * 100).toFixed(1)}%
                    </p>
                    <p className="text-sm text-gray-600">Visitors to members</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Analytics Tabs */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="growth">Growth Trends</TabsTrigger>
              <TabsTrigger value="behavior">Member Behavior</TabsTrigger>
              <TabsTrigger value="members">Recent Members</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="w-5 h-5" />
                      Top Categories
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {stats.topCategories.map((category, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-3 h-3 rounded-full bg-${['blue', 'green', 'purple', 'orange', 'red'][index % 5]}-500`}
                            ></div>
                            <span className="font-medium">
                              {category.categoryName}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-semibold">
                              {category.quantity}
                            </span>
                            <span className="text-sm text-gray-600 ml-1">
                              orders
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Key Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div>
                        <p className="font-semibold text-blue-900">
                          Average Orders per Member
                        </p>
                        <p className="text-sm text-blue-700">
                          Member engagement metric
                        </p>
                      </div>
                      <span className="text-2xl font-bold text-blue-600">
                        {stats.insights.avgOrdersPerMember.toFixed(1)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div>
                        <p className="font-semibold text-green-900">
                          Total Member Orders
                        </p>
                        <p className="text-sm text-green-700">
                          All-time completed orders
                        </p>
                      </div>
                      <span className="text-2xl font-bold text-green-600">
                        {stats.insights.totalMemberOrders.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <div>
                        <p className="font-semibold text-purple-900">
                          Orders This Month
                        </p>
                        <p className="text-sm text-purple-700">
                          Current month activity
                        </p>
                      </div>
                      <span className="text-2xl font-bold text-purple-600">
                        {stats.memberOrdersThisMonth}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Growth Trends Tab */}
            <TabsContent value="growth" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Member Growth Trend
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {['3M', '6M', '1Y', 'ALL'].map(period => (
                        <Button
                          key={period}
                          variant={
                            selectedPeriod === period ? 'default' : 'outline'
                          }
                          size="sm"
                          onClick={() => setSelectedPeriod(period as any)}
                          className="text-xs"
                        >
                          {period}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const filteredData = getFilteredGrowthData();
                    const insights = getGrowthInsights();
                    const maxValue = Math.max(
                      ...filteredData.map(d => d.newMembers)
                    );

                    return (
                      <div className="space-y-6">
                        {/* Growth Insights */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100">
                            <CardContent className="pt-6 text-center">
                              <Badge
                                variant={
                                  insights.trend === 'growing'
                                    ? 'default'
                                    : insights.trend === 'declining'
                                      ? 'destructive'
                                      : 'secondary'
                                }
                                className="mb-2"
                              >
                                {insights.trend === 'growing'
                                  ? '📈'
                                  : insights.trend === 'declining'
                                    ? '📉'
                                    : '➡️'}
                                {insights.trend.charAt(0).toUpperCase() +
                                  insights.trend.slice(1)}{' '}
                                Trend
                              </Badge>
                              <div className="mt-2">
                                <p className="text-xs text-muted-foreground">
                                  Overall Direction
                                </p>
                              </div>
                            </CardContent>
                          </Card>

                          <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-emerald-100">
                            <CardContent className="pt-6 text-center">
                              <p className="text-xs text-muted-foreground mb-1">
                                Month-over-Month
                              </p>
                              <p
                                className={`text-2xl font-bold ${insights.totalGrowth >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
                              >
                                {insights.totalGrowth >= 0 ? '+' : ''}
                                {insights.totalGrowth.toFixed(1)}%
                              </p>
                              <Progress
                                value={Math.min(
                                  Math.abs(insights.totalGrowth),
                                  100
                                )}
                                className="mt-3 h-2"
                              />
                            </CardContent>
                          </Card>

                          <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100">
                            <CardContent className="pt-6 text-center">
                              <p className="text-xs text-muted-foreground mb-1">
                                Average Growth
                              </p>
                              <p
                                className={`text-2xl font-bold ${insights.avgGrowth >= 0 ? 'text-purple-600' : 'text-red-600'}`}
                              >
                                {insights.avgGrowth >= 0 ? '+' : ''}
                                {insights.avgGrowth.toFixed(1)}%
                              </p>
                              <Progress
                                value={Math.min(
                                  Math.abs(insights.avgGrowth),
                                  100
                                )}
                                className="mt-3 h-2"
                              />
                            </CardContent>
                          </Card>
                        </div>

                        <Separator />

                        {/* Interactive Chart */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                              <BarChart3 className="h-4 w-4" />
                              Visual Trend Analysis
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {/* Chart Container */}
                            <div className="relative p-4 bg-muted/30 rounded-lg">
                              <div className="h-48 flex items-end justify-between gap-1">
                                {filteredData.map((item, index) => {
                                  const height =
                                    maxValue > 0
                                      ? (item.newMembers / maxValue) * 160
                                      : 16;
                                  const previousValue =
                                    index > 0
                                      ? filteredData[index - 1].newMembers
                                      : item.newMembers;
                                  const growthRate = calculateGrowthRate(
                                    item.newMembers,
                                    previousValue
                                  );

                                  return (
                                    <div
                                      key={index}
                                      className="flex-1 flex flex-col items-center relative group"
                                    >
                                      {/* Tooltip */}
                                      {hoveredPoint === index && (
                                        <Alert className="absolute bottom-full mb-2 z-20 min-w-40 shadow-lg">
                                          <AlertDescription className="text-center p-1">
                                            <div className="font-semibold">
                                              {item.month}
                                            </div>
                                            <div className="text-lg font-bold text-primary">
                                              {item.newMembers}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                              new members
                                            </div>
                                            {index > 0 && (
                                              <Badge
                                                size="sm"
                                                variant={
                                                  growthRate >= 0
                                                    ? 'default'
                                                    : 'destructive'
                                                }
                                                className="mt-1"
                                              >
                                                {growthRate >= 0 ? '+' : ''}
                                                {growthRate.toFixed(1)}%
                                              </Badge>
                                            )}
                                          </AlertDescription>
                                        </Alert>
                                      )}

                                      {/* Bar */}
                                      <div
                                        className={`w-full max-w-8 rounded-t-md cursor-pointer transition-all ${
                                          hoveredPoint === index
                                            ? 'bg-primary shadow-lg scale-110'
                                            : 'bg-primary/70 hover:bg-primary hover:scale-105'
                                        }`}
                                        style={{
                                          height: `${height}px`,
                                          minHeight: '8px',
                                        }}
                                        onMouseEnter={() =>
                                          setHoveredPoint(index)
                                        }
                                        onMouseLeave={() =>
                                          setHoveredPoint(null)
                                        }
                                      />

                                      {/* Labels */}
                                      <div className="mt-2 text-center space-y-1">
                                        <div className="text-xs font-medium">
                                          {item.newMembers}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          {item.month}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Separator className="my-6" />

                        {/* Detailed Breakdown */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <h4 className="text-lg font-semibold text-foreground">
                              Detailed Breakdown
                            </h4>
                            <Badge variant="outline" className="text-xs">
                              {selectedPeriod} Period
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredData.map((item, index) => {
                              const previousValue =
                                index > 0
                                  ? filteredData[index - 1].newMembers
                                  : item.newMembers;
                              const growthRate =
                                index > 0
                                  ? calculateGrowthRate(
                                      item.newMembers,
                                      previousValue
                                    )
                                  : 0;

                              return (
                                <Card
                                  key={index}
                                  className="hover:shadow-md transition-all duration-200 hover:scale-[1.02]"
                                >
                                  <CardContent className="pt-4">
                                    <div className="flex items-center justify-between mb-3">
                                      <span className="font-medium text-foreground">
                                        {item.month}
                                      </span>
                                      {index > 0 && (
                                        <Badge
                                          variant={
                                            growthRate >= 0
                                              ? 'default'
                                              : 'destructive'
                                          }
                                          className="text-xs"
                                        >
                                          {growthRate >= 0 ? '+' : ''}
                                          {growthRate.toFixed(1)}%
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="space-y-2">
                                      <p className="text-3xl font-bold text-primary">
                                        {item.newMembers}
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        new members
                                      </p>
                                      <Progress
                                        value={
                                          (item.newMembers / maxValue) * 100
                                        }
                                        className="h-2 mt-3"
                                      />
                                    </div>
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Member Behavior Tab */}
            <TabsContent value="behavior" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Purchase Behavior</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                      <p className="text-sm text-gray-600">
                        Average Order Value
                      </p>
                      <p className="text-2xl font-bold text-blue-600">
                        {formatPrice(stats.averageOrderValue)}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
                      <p className="text-sm text-gray-600">
                        Avg Orders per Member
                      </p>
                      <p className="text-2xl font-bold text-green-600">
                        {stats.insights.avgOrdersPerMember.toFixed(1)}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Savings Impact</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-orange-50 rounded-lg">
                      <p className="text-sm text-gray-600">
                        Total Savings Given
                      </p>
                      <p className="text-2xl font-bold text-purple-600">
                        {formatPrice(stats.totalSavingsGiven)}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg">
                      <p className="text-sm text-gray-600">Avg per Member</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {formatPrice(stats.insights.avgSavingsPerMember)}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Conversion</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg">
                      <p className="text-sm text-gray-600">Conversion Rate</p>
                      <p className="text-2xl font-bold text-indigo-600">
                        {(stats.conversionRate * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg">
                      <p className="text-sm text-gray-600">New This Month</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {stats.newMembersThisMonth}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Recent Members Tab */}
            <TabsContent value="members" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Recently Joined Members
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {recentMembers.length > 0 ? (
                    <div className="space-y-4">
                      {recentMembers.map(member => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                                <span className="text-white font-semibold">
                                  {member.firstName.charAt(0)}
                                  {member.lastName.charAt(0)}
                                </span>
                              </div>
                              <div>
                                <p className="font-semibold">
                                  {member.firstName} {member.lastName}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {member.email}
                                </p>
                              </div>
                              <Badge className="bg-green-600 text-white">
                                Member since {formatDate(member.memberSince)}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right space-y-1">
                            <div className="text-sm text-gray-600">
                              {member.totalOrders} orders •{' '}
                              {formatPrice(member.totalSpent)} spent
                            </div>
                            <div className="text-sm font-medium text-green-600">
                              {formatPrice(member.totalSavings)} saved
                            </div>
                            <div className="text-xs text-gray-500">
                              Favorite: {member.favoriteCategory || 'N/A'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600">No recent members found</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </AdminPageLayout>
  );
}
