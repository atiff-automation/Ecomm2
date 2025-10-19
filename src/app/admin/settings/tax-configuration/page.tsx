'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  SettingsCard,
  SettingsSection,
  SettingsInput,
  SettingsSwitch,
  SettingsFormActions,
} from '@/components/settings';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { taxConfigurationSchema } from '@/lib/validation/settings';
import type { TaxConfigurationFormData } from '@/lib/validation/settings';
import {
  Calculator,
  Percent,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Plus,
  Trash2,
  Info,
  Building2,
  FileText,
} from 'lucide-react';
import Link from 'next/link';

export default function TaxConfigurationPage() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [taxConfig, setTaxConfig] = useState<any>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    setValue,
    watch,
    control,
  } = useForm<TaxConfigurationFormData>({
    resolver: zodResolver(taxConfigurationSchema),
    defaultValues: {
      gstRegistered: false,
      gstNumber: '',
      sstRegistered: false,
      sstNumber: '',
      defaultGstRate: 6.0,
      defaultSstRate: 10.0,
      taxInclusivePricing: false,
      autoCalculateTax: true,
    },
  });

  const {
    fields: taxRateFields,
    append: addTaxRate,
    remove: removeTaxRate,
  } = useFieldArray({
    control,
    name: 'taxRates',
  });

  const watchedValues = watch();

  useEffect(() => {
    loadTaxConfiguration();
  }, []);

  const loadTaxConfiguration = async () => {
    try {
      const response = await fetch('/api/admin/settings/tax-configuration');
      if (response.ok) {
        const data = await response.json();
        if (data.data) {
          const configData = data.data;
          setTaxConfig(configData);

          // Transform the data to match form structure
          const formData = {
            gstRegistered: configData.gstRegistered || false,
            gstNumber: configData.gstNumber || '',
            sstRegistered: configData.sstRegistered || false,
            sstNumber: configData.sstNumber || '',
            defaultGstRate: configData.defaultGstRate || 6.0,
            defaultSstRate: configData.defaultSstRate || 10.0,
            taxInclusivePricing: configData.taxInclusivePricing || false,
            autoCalculateTax: configData.autoCalculateTax !== false, // Default to true
            taxRates: configData.taxRates || [],
          };

          reset(formData);
        }
      } else if (response.status === 404) {
        // No configuration exists yet, use defaults
        console.log('No tax configuration found, using defaults');
      } else {
        console.error('Failed to load tax configuration');
      }
    } catch (error) {
      console.error('Load tax configuration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveTaxConfig = async (data: TaxConfigurationFormData) => {
    if (!session?.user?.id) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/admin/settings/tax-configuration', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save tax configuration');
      }

      const result = await response.json();
      toast.success('Tax configuration saved successfully');

      // Reload the configuration to get updated data
      await loadTaxConfiguration();
    } catch (error) {
      console.error('Save tax configuration error:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to save tax configuration'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const addCustomTaxRate = () => {
    addTaxRate({
      name: '',
      rate: 0,
      type: 'GST',
      description: '',
      isActive: true,
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const hasGstRegistration = watchedValues.gstRegistered;
  const hasSstRegistration = watchedValues.sstRegistered;
  const isConfigured = hasGstRegistration || hasSstRegistration;

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <SettingsCard
        title="Tax Status Overview"
        description="Current tax registration and configuration status"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                GST Registration
              </p>
              <Badge variant={hasGstRegistration ? 'default' : 'secondary'}>
                {hasGstRegistration ? 'Registered' : 'Not Registered'}
              </Badge>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
            <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
              <Calculator className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                SST Registration
              </p>
              <Badge variant={hasSstRegistration ? 'default' : 'secondary'}>
                {hasSstRegistration ? 'Registered' : 'Not Registered'}
              </Badge>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
            <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                Auto Calculate
              </p>
              <Badge
                variant={
                  watchedValues.autoCalculateTax ? 'default' : 'secondary'
                }
              >
                {watchedValues.autoCalculateTax ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
          </div>
        </div>
      </SettingsCard>

      <form onSubmit={handleSubmit(handleSaveTaxConfig)} className="space-y-6">
        {/* GST Configuration */}
        <SettingsCard
          title="Goods and Services Tax (GST)"
          description="Manage your GST registration and rates"
        >
          <SettingsSection title="GST Registration">
            <div className="space-y-4">
              <SettingsSwitch
                label="GST Registered"
                description="Enable if your business is registered for GST"
                checked={watchedValues.gstRegistered}
                onCheckedChange={checked => setValue('gstRegistered', checked)}
              />

              {hasGstRegistration && (
                <div className="space-y-4 ml-6">
                  <SettingsInput
                    label="GST Registration Number"
                    type="text"
                    {...register('gstNumber')}
                    error={errors.gstNumber?.message}
                    placeholder="e.g., C12345678901"
                    helperText="Format: C followed by 11 digits"
                  />

                  <SettingsInput
                    label="Default GST Rate (%)"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    {...register('defaultGstRate', { valueAsNumber: true })}
                    error={errors.defaultGstRate?.message}
                    placeholder="6.00"
                    helperText="Standard GST rate in Malaysia is 6%"
                  />
                </div>
              )}
            </div>
          </SettingsSection>

          {hasGstRegistration && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mt-4">
              <div className="flex items-start space-x-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-blue-800">
                    GST Information
                  </h4>
                  <p className="text-sm text-blue-700">
                    Malaysia's standard GST rate is 6%. Zero-rated and exempt
                    supplies have different treatment under GST law.
                  </p>
                </div>
              </div>
            </div>
          )}
        </SettingsCard>

        {/* SST Configuration */}
        <SettingsCard
          title="Sales and Service Tax (SST)"
          description="Configure your SST registration and rates"
        >
          <SettingsSection title="SST Registration">
            <div className="space-y-4">
              <SettingsSwitch
                label="SST Registered"
                description="Enable if your business is registered for SST"
                checked={watchedValues.sstRegistered}
                onCheckedChange={checked => setValue('sstRegistered', checked)}
              />

              {hasSstRegistration && (
                <div className="space-y-4 ml-6">
                  <SettingsInput
                    label="SST Registration Number"
                    type="text"
                    {...register('sstNumber')}
                    error={errors.sstNumber?.message}
                    placeholder="SST registration number"
                    helperText="Your SST registration number as issued by authorities"
                  />

                  <SettingsInput
                    label="Default SST Rate (%)"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    {...register('defaultSstRate', { valueAsNumber: true })}
                    error={errors.defaultSstRate?.message}
                    placeholder="10.00"
                    helperText="Standard SST rate for services is typically 6-10%"
                  />
                </div>
              )}
            </div>
          </SettingsSection>

          {hasSstRegistration && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg mt-4">
              <div className="flex items-start space-x-3">
                <Info className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-green-800">
                    SST Information
                  </h4>
                  <p className="text-sm text-green-700">
                    SST applies to taxable goods and services. Sales tax is
                    typically 10% and service tax is 6%.
                  </p>
                </div>
              </div>
            </div>
          )}
        </SettingsCard>

        {/* Tax Calculation Settings */}
        <SettingsCard
          title="Tax Calculation Settings"
          description="Configure how taxes are calculated and displayed"
        >
          <SettingsSection title="Calculation Options">
            <div className="space-y-4">
              <SettingsSwitch
                label="Tax Inclusive Pricing"
                description="Show prices with tax included by default"
                checked={watchedValues.taxInclusivePricing}
                onCheckedChange={checked =>
                  setValue('taxInclusivePricing', checked)
                }
              />

              <SettingsSwitch
                label="Auto Calculate Tax"
                description="Automatically calculate tax on orders and invoices"
                checked={watchedValues.autoCalculateTax}
                onCheckedChange={checked =>
                  setValue('autoCalculateTax', checked)
                }
              />
            </div>
          </SettingsSection>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mt-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-amber-800">
                  Tax Calculation Impact
                </h4>
                <p className="text-sm text-amber-700">
                  Changes to tax settings will affect new orders and invoices.
                  Existing records remain unchanged.
                </p>
              </div>
            </div>
          </div>
        </SettingsCard>

        {/* Custom Tax Rates */}
        {isConfigured && (
          <SettingsCard
            title="Custom Tax Rates"
            description="Define custom tax rates for specific products or services"
          >
            <SettingsSection title="Tax Rate Rules">
              <div className="space-y-4">
                {taxRateFields.map((field, index) => (
                  <div
                    key={field.id}
                    className="p-4 border rounded-lg bg-gray-50"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">
                        Tax Rate #{index + 1}
                      </h4>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeTaxRate(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <SettingsInput
                        label="Rate Name"
                        type="text"
                        {...register(`taxRates.${index}.name`)}
                        placeholder="e.g., Zero Rate, Exempt"
                      />

                      <SettingsInput
                        label="Rate (%)"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        {...register(`taxRates.${index}.rate`, {
                          valueAsNumber: true,
                        })}
                        placeholder="0.00"
                      />
                    </div>

                    <div className="mt-4">
                      <SettingsInput
                        label="Description"
                        type="text"
                        {...register(`taxRates.${index}.description`)}
                        placeholder="When to apply this rate"
                      />
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={addCustomTaxRate}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Custom Tax Rate
                </Button>
              </div>
            </SettingsSection>
          </SettingsCard>
        )}

        {/* Save Actions */}
        <SettingsFormActions>
          <Button
            type="button"
            variant="outline"
            disabled={!isDirty || isSubmitting}
            onClick={() => loadTaxConfiguration()}
          >
            Reset Changes
          </Button>
          <Button
            type="submit"
            disabled={!isDirty || isSubmitting}
            loading={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save Tax Configuration'}
          </Button>
        </SettingsFormActions>
      </form>

      {/* Tax Compliance Information */}
      <SettingsCard
        title="Tax Compliance"
        description="Important information about Malaysian tax requirements"
      >
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">
              GST Registration Threshold
            </h4>
            <p className="text-sm text-gray-600">
              Businesses with annual taxable turnover of RM 500,000 or more must
              register for GST. Voluntary registration is available for
              businesses below this threshold.
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">
              SST Registration Requirements
            </h4>
            <p className="text-sm text-gray-600">
              Manufacturers with annual turnover exceeding RM 500,000 must
              register for Sales Tax. Service providers with annual turnover
              exceeding RM 150,000 must register for Service Tax.
            </p>
          </div>
        </div>
      </SettingsCard>
    </div>
  );
}
