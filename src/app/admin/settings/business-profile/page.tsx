'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  SettingsCard,
  SettingsSection,
  SettingsInput,
  SettingsSelect,
  SettingsFormActions,
} from '@/components/settings';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  businessProfileSchema,
  malaysianStatesOptions,
} from '@/lib/validation/settings';
import type { BusinessProfileFormData } from '@/lib/validation/settings';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';

const businessTypes = [
  { value: 'SDN_BHD', label: 'Sdn Bhd (Private Limited Company)' },
  { value: 'ENTERPRISE', label: 'Enterprise' },
  { value: 'SOLE_PROPRIETOR', label: 'Sole Proprietor' },
];

export default function BusinessProfilePage() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  // Postcode validation state
  const [postcodeValidation, setPostcodeValidation] = useState<{
    registered: { valid: boolean; error?: string; loading?: boolean };
    operational: { valid: boolean; error?: string; loading?: boolean };
    shipping: { valid: boolean; error?: string; loading?: boolean };
  }>({
    registered: { valid: true },
    operational: { valid: true },
    shipping: { valid: true },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    setValue,
    watch,
    getValues,
    trigger,
  } = useForm<BusinessProfileFormData>({
    resolver: zodResolver(businessProfileSchema),
    defaultValues: {
      legalName: '',
      tradingName: '',
      registrationNumber: '',
      taxRegistrationNumber: '',
      businessType: 'SDN_BHD',
      primaryPhone: '',
      secondaryPhone: '',
      primaryEmail: '',
      supportEmail: '',
      website: '',
      logoUrl: '',
      registeredAddress: {
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'Malaysia',
      },
      operationalAddress: {
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'Malaysia',
      },
      shippingAddress: {
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'Malaysia',
      },
    },
  });

  const watchedValues = watch();

  // Helper function to handle controlled input changes and mark form as dirty
  const handleFieldChange = (
    fieldName: keyof BusinessProfileFormData | string,
    value: any
  ) => {
    setValue(fieldName as any, value, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  useEffect(() => {
    loadBusinessProfile();
  }, []);

  const loadBusinessProfile = async () => {
    try {
      console.log('[Business Profile] Loading profile...');

      const response = await fetch('/api/admin/settings/business-profile', {
        credentials: 'include',
      });

      console.log('[Business Profile] Load response status:', response.status);
      console.log('[Business Profile] Load response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const data = await response.json();
        if (data.data) {
          const profileData = data.data;
          setProfile(profileData);

          // Transform the data to match form structure
          const formData = {
            legalName: profileData.legalName || '',
            tradingName: profileData.tradingName || '',
            registrationNumber: profileData.registrationNumber || '',
            taxRegistrationNumber: profileData.taxRegistrationNumber || '',
            businessType: profileData.businessType || 'SDN_BHD',
            establishedDate: profileData.establishedDate
              ? new Date(profileData.establishedDate)
                  .toISOString()
                  .split('T')[0]
              : '',
            primaryPhone: profileData.primaryPhone || '',
            secondaryPhone: profileData.secondaryPhone || '',
            primaryEmail: profileData.primaryEmail || '',
            supportEmail: profileData.supportEmail || '',
            website: profileData.website || '',
            logoUrl: profileData.logoUrl || '',
            registeredAddress: {
              addressLine1: profileData.registeredAddress?.addressLine1 || '',
              addressLine2: profileData.registeredAddress?.addressLine2 || '',
              city: profileData.registeredAddress?.city || '',
              state: profileData.registeredAddress?.state || '',
              postalCode: profileData.registeredAddress?.postalCode || '',
              country: 'Malaysia',
            },
            operationalAddress: {
              addressLine1: profileData.operationalAddress?.addressLine1 || '',
              addressLine2: profileData.operationalAddress?.addressLine2 || '',
              city: profileData.operationalAddress?.city || '',
              state: profileData.operationalAddress?.state || '',
              postalCode: profileData.operationalAddress?.postalCode || '',
              country: 'Malaysia',
            },
            shippingAddress: {
              addressLine1: profileData.shippingAddress?.addressLine1 || '',
              addressLine2: profileData.shippingAddress?.addressLine2 || '',
              city: profileData.shippingAddress?.city || '',
              state: profileData.shippingAddress?.state || '',
              postalCode: profileData.shippingAddress?.postalCode || '',
              country: 'Malaysia',
            },
          };

          reset(formData);
        }
      } else {
        console.error('Failed to load business profile');
      }
    } catch (error) {
      console.error('Load business profile error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async (data: BusinessProfileFormData) => {
    if (!session?.user?.id) return;

    setIsSubmitting(true);
    try {
      console.log('[Business Profile] Starting save request...');
      console.log('[Business Profile] Data:', data);

      const response = await fetch('/api/admin/settings/business-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      console.log('[Business Profile] Response status:', response.status);
      console.log('[Business Profile] Response headers:', Object.fromEntries(response.headers.entries()));

      // Get response text first to debug
      const responseText = await response.text();
      console.log('[Business Profile] Response text:', responseText);

      if (!response.ok) {
        // Try to parse as JSON, fallback to text
        let errorMessage = responseText;
        try {
          const errorJson = JSON.parse(responseText);
          errorMessage = errorJson.message || errorJson.error || responseText;
        } catch (e) {
          // Response is not JSON, use text directly
          console.log('[Business Profile] Response is not JSON, using text');
        }
        throw new Error(errorMessage || 'Failed to save business profile');
      }

      // Parse successful response
      const result = JSON.parse(responseText);
      toast.success('Business profile saved successfully');

      // Reload the profile to get updated data
      await loadBusinessProfile();
    } catch (error) {
      console.error('Save business profile error:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to save business profile'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyOperationalToShipping = () => {
    // Get current operational address values from form state
    const operationalAddress = getValues('operationalAddress');
    const { addressLine1, addressLine2, city, state, postalCode } =
      operationalAddress;

    if (!addressLine1 && !city && !state && !postalCode) {
      toast.error('No operational address to copy');
      return;
    }

    // Update React Hook Form using handleFieldChange to mark as dirty
    handleFieldChange('shippingAddress.addressLine1', addressLine1 || '');
    handleFieldChange('shippingAddress.addressLine2', addressLine2 || '');
    handleFieldChange('shippingAddress.city', city || '');
    handleFieldChange('shippingAddress.state', state || '');

    // Handle postcode with validation
    if (postalCode) {
      handlePostcodeChange('shipping', postalCode);
    } else {
      handleFieldChange('shippingAddress.postalCode', '');
    }

    // Copy postcode validation state
    setPostcodeValidation(prev => ({
      ...prev,
      shipping: { ...prev.operational },
    }));

    toast.success('Copied operational address to shipping address');
  };

  const copyRegisteredToOperational = () => {
    // Get current registered address values from form state
    const registeredAddress = getValues('registeredAddress');
    const { addressLine1, addressLine2, city, state, postalCode } =
      registeredAddress;

    if (!addressLine1 && !city && !state && !postalCode) {
      toast.error('No registered address to copy');
      return;
    }

    // Update React Hook Form using handleFieldChange to mark as dirty
    handleFieldChange('operationalAddress.addressLine1', addressLine1 || '');
    handleFieldChange('operationalAddress.addressLine2', addressLine2 || '');
    handleFieldChange('operationalAddress.city', city || '');
    handleFieldChange('operationalAddress.state', state || '');

    // Handle postcode with validation
    if (postalCode) {
      handlePostcodeChange('operational', postalCode);
    } else {
      handleFieldChange('operationalAddress.postalCode', '');
    }

    // Copy postcode validation state
    setPostcodeValidation(prev => ({
      ...prev,
      operational: { ...prev.registered },
    }));

    toast.success('Copied registered address to operational address');
  };

  // Handle postcode change with auto-fill (same as checkout page)
  const handlePostcodeChange = (
    addressType: 'registered' | 'operational' | 'shipping',
    postcode: string
  ) => {
    console.log(
      `🔍 handlePostcodeChange called for ${addressType} with postcode:`,
      postcode
    );

    // Update the postcode value immediately
    const fieldPath =
      `${addressType}Address.postalCode` as keyof BusinessProfileFormData;
    setValue(fieldPath, postcode);

    // Only proceed with validation if postcode is exactly 5 digits
    if (!/^\d{5}$/.test(postcode)) {
      console.log(
        `⏭️ Skipping API call - postcode not 5 digits: "${postcode}"`
      );
      setPostcodeValidation(prev => ({
        ...prev,
        [addressType]: { valid: true, loading: false },
      }));
      return;
    }

    // Set loading state
    console.log(`⏳ Setting loading state for ${addressType}`);
    setPostcodeValidation(prev => ({
      ...prev,
      [addressType]: { valid: true, loading: true },
    }));

    // Debounce the validation and auto-fill with API call
    console.log(`⏰ Starting 500ms timeout for API call`);
    setTimeout(async () => {
      try {
        console.log(`📞 Making API call to validate postcode: ${postcode}`);
        const response = await fetch(
          `/api/postcode/validate?postcode=${encodeURIComponent(postcode)}`
        );

        if (response.ok) {
          const validation = await response.json();

          if (validation.valid && validation.location) {
            // Auto-fill state and city using database data
            // Use stateCode instead of stateName for form validation
            const cityField =
              `${addressType}Address.city` as keyof BusinessProfileFormData;
            const stateField =
              `${addressType}Address.state` as keyof BusinessProfileFormData;

            console.log(`🎯 Attempting to set fields:`, {
              cityField,
              stateField,
              city: validation.location.city,
              stateCode: validation.location.stateCode,
              currentFormValues: watchedValues,
            });

            setValue(cityField, validation.location.city);
            setValue(stateField, validation.location.stateCode);
            setValue(fieldPath, validation.formatted || postcode);

            setPostcodeValidation(prev => ({
              ...prev,
              [addressType]: { valid: true, loading: false },
            }));

            console.log(
              `✅ Successfully called setValue for ${addressType} address:`,
              {
                postcode: validation.formatted,
                state: `${validation.location.stateCode} (${validation.location.stateName})`,
                city: validation.location.city,
                zone: validation.location.zone,
                formValues: watchedValues,
              }
            );
          } else if (postcode.length === 5) {
            // Invalid postcode from database
            setPostcodeValidation(prev => ({
              ...prev,
              [addressType]: {
                valid: false,
                error: `${validation.error || 'Invalid Malaysian postcode'}. This may affect shipping calculation.`,
                loading: false,
              },
            }));
          } else {
            // Still typing
            setPostcodeValidation(prev => ({
              ...prev,
              [addressType]: { valid: true, loading: false },
            }));
          }
        } else {
          throw new Error('API request failed');
        }
      } catch (error) {
        console.error(`Error validating postcode ${postcode}:`, error);
        setPostcodeValidation(prev => ({
          ...prev,
          [addressType]: {
            valid: false,
            error: 'Postcode validation service temporarily unavailable',
            loading: false,
          },
        }));
      }
    }, 500); // 500ms debounce
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const completeness = profile ? calculateCompleteness(profile) : 0;

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <SettingsCard
        title="Profile Status"
        description="Current status of your business profile setup"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                Profile Completeness
              </p>
              <div className="flex items-center space-x-2">
                <div className="text-lg font-semibold">{completeness}%</div>
                {completeness === 100 ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
            <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
              <FileText className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Legal Status</p>
              <Badge
                variant={profile?.registrationNumber ? 'default' : 'secondary'}
              >
                {profile?.registrationNumber ? 'Registered' : 'Pending'}
              </Badge>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
            <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Clock className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Last Updated</p>
              <p className="text-sm text-gray-500">
                {profile?.updatedAt
                  ? new Date(profile.updatedAt).toLocaleDateString()
                  : 'Never'}
              </p>
            </div>
          </div>
        </div>
      </SettingsCard>

      <form onSubmit={handleSubmit(handleSaveProfile)} className="space-y-6">
        {/* Company Information */}
        <SettingsCard
          title="Company Information"
          description="Basic company details and legal information"
        >
          <SettingsSection title="Legal Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SettingsInput
                label="Legal Name"
                type="text"
                required
                value={watchedValues.legalName || ''}
                onChange={e => handleFieldChange('legalName', e.target.value)}
                error={errors.legalName?.message}
                placeholder="Enter your company's legal name"
                helperText="As registered with SSM"
              />

              <SettingsInput
                label="Trading Name"
                type="text"
                value={watchedValues.tradingName || ''}
                onChange={e => handleFieldChange('tradingName', e.target.value)}
                error={errors.tradingName?.message}
                placeholder="Enter trading name (if different)"
                helperText="Optional - only if different from legal name"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SettingsInput
                label="SSM Registration Number"
                type="text"
                required
                value={watchedValues.registrationNumber || ''}
                onChange={e =>
                  handleFieldChange('registrationNumber', e.target.value)
                }
                error={errors.registrationNumber?.message}
                placeholder="e.g., 123456-X"
                helperText="Format: 123456-X (6-8 digits followed by letter)"
              />

              <SettingsInput
                label="GST Registration Number"
                type="text"
                value={watchedValues.taxRegistrationNumber || ''}
                onChange={e =>
                  handleFieldChange('taxRegistrationNumber', e.target.value)
                }
                error={errors.taxRegistrationNumber?.message}
                placeholder="e.g., C12345678901"
                helperText="Optional - GST format: C12345678901"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SettingsSelect
                label="Business Type"
                options={businessTypes}
                value={watchedValues.businessType}
                onValueChange={value =>
                  handleFieldChange('businessType', value as any)
                }
                placeholder="Select business type"
                helperText="Choose your business entity type"
              />

              <SettingsInput
                label="Established Date"
                type="date"
                value={watchedValues.establishedDate || ''}
                onChange={e =>
                  handleFieldChange('establishedDate', e.target.value)
                }
                error={errors.establishedDate?.message}
                helperText="When was your business established"
              />
            </div>
          </SettingsSection>
        </SettingsCard>

        {/* Contact Information */}
        <SettingsCard
          title="Contact Information"
          description="Primary communication channels"
        >
          <SettingsSection title="Phone & Email">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SettingsInput
                label="Primary Phone"
                type="tel"
                required
                value={watchedValues.primaryPhone || ''}
                onChange={e =>
                  handleFieldChange('primaryPhone', e.target.value)
                }
                error={errors.primaryPhone?.message}
                placeholder="012-3456789"
                helperText="Malaysian mobile/landline number"
              />

              <SettingsInput
                label="Secondary Phone"
                type="tel"
                value={watchedValues.secondaryPhone || ''}
                onChange={e =>
                  handleFieldChange('secondaryPhone', e.target.value)
                }
                error={errors.secondaryPhone?.message}
                placeholder="03-12345678"
                helperText="Optional secondary contact"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SettingsInput
                label="Primary Email"
                type="email"
                required
                value={watchedValues.primaryEmail || ''}
                onChange={e =>
                  handleFieldChange('primaryEmail', e.target.value)
                }
                error={errors.primaryEmail?.message}
                placeholder="contact@company.com"
                helperText="Main business email address"
              />

              <SettingsInput
                label="Support Email"
                type="email"
                value={watchedValues.supportEmail || ''}
                onChange={e =>
                  handleFieldChange('supportEmail', e.target.value)
                }
                error={errors.supportEmail?.message}
                placeholder="support@company.com"
                helperText="Optional customer support email"
              />
            </div>

            <SettingsInput
              label="Website"
              type="url"
              value={watchedValues.website || ''}
              onChange={e => handleFieldChange('website', e.target.value)}
              error={errors.website?.message}
              placeholder="https://www.company.com"
              helperText="Optional company website"
            />

            <SettingsInput
              label="Logo URL"
              type="url"
              value={watchedValues.logoUrl || ''}
              onChange={e => handleFieldChange('logoUrl', e.target.value)}
              error={errors.logoUrl?.message}
              placeholder="https://www.company.com/logo.png"
              helperText="Optional company logo URL for receipts and invoices"
            />
          </SettingsSection>
        </SettingsCard>

        {/* Address Information */}
        <SettingsCard
          title="Address Information"
          description="Business addresses for different purposes"
        >
          {/* Registered Address */}
          <SettingsSection title="Registered Address">
            <div className="space-y-4">
              <SettingsInput
                label="Address Line 1"
                type="text"
                required
                value={watchedValues.registeredAddress?.addressLine1 || ''}
                onChange={e =>
                  handleFieldChange(
                    'registeredAddress.addressLine1',
                    e.target.value
                  )
                }
                error={errors.registeredAddress?.addressLine1?.message}
                placeholder="Street address, building name, unit number"
              />

              <SettingsInput
                label="Address Line 2"
                type="text"
                value={watchedValues.registeredAddress?.addressLine2 || ''}
                onChange={e =>
                  handleFieldChange(
                    'registeredAddress.addressLine2',
                    e.target.value
                  )
                }
                error={errors.registeredAddress?.addressLine2?.message}
                placeholder="Additional address details (optional)"
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Postal Code - First position for auto-fill workflow */}
                <SettingsInput
                  label={
                    <span className="text-sm font-medium">
                      Postal Code
                      {postcodeValidation.registered.loading && (
                        <span className="ml-2 text-xs text-blue-600">
                          <Loader2 className="inline h-3 w-3 animate-spin" />{' '}
                          Looking up...
                        </span>
                      )}
                    </span>
                  }
                  type="text"
                  required
                  value={watchedValues.registeredAddress?.postalCode || ''}
                  onChange={e =>
                    handlePostcodeChange('registered', e.target.value)
                  }
                  error={
                    errors.registeredAddress?.postalCode?.message ||
                    (!postcodeValidation.registered.valid
                      ? postcodeValidation.registered.error
                      : undefined)
                  }
                  placeholder="12345"
                  className={
                    !postcodeValidation.registered.valid
                      ? 'border-red-300 focus:border-red-500'
                      : postcodeValidation.registered.loading
                        ? 'border-blue-300 focus:border-blue-500'
                        : ''
                  }
                />

                {/* City - Second position, auto-filled from postcode */}
                <SettingsInput
                  label="City"
                  type="text"
                  required
                  value={watchedValues.registeredAddress?.city || ''}
                  onChange={e =>
                    handleFieldChange('registeredAddress.city', e.target.value)
                  }
                  error={errors.registeredAddress?.city?.message}
                  placeholder="City"
                />

                {/* State - Third position, auto-filled from postcode */}
                <SettingsSelect
                  label="State"
                  required
                  options={malaysianStatesOptions}
                  value={watchedValues.registeredAddress?.state || ''}
                  onValueChange={value =>
                    handleFieldChange('registeredAddress.state', value)
                  }
                  placeholder="Select state"
                />
              </div>

              {/* Postcode validation success message */}
              {postcodeValidation.registered.valid &&
                watchedValues.registeredAddress?.postalCode?.length === 5 && (
                  <p className="mt-1 text-xs text-green-600">
                    ✓ Valid Malaysian postcode
                  </p>
                )}
            </div>
          </SettingsSection>

          <Separator />

          {/* Operational Address */}
          <SettingsSection title="Operational Address">
            <div className="mb-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={copyRegisteredToOperational}
              >
                Copy from Registered Address
              </Button>
            </div>

            <div className="space-y-4">
              <SettingsInput
                label="Address Line 1"
                type="text"
                value={watchedValues.operationalAddress?.addressLine1 || ''}
                onChange={e =>
                  handleFieldChange(
                    'operationalAddress.addressLine1',
                    e.target.value
                  )
                }
                error={errors.operationalAddress?.addressLine1?.message}
                placeholder="Street address, building name, unit number"
              />

              <SettingsInput
                label="Address Line 2"
                type="text"
                value={watchedValues.operationalAddress?.addressLine2 || ''}
                onChange={e =>
                  handleFieldChange(
                    'operationalAddress.addressLine2',
                    e.target.value
                  )
                }
                error={errors.operationalAddress?.addressLine2?.message}
                placeholder="Additional address details (optional)"
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Postal Code - First position for auto-fill workflow */}
                <SettingsInput
                  label={
                    <span className="text-sm font-medium">
                      Postal Code
                      {postcodeValidation.operational.loading && (
                        <span className="ml-2 text-xs text-blue-600">
                          <Loader2 className="inline h-3 w-3 animate-spin" />{' '}
                          Looking up...
                        </span>
                      )}
                    </span>
                  }
                  type="text"
                  value={watchedValues.operationalAddress?.postalCode || ''}
                  onChange={e =>
                    handlePostcodeChange('operational', e.target.value)
                  }
                  error={
                    errors.operationalAddress?.postalCode?.message ||
                    (!postcodeValidation.operational.valid
                      ? postcodeValidation.operational.error
                      : undefined)
                  }
                  placeholder="12345"
                  className={
                    !postcodeValidation.operational.valid
                      ? 'border-red-300 focus:border-red-500'
                      : postcodeValidation.operational.loading
                        ? 'border-blue-300 focus:border-blue-500'
                        : ''
                  }
                />

                {/* City - Second position, auto-filled from postcode */}
                <SettingsInput
                  label="City"
                  type="text"
                  value={watchedValues.operationalAddress?.city || ''}
                  onChange={e =>
                    handleFieldChange('operationalAddress.city', e.target.value)
                  }
                  error={errors.operationalAddress?.city?.message}
                  placeholder="City"
                />

                {/* State - Third position, auto-filled from postcode */}
                <SettingsSelect
                  label="State"
                  options={malaysianStatesOptions}
                  value={watchedValues.operationalAddress?.state || ''}
                  onValueChange={value =>
                    handleFieldChange('operationalAddress.state', value)
                  }
                  placeholder="Select state"
                />
              </div>

              {/* Postcode validation success message */}
              {postcodeValidation.operational.valid &&
                watchedValues.operationalAddress?.postalCode?.length === 5 && (
                  <p className="mt-1 text-xs text-green-600">
                    ✓ Valid Malaysian postcode
                  </p>
                )}
            </div>
          </SettingsSection>

          <Separator />

          {/* Shipping Address */}
          <SettingsSection title="Default Shipping Address">
            <div className="mb-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={copyOperationalToShipping}
              >
                Copy from Operational Address
              </Button>
            </div>

            <div className="space-y-4">
              <SettingsInput
                label="Address Line 1"
                type="text"
                value={watchedValues.shippingAddress?.addressLine1 || ''}
                onChange={e =>
                  handleFieldChange(
                    'shippingAddress.addressLine1',
                    e.target.value
                  )
                }
                error={errors.shippingAddress?.addressLine1?.message}
                placeholder="Street address, building name, unit number"
              />

              <SettingsInput
                label="Address Line 2"
                type="text"
                value={watchedValues.shippingAddress?.addressLine2 || ''}
                onChange={e =>
                  handleFieldChange(
                    'shippingAddress.addressLine2',
                    e.target.value
                  )
                }
                error={errors.shippingAddress?.addressLine2?.message}
                placeholder="Additional address details (optional)"
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Postal Code - First position for auto-fill workflow */}
                <SettingsInput
                  label={
                    <span className="text-sm font-medium">
                      Postal Code
                      {postcodeValidation.shipping.loading && (
                        <span className="ml-2 text-xs text-blue-600">
                          <Loader2 className="inline h-3 w-3 animate-spin" />{' '}
                          Looking up...
                        </span>
                      )}
                    </span>
                  }
                  type="text"
                  value={watchedValues.shippingAddress?.postalCode || ''}
                  onChange={e =>
                    handlePostcodeChange('shipping', e.target.value)
                  }
                  error={
                    errors.shippingAddress?.postalCode?.message ||
                    (!postcodeValidation.shipping.valid
                      ? postcodeValidation.shipping.error
                      : undefined)
                  }
                  placeholder="12345"
                  className={
                    !postcodeValidation.shipping.valid
                      ? 'border-red-300 focus:border-red-500'
                      : postcodeValidation.shipping.loading
                        ? 'border-blue-300 focus:border-blue-500'
                        : ''
                  }
                />

                {/* City - Second position, auto-filled from postcode */}
                <SettingsInput
                  label="City"
                  type="text"
                  value={watchedValues.shippingAddress?.city || ''}
                  onChange={e =>
                    handleFieldChange('shippingAddress.city', e.target.value)
                  }
                  error={errors.shippingAddress?.city?.message}
                  placeholder="City"
                />

                {/* State - Third position, auto-filled from postcode */}
                <SettingsSelect
                  label="State"
                  options={malaysianStatesOptions}
                  value={watchedValues.shippingAddress?.state || ''}
                  onValueChange={value =>
                    handleFieldChange('shippingAddress.state', value)
                  }
                  placeholder="Select state"
                />
              </div>

              {/* Postcode validation success message */}
              {postcodeValidation.shipping.valid &&
                watchedValues.shippingAddress?.postalCode?.length === 5 && (
                  <p className="mt-1 text-xs text-green-600">
                    ✓ Valid Malaysian postcode
                  </p>
                )}
            </div>
          </SettingsSection>
        </SettingsCard>

        {/* Save Actions */}
        <SettingsFormActions>
          <Button
            type="button"
            variant="outline"
            disabled={!isDirty || isSubmitting}
            onClick={() => loadBusinessProfile()}
          >
            Reset Changes
          </Button>
          <Button type="submit" disabled={!isDirty || isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Business Profile'}
          </Button>
        </SettingsFormActions>
      </form>
    </div>
  );
}

/**
 * Calculate business profile completeness percentage
 */
function calculateCompleteness(profile: any): number {
  if (!profile) return 0;

  const requiredFields = [
    'legalName',
    'registrationNumber',
    'primaryPhone',
    'primaryEmail',
  ];

  const addressFields = ['registeredAddress'];

  let completedFields = 0;
  let totalFields = requiredFields.length + addressFields.length;

  // Check basic fields
  requiredFields.forEach(field => {
    if (profile[field] && profile[field].trim() !== '') {
      completedFields++;
    }
  });

  // Check address fields
  if (profile.registeredAddress && profile.registeredAddress.addressLine1) {
    completedFields++;
  }

  // Optional bonus points for additional info
  if (profile.tradingName) totalFields += 0.5;
  if (profile.taxRegistrationNumber) totalFields += 0.5;
  if (profile.operationalAddress?.addressLine1) totalFields += 0.5;

  if (profile.tradingName && profile.tradingName.trim() !== '')
    completedFields += 0.5;
  if (
    profile.taxRegistrationNumber &&
    profile.taxRegistrationNumber.trim() !== ''
  )
    completedFields += 0.5;
  if (profile.operationalAddress?.addressLine1) completedFields += 0.5;

  return Math.round((completedFields / totalFields) * 100);
}
