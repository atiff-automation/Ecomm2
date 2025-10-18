'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
  Save,
  Upload,
  X,
  Image as ImageIcon,
  Building2,
  Phone,
  Mail,
  MapPin,
  FileText,
  Hash,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CompanyInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  registrationNo: string;
  sstNo: string;
  website?: string;
  logoUrl?: string;
  logoEnabled: boolean;
}

interface CompanyInfoEditorProps {
  className?: string;
}

export const CompanyInfoEditor: React.FC<CompanyInfoEditorProps> = ({
  className,
}) => {
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    name: '',
    address: '',
    phone: '',
    email: '',
    registrationNo: '',
    sstNo: '',
    website: '',
    logoUrl: '',
    logoEnabled: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadCompanyInfo();
  }, []);

  const loadCompanyInfo = async () => {
    try {
      setLoading(true);

      // First try to load from business profile
      const businessResponse = await fetch('/api/admin/business-profile');
      let businessProfile = null;

      if (businessResponse.ok) {
        const data = await businessResponse.json();
        businessProfile = data.profile;
      }

      // Also load system config for receipt-specific settings
      const configResponse = await fetch(
        '/api/admin/system-config?keys=receipt_company_logo_enabled,receipt_footer_message'
      );
      let systemConfig = {};

      if (configResponse.ok) {
        const data = await configResponse.json();
        systemConfig = data.config;
      }

      // Merge data from different sources
      setCompanyInfo({
        name:
          businessProfile?.legalName ||
          process.env.NEXT_PUBLIC_COMPANY_NAME ||
          'JRM E-commerce Sdn Bhd',
        address:
          businessProfile?.registeredAddress?.addressLine1 ||
          'Kuala Lumpur, Malaysia',
        phone: businessProfile?.primaryPhone || '+60 3-1234 5678',
        email: businessProfile?.primaryEmail || 'info@jrmecommerce.com',
        registrationNo: businessProfile?.registrationNumber || '202301234567',
        sstNo: businessProfile?.taxRegistrationNumber || 'A12-3456-78901234',
        website: businessProfile?.website || '',
        logoUrl: businessProfile?.logoUrl || '',
        logoEnabled: systemConfig.receipt_company_logo_enabled === 'true',
      });

      setHasChanges(false);
    } catch (error) {
      console.error('Error loading company info:', error);
      toast.error('Failed to load company information');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    field: keyof CompanyInfo,
    value: string | boolean
  ) => {
    setCompanyInfo(prev => ({
      ...prev,
      [field]: value,
    }));
    setHasChanges(true);
  };

  const handleLogoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('usage', 'company-logo');

      const response = await fetch('/api/admin/media/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload logo');
      }

      const data = await response.json();
      handleInputChange('logoUrl', data.url);
      toast.success('Logo uploaded successfully');
    } catch (error) {
      console.error('Logo upload error:', error);
      toast.error('Failed to upload logo');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = () => {
    handleInputChange('logoUrl', '');
    toast.success('Logo removed');
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Save to business profile
      const businessResponse = await fetch('/api/admin/business-profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          legalName: companyInfo.name,
          primaryPhone: companyInfo.phone,
          primaryEmail: companyInfo.email,
          registrationNumber: companyInfo.registrationNo,
          taxRegistrationNumber: companyInfo.sstNo,
          website: companyInfo.website,
          logoUrl: companyInfo.logoUrl,
          registeredAddress: {
            addressLine1: companyInfo.address,
          },
        }),
      });

      // Save system config for receipt-specific settings
      const configResponse = await fetch('/api/admin/system-config', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receipt_company_logo_enabled: companyInfo.logoEnabled.toString(),
        }),
      });

      if (!businessResponse.ok && !configResponse.ok) {
        throw new Error('Failed to save company information');
      }

      toast.success('Company information saved successfully');
      setHasChanges(false);
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save company information');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    loadCompanyInfo();
    toast.success('Changes reset');
  };

  if (loading) {
    return (
      <div className={cn('space-y-6', className)}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-5 bg-gray-200 rounded w-1/4"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Save Actions */}
      {hasChanges && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-orange-800">
                <FileText className="h-4 w-4" />
                <span className="text-sm font-medium">
                  You have unsaved changes
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleReset}>
                  Reset
                </Button>
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <>
                      <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-3 w-3 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Company Logo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Company Logo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="logo-enabled"
              checked={companyInfo.logoEnabled}
              onCheckedChange={checked =>
                handleInputChange('logoEnabled', checked)
              }
            />
            <Label htmlFor="logo-enabled">Display logo on receipts</Label>
          </div>

          {companyInfo.logoEnabled && (
            <div className="space-y-4">
              {/* Current Logo */}
              {companyInfo.logoUrl && (
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <img
                      src={companyInfo.logoUrl}
                      alt="Company Logo"
                      className="w-32 h-20 object-contain border rounded-lg"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleRemoveLogo}
                      className="absolute -top-2 -right-2 h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>Current logo</p>
                    <p>Recommended: 300x120px, PNG/JPG, max 5MB</p>
                  </div>
                </div>
              )}

              {/* Upload Button */}
              <div>
                <Label htmlFor="logo-upload" className="sr-only">
                  Upload Logo
                </Label>
                <Button
                  variant="outline"
                  onClick={() =>
                    document.getElementById('logo-upload')?.click()
                  }
                  disabled={uploading}
                  className="w-full sm:w-auto"
                >
                  {uploading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      {companyInfo.logoUrl ? 'Change Logo' : 'Upload Logo'}
                    </>
                  )}
                </Button>
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company-name">Company Name *</Label>
              <Input
                id="company-name"
                value={companyInfo.name}
                onChange={e => handleInputChange('name', e.target.value)}
                placeholder="Enter company name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={companyInfo.website}
                onChange={e => handleInputChange('website', e.target.value)}
                placeholder="https://example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address *</Label>
            <Textarea
              id="address"
              value={companyInfo.address}
              onChange={e => handleInputChange('address', e.target.value)}
              placeholder="Enter complete company address"
              rows={3}
              required
            />
            <p className="text-xs text-muted-foreground">
              This address will appear on all receipts and invoices
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  value={companyInfo.phone}
                  onChange={e => handleInputChange('phone', e.target.value)}
                  placeholder="+60 3-1234 5678"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={companyInfo.email}
                  onChange={e => handleInputChange('email', e.target.value)}
                  placeholder="info@company.com"
                  className="pl-10"
                  required
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Registration Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            Registration Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="registration-no">Registration Number *</Label>
              <Input
                id="registration-no"
                value={companyInfo.registrationNo}
                onChange={e =>
                  handleInputChange('registrationNo', e.target.value)
                }
                placeholder="202301234567"
                required
              />
              <p className="text-xs text-muted-foreground">
                Company registration number (SSM)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sst-no">SST Number *</Label>
              <Input
                id="sst-no"
                value={companyInfo.sstNo}
                onChange={e => handleInputChange('sstNo', e.target.value)}
                placeholder="A12-3456-78901234"
                required
              />
              <p className="text-xs text-muted-foreground">
                Sales and Service Tax registration number
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Final Save Action */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={!hasChanges || saving}>
          {saving ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Company Information
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
