'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminPageLayout, TabConfig, BreadcrumbItem, BREADCRUMB_CONFIGS } from '@/components/admin/layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Crown,
  Users,
  TrendingUp,
  DollarSign,
  Calendar,
  Settings,
  BarChart3,
  Gift,
  Star,
  Target,
} from 'lucide-react';
import Link from 'next/link';

interface MembershipStats {
  totalMembers: number;
  newMembersThisMonth: number;
  totalRevenue: number;
  averageOrderValue: number;
  memberConversionRate: number;
  retentionRate: number;
}

interface RecentMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  memberSince: string;
  totalSpent: number;
}

export default function AdminMembership() {
  const [stats, setStats] = useState<MembershipStats | null>(null);
  const [recentMembers, setRecentMembers] = useState<RecentMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMembershipData();
  }, []);

  const fetchMembershipData = async () => {
    setLoading(true);
    try {
      const [statsResponse, membersResponse] = await Promise.all([
        fetch('/api/admin/membership/stats'),
        fetch('/api/admin/membership/members?limit=10&recent=true'),
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
      console.error('Failed to fetch membership data:', error);
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

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Define breadcrumbs to show hierarchical location
  const breadcrumbs: BreadcrumbItem[] = [
    BREADCRUMB_CONFIGS.customers.main,
    BREADCRUMB_CONFIGS.customers.membership,
  ];

  // Define contextual tabs following ADMIN_LAYOUT_STANDARD.md for Customers (Membership section)
  const tabs: TabConfig[] = [
    { id: 'directory', label: 'Directory', href: '/admin/customers' },
    { id: 'membership', label: 'Membership', href: '/admin/membership' },
    { id: 'referrals', label: 'Referrals', href: '/admin/member-promotions' },
  ];

  // Extract page actions
  const pageActions = (
    <div className="flex gap-3">
      <Link href="/admin/membership/analytics">
        <Button variant="outline">
          <BarChart3 className="h-4 w-4 mr-2" />
          Analytics
        </Button>
      </Link>
      <Link href="/admin/membership/config">
        <Button>
          <Settings className="h-4 w-4 mr-2" />
          Configuration
        </Button>
      </Link>
    </div>
  );

  return (
    <AdminPageLayout
      title="Membership Management"
      subtitle="Manage your membership program and track member engagement"
      actions={pageActions}
      tabs={tabs}
      breadcrumbs={breadcrumbs}
      parentSection={{ label: 'Customers', href: '/admin/customers' }}
      loading={loading}
    >

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Members
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {stats?.totalMembers || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                +{stats?.newMembersThisMonth || 0} this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Member Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(stats?.totalRevenue || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Avg: {formatCurrency(stats?.averageOrderValue || 0)} per order
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Conversion Rate
              </CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatPercentage(stats?.memberConversionRate || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Retention: {formatPercentage(stats?.retentionRate || 0)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-purple-500" />
                Member Benefits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Manage membership benefits, discounts, and exclusive offers
              </p>
              <Link href="/admin/membership/config">
                <Button variant="outline" className="w-full">
                  Configure Benefits
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                Growth Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Track membership growth, engagement, and revenue trends
              </p>
              <Link href="/admin/membership/analytics">
                <Button variant="outline" className="w-full">
                  View Analytics
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-orange-500" />
                Member Engagement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                View member activity, loyalty points, and engagement metrics
              </p>
              <Link href="/admin/customers?membership=members">
                <Button variant="outline" className="w-full">
                  View Members
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Recent Members */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Recent New Members
            </CardTitle>
            <Link href="/admin/customers?membership=members">
              <Button variant="outline" size="sm">
                View All Members
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentMembers.length > 0 ? (
              <div className="space-y-4">
                {recentMembers.map(member => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                        <Crown className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {member.firstName} {member.lastName}
                        </p>
                        <p className="text-sm text-gray-600">{member.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-yellow-100 text-yellow-800 mb-1">
                        Member
                      </Badge>
                      <p className="text-sm text-gray-600">
                        Since{' '}
                        {new Date(member.memberSince).toLocaleDateString(
                          'en-MY'
                        )}
                      </p>
                      <p className="text-sm font-medium">
                        {formatCurrency(member.totalSpent)} spent
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Crown className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p>No members found</p>
                <p className="text-sm">New members will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Membership Program Overview */}
        <div className="mt-8 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Crown className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                JRM Membership Program
              </h3>
              <p className="text-gray-600 mb-4">
                Your membership program offers exclusive benefits including
                member pricing, early access to products, and special
                promotions. Members enjoy significant savings and premium
                shopping experiences.
              </p>
              <div className="flex gap-3">
                <Link href="/admin/membership/config">
                  <Button size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Manage Program
                  </Button>
                </Link>
                <Link href="/admin/membership/analytics">
                  <Button variant="outline" size="sm">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Reports
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
    </AdminPageLayout>
  );
}
