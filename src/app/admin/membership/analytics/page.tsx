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
import ContextualNavigation from '@/components/admin/ContextualNavigation';
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

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const breadcrumbItems = [
    {
      label: 'Membership',
      href: '/admin/membership',
      icon: Users as React.ComponentType<{ className?: string }>,
    },
    {
      label: 'Analytics',
      href: '/admin/membership/analytics',
      icon: BarChart3 as React.ComponentType<{ className?: string }>,
    },
  ];

  return (
    <div>
      <ContextualNavigation items={breadcrumbItems} />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-blue-600" />
              Member Analytics
            </h1>
            <p className="text-gray-600 mt-2">
              Comprehensive insights into membership program performance
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw
                className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
              />
              Refresh Data
            </Button>
            <Button
              onClick={handleExportData}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export Analytics
            </Button>
          </div>
        </div>

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
                      <p className="text-sm text-gray-600">
                        Member orders only
                      </p>
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
                      <p className="text-sm text-gray-600">
                        Total Savings Given
                      </p>
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
                      <p className="text-sm text-gray-600">
                        Visitors to members
                      </p>
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
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Member Growth Trend (Last 6 Months)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {stats.memberGrowthTrend.map((trend, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="font-medium">{trend.month}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-semibold text-lg">
                              {trend.newMembers}
                            </span>
                            <span className="text-sm text-gray-600 ml-1">
                              new members
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
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
      </div>
    </div>
  );
}
