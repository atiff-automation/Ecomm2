/**
 * GuestTrackingForm Component
 * Form for guest customers to lookup order tracking
 * Based on CUSTOMER_TRACKING_IMPLEMENTATION_PLAN.md
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  Mail, 
  Phone, 
  Package, 
  AlertCircle,
  Loader2,
  Info
} from 'lucide-react';
import { TRACKING_CONFIG, validateOrderNumber, formatOrderNumber } from '@/lib/config/tracking';
import { GuestTrackingRequest, GuestTrackingFormProps, FormValidationErrors } from '@/lib/types/tracking';

interface GuestTrackingRequest {
  orderNumber: string;
  email?: string;
  phone?: string;
}

interface GuestTrackingFormProps {
  onSubmit: (data: GuestTrackingRequest) => void;
  loading?: boolean;
  error?: string;
  className?: string;
}

export default function GuestTrackingForm({
  onSubmit,
  loading = false,
  error,
  className = ''
}: GuestTrackingFormProps) {
  const [formData, setFormData] = useState<GuestTrackingRequest>({
    orderNumber: '',
    email: '',
    phone: ''
  });
  const [verificationMethod, setVerificationMethod] = useState<'email' | 'phone'>('email');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  /**
   * Validate form inputs
   */
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Validate order number format
    if (!formData.orderNumber) {
      errors.orderNumber = 'Order number is required';
    } else if (!/^ORD-\d{8}-\w{4}$/i.test(formData.orderNumber)) {
      errors.orderNumber = 'Invalid order number format (e.g., ORD-20250821-A1B2)';
    }

    // Validate verification method
    if (verificationMethod === 'email') {
      if (!formData.email) {
        errors.email = 'Email address is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.email = 'Please enter a valid email address';
      }
    } else {
      if (!formData.phone) {
        errors.phone = 'Phone number is required';
      } else if (!/^(\+?6?0?1[0-9]-?[0-9]{7,8}|[\d\s\-\+\(\)]{8,15})$/.test(formData.phone.replace(/\s/g, ''))) {
        errors.phone = 'Please enter a valid phone number';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Prepare submission data
    const submissionData: GuestTrackingRequest = {
      orderNumber: formData.orderNumber.toUpperCase(),
    };

    if (verificationMethod === 'email') {
      submissionData.email = formData.email?.toLowerCase();
    } else {
      submissionData.phone = formData.phone?.replace(/\s/g, '');
    }

    onSubmit(submissionData);
  };

  /**
   * Handle input changes
   */
  const handleInputChange = (field: keyof GuestTrackingRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const { [field]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  /**
   * Format order number as user types
   */
  const formatOrderNumber = (value: string) => {
    const cleaned = value.replace(/[^a-zA-Z0-9]/g, '');
    const upperCased = cleaned.toUpperCase();
    
    // Auto-format to ORD-YYYYMMDD-XXXX pattern
    if (upperCased.startsWith('ORD')) {
      let formatted = upperCased;
      if (formatted.length > 3 && formatted[3] !== '-') {
        formatted = formatted.slice(0, 3) + '-' + formatted.slice(3);
      }
      if (formatted.length > 12 && formatted[12] !== '-') {
        formatted = formatted.slice(0, 12) + '-' + formatted.slice(12);
      }
      return formatted.slice(0, 17); // Max length ORD-YYYYMMDD-XXXX
    } else {
      return upperCased.slice(0, 17);
    }
  };

  return (
    <Card className={`guest-tracking-form ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Track Your Order
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Enter your order details to track your shipment
        </p>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Order Number Input */}
          <div className="space-y-2">
            <Label htmlFor="orderNumber">Order Number</Label>
            <Input
              id="orderNumber"
              type="text"
              placeholder="ORD-20250821-A1B2"
              value={formData.orderNumber}
              onChange={(e) => handleInputChange('orderNumber', formatOrderNumber(e.target.value))}
              className={validationErrors.orderNumber ? 'border-red-500' : ''}
              disabled={loading}
            />
            {validationErrors.orderNumber && (
              <p className="text-sm text-red-600">{validationErrors.orderNumber}</p>
            )}
            <p className="text-xs text-muted-foreground">
              You can find this in your order confirmation email
            </p>
          </div>

          {/* Verification Method Selector */}
          <div className="space-y-3">
            <Label>Verify with</Label>
            <div className="flex gap-2 flex-wrap">
              <Button
                type="button"
                variant={verificationMethod === 'email' ? 'default' : 'outline'}
                onClick={() => setVerificationMethod('email')}
                size="sm"
                disabled={loading}
              >
                <Mail className="h-4 w-4 mr-1" />
                Email
              </Button>
              <Button
                type="button"
                variant={verificationMethod === 'phone' ? 'default' : 'outline'}
                onClick={() => setVerificationMethod('phone')}
                size="sm"
                disabled={loading}
              >
                <Phone className="h-4 w-4 mr-1" />
                Phone
              </Button>
            </div>
          </div>

          {/* Email Input */}
          {verificationMethod === 'email' && (
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={validationErrors.email ? 'border-red-500' : ''}
                disabled={loading}
              />
              {validationErrors.email && (
                <p className="text-sm text-red-600">{validationErrors.email}</p>
              )}
              <p className="text-xs text-muted-foreground">
                The email address used when placing the order
              </p>
            </div>
          )}

          {/* Phone Input */}
          {verificationMethod === 'phone' && (
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+60123456789"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className={validationErrors.phone ? 'border-red-500' : ''}
                disabled={loading}
              />
              {validationErrors.phone && (
                <p className="text-sm text-red-600">{validationErrors.phone}</p>
              )}
              <p className="text-xs text-muted-foreground">
                The phone number used for delivery
              </p>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Info Alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Privacy Notice:</strong> We only use this information to verify your order ownership. 
              Your details are not stored or shared.
            </AlertDescription>
          </Alert>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Track Order
              </>
            )}
          </Button>
        </form>

        {/* Help Section */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <h4 className="font-medium text-sm mb-2">Need Help?</h4>
          <div className="space-y-2 text-xs text-muted-foreground">
            <p>• Order numbers are in format: ORD-YYYYMMDD-XXXX</p>
            <p>• Use the same email or phone used when ordering</p>
            <p>• Contact support if you can't find your order details</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * GuestTrackingFormSkeleton Component
 * Loading skeleton for the form
 */
export function GuestTrackingFormSkeleton({ className = '' }: { className?: string }) {
  return (
    <Card className={`guest-tracking-form-skeleton ${className}`}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-gray-200 rounded animate-pulse" />
          <div className="w-32 h-6 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="w-48 h-4 bg-gray-200 rounded animate-pulse" />
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Order Number Skeleton */}
        <div className="space-y-2">
          <div className="w-24 h-4 bg-gray-200 rounded animate-pulse" />
          <div className="w-full h-10 bg-gray-200 rounded animate-pulse" />
          <div className="w-56 h-3 bg-gray-200 rounded animate-pulse" />
        </div>

        {/* Verification Method Skeleton */}
        <div className="space-y-3">
          <div className="w-20 h-4 bg-gray-200 rounded animate-pulse" />
          <div className="flex gap-2">
            <div className="w-20 h-8 bg-gray-200 rounded animate-pulse" />
            <div className="w-20 h-8 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>

        {/* Input Skeleton */}
        <div className="space-y-2">
          <div className="w-20 h-4 bg-gray-200 rounded animate-pulse" />
          <div className="w-full h-10 bg-gray-200 rounded animate-pulse" />
          <div className="w-48 h-3 bg-gray-200 rounded animate-pulse" />
        </div>

        {/* Button Skeleton */}
        <div className="w-full h-10 bg-gray-200 rounded animate-pulse" />
      </CardContent>
    </Card>
  );
}