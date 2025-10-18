'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  SettingsLayout,
  SettingsCard,
  SettingsSection,
  SettingsInput,
  SettingsSelect,
  SettingsSwitch,
  SettingsFormActions,
} from '@/components/settings';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  addressSchema,
  malaysianStatesOptions,
} from '@/lib/validation/settings';
import type { AddressFormData } from '@/lib/validation/settings';
import { Plus, MapPin, Edit, Trash2, Home, Building, Star } from 'lucide-react';

interface Address {
  id: string;
  type: 'billing' | 'shipping';
  firstName: string;
  lastName: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AddressManagementPage() {
  const { data: session } = useSession();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      type: 'shipping',
      country: 'Malaysia',
      isDefault: false,
    },
  });

  const addressType = watch('type');

  // Load addresses on component mount
  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      const response = await fetch('/api/settings/addresses');
      if (response.ok) {
        const data = await response.json();
        setAddresses(data.data || []);
      } else {
        toast.error('Failed to load addresses');
      }
    } catch (error) {
      console.error('Load addresses error:', error);
      toast.error('Failed to load addresses');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddressSubmit = async (data: AddressFormData) => {
    if (!session?.user?.id) return;

    setIsSubmitting(true);
    try {
      const url = editingAddress
        ? `/api/settings/addresses/${editingAddress.id}`
        : '/api/settings/addresses';

      const method = editingAddress ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save address');
      }

      toast.success(
        editingAddress
          ? 'Address updated successfully'
          : 'Address added successfully'
      );

      // Reload addresses and close dialog
      await loadAddresses();
      setIsDialogOpen(false);
      setEditingAddress(null);
      reset({
        type: 'shipping',
        country: 'Malaysia',
        isDefault: false,
      });
    } catch (error) {
      console.error('Address submit error:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to save address'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address);
    reset({
      type: address.type,
      firstName: address.firstName,
      lastName: address.lastName,
      company: address.company || '',
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || '',
      city: address.city,
      state: address.state as any,
      postalCode: address.postalCode,
      country: address.country as 'Malaysia',
      phone: address.phone || '',
      isDefault: address.isDefault,
    });
    setIsDialogOpen(true);
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;

    try {
      const response = await fetch(`/api/settings/addresses/${addressId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete address');
      }

      toast.success('Address deleted successfully');
      await loadAddresses();
    } catch (error) {
      console.error('Delete address error:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete address'
      );
    }
  };

  const handleSetDefaultAddress = async (
    addressId: string,
    type: 'billing' | 'shipping'
  ) => {
    try {
      const response = await fetch(
        `/api/settings/addresses/${addressId}/default`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to set default address');
      }

      toast.success(`Default ${type} address updated`);
      await loadAddresses();
    } catch (error) {
      console.error('Set default address error:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to set default address'
      );
    }
  };

  const openNewAddressDialog = () => {
    setEditingAddress(null);
    reset({
      type: 'shipping',
      country: 'Malaysia',
      isDefault: false,
    });
    setIsDialogOpen(true);
  };

  const getStateLabel = (stateCode: string) => {
    const state = malaysianStatesOptions.find(s => s.value === stateCode);
    return state?.label || stateCode;
  };

  if (isLoading) {
    return <div className="flex justify-center py-8">Loading addresses...</div>;
  }

  const shippingAddresses = addresses.filter(addr => addr.type === 'shipping');
  const billingAddresses = addresses.filter(addr => addr.type === 'billing');

  return (
    <SettingsLayout
      title="Address Management"
      subtitle="Manage your shipping and billing addresses"
      actions={
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewAddressDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Address
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingAddress ? 'Edit Address' : 'Add New Address'}
              </DialogTitle>
            </DialogHeader>

            <form
              onSubmit={handleSubmit(handleAddressSubmit)}
              className="space-y-6"
            >
              <SettingsSection title="Address Type">
                <SettingsSelect
                  label="Address Type"
                  options={[
                    { value: 'shipping', label: 'Shipping Address' },
                    { value: 'billing', label: 'Billing Address' },
                  ]}
                  value={addressType}
                  onValueChange={value =>
                    setValue('type', value as 'billing' | 'shipping')
                  }
                  required
                  error={errors.type?.message}
                />
              </SettingsSection>

              <SettingsSection title="Contact Information">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SettingsInput
                    label="First Name"
                    required
                    {...register('firstName')}
                    error={errors.firstName?.message}
                    placeholder="Enter first name"
                  />

                  <SettingsInput
                    label="Last Name"
                    required
                    {...register('lastName')}
                    error={errors.lastName?.message}
                    placeholder="Enter last name"
                  />
                </div>

                <SettingsInput
                  label="Company (Optional)"
                  {...register('company')}
                  error={errors.company?.message}
                  placeholder="Enter company name"
                />

                <SettingsInput
                  label="Phone Number (Optional)"
                  type="tel"
                  {...register('phone')}
                  error={errors.phone?.message}
                  placeholder="012-3456789"
                  helperText="Malaysian mobile number"
                />
              </SettingsSection>

              <SettingsSection title="Address Details">
                <SettingsInput
                  label="Address Line 1"
                  required
                  {...register('addressLine1')}
                  error={errors.addressLine1?.message}
                  placeholder="Street address, building number"
                />

                <SettingsInput
                  label="Address Line 2 (Optional)"
                  {...register('addressLine2')}
                  error={errors.addressLine2?.message}
                  placeholder="Apartment, suite, floor, etc."
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SettingsInput
                    label="City"
                    required
                    {...register('city')}
                    error={errors.city?.message}
                    placeholder="Enter city"
                  />

                  <SettingsSelect
                    label="State"
                    options={malaysianStatesOptions}
                    {...register('state')}
                    error={errors.state?.message}
                    placeholder="Select state"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SettingsInput
                    label="Postal Code"
                    required
                    {...register('postalCode')}
                    error={errors.postalCode?.message}
                    placeholder="12345"
                    helperText="5-digit Malaysian postal code"
                  />

                  <SettingsInput
                    label="Country"
                    value="Malaysia"
                    disabled
                    helperText="Currently only serving Malaysia"
                  />
                </div>
              </SettingsSection>

              <SettingsSection title="Preferences">
                <SettingsSwitch
                  label={`Set as default ${addressType} address`}
                  description={`Use this address as your default ${addressType} address for future orders`}
                  checked={watch('isDefault')}
                  onCheckedChange={checked => setValue('isDefault', checked)}
                />
              </SettingsSection>

              <SettingsFormActions>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setEditingAddress(null);
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  loading={isSubmitting}
                >
                  {isSubmitting
                    ? editingAddress
                      ? 'Updating...'
                      : 'Adding...'
                    : editingAddress
                      ? 'Update Address'
                      : 'Add Address'}
                </Button>
              </SettingsFormActions>
            </form>
          </DialogContent>
        </Dialog>
      }
    >
      {/* Shipping Addresses */}
      <SettingsCard
        title="Shipping Addresses"
        description="Addresses where your orders will be delivered"
      >
        {shippingAddresses.length === 0 ? (
          <div className="text-center py-8">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">
              No shipping addresses added yet
            </p>
            <Button onClick={openNewAddressDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Shipping Address
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {shippingAddresses.map(address => (
              <div key={address.id} className="border rounded-lg p-4 relative">
                {address.isDefault && (
                  <div className="absolute top-3 right-3">
                    <Badge variant="default" className="flex items-center">
                      <Star className="h-3 w-3 mr-1" />
                      Default
                    </Badge>
                  </div>
                )}

                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center space-x-2">
                      <Home className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">
                        {address.firstName} {address.lastName}
                      </span>
                      {address.company && (
                        <>
                          <span className="text-gray-400">•</span>
                          <span className="text-gray-600">
                            {address.company}
                          </span>
                        </>
                      )}
                    </div>

                    <div className="text-sm text-gray-600 ml-6">
                      <p>{address.addressLine1}</p>
                      {address.addressLine2 && <p>{address.addressLine2}</p>}
                      <p>
                        {address.city}, {getStateLabel(address.state)}{' '}
                        {address.postalCode}
                      </p>
                      <p>{address.country}</p>
                      {address.phone && <p>Phone: {address.phone}</p>}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    {!address.isDefault && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleSetDefaultAddress(address.id, 'shipping')
                        }
                      >
                        Set Default
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditAddress(address)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteAddress(address.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SettingsCard>

      {/* Billing Addresses */}
      <SettingsCard
        title="Billing Addresses"
        description="Addresses for billing and invoice purposes"
      >
        {billingAddresses.length === 0 ? (
          <div className="text-center py-8">
            <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No billing addresses added yet</p>
            <Button
              onClick={() => {
                setValue('type', 'billing');
                openNewAddressDialog();
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Billing Address
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {billingAddresses.map(address => (
              <div key={address.id} className="border rounded-lg p-4 relative">
                {address.isDefault && (
                  <div className="absolute top-3 right-3">
                    <Badge variant="default" className="flex items-center">
                      <Star className="h-3 w-3 mr-1" />
                      Default
                    </Badge>
                  </div>
                )}

                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center space-x-2">
                      <Building className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">
                        {address.firstName} {address.lastName}
                      </span>
                      {address.company && (
                        <>
                          <span className="text-gray-400">•</span>
                          <span className="text-gray-600">
                            {address.company}
                          </span>
                        </>
                      )}
                    </div>

                    <div className="text-sm text-gray-600 ml-6">
                      <p>{address.addressLine1}</p>
                      {address.addressLine2 && <p>{address.addressLine2}</p>}
                      <p>
                        {address.city}, {getStateLabel(address.state)}{' '}
                        {address.postalCode}
                      </p>
                      <p>{address.country}</p>
                      {address.phone && <p>Phone: {address.phone}</p>}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    {!address.isDefault && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleSetDefaultAddress(address.id, 'billing')
                        }
                      >
                        Set Default
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditAddress(address)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteAddress(address.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SettingsCard>
    </SettingsLayout>
  );
}
