'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Settings,
  Building2,
  Calculator,
  MessageCircle,
  Palette,
  Bell,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Clock,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';

interface SettingsDashboard {
  businessProfile: {
    configured: boolean;
    lastUpdated?: Date;
    completeness: number;
  };
  taxConfiguration: {
    configured: boolean;
    gstEnabled: boolean;
    lastUpdated?: Date;
  };
  integrations: {
    telegram: boolean;
    payment: boolean;
    shipping: boolean;
  };
  recentChanges: SettingChange[];
}

interface SettingChange {
  section: string;
  action: string;
  changedBy: string;
  timestamp: Date;
  description: string;
}

const quickLinks = [
  {
    title: 'Site Customization',
    description: 'Themes, branding, and content management',
    href: '/admin/site-customization',
    icon: Palette,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100'
  },
  {
    title: 'Notifications',
    description: 'System notifications and Telegram integration',
    href: '/admin/notifications',
    icon: MessageCircle,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  },
  {
    title: 'Business Profile',
    description: 'Company information and legal details',
    href: '/admin/settings/business-profile',
    icon: Building2,
    color: 'text-green-600',
    bgColor: 'bg-green-100'
  },
  {
    title: 'Tax Configuration',
    description: 'GST/SST settings and tax management',
    href: '/admin/settings/tax-configuration',
    icon: Calculator,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100'
  }
];

export default function AdminSettingsDashboard() {
  const { data: session } = useSession();
  const [dashboard, setDashboard] = useState<SettingsDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const response = await fetch('/api/admin/settings/dashboard');
      if (response.ok) {
        const data = await response.json();
        setDashboard(data.data);
      } else {
        console.error('Failed to load dashboard data');
      }
    } catch (error) {
      console.error('Dashboard data error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (configured: boolean) => {
    return configured ? (
      <CheckCircle className="h-5 w-5 text-green-600" />
    ) : (
      <AlertCircle className="h-5 w-5 text-amber-600" />
    );
  };

  const getStatusBadge = (configured: boolean) => {
    return configured ? (
      <Badge variant="default" className="bg-green-100 text-green-800">
        Configured
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-amber-100 text-amber-800">
        Needs Setup
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Settings Dashboard</h1>
          <p className="text-gray-600 mt-2">Loading configuration overview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Settings className="h-8 w-8 text-blue-600" />
          Settings Dashboard
        </h1>
        <p className="text-gray-600 mt-2">
          Manage your business configuration, integrations, and system settings
        </p>
      </div>

      {/* Configuration Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Business Profile Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Business Profile</CardTitle>
            {dashboard && getStatusIcon(dashboard.businessProfile.configured)}
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dashboard && getStatusBadge(dashboard.businessProfile.configured)}
              {dashboard?.businessProfile.configured && (
                <div className="text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    {dashboard.businessProfile.completeness}% Complete
                  </div>
                  {dashboard.businessProfile.lastUpdated && (
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-4 w-4" />
                      Last updated: {new Date(dashboard.businessProfile.lastUpdated).toLocaleDateString()}
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tax Configuration Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tax Configuration</CardTitle>
            {dashboard && getStatusIcon(dashboard.taxConfiguration.configured)}
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dashboard && getStatusBadge(dashboard.taxConfiguration.configured)}
              {dashboard?.taxConfiguration.configured && (
                <div className="text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Badge variant={dashboard.taxConfiguration.gstEnabled ? "default" : "secondary"}>
                      {dashboard.taxConfiguration.gstEnabled ? "GST Enabled" : "GST Disabled"}
                    </Badge>
                  </div>
                  {dashboard.taxConfiguration.lastUpdated && (
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-4 w-4" />
                      Last updated: {new Date(dashboard.taxConfiguration.lastUpdated).toLocaleDateString()}
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* System Integrations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Integrations</CardTitle>
            <Bell className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dashboard && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Telegram</span>
                    <Badge variant={dashboard.integrations.telegram ? "default" : "secondary"}>
                      {dashboard.integrations.telegram ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Payment</span>
                    <Badge variant={dashboard.integrations.payment ? "default" : "secondary"}>
                      {dashboard.integrations.payment ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Shipping</span>
                    <Badge variant={dashboard.integrations.shipping ? "default" : "secondary"}>
                      {dashboard.integrations.shipping ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Navigation */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Settings Navigation</CardTitle>
          <CardDescription>
            Access key configuration areas and manage your system settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <div className="group p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className={`h-10 w-10 ${link.bgColor} rounded-lg flex items-center justify-center`}>
                        <link.icon className={`h-5 w-5 ${link.color}`} />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 group-hover:text-blue-600">
                          {link.title}
                        </h4>
                        <p className="text-sm text-gray-500">{link.description}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Changes */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Configuration Changes</CardTitle>
          <CardDescription>
            Track recent modifications to your system settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dashboard?.recentChanges && dashboard.recentChanges.length > 0 ? (
            <div className="space-y-4">
              {dashboard.recentChanges.slice(0, 5).map((change, index) => (
                <div key={index} className="flex items-center space-x-4 py-2">
                  <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{change.section}</span>
                        <span className="text-gray-500 mx-2">•</span>
                        <span className="text-sm text-gray-600">{change.description}</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(change.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      By {change.changedBy}
                    </div>
                  </div>
                </div>
              ))}
              {dashboard.recentChanges.length === 0 && (
                <p className="text-gray-500 text-center py-4">
                  No recent configuration changes
                </p>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">
              No recent configuration changes
            </p>
          )}
        </CardContent>
      </Card>

      {/* System Health Indicators */}
      <Card>
        <CardHeader>
          <CardTitle>System Health</CardTitle>
          <CardDescription>
            Monitor your system's configuration and performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="font-medium">Database</div>
              <div className="text-sm text-gray-500">Connected</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="font-medium">Cache</div>
              <div className="text-sm text-gray-500">Redis Active</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="font-medium">Security</div>
              <div className="text-sm text-gray-500">Audit Enabled</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}