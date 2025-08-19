/**
 * Admin Shipping Configuration Management
 * Manage business shipping settings, courier preferences, and policies
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
  Settings,
  Truck,
  Shield,
  Clock,
  Package,
  MapPin,
  Save,
  TestTube,
  CheckCircle,
  AlertTriangle,
  Info,
  Star,
  Edit,
} from 'lucide-react';

interface BusinessProfile {
  businessName: string;
  businessRegistration?: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  pickupAddress: {
    name: string;
    phone: string;
    address_line_1: string;
    address_line_2?: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
  courierPreferences: {
    preferredCouriers: string[];
    blockedCouriers: string[];
    autoSelectCheapest: boolean;
    showCustomerChoice: boolean;
    defaultServiceType: 'STANDARD' | 'EXPRESS' | 'OVERNIGHT';
  };
  shippingPolicies: {
    freeShippingThreshold: number;
    maxWeight: number;
    maxDimensions: {
      length: number;
      width: number;
      height: number;
    };
    restrictedItems: string[];
    processingDays: number;
  };
  serviceSettings: {
    insuranceRequired: boolean;
    maxInsuranceValue: number;
    codEnabled: boolean;
    maxCodAmount: number;
    signatureRequired: boolean;
  };
}

interface CourierPreference {
  courierId: string;
  courierName: string;
  priority: number;
  enabled: boolean;
  serviceTypes: ('STANDARD' | 'EXPRESS' | 'OVERNIGHT')[];
  maxWeight?: number;
  notes?: string;
}

const MALAYSIAN_STATES = [
  { code: 'JOH', name: 'Johor' },
  { code: 'KDH', name: 'Kedah' },
  { code: 'KTN', name: 'Kelantan' },
  { code: 'MLK', name: 'Malacca' },
  { code: 'NSN', name: 'Negeri Sembilan' },
  { code: 'PHG', name: 'Pahang' },
  { code: 'PRK', name: 'Perak' },
  { code: 'PLS', name: 'Perlis' },
  { code: 'PNG', name: 'Penang' },
  { code: 'SBH', name: 'Sabah' },
  { code: 'SEL', name: 'Selangor' },
  { code: 'SWK', name: 'Sarawak' },
  { code: 'TRG', name: 'Terengganu' },
  { code: 'KUL', name: 'Kuala Lumpur' },
  { code: 'LBN', name: 'Labuan' },
];

const DEFAULT_COURIERS: CourierPreference[] = [
  {
    courierId: 'citylink',
    courierName: 'City-Link Express',
    priority: 1,
    enabled: true,
    serviceTypes: ['STANDARD', 'EXPRESS'],
    maxWeight: 30,
    notes: 'Reliable for West Malaysia'
  },
  {
    courierId: 'poslaju',
    courierName: 'Pos Laju',
    priority: 2,
    enabled: true,
    serviceTypes: ['STANDARD', 'EXPRESS', 'OVERNIGHT'],
    maxWeight: 20,
    notes: 'Good nationwide coverage'
  },
  {
    courierId: 'gdex',
    courierName: 'GDex',
    priority: 3,
    enabled: true,
    serviceTypes: ['STANDARD'],
    maxWeight: 25,
    notes: 'Cost-effective option'
  },
];

// Helper function to get default profile
const getDefaultProfile = (): BusinessProfile => ({
  businessName: 'EcomJRM Store',
  contactPerson: 'Store Manager', 
  contactPhone: '+60123456789',
  contactEmail: 'store@ecomjrm.com',
  pickupAddress: {
    name: 'EcomJRM Store',
    phone: '+60123456789',
    address_line_1: 'No. 123, Jalan Raja Laut',
    address_line_2: 'Level 2, Block A',
    city: 'Kuala Lumpur',
    state: 'KUL',
    postcode: '50000',
    country: 'MY'
  },
  courierPreferences: {
    preferredCouriers: ['citylink', 'poslaju', 'gdex'],
    blockedCouriers: [],
    autoSelectCheapest: true,
    showCustomerChoice: false,
    defaultServiceType: 'STANDARD'
  },
  shippingPolicies: {
    freeShippingThreshold: 150,
    maxWeight: 30,
    maxDimensions: { length: 100, width: 100, height: 100 },
    restrictedItems: ['hazardous', 'liquids', 'fragile_items'],
    processingDays: 1
  },
  serviceSettings: {
    insuranceRequired: false,
    maxInsuranceValue: 5000,
    codEnabled: true,
    maxCodAmount: 1000,
    signatureRequired: false
  }
});

export default function ShippingConfigPage() {
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [courierPrefs, setCourierPrefs] = useState<CourierPreference[]>(DEFAULT_COURIERS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      setLoading(true);
      
      // Initialize with defaults first
      setProfile(getDefaultProfile());
      setCourierPrefs(DEFAULT_COURIERS);
      
      try {
        // Load business profile
        const profileResponse = await fetch('/api/admin/shipping/config', {
          credentials: 'include',  // Include session cookies
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          if (profileData.profile) {
            setProfile(profileData.profile);
          }
        } else {
          console.warn('Config API returned:', profileResponse.status, profileResponse.statusText);
        }

        // Load courier preferences
        const courierResponse = await fetch('/api/admin/shipping/couriers', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (courierResponse.ok) {
          const courierData = await courierResponse.json();
          if (courierData.preferences) {
            setCourierPrefs(courierData.preferences);
          }
        }
      } catch (apiError) {
        console.warn('API calls failed, using defaults:', apiError);
        // Continue with defaults already set
      }

    } catch (error) {
      console.error('Failed to load configuration:', error);
      setMessage({ type: 'error', text: 'Failed to load shipping configuration' });
      // Set defaults anyway
      setProfile(getDefaultProfile());
      setCourierPrefs(DEFAULT_COURIERS);
    } finally {
      setLoading(false);
    }
  };

  const saveConfiguration = async () => {
    if (!profile) return;

    try {
      setSaving(true);
      setMessage(null);

      // Save business profile
      const profileResponse = await fetch('/api/admin/shipping/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile }),
      });

      // Save courier preferences
      const courierResponse = await fetch('/api/admin/shipping/couriers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences: courierPrefs }),
      });

      if (profileResponse.ok && courierResponse.ok) {
        setMessage({ type: 'success', text: 'Configuration saved successfully!' });
      } else {
        throw new Error('Failed to save configuration');
      }

    } catch (error) {
      console.error('Save error:', error);
      setMessage({ type: 'error', text: 'Failed to save configuration' });
    } finally {
      setSaving(false);
    }
  };

  const testConfiguration = async () => {
    try {
      setTesting(true);
      setMessage(null);

      const response = await fetch('/api/admin/shipping/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testDestination: {
            postcode: '50000',
            city: 'Kuala Lumpur',
            state: 'KUL'
          }
        }),
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        setMessage({ 
          type: 'success', 
          text: `Test successful! Found ${result.rateCount} shipping options. Recommended: ${result.recommendedCourier}` 
        });
      } else {
        throw new Error(result.message || 'Test failed');
      }

    } catch (error) {
      console.error('Test error:', error);
      setMessage({ type: 'error', text: `Configuration test failed: ${error.message}` });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading shipping configuration...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Shipping Configuration
        </h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={testConfiguration}
            disabled={testing || !profile}
          >
            <TestTube className="h-4 w-4 mr-2" />
            {testing ? 'Testing...' : 'Test Config'}
          </Button>
          <Button
            onClick={saveConfiguration}
            disabled={saving || !profile}
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          {message.type === 'error' ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="business" className="space-y-6">
        <TabsList>
          <TabsTrigger value="business">Business Profile</TabsTrigger>
          <TabsTrigger value="couriers">Courier Preferences</TabsTrigger>
          <TabsTrigger value="policies">Shipping Policies</TabsTrigger>
          <TabsTrigger value="services">Additional Services</TabsTrigger>
        </TabsList>

        <TabsContent value="business">
          <BusinessProfileTab profile={profile} setProfile={setProfile} />
        </TabsContent>

        <TabsContent value="couriers">
          <CourierPreferencesTab 
            preferences={courierPrefs} 
            setPreferences={setCourierPrefs}
            autoSelectEnabled={profile?.courierPreferences.autoSelectCheapest || false}
          />
        </TabsContent>

        <TabsContent value="policies">
          <ShippingPoliciesTab profile={profile} setProfile={setProfile} />
        </TabsContent>

        <TabsContent value="services">
          <AdditionalServicesTab profile={profile} setProfile={setProfile} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Business Profile Tab Component
function BusinessProfileTab({ profile, setProfile }: {
  profile: BusinessProfile | null;
  setProfile: (profile: BusinessProfile) => void;
}) {
  if (!profile) return <div>Loading...</div>;

  return (
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
              value={profile.businessName}
              onChange={(e) => setProfile({ ...profile, businessName: e.target.value })}
              placeholder="Your Business Name"
            />
          </div>
          
          <div>
            <Label htmlFor="contactPerson">Contact Person</Label>
            <Input
              id="contactPerson"
              value={profile.contactPerson}
              onChange={(e) => setProfile({ ...profile, contactPerson: e.target.value })}
              placeholder="Manager Name"
            />
          </div>
          
          <div>
            <Label htmlFor="contactPhone">Phone Number</Label>
            <Input
              id="contactPhone"
              value={profile.contactPhone}
              onChange={(e) => setProfile({ ...profile, contactPhone: e.target.value })}
              placeholder="+60123456789"
            />
          </div>
          
          <div>
            <Label htmlFor="contactEmail">Email Address</Label>
            <Input
              id="contactEmail"
              type="email"
              value={profile.contactEmail}
              onChange={(e) => setProfile({ ...profile, contactEmail: e.target.value })}
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
              value={profile.pickupAddress.name}
              onChange={(e) => setProfile({
                ...profile,
                pickupAddress: { ...profile.pickupAddress, name: e.target.value }
              })}
              placeholder="Store/Warehouse Name"
            />
          </div>
          
          <div>
            <Label htmlFor="address1">Address Line 1</Label>
            <Input
              id="address1"
              value={profile.pickupAddress.address_line_1}
              onChange={(e) => setProfile({
                ...profile,
                pickupAddress: { ...profile.pickupAddress, address_line_1: e.target.value }
              })}
              placeholder="Street Address"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={profile.pickupAddress.city}
                onChange={(e) => setProfile({
                  ...profile,
                  pickupAddress: { ...profile.pickupAddress, city: e.target.value }
                })}
                placeholder="City"
              />
            </div>
            
            <div>
              <Label htmlFor="postcode">Postcode</Label>
              <Input
                id="postcode"
                value={profile.pickupAddress.postcode}
                onChange={(e) => setProfile({
                  ...profile,
                  pickupAddress: { ...profile.pickupAddress, postcode: e.target.value }
                })}
                placeholder="50000"
                maxLength={5}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="state">State</Label>
            <Select
              value={profile.pickupAddress.state}
              onValueChange={(value) => setProfile({
                ...profile,
                pickupAddress: { ...profile.pickupAddress, state: value }
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                {MALAYSIAN_STATES.map((state) => (
                  <SelectItem key={state.code} value={state.code}>
                    {state.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Courier Preferences Tab Component
function CourierPreferencesTab({ 
  preferences, 
  setPreferences, 
  autoSelectEnabled 
}: {
  preferences: CourierPreference[];
  setPreferences: (prefs: CourierPreference[]) => void;
  autoSelectEnabled: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Courier Management
        </CardTitle>
        {autoSelectEnabled && (
          <Badge variant="secondary" className="w-fit">
            <Star className="h-3 w-3 mr-1" />
            Auto-Selection Enabled
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <Alert className="mb-4">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Couriers are automatically selected based on priority order and business rules. 
            Customers will not see courier options during checkout.
          </AlertDescription>
        </Alert>
        
        <div className="space-y-4">
          {preferences.map((courier, index) => (
            <div key={courier.courierId} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">Priority {courier.priority}</Badge>
                  <h3 className="font-semibold">{courier.courierName}</h3>
                  <Switch
                    checked={courier.enabled}
                    onCheckedChange={(enabled) => {
                      const newPrefs = [...preferences];
                      newPrefs[index] = { ...courier, enabled };
                      setPreferences(newPrefs);
                    }}
                  />
                </div>
                <Button variant="ghost" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                <div>
                  <strong>Services:</strong> {courier.serviceTypes.join(', ')}
                </div>
                <div>
                  <strong>Max Weight:</strong> {courier.maxWeight}kg
                </div>
                <div>
                  <strong>Status:</strong> {courier.enabled ? 'Active' : 'Disabled'}
                </div>
              </div>
              
              {courier.notes && (
                <p className="text-sm text-gray-500 mt-2">{courier.notes}</p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Shipping Policies Tab Component  
function ShippingPoliciesTab({ profile, setProfile }: {
  profile: BusinessProfile | null;
  setProfile: (profile: BusinessProfile) => void;
}) {
  if (!profile) return <div>Loading...</div>;

  return (
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
              value={profile.shippingPolicies.freeShippingThreshold}
              onChange={(e) => setProfile({
                ...profile,
                shippingPolicies: { 
                  ...profile.shippingPolicies, 
                  freeShippingThreshold: Number(e.target.value) 
                }
              })}
            />
          </div>
          
          <div>
            <Label htmlFor="processingDays">Processing Days</Label>
            <Input
              id="processingDays"
              type="number"
              value={profile.shippingPolicies.processingDays}
              onChange={(e) => setProfile({
                ...profile,
                shippingPolicies: { 
                  ...profile.shippingPolicies, 
                  processingDays: Number(e.target.value) 
                }
              })}
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
              value={profile.shippingPolicies.maxWeight}
              onChange={(e) => setProfile({
                ...profile,
                shippingPolicies: { 
                  ...profile.shippingPolicies, 
                  maxWeight: Number(e.target.value) 
                }
              })}
            />
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label htmlFor="maxLength">Max Length (cm)</Label>
              <Input
                id="maxLength"
                type="number"
                value={profile.shippingPolicies.maxDimensions.length}
                onChange={(e) => setProfile({
                  ...profile,
                  shippingPolicies: {
                    ...profile.shippingPolicies,
                    maxDimensions: {
                      ...profile.shippingPolicies.maxDimensions,
                      length: Number(e.target.value)
                    }
                  }
                })}
              />
            </div>
            <div>
              <Label htmlFor="maxWidth">Width (cm)</Label>
              <Input
                id="maxWidth"
                type="number"
                value={profile.shippingPolicies.maxDimensions.width}
                onChange={(e) => setProfile({
                  ...profile,
                  shippingPolicies: {
                    ...profile.shippingPolicies,
                    maxDimensions: {
                      ...profile.shippingPolicies.maxDimensions,
                      width: Number(e.target.value)
                    }
                  }
                })}
              />
            </div>
            <div>
              <Label htmlFor="maxHeight">Height (cm)</Label>
              <Input
                id="maxHeight"
                type="number"
                value={profile.shippingPolicies.maxDimensions.height}
                onChange={(e) => setProfile({
                  ...profile,
                  shippingPolicies: {
                    ...profile.shippingPolicies,
                    maxDimensions: {
                      ...profile.shippingPolicies.maxDimensions,
                      height: Number(e.target.value)
                    }
                  }
                })}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Additional Services Tab Component
function AdditionalServicesTab({ profile, setProfile }: {
  profile: BusinessProfile | null;
  setProfile: (profile: BusinessProfile) => void;
}) {
  if (!profile) return <div>Loading...</div>;

  return (
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
              checked={profile.serviceSettings.insuranceRequired}
              onCheckedChange={(checked) => setProfile({
                ...profile,
                serviceSettings: { 
                  ...profile.serviceSettings, 
                  insuranceRequired: checked 
                }
              })}
            />
            <Label htmlFor="insuranceRequired">Require insurance for all shipments</Label>
          </div>
          
          <div>
            <Label htmlFor="maxInsuranceValue">Maximum Insurance Value (RM)</Label>
            <Input
              id="maxInsuranceValue"
              type="number"
              value={profile.serviceSettings.maxInsuranceValue}
              onChange={(e) => setProfile({
                ...profile,
                serviceSettings: { 
                  ...profile.serviceSettings, 
                  maxInsuranceValue: Number(e.target.value) 
                }
              })}
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
              checked={profile.serviceSettings.codEnabled}
              onCheckedChange={(checked) => setProfile({
                ...profile,
                serviceSettings: { 
                  ...profile.serviceSettings, 
                  codEnabled: checked 
                }
              })}
            />
            <Label htmlFor="codEnabled">Enable COD service</Label>
          </div>
          
          <div>
            <Label htmlFor="maxCodAmount">Maximum COD Amount (RM)</Label>
            <Input
              id="maxCodAmount"
              type="number"
              value={profile.serviceSettings.maxCodAmount}
              onChange={(e) => setProfile({
                ...profile,
                serviceSettings: { 
                  ...profile.serviceSettings, 
                  maxCodAmount: Number(e.target.value) 
                }
              })}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}