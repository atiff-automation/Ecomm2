'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Truck,
  Package,
  MapPin,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

interface ShippingConfig {
  easyParcelStatus: {
    configured: boolean;
    sandbox: boolean;
    hasApiKey: boolean;
    hasApiSecret: boolean;
  };
  freeShippingThreshold: number;
  defaultCourier: string;
  enableInsurance: boolean;
  businessAddress: {
    name: string;
    phone: string;
    email: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    postalCode: string;
  };
  availableStates: Array<{
    code: string;
    name: string;
    zone: 'west' | 'east';
  }>;
  supportedCouriers: Array<{
    id: string;
    name: string;
  }>;
}

interface ShippingStats {
  shipped: number;
  delivered: number;
  deliveryRate: string;
  statusBreakdown: Array<{
    status: string;
    _count: number;
  }>;
}

export default function AdminShippingPage() {
  const { data: session, status } = useSession();
  const [config, setConfig] = useState<ShippingConfig | null>(null);
  const [stats, setStats] = useState<ShippingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    fetchShippingConfig();
  }, []);

  // Redirect if not admin
  if (status === 'loading') {
    return <div>Loading...</div>;
  }
  if (
    !session?.user ||
    (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN')
  ) {
    redirect('/auth/signin');
  }

  const fetchShippingConfig = async () => {
    try {
      const response = await fetch('/api/admin/shipping/config');
      if (!response.ok) {
        throw new Error('Failed to fetch shipping configuration');
      }

      const data = await response.json();
      setConfig(data.config);
      setStats(data.statistics);
    } catch (error) {
      console.error('Error fetching shipping config:', error);
      toast.error('Failed to load shipping configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async (updatedConfig: Partial<ShippingConfig>) => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/shipping/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedConfig),
      });

      if (!response.ok) {
        throw new Error('Failed to save configuration');
      }

      await response.json();
      toast.success('Shipping configuration updated successfully');

      // Refresh config
      await fetchShippingConfig();
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const response = await fetch('/api/admin/shipping/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'test_connection' }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(
          `EasyParcel connection successful! Found ${result.ratesReturned} shipping rates.`
        );
      } else {
        toast.error(`Connection failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      toast.error('Failed to test EasyParcel connection');
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p className="text-red-600">Failed to load shipping configuration</p>
          <Button onClick={fetchShippingConfig} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Shipping Management</h1>
          <p className="text-gray-600">
            Manage EasyParcel integration and shipping settings
          </p>
        </div>
        <Button onClick={fetchShippingConfig} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Service Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            EasyParcel Service Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="flex items-center gap-2">
              {config.easyParcelStatus.configured ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <span className="text-sm">
                {config.easyParcelStatus.configured
                  ? 'Configured'
                  : 'Not Configured'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {config.easyParcelStatus.hasApiKey ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <span className="text-sm">API Key</span>
            </div>
            <div className="flex items-center gap-2">
              {config.easyParcelStatus.hasApiSecret ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <span className="text-sm">API Secret</span>
            </div>
            <div className="flex items-center gap-2">
              {config.easyParcelStatus.sandbox ? (
                <AlertTriangle className="h-5 w-5 text-orange-500" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
              <span className="text-sm">
                {config.easyParcelStatus.sandbox
                  ? 'Sandbox Mode'
                  : 'Production Mode'}
              </span>
            </div>
          </div>

          <Button onClick={handleTestConnection} disabled={testing} size="sm">
            {testing ? 'Testing...' : 'Test Connection'}
          </Button>
        </CardContent>
      </Card>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Shipped Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.shipped}
              </div>
              <p className="text-sm text-gray-600">Last 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Delivered Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.delivered}
              </div>
              <p className="text-sm text-gray-600">Last 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Delivery Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {stats.deliveryRate}%
              </div>
              <p className="text-sm text-gray-600">Success rate</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">General Settings</TabsTrigger>
          <TabsTrigger value="business">Business Address</TabsTrigger>
          <TabsTrigger value="couriers">Supported Couriers</TabsTrigger>
          <TabsTrigger value="zones">Shipping Zones</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>General Shipping Settings</CardTitle>
              <CardDescription>
                Configure shipping thresholds and default options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="freeShippingThreshold">
                    Free Shipping Threshold (RM)
                  </Label>
                  <Input
                    id="freeShippingThreshold"
                    type="number"
                    value={config.freeShippingThreshold}
                    onChange={e =>
                      setConfig(prev =>
                        prev
                          ? {
                              ...prev,
                              freeShippingThreshold:
                                parseFloat(e.target.value) || 0,
                            }
                          : null
                      )
                    }
                    min="0"
                    step="0.01"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Orders above this amount get free shipping
                  </p>
                </div>

                <div>
                  <Label htmlFor="defaultCourier">Default Courier</Label>
                  <select
                    id="defaultCourier"
                    value={config.defaultCourier}
                    onChange={e =>
                      setConfig(prev =>
                        prev
                          ? {
                              ...prev,
                              defaultCourier: e.target.value,
                            }
                          : null
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select courier</option>
                    {config.supportedCouriers.map(courier => (
                      <option key={courier.id} value={courier.id}>
                        {courier.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="enableInsurance"
                  checked={config.enableInsurance}
                  onCheckedChange={checked =>
                    setConfig(prev =>
                      prev
                        ? {
                            ...prev,
                            enableInsurance: !!checked,
                          }
                        : null
                    )
                  }
                />
                <Label htmlFor="enableInsurance">
                  Enable insurance for all shipments
                </Label>
              </div>

              <Button
                onClick={() =>
                  handleSaveConfig({
                    freeShippingThreshold: config.freeShippingThreshold,
                    defaultCourier: config.defaultCourier,
                    enableInsurance: config.enableInsurance,
                  })
                }
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="business" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Business Pickup Address</CardTitle>
              <CardDescription>
                Address used for package pickup by couriers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    value={config.businessAddress.name}
                    onChange={e =>
                      setConfig(prev =>
                        prev
                          ? {
                              ...prev,
                              businessAddress: {
                                ...prev.businessAddress,
                                name: e.target.value,
                              },
                            }
                          : null
                      )
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="businessPhone">Phone Number</Label>
                  <Input
                    id="businessPhone"
                    value={config.businessAddress.phone}
                    onChange={e =>
                      setConfig(prev =>
                        prev
                          ? {
                              ...prev,
                              businessAddress: {
                                ...prev.businessAddress,
                                phone: e.target.value,
                              },
                            }
                          : null
                      )
                    }
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="businessEmail">Email</Label>
                  <Input
                    id="businessEmail"
                    type="email"
                    value={config.businessAddress.email}
                    onChange={e =>
                      setConfig(prev =>
                        prev
                          ? {
                              ...prev,
                              businessAddress: {
                                ...prev.businessAddress,
                                email: e.target.value,
                              },
                            }
                          : null
                      )
                    }
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="addressLine1">Address Line 1</Label>
                  <Input
                    id="addressLine1"
                    value={config.businessAddress.addressLine1}
                    onChange={e =>
                      setConfig(prev =>
                        prev
                          ? {
                              ...prev,
                              businessAddress: {
                                ...prev.businessAddress,
                                addressLine1: e.target.value,
                              },
                            }
                          : null
                      )
                    }
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="addressLine2">
                    Address Line 2 (Optional)
                  </Label>
                  <Input
                    id="addressLine2"
                    value={config.businessAddress.addressLine2}
                    onChange={e =>
                      setConfig(prev =>
                        prev
                          ? {
                              ...prev,
                              businessAddress: {
                                ...prev.businessAddress,
                                addressLine2: e.target.value,
                              },
                            }
                          : null
                      )
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={config.businessAddress.city}
                    onChange={e =>
                      setConfig(prev =>
                        prev
                          ? {
                              ...prev,
                              businessAddress: {
                                ...prev.businessAddress,
                                city: e.target.value,
                              },
                            }
                          : null
                      )
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="state">State</Label>
                  <select
                    id="state"
                    value={config.businessAddress.state}
                    onChange={e =>
                      setConfig(prev =>
                        prev
                          ? {
                              ...prev,
                              businessAddress: {
                                ...prev.businessAddress,
                                state: e.target.value,
                              },
                            }
                          : null
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select state</option>
                    {config.availableStates.map(state => (
                      <option key={state.code} value={state.code}>
                        {state.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    value={config.businessAddress.postalCode}
                    onChange={e =>
                      setConfig(prev =>
                        prev
                          ? {
                              ...prev,
                              businessAddress: {
                                ...prev.businessAddress,
                                postalCode: e.target.value,
                              },
                            }
                          : null
                      )
                    }
                  />
                </div>
              </div>

              <Button
                onClick={() =>
                  handleSaveConfig({
                    businessAddress: config.businessAddress,
                  })
                }
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Business Address'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="couriers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Supported Couriers</CardTitle>
              <CardDescription>
                Available courier services through EasyParcel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {config.supportedCouriers.map(courier => (
                  <div
                    key={courier.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <span className="font-medium">{courier.name}</span>
                    <Badge
                      variant={
                        config.defaultCourier === courier.id
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {config.defaultCourier === courier.id
                        ? 'Default'
                        : 'Available'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="zones" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Malaysian Shipping Zones</CardTitle>
              <CardDescription>
                Delivery zones and estimated shipping costs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-green-600 mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    West Malaysia (Lower Shipping Cost)
                  </h3>
                  <div className="space-y-2">
                    {config.availableStates
                      .filter(state => state.zone === 'west')
                      .map(state => (
                        <div
                          key={state.code}
                          className="flex justify-between items-center py-1 px-2 bg-green-50 rounded"
                        >
                          <span>{state.name}</span>
                          <Badge variant="outline">West</Badge>
                        </div>
                      ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-blue-600 mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    East Malaysia (Higher Shipping Cost)
                  </h3>
                  <div className="space-y-2">
                    {config.availableStates
                      .filter(state => state.zone === 'east')
                      .map(state => (
                        <div
                          key={state.code}
                          className="flex justify-between items-center py-1 px-2 bg-blue-50 rounded"
                        >
                          <span>{state.name}</span>
                          <Badge variant="outline">East</Badge>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
