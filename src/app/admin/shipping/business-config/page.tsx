/**
 * Admin Business Shipping Configuration Page
 * Allows admin to configure business profile and courier preferences
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Building2, 
  MapPin, 
  Truck, 
  Settings, 
  CheckCircle, 
  AlertCircle,
  Info,
  Clock,
  Shield,
  CreditCard
} from 'lucide-react';

interface BusinessProfile {
  businessName: string;
  businessRegistration?: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  pickupAddress: {
    name: string;
    company?: string;
    phone: string;
    email?: string;
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

const MALAYSIAN_STATES = [
  { code: 'JOH', name: 'Johor' },
  { code: 'KDH', name: 'Kedah' },
  { code: 'KTN', name: 'Kelantan' },
  { code: 'MLK', name: 'Melaka' },
  { code: 'NSN', name: 'Negeri Sembilan' },
  { code: 'PHG', name: 'Pahang' },
  { code: 'PRK', name: 'Perak' },
  { code: 'PLS', name: 'Perlis' },
  { code: 'PNG', name: 'Pulau Pinang' },
  { code: 'KUL', name: 'Kuala Lumpur' },
  { code: 'TRG', name: 'Terengganu' },
  { code: 'SEL', name: 'Selangor' },
  { code: 'SBH', name: 'Sabah' },
  { code: 'SWK', name: 'Sarawak' },
  { code: 'LBN', name: 'Labuan' }
];

export default function BusinessConfigPage() {
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState('business');

  useEffect(() => {
    loadBusinessProfile();
  }, []);

  const loadBusinessProfile = async () => {
    try {
      const response = await fetch('/api/admin/shipping/business-config?component=profile');
      const data = await response.json();
      
      if (data.success) {
        setProfile(data.profile);
      } else {
        setMessage({ type: 'error', text: 'Failed to load business profile' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error loading business profile' });
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!profile) return;

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/shipping/business-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_profile',
          data: profile
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage({ type: 'success', text: 'Business profile updated successfully!' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update profile' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error updating business profile' });
    } finally {
      setSaving(false);
    }
  };

  const updateProfile = (updates: Partial<BusinessProfile>) => {
    if (!profile) return;
    setProfile({ ...profile, ...updates });
  };

  const updateNestedField = (path: string[], value: any) => {
    if (!profile) return;
    
    const newProfile = { ...profile };
    let current: any = newProfile;
    
    for (let i = 0; i < path.length - 1; i++) {
      current[path[i]] = { ...current[path[i]] };
      current = current[path[i]];
    }
    
    current[path[path.length - 1]] = value;
    setProfile(newProfile);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading business configuration...</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load business configuration. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Business Shipping Configuration</h1>
        <p className="text-gray-600">
          Configure your business profile, pickup address, and courier preferences for EasyParcel integration.
        </p>
      </div>

      {message && (
        <Alert className={`mb-6 ${message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <Info className="h-4 w-4" />
          <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="business" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Business Info
          </TabsTrigger>
          <TabsTrigger value="pickup" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Pickup Address
          </TabsTrigger>
          <TabsTrigger value="couriers" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Courier Preferences
          </TabsTrigger>
          <TabsTrigger value="policies" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Shipping Policies
          </TabsTrigger>
        </TabsList>

        <TabsContent value="business" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>
                Basic business details for shipping and invoicing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="businessName">Business Name *</Label>
                  <Input
                    id="businessName"
                    value={profile.businessName}
                    onChange={(e) => updateProfile({ businessName: e.target.value })}
                    placeholder="Your business name"
                    maxLength={100}
                  />
                </div>
                <div>
                  <Label htmlFor="businessRegistration">Business Registration</Label>
                  <Input
                    id="businessRegistration"
                    value={profile.businessRegistration || ''}
                    onChange={(e) => updateProfile({ businessRegistration: e.target.value })}
                    placeholder="Registration number (optional)"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contactPerson">Contact Person *</Label>
                  <Input
                    id="contactPerson"
                    value={profile.contactPerson}
                    onChange={(e) => updateProfile({ contactPerson: e.target.value })}
                    placeholder="Primary contact person"
                    maxLength={100}
                  />
                </div>
                <div>
                  <Label htmlFor="contactPhone">Contact Phone *</Label>
                  <Input
                    id="contactPhone"
                    value={profile.contactPhone}
                    onChange={(e) => updateProfile({ contactPhone: e.target.value })}
                    placeholder="+60123456789"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="contactEmail">Contact Email *</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={profile.contactEmail}
                  onChange={(e) => updateProfile({ contactEmail: e.target.value })}
                  placeholder="business@example.com"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pickup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pickup Address</CardTitle>
              <CardDescription>
                Address where couriers will collect packages
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pickupName">Location Name *</Label>
                  <Input
                    id="pickupName"
                    value={profile.pickupAddress.name}
                    onChange={(e) => updateNestedField(['pickupAddress', 'name'], e.target.value)}
                    placeholder="Store/warehouse name"
                    maxLength={100}
                  />
                </div>
                <div>
                  <Label htmlFor="pickupPhone">Phone Number *</Label>
                  <Input
                    id="pickupPhone"
                    value={profile.pickupAddress.phone}
                    onChange={(e) => updateNestedField(['pickupAddress', 'phone'], e.target.value)}
                    placeholder="+60123456789"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="addressLine1">Address Line 1 *</Label>
                <Input
                  id="addressLine1"
                  value={profile.pickupAddress.address_line_1}
                  onChange={(e) => updateNestedField(['pickupAddress', 'address_line_1'], e.target.value)}
                  placeholder="Street address"
                  maxLength={100}
                />
              </div>

              <div>
                <Label htmlFor="addressLine2">Address Line 2</Label>
                <Input
                  id="addressLine2"
                  value={profile.pickupAddress.address_line_2 || ''}
                  onChange={(e) => updateNestedField(['pickupAddress', 'address_line_2'], e.target.value)}
                  placeholder="Unit, suite, etc. (optional)"
                  maxLength={100}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={profile.pickupAddress.city}
                    onChange={(e) => updateNestedField(['pickupAddress', 'city'], e.target.value)}
                    placeholder="City"
                    maxLength={50}
                  />
                </div>
                <div>
                  <Label htmlFor="state">State *</Label>
                  <Select
                    value={profile.pickupAddress.state}
                    onValueChange={(value) => updateNestedField(['pickupAddress', 'state'], value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {MALAYSIAN_STATES.map((state) => (
                        <SelectItem key={state.code} value={state.code}>
                          {state.name} ({state.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="postcode">Postcode *</Label>
                  <Input
                    id="postcode"
                    value={profile.pickupAddress.postcode}
                    onChange={(e) => updateNestedField(['pickupAddress', 'postcode'], e.target.value)}
                    placeholder="12345"
                    maxLength={5}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="couriers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Courier Preferences</CardTitle>
              <CardDescription>
                Configure how customers see and select courier options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Customer Choice</Label>
                  <p className="text-sm text-gray-500">Allow customers to choose their preferred courier</p>
                </div>
                <Switch
                  checked={profile.courierPreferences.showCustomerChoice}
                  onCheckedChange={(checked) => updateNestedField(['courierPreferences', 'showCustomerChoice'], checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto-Select Cheapest</Label>
                  <p className="text-sm text-gray-500">Automatically select the cheapest option when customer choice is disabled</p>
                </div>
                <Switch
                  checked={profile.courierPreferences.autoSelectCheapest}
                  onCheckedChange={(checked) => updateNestedField(['courierPreferences', 'autoSelectCheapest'], checked)}
                />
              </div>

              <div>
                <Label>Default Service Type</Label>
                <Select
                  value={profile.courierPreferences.defaultServiceType}
                  onValueChange={(value) => updateNestedField(['courierPreferences', 'defaultServiceType'], value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STANDARD">Standard Delivery</SelectItem>
                    <SelectItem value="EXPRESS">Express Delivery</SelectItem>
                    <SelectItem value="OVERNIGHT">Overnight Delivery</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  {profile.courierPreferences.showCustomerChoice 
                    ? "Customers will see all available courier options and can choose their preference."
                    : "Only business-approved couriers will be shown to customers, or automatically selected if auto-select is enabled."
                  }
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="policies" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Shipping Policies</CardTitle>
              <CardDescription>
                Set limits and policies for your shipping operations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="freeShippingThreshold">Free Shipping Threshold (RM)</Label>
                  <Input
                    id="freeShippingThreshold"
                    type="number"
                    min="0"
                    value={profile.shippingPolicies.freeShippingThreshold}
                    onChange={(e) => updateNestedField(['shippingPolicies', 'freeShippingThreshold'], Number(e.target.value))}
                  />
                  <p className="text-sm text-gray-500 mt-1">Orders above this amount get free shipping</p>
                </div>
                <div>
                  <Label htmlFor="processingDays">Processing Days</Label>
                  <Input
                    id="processingDays"
                    type="number"
                    min="0"
                    max="14"
                    value={profile.shippingPolicies.processingDays}
                    onChange={(e) => updateNestedField(['shippingPolicies', 'processingDays'], Number(e.target.value))}
                  />
                  <p className="text-sm text-gray-500 mt-1">Days before pickup/shipping</p>
                </div>
              </div>

              <div>
                <Label htmlFor="maxWeight">Maximum Weight per Parcel (kg)</Label>
                <Input
                  id="maxWeight"
                  type="number"
                  min="0.1"
                  max="70"
                  step="0.1"
                  value={profile.shippingPolicies.maxWeight}
                  onChange={(e) => updateNestedField(['shippingPolicies', 'maxWeight'], Number(e.target.value))}
                />
                <p className="text-sm text-gray-500 mt-1">Maximum weight per parcel (EasyParcel limit: 70kg)</p>
              </div>

              <div>
                <Label>Maximum Dimensions per Parcel (cm)</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div>
                    <Input
                      type="number"
                      min="1"
                      max="200"
                      placeholder="Length"
                      value={profile.shippingPolicies.maxDimensions.length}
                      onChange={(e) => updateNestedField(['shippingPolicies', 'maxDimensions', 'length'], Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Input
                      type="number"
                      min="1"
                      max="200"
                      placeholder="Width"
                      value={profile.shippingPolicies.maxDimensions.width}
                      onChange={(e) => updateNestedField(['shippingPolicies', 'maxDimensions', 'width'], Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Input
                      type="number"
                      min="1"
                      max="200"
                      placeholder="Height"
                      value={profile.shippingPolicies.maxDimensions.height}
                      onChange={(e) => updateNestedField(['shippingPolicies', 'maxDimensions', 'height'], Number(e.target.value))}
                    />
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-1">Maximum dimensions per parcel (EasyParcel limit: 200cm each)</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Service Settings</CardTitle>
              <CardDescription>
                Configure additional services like insurance and COD
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Insurance Required</Label>
                      <p className="text-sm text-gray-500">Require insurance for all shipments</p>
                    </div>
                    <Switch
                      checked={profile.serviceSettings.insuranceRequired}
                      onCheckedChange={(checked) => updateNestedField(['serviceSettings', 'insuranceRequired'], checked)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="maxInsuranceValue">Max Insurance Value (RM)</Label>
                    <Input
                      id="maxInsuranceValue"
                      type="number"
                      min="0"
                      value={profile.serviceSettings.maxInsuranceValue}
                      onChange={(e) => updateNestedField(['serviceSettings', 'maxInsuranceValue'], Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>COD Enabled</Label>
                      <p className="text-sm text-gray-500">Allow Cash on Delivery</p>
                    </div>
                    <Switch
                      checked={profile.serviceSettings.codEnabled}
                      onCheckedChange={(checked) => updateNestedField(['serviceSettings', 'codEnabled'], checked)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="maxCodAmount">Max COD Amount (RM)</Label>
                    <Input
                      id="maxCodAmount"
                      type="number"
                      min="0"
                      value={profile.serviceSettings.maxCodAmount}
                      onChange={(e) => updateNestedField(['serviceSettings', 'maxCodAmount'], Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Signature Required</Label>
                  <p className="text-sm text-gray-500">Require signature on delivery</p>
                </div>
                <Switch
                  checked={profile.serviceSettings.signatureRequired}
                  onCheckedChange={(checked) => updateNestedField(['serviceSettings', 'signatureRequired'], checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-4 mt-8">
        <Button variant="outline" onClick={loadBusinessProfile}>
          Reset Changes
        </Button>
        <Button onClick={saveProfile} disabled={saving}>
          {saving ? 'Saving...' : 'Save Configuration'}
        </Button>
      </div>
    </div>
  );
}