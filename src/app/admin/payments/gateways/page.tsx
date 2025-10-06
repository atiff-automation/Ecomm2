'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Smartphone,
  Settings,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { AdminPageLayout, TabConfig, BreadcrumbItem } from '@/components/admin/layout';

interface Gateway {
  id: string;
  name: string;
  type: string;
  status: string;
  description: string;
  configPath: string;
  features: string[];
}

export default function PaymentGatewaysPage() {
  const { data: session, status } = useSession();
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [loading, setLoading] = useState(true);

  // Authentication check
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!session || !['ADMIN', 'SUPERADMIN', 'STAFF'].includes(session.user?.role || '')) {
    redirect('/auth/signin');
  }

  useEffect(() => {
    fetchGateways();
  }, []);

  const fetchGateways = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/payments/gateways?includeStats=false');
      if (response.ok) {
        const data = await response.json();
        setGateways(data.data?.gateways || []);
      }
    } catch (error) {
      console.error('Failed to fetch gateways:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'configured':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
      case 'configured':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <XCircle className="h-4 w-4" />;
    }
  };

  // Define contextual tabs
  const tabs: TabConfig[] = [
    { id: 'overview', label: 'Overview', href: '/admin/payments' },
    {
      id: 'gateways',
      label: 'Gateways',
      href: '/admin/payments/gateways',
    },
  ];

  // Define breadcrumbs
  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Payments', href: '/admin/payments', icon: Smartphone },
    { label: 'Gateways', href: '/admin/payments/gateways' },
  ];

  // Page actions
  const pageActions = (
    <Button variant="outline" onClick={fetchGateways}>
      <RefreshCw className="h-4 w-4 mr-2" />
      Refresh
    </Button>
  );

  return (
    <AdminPageLayout
      title="Payment Gateways"
      subtitle="Configure and manage payment processing options"
      actions={pageActions}
      tabs={tabs}
      breadcrumbs={breadcrumbs}
      loading={loading}
      parentSection={{ label: 'Payments', href: '/admin/payments' }}
      showBackButton={true}
    >
      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-32 bg-gray-200 rounded animate-pulse"
              ></div>
            ))}
          </div>
        ) : gateways.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No payment gateways configured</p>
            </CardContent>
          </Card>
        ) : (
          gateways.map(gateway => (
            <Card key={gateway.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-gray-100 rounded-lg">
                      <Smartphone className="h-8 w-8" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold">{gateway.name}</h3>
                        <Badge className={getStatusColor(gateway.status)}>
                          {getStatusIcon(gateway.status)}
                          <span className="ml-1 capitalize">
                            {gateway.status}
                          </span>
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {gateway.description}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {gateway.features.map((feature, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs"
                          >
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="default" size="sm" asChild>
                      <Link href={gateway.configPath}>
                        <Settings className="h-4 w-4 mr-2" />
                        Configure
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}

        {/* Future Gateways Placeholder */}
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              More payment gateways coming soon
            </p>
            <p className="text-xs text-muted-foreground">
              Stripe, PayPal, and other providers will be available in future updates
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminPageLayout>
  );
}
