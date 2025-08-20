/**
 * Unified Admin Shipping Management Page
 * Combines dashboard, monitoring, and configuration in one interface
 * Follows proper architecture with businessShippingConfig service integration
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Truck,
  Package,
  MapPin,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Settings,
  Shield,
  Clock,
  Save,
  TestTube,
  Info,
  Star,
  Activity,
  TrendingUp,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

// Import our proper types from business configuration
import type { 
  BusinessProfile, 
  CourierPreference 
} from '@/lib/config/business-shipping-config';

interface ShippingStats {
  shipped: number;
  delivered: number;
  deliveryRate: string;
  statusBreakdown: Array<{
    status: string;
    _count: number;
  }>;
}

interface APIConnectionStatus {
  configured: boolean;
  apiConnected: boolean;
  lastCheck: string;
  responseTime?: number;
  errorCount: number;
}

interface BalanceInfo {
  current: number;
  currency: string;
  lastUpdated: string;
  status: 'sufficient' | 'low' | 'critical';
  threshold: {
    low: number;
    critical: number;
  };
  cacheInfo: {
    cached: boolean;
    age: number;
  };
}

interface ShippingDashboardData {
  profile: BusinessProfile;
  courierPreferences: CourierPreference[];
  statistics: ShippingStats;
  apiStatus: APIConnectionStatus;
  configured: boolean;
  balance?: BalanceInfo;
}

export default function UnifiedShippingAdminPage() {
  const { data: session, status } = useSession();
  const [dashboardData, setDashboardData] = useState<ShippingDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Authentication check
  if (status === 'loading') {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>;
  }

  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN')) {
    redirect('/auth/signin');
  }

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load shipping config and balance data in parallel
      const [configResponse, balanceResponse] = await Promise.all([
        fetch('/api/admin/shipping/config', {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        }),
        fetch('/api/admin/shipping/balance', {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        }).catch(err => {
          console.warn('Balance API not available:', err);
          return null;
        })
      ]);

      if (!configResponse.ok) {
        throw new Error(`HTTP ${configResponse.status}: ${configResponse.statusText}`);
      }

      const configData = await configResponse.json();
      const balanceData = balanceResponse?.ok ? await balanceResponse.json() : null;
      
      // Transform API response to our unified dashboard format
      const dashboardData: ShippingDashboardData = {
        profile: configData.profile,
        courierPreferences: configData.courierPreferences || [],
        statistics: configData.statistics,
        apiStatus: {
          configured: configData.apiStatus?.apiConfigured || false,
          apiConnected: configData.apiStatus?.hasApiKey && configData.apiStatus?.hasApiSecret || false,
          lastCheck: new Date().toISOString(),
          errorCount: 0
        },
        configured: configData.configured || false,
        balance: balanceData?.balance || null
      };

      setDashboardData(dashboardData);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load shipping configuration');
    } finally {
      setLoading(false);
    }
  };

  const saveConfiguration = async (updatedData: Partial<BusinessProfile>) => {
    if (!dashboardData) return;
    
    setSaving(true);
    try {
      const response = await fetch('/api/admin/shipping/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save configuration');
      }

      const result = await response.json();
      toast.success('Configuration updated successfully');
      
      // Reload dashboard data
      await loadDashboardData();
      
    } catch (error) {
      console.error('Save error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const testEasyParcelConnection = async () => {
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
        toast.success(`EasyParcel connection successful! Found ${result.ratesReturned} shipping rates.`);
        
        // Update API status
        if (dashboardData) {
          setDashboardData({
            ...dashboardData,
            apiStatus: {
              ...dashboardData.apiStatus,
              apiConnected: true,
              lastCheck: new Date().toISOString(),
              responseTime: result.responseTime,
              errorCount: 0
            }
          });
        }
      } else {
        throw new Error(result.error || 'Connection test failed');
      }
    } catch (error) {
      console.error('Test connection error:', error);
      toast.error(`Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Update API status with error
      if (dashboardData) {
        setDashboardData({
          ...dashboardData,
          apiStatus: {
            ...dashboardData.apiStatus,
            apiConnected: false,
            lastCheck: new Date().toISOString(),
            errorCount: dashboardData.apiStatus.errorCount + 1
          }
        });
      }
    } finally {
      setTesting(false);
    }
  };

  const refreshBalance = async () => {
    try {
      const response = await fetch('/api/admin/shipping/balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'refresh' })
      });

      if (response.ok) {
        const result = await response.json();
        if (dashboardData) {
          setDashboardData({
            ...dashboardData,
            balance: result.balance
          });
        }
        toast.success('Balance refreshed successfully');
      } else {
        throw new Error('Failed to refresh balance');
      }
    } catch (error) {
      console.error('Balance refresh error:', error);
      toast.error('Failed to refresh balance');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3">Loading shipping management...</span>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">Failed to load shipping configuration</p>
          <Button onClick={loadDashboardData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Truck className="h-8 w-8" />
            Shipping Management
          </h1>
          <p className="text-gray-600">
            Complete shipping configuration and monitoring dashboard
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={testEasyParcelConnection}
            disabled={testing}
          >
            <TestTube className="h-4 w-4 mr-2" />
            {testing ? 'Testing...' : 'Test API'}
          </Button>
          <Button onClick={loadDashboardData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="business">Business Profile</TabsTrigger>
          <TabsTrigger value="couriers">Courier Management</TabsTrigger>
          <TabsTrigger value="policies">Shipping Policies</TabsTrigger>
          <TabsTrigger value="services">Additional Services</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab 
            dashboardData={dashboardData} 
            onRefresh={loadDashboardData}
            onRefreshBalance={refreshBalance}
          />
        </TabsContent>

        <TabsContent value="business">
          <BusinessProfileTab 
            profile={dashboardData.profile}
            onSave={saveConfiguration}
            saving={saving}
          />
        </TabsContent>

        <TabsContent value="couriers">
          <CourierManagementTab 
            profile={dashboardData.profile}
            courierPreferences={dashboardData.courierPreferences}
            onSave={saveConfiguration}
            saving={saving}
          />
        </TabsContent>

        <TabsContent value="policies">
          <ShippingPoliciesTab 
            profile={dashboardData.profile}
            onSave={saveConfiguration}
            saving={saving}
          />
        </TabsContent>

        <TabsContent value="services">
          <AdditionalServicesTab 
            profile={dashboardData.profile}
            onSave={saveConfiguration}
            saving={saving}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Overview Tab Component
function OverviewTab({ 
  dashboardData, 
  onRefresh,
  onRefreshBalance 
}: { 
  dashboardData: ShippingDashboardData;
  onRefresh: () => void;
  onRefreshBalance: () => void;
}) {
  return (
    <div className="space-y-6">
      {/* Balance Alert */}
      {dashboardData.balance && dashboardData.balance.status !== 'sufficient' && (
        <Alert className={dashboardData.balance.status === 'critical' ? 'border-red-500 bg-red-50' : 'border-yellow-500 bg-yellow-50'}>
          <AlertTriangle className={`h-4 w-4 ${dashboardData.balance.status === 'critical' ? 'text-red-500' : 'text-yellow-500'}`} />
          <AlertDescription>
            <strong>{dashboardData.balance.status === 'critical' ? 'Critical:' : 'Warning:'}</strong>
            {' '}EasyParcel balance is {dashboardData.balance.status} (RM {dashboardData.balance.current}).
            {dashboardData.balance.status === 'critical' && ' You may not be able to create shipping labels.'}
            {' '}
            <a 
              href="https://connect.easyparcel.my/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline font-medium"
            >
              Top up now
            </a>
          </AlertDescription>
        </Alert>
      )}

      {/* EasyParcel Balance Card */}
      {dashboardData.balance && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              EasyParcel Account Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-3xl font-bold">
                  <span className={`${
                    dashboardData.balance.status === 'critical' ? 'text-red-600' :
                    dashboardData.balance.status === 'low' ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {dashboardData.balance.currency} {dashboardData.balance.current.toFixed(2)}
                  </span>
                </div>
                <div className="space-y-1">
                  <Badge 
                    variant={
                      dashboardData.balance.status === 'critical' ? 'destructive' :
                      dashboardData.balance.status === 'low' ? 'secondary' :
                      'default'
                    }
                  >
                    {dashboardData.balance.status.toUpperCase()}
                  </Badge>
                  <p className="text-sm text-gray-600">
                    {dashboardData.balance.cacheInfo.cached ? 
                      `Cached ${dashboardData.balance.cacheInfo.age}s ago` :
                      'Live data'
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={onRefreshBalance}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button 
                  size="sm"
                  onClick={() => window.open('https://connect.easyparcel.my/', '_blank')}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Top Up
                </Button>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Low threshold:</span>
                <span className="ml-2 text-gray-600">RM {dashboardData.balance.threshold.low}</span>
              </div>
              <div>
                <span className="font-medium">Critical threshold:</span>
                <span className="ml-2 text-gray-600">RM {dashboardData.balance.threshold.critical}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* API Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            EasyParcel API Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              {dashboardData.apiStatus.configured ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <div>
                <p className="font-medium">Configuration</p>
                <p className="text-sm text-gray-600">
                  {dashboardData.apiStatus.configured ? 'Configured' : 'Not Configured'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {dashboardData.apiStatus.apiConnected ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <div>
                <p className="font-medium">API Connection</p>
                <p className="text-sm text-gray-600">
                  {dashboardData.apiStatus.apiConnected ? 'Connected' : 'Disconnected'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <div>
                <p className="font-medium">Last Check</p>
                <p className="text-sm text-gray-600">
                  {new Date(dashboardData.apiStatus.lastCheck).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {dashboardData.apiStatus.errorCount === 0 ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              )}
              <div>
                <p className="font-medium">Error Count</p>
                <p className="text-sm text-gray-600">
                  {dashboardData.apiStatus.errorCount} errors
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              Shipped Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {dashboardData.statistics.shipped}
            </div>
            <p className="text-sm text-gray-600">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Delivered Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {dashboardData.statistics.delivered}
            </div>
            <p className="text-sm text-gray-600">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              Delivery Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {dashboardData.statistics.deliveryRate}%
            </div>
            <p className="text-sm text-gray-600">Success rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-orange-600" />
              Active Couriers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {dashboardData.courierPreferences.filter(c => c.enabled).length}
            </div>
            <p className="text-sm text-gray-600">
              of {dashboardData.courierPreferences.length} total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Configuration Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Free Shipping</span>
                <Badge variant="outline">
                  RM {dashboardData.profile?.shippingPolicies?.freeShippingThreshold || 0}
                </Badge>
              </div>
              <p className="text-sm text-gray-600">
                Orders above this amount get free shipping
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Auto Selection</span>
                <Badge variant={dashboardData.profile?.courierPreferences?.autoSelectCheapest ? 'default' : 'secondary'}>
                  {dashboardData.profile?.courierPreferences?.autoSelectCheapest ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
              <p className="text-sm text-gray-600">
                Automatic courier selection for customers
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Default Service</span>
                <Badge variant="outline">
                  {dashboardData.profile?.courierPreferences?.defaultServiceType || 'STANDARD'}
                </Badge>
              </div>
              <p className="text-sm text-gray-600">
                Default shipping service type
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Business Profile Tab Component
function BusinessProfileTab({ 
  profile, 
  onSave, 
  saving 
}: { 
  profile: BusinessProfile | null;
  onSave: (data: Partial<BusinessProfile>) => Promise<void>;
  saving: boolean;
}) {
  const [editedProfile, setEditedProfile] = useState<BusinessProfile | null>(profile);

  useEffect(() => {
    setEditedProfile(profile);
  }, [profile]);

  if (!editedProfile) {
    return <div>Loading business profile...</div>;
  }

  const handleSave = () => {
    onSave({
      businessName: editedProfile.businessName,
      contactPerson: editedProfile.contactPerson,
      contactPhone: editedProfile.contactPhone,
      contactEmail: editedProfile.contactEmail,
      pickupAddress: editedProfile.pickupAddress
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Business Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                value={editedProfile.businessName || ''}
                onChange={(e) => setEditedProfile({
                  ...editedProfile,
                  businessName: e.target.value
                })}
                placeholder="Enter your business name"
              />
            </div>

            <div>
              <Label htmlFor="contactPerson">Contact Person</Label>
              <Input
                id="contactPerson"
                value={editedProfile.contactPerson || ''}
                onChange={(e) => setEditedProfile({
                  ...editedProfile,
                  contactPerson: e.target.value
                })}
                placeholder="Contact person name"
              />
            </div>

            <div>
              <Label htmlFor="contactPhone">Phone Number</Label>
              <Input
                id="contactPhone"
                value={editedProfile.contactPhone || ''}
                onChange={(e) => setEditedProfile({
                  ...editedProfile,
                  contactPhone: e.target.value
                })}
                placeholder="+60123456789"
              />
            </div>

            <div>
              <Label htmlFor="contactEmail">Email Address</Label>
              <Input
                id="contactEmail"
                type="email"
                value={editedProfile.contactEmail || ''}
                onChange={(e) => setEditedProfile({
                  ...editedProfile,
                  contactEmail: e.target.value
                })}
                placeholder="business@example.com"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Pickup Address
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="pickupName">Location Name</Label>
              <Input
                id="pickupName"
                value={editedProfile.pickupAddress?.name || ''}
                onChange={(e) => setEditedProfile({
                  ...editedProfile,
                  pickupAddress: {
                    ...editedProfile.pickupAddress!,
                    name: e.target.value
                  }
                })}
                placeholder="Store/Warehouse Name"
              />
            </div>

            <div>
              <Label htmlFor="address1">Address Line 1</Label>
              <Input
                id="address1"
                value={editedProfile.pickupAddress?.address_line_1 || ''}
                onChange={(e) => setEditedProfile({
                  ...editedProfile,
                  pickupAddress: {
                    ...editedProfile.pickupAddress!,
                    address_line_1: e.target.value
                  }
                })}
                placeholder="Street Address"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={editedProfile.pickupAddress?.city || ''}
                  onChange={(e) => setEditedProfile({
                    ...editedProfile,
                    pickupAddress: {
                      ...editedProfile.pickupAddress!,
                      city: e.target.value
                    }
                  })}
                  placeholder="City"
                />
              </div>

              <div>
                <Label htmlFor="postcode">Postcode</Label>
                <Input
                  id="postcode"
                  value={editedProfile.pickupAddress?.postcode || ''}
                  onChange={(e) => setEditedProfile({
                    ...editedProfile,
                    pickupAddress: {
                      ...editedProfile.pickupAddress!,
                      postcode: e.target.value
                    }
                  })}
                  placeholder="50000"
                  maxLength={5}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="state">State</Label>
              <Select
                value={editedProfile.pickupAddress?.state || ''}
                onValueChange={(value) => setEditedProfile({
                  ...editedProfile,
                  pickupAddress: {
                    ...editedProfile.pickupAddress!,
                    state: value
                  }
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="JOH">Johor</SelectItem>
                  <SelectItem value="KDH">Kedah</SelectItem>
                  <SelectItem value="KTN">Kelantan</SelectItem>
                  <SelectItem value="MLK">Malacca</SelectItem>
                  <SelectItem value="NSN">Negeri Sembilan</SelectItem>
                  <SelectItem value="PHG">Pahang</SelectItem>
                  <SelectItem value="PRK">Perak</SelectItem>
                  <SelectItem value="PLS">Perlis</SelectItem>
                  <SelectItem value="PNG">Penang</SelectItem>
                  <SelectItem value="SBH">Sabah</SelectItem>
                  <SelectItem value="SEL">Selangor</SelectItem>
                  <SelectItem value="SWK">Sarawak</SelectItem>
                  <SelectItem value="TRG">Terengganu</SelectItem>
                  <SelectItem value="KUL">Kuala Lumpur</SelectItem>
                  <SelectItem value="LBN">Labuan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Business Profile'}
        </Button>
      </div>
    </div>
  );
}

// Courier Management Tab Component
function CourierManagementTab({ 
  profile, 
  courierPreferences, 
  onSave, 
  saving 
}: { 
  profile: BusinessProfile | null;
  courierPreferences: CourierPreference[];
  onSave: (data: Partial<BusinessProfile>) => Promise<void>;
  saving: boolean;
}) {
  const [availableCouriers, setAvailableCouriers] = useState<any[]>([]);
  const [loadingCouriers, setLoadingCouriers] = useState(false);
  const [apiConnected, setApiConnected] = useState(false);
  const [hasTestedApi, setHasTestedApi] = useState(false);

  // ✅ REMOVED: Auto-loading API call on tab click
  // Now only loads existing preferences (fast) and requires manual refresh for API discovery

  const loadAvailableCouriers = async () => {
    setLoadingCouriers(true);
    try {
      const response = await fetch('/api/admin/shipping/couriers?action=available');
      const data = await response.json();
      
      if (data.success) {
        setAvailableCouriers(data.availableCouriers || []);
        setApiConnected(data.apiConnected || false);
        setHasTestedApi(true);
        toast.success(`Found ${data.availableCouriers?.length || 0} available couriers from API`);
      } else {
        toast.error('Failed to load available couriers');
        setApiConnected(false);
      }
    } catch (error) {
      console.error('Error loading couriers:', error);
      toast.error('Error connecting to courier API');
      setApiConnected(false);
    } finally {
      setLoadingCouriers(false);
    }
  };

  const testApiConnection = async () => {
    setLoadingCouriers(true);
    try {
      const response = await fetch('/api/admin/shipping/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test_connection' })
      });
      
      const result = await response.json();
      if (result.success) {
        toast.success(`API test successful! Found ${result.ratesReturned} shipping rates available.`);
        // Load available couriers after successful test
        await loadAvailableCouriers();
      } else {
        toast.error(`API test failed: ${result.error}`);
        setApiConnected(false);
      }
    } catch (error) {
      toast.error('Failed to test API connection');
      setApiConnected(false);
    } finally {
      setLoadingCouriers(false);
    }
  };

  const toggleCourierSelection = (courierId: string) => {
    setAvailableCouriers(prev => 
      prev.map(courier => 
        courier.courierId === courierId 
          ? { ...courier, enabled: !courier.enabled }
          : courier
      )
    );
  };

  const selectAllCouriers = (enable: boolean) => {
    setAvailableCouriers(prev => 
      prev.map(courier => ({ ...courier, enabled: enable }))
    );
  };

  const saveCourierSelections = async () => {
    try {
      const selectedCouriers = availableCouriers
        .filter(courier => courier.enabled)
        .map((courier, index) => ({
          courierId: courier.courierId,
          courierName: courier.courierName,
          priority: courier.priority < 999 ? courier.priority : index + 1,
          enabled: true,
          serviceTypes: courier.serviceTypes || ['STANDARD'],
          maxWeight: courier.maxWeight || 30,
          notes: courier.notes || `Auto-configured from EasyParcel API`
        }));

      const response = await fetch('/api/admin/shipping/couriers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences: selectedCouriers })
      });

      if (response.ok) {
        toast.success(`Successfully saved ${selectedCouriers.length} courier preferences`);
        // Reload dashboard data to show updated preferences
        await loadDashboardData();
      } else {
        const error = await response.json();
        toast.error(`Failed to save courier preferences: ${error.error}`);
      }
    } catch (error) {
      console.error('Error saving courier selections:', error);
      toast.error('Failed to save courier selections');
    }
  };

  const saveCourierPreferences = async (updatedPreferences: CourierPreference[]) => {
    try {
      const response = await fetch('/api/admin/shipping/couriers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences: updatedPreferences })
      });

      if (response.ok) {
        toast.success('Courier preferences updated successfully');
        // Reload dashboard data to show updated preferences
        await loadDashboardData();
      } else {
        const error = await response.json();
        toast.error(`Failed to update courier preferences: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating courier preferences:', error);
      toast.error('Failed to update courier preferences');
    }
  };

  // ✅ REMOVED: Loading blocker - now shows existing preferences while loading API data

  return (
    <div className="space-y-6">
      {/* Current Courier Preferences Management */}
      {courierPreferences.length > 0 && (
        <CourierPreferencesManager
          courierPreferences={courierPreferences}
          onSave={saveCourierPreferences}
          saving={saving}
          hasApiResults={hasTestedApi && availableCouriers.length > 0}
        />
      )}

      {/* API Discovery Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Discover New Couriers
          </CardTitle>
          <CardDescription>
            Manually check EasyParcel API to discover available couriers for your location
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {hasTestedApi ? (
                <>
                  {apiConnected ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span className="font-medium">
                    Last API Test: {apiConnected ? 'Success' : 'Failed'}
                  </span>
                  {availableCouriers.length > 0 && (
                    <Badge variant="outline">
                      {availableCouriers.length} couriers found
                    </Badge>
                  )}
                </>
              ) : (
                <>
                  <Info className="h-5 w-5 text-blue-500" />
                  <span className="font-medium text-blue-700">
                    Click "Discover Couriers" to check available options
                  </span>
                </>
              )}
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={testApiConnection}
                disabled={loadingCouriers}
              >
                {loadingCouriers ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Testing API...
                  </>
                ) : (
                  <>
                    <TestTube className="h-4 w-4 mr-2" />
                    Discover Couriers
                  </>
                )}
              </Button>
              {hasTestedApi && (
                <Button 
                  variant="outline" 
                  onClick={loadAvailableCouriers}
                  disabled={loadingCouriers}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Results
                </Button>
              )}
            </div>
          </div>
          
          {!hasTestedApi && (
            <Alert className="mt-4">
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Manual Discovery:</strong> Courier discovery now requires explicit action to avoid unnecessary API costs. 
                Click "Discover Couriers" to test your EasyParcel connection and find available shipping options.
              </AlertDescription>
            </Alert>
          )}
          
          {hasTestedApi && availableCouriers.length > 0 && (
            <Alert className="mt-4">
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>API Discovery Complete:</strong> Found {availableCouriers.length} courier options from EasyParcel.{' '}
                {courierPreferences.length > 0 && (
                  <>Your current preferences are shown above. </>
                )}
                Use the selection tool below to update your courier preferences.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Available Couriers from API Discovery */}
      {availableCouriers.length > 0 && hasTestedApi ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>📋 Courier Selection ({availableCouriers.length} from API)</span>
              <Badge variant="outline">
                {availableCouriers.filter(c => c.enabled).length} Selected for Update
              </Badge>
            </CardTitle>
            <CardDescription>
              Fresh results from EasyParcel API. Select which couriers to add/update in your preferences.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {availableCouriers.map((courier) => (
                <div 
                  key={courier.courierId}
                  className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                    courier.enabled 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => toggleCourierSelection(courier.courierId)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        courier.enabled 
                          ? 'border-blue-500 bg-blue-500' 
                          : 'border-gray-300'
                      }`}>
                        {courier.enabled && (
                          <CheckCircle className="w-3 h-3 text-white" />
                        )}
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {courier.courierName}
                        </h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-sm text-gray-600">
                            {courier.estimatedDeliveryDays} day{courier.estimatedDeliveryDays !== 1 ? 's' : ''} delivery
                          </span>
                          {courier.serviceTypes && courier.serviceTypes.length > 0 && (
                            <>
                              <span className="text-gray-400">•</span>
                              <span className="text-sm text-gray-600">
                                {courier.serviceTypes.join(', ')}
                              </span>
                            </>
                          )}
                          {courier.priceRange && (
                            <>
                              <span className="text-gray-400">•</span>
                              <span className="text-sm font-medium text-green-600">
                                RM {courier.priceRange.min}-{courier.priceRange.max}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {/* Coverage badges */}
                      {courier.coverage?.westMalaysia && (
                        <Badge variant="secondary" className="text-xs">West MY</Badge>
                      )}
                      {courier.coverage?.eastMalaysia && (
                        <Badge variant="secondary" className="text-xs">East MY</Badge>
                      )}
                      
                      {/* Feature icons */}
                      <div className="flex space-x-1">
                        {courier.features?.insuranceAvailable && (
                          <Shield className="h-4 w-4 text-gray-400" title="Insurance Available" />
                        )}
                        {courier.features?.codAvailable && (
                          <DollarSign className="h-4 w-4 text-gray-400" title="COD Available" />
                        )}
                      </div>

                      {/* Priority indicator */}
                      {courier.priority < 999 && (
                        <Badge variant="outline" className="text-xs">
                          Priority {courier.priority}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex justify-between items-center mt-6 pt-4 border-t">
              <div className="text-sm text-gray-600">
                {availableCouriers.filter(c => c.enabled).length} of {availableCouriers.length} couriers selected
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => selectAllCouriers(false)}
                >
                  Clear All
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => selectAllCouriers(true)}
                >
                  Select All
                </Button>
                <Button 
                  size="sm"
                  onClick={saveCourierSelections}
                  disabled={saving}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Updating...' : 'Update Preferences'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : hasTestedApi ? (
        <Card>
          <CardContent className="text-center py-8">
            <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">
              No new couriers found in the last API test. Try refreshing or check your EasyParcel configuration.
            </p>
            <Button onClick={loadAvailableCouriers} disabled={loadingCouriers}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh API Results
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {/* Initial state when no preferences exist */}
      {courierPreferences.length === 0 && !hasTestedApi && (
        <Card>
          <CardContent className="text-center py-12">
            <Truck className="h-16 w-16 text-gray-400 mx-auto mb-6" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Courier Preferences Set</h3>
            <p className="text-gray-600 mb-6">
              Get started by discovering available couriers from EasyParcel API
            </p>
            <Button onClick={testApiConnection} disabled={loadingCouriers}>
              {loadingCouriers ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Discovering...
                </>
              ) : (
                <>
                  <TestTube className="h-4 w-4 mr-2" />
                  Discover Available Couriers
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Courier Preferences Manager Component
function CourierPreferencesManager({
  courierPreferences,
  onSave,
  saving,
  hasApiResults
}: {
  courierPreferences: CourierPreference[];
  onSave: (preferences: CourierPreference[]) => Promise<void>;
  saving: boolean;
  hasApiResults: boolean;
}) {
  const [editedPreferences, setEditedPreferences] = useState<CourierPreference[]>(courierPreferences);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setEditedPreferences(courierPreferences);
  }, [courierPreferences]);

  const toggleCourierEnabled = (courierId: string) => {
    setEditedPreferences(prev =>
      prev.map(pref =>
        pref.courierId === courierId
          ? { ...pref, enabled: !pref.enabled }
          : pref
      )
    );
  };

  const updateCourierPriority = (courierId: string, newPriority: number) => {
    setEditedPreferences(prev =>
      prev.map(pref =>
        pref.courierId === courierId
          ? { ...pref, priority: newPriority }
          : pref
      )
    );
  };

  const removeCourier = (courierId: string) => {
    setEditedPreferences(prev =>
      prev.filter(pref => pref.courierId !== courierId)
    );
  };

  const handleSave = async () => {
    // Re-sort by priority to ensure consistency
    const sortedPreferences = [...editedPreferences].sort((a, b) => a.priority - b.priority);
    await onSave(sortedPreferences);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedPreferences(courierPreferences);
    setIsEditing(false);
  };

  if (!isEditing && !hasApiResults) {
    // Compact view when not editing and no API results
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Current Active Couriers ({courierPreferences.filter(c => c.enabled).length})
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {courierPreferences.length} total configured
              </Badge>
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Settings className="h-4 w-4 mr-2" />
                Manage
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Your active courier configuration. Click "Manage" to edit priorities or disable couriers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {courierPreferences.filter(pref => pref.enabled).map((pref) => (
              <div key={pref.courierId} className="flex items-center justify-between p-3 border rounded-lg bg-green-50">
                <div>
                  <h4 className="font-medium text-gray-900">{pref.courierName}</h4>
                  <p className="text-sm text-gray-600">Priority {pref.priority}</p>
                </div>
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
            ))}
          </div>
          {courierPreferences.some(c => !c.enabled) && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-600 mb-2">
                <strong>{courierPreferences.filter(c => !c.enabled).length} disabled:</strong>{' '}
                {courierPreferences.filter(c => !c.enabled).map(c => c.courierName).join(', ')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Full management view when editing or when API results are available
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Manage Courier Preferences
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {editedPreferences.filter(c => c.enabled).length} active
            </Badge>
            <Badge variant="secondary">
              {editedPreferences.length} total
            </Badge>
          </div>
        </CardTitle>
        <CardDescription>
          Enable/disable couriers, set priorities (1 = highest), and remove unwanted options.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {editedPreferences
            .sort((a, b) => a.priority - b.priority)
            .map((pref, index) => (
              <div 
                key={pref.courierId} 
                className={`p-4 border rounded-lg ${
                  pref.enabled ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Enable/Disable Toggle */}
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={pref.enabled}
                        onChange={() => toggleCourierEnabled(pref.courierId)}
                        className="h-4 w-4 text-blue-600 rounded border-gray-300"
                      />
                    </div>

                    {/* Courier Info */}
                    <div>
                      <h4 className={`font-medium ${pref.enabled ? 'text-gray-900' : 'text-gray-500'}`}>
                        {pref.courierName}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {pref.serviceTypes?.join(', ') || 'Standard'} • Max: {pref.maxWeight || 30}kg
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {/* Priority Input */}
                    <div className="flex items-center space-x-2">
                      <Label htmlFor={`priority-${pref.courierId}`} className="text-sm">
                        Priority:
                      </Label>
                      <Input
                        id={`priority-${pref.courierId}`}
                        type="number"
                        min="1"
                        max="99"
                        value={pref.priority}
                        onChange={(e) => updateCourierPriority(pref.courierId, parseInt(e.target.value) || 1)}
                        className="w-20 h-8"
                        disabled={!pref.enabled}
                      />
                    </div>

                    {/* Remove Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeCourier(pref.courierId)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center mt-6 pt-4 border-t">
          <div className="text-sm text-gray-600">
            {editedPreferences.filter(c => c.enabled).length} of {editedPreferences.length} couriers enabled
          </div>
          <div className="flex space-x-2">
            {isEditing && (
              <Button variant="outline" onClick={handleCancel} disabled={saving}>
                Cancel
              </Button>
            )}
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Shipping Policies Tab Component
function ShippingPoliciesTab({ 
  profile, 
  onSave, 
  saving 
}: { 
  profile: BusinessProfile | null;
  onSave: (data: Partial<BusinessProfile>) => Promise<void>;
  saving: boolean;
}) {
  const [policies, setPolicies] = useState(profile?.shippingPolicies);

  useEffect(() => {
    setPolicies(profile?.shippingPolicies);
  }, [profile]);

  if (!policies) return <div>Loading policies...</div>;

  const handleSave = () => {
    onSave({ shippingPolicies: policies });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Shipping Rules</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="freeShippingThreshold">Free Shipping Threshold (RM)</Label>
              <Input
                id="freeShippingThreshold"
                type="number"
                value={policies.freeShippingThreshold || 0}
                onChange={(e) => setPolicies({
                  ...policies!,
                  freeShippingThreshold: Number(e.target.value)
                })}
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <Label htmlFor="processingDays">Processing Days</Label>
              <Input
                id="processingDays"
                type="number"
                value={policies.processingDays || 1}
                onChange={(e) => setPolicies({
                  ...policies!,
                  processingDays: Number(e.target.value)
                })}
                min="0"
                max="7"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Package Limits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="maxWeight">Maximum Weight (kg)</Label>
              <Input
                id="maxWeight"
                type="number"
                value={policies.maxWeight || 30}
                onChange={(e) => setPolicies({
                  ...policies!,
                  maxWeight: Number(e.target.value)
                })}
                min="0"
                max="70"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label htmlFor="maxLength">Length (cm)</Label>
                <Input
                  id="maxLength"
                  type="number"
                  value={policies.maxDimensions?.length || 100}
                  onChange={(e) => setPolicies({
                    ...policies!,
                    maxDimensions: {
                      ...policies.maxDimensions!,
                      length: Number(e.target.value)
                    }
                  })}
                />
              </div>
              <div>
                <Label htmlFor="maxWidth">Width (cm)</Label>
                <Input
                  id="maxWidth"
                  type="number"
                  value={policies.maxDimensions?.width || 100}
                  onChange={(e) => setPolicies({
                    ...policies!,
                    maxDimensions: {
                      ...policies.maxDimensions!,
                      width: Number(e.target.value)
                    }
                  })}
                />
              </div>
              <div>
                <Label htmlFor="maxHeight">Height (cm)</Label>
                <Input
                  id="maxHeight"
                  type="number"
                  value={policies.maxDimensions?.height || 100}
                  onChange={(e) => setPolicies({
                    ...policies!,
                    maxDimensions: {
                      ...policies.maxDimensions!,
                      height: Number(e.target.value)
                    }
                  })}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Shipping Policies'}
        </Button>
      </div>
    </div>
  );
}

// Additional Services Tab Component
function AdditionalServicesTab({ 
  profile, 
  onSave, 
  saving 
}: { 
  profile: BusinessProfile | null;
  onSave: (data: Partial<BusinessProfile>) => Promise<void>;
  saving: boolean;
}) {
  const [services, setServices] = useState(profile?.serviceSettings);

  useEffect(() => {
    setServices(profile?.serviceSettings);
  }, [profile]);

  if (!services) return <div>Loading services...</div>;

  const handleSave = () => {
    onSave({ serviceSettings: services });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Insurance Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="insuranceRequired"
                checked={services.insuranceRequired || false}
                onCheckedChange={(checked) => setServices({
                  ...services!,
                  insuranceRequired: checked
                })}
              />
              <Label htmlFor="insuranceRequired">Require insurance for all shipments</Label>
            </div>

            <div>
              <Label htmlFor="maxInsuranceValue">Maximum Insurance Value (RM)</Label>
              <Input
                id="maxInsuranceValue"
                type="number"
                value={services.maxInsuranceValue || 5000}
                onChange={(e) => setServices({
                  ...services!,
                  maxInsuranceValue: Number(e.target.value)
                })}
                min="0"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cash on Delivery (COD)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="codEnabled"
                checked={services.codEnabled || false}
                onCheckedChange={(checked) => setServices({
                  ...services!,
                  codEnabled: checked
                })}
              />
              <Label htmlFor="codEnabled">Enable COD service</Label>
            </div>

            <div>
              <Label htmlFor="maxCodAmount">Maximum COD Amount (RM)</Label>
              <Input
                id="maxCodAmount"
                type="number"
                value={services.maxCodAmount || 1000}
                onChange={(e) => setServices({
                  ...services!,
                  maxCodAmount: Number(e.target.value)
                })}
                min="0"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Additional Services'}
        </Button>
      </div>
    </div>
  );
}