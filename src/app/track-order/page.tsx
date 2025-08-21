/**
 * Public Order Tracking Page
 * Allows guest customers to track their orders
 * Based on CUSTOMER_TRACKING_IMPLEMENTATION_PLAN.md
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Package, 
  Shield, 
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import GuestTrackingForm from '@/components/customer/GuestTrackingForm';
import GuestTrackingResults from '@/components/customer/GuestTrackingResults';

interface GuestTrackingRequest {
  orderNumber: string;
  email?: string;
  phone?: string;
}

interface GuestTrackingData {
  orderNumber: string;
  status: string;
  orderDate: string;
  hasShipment: boolean;
  courierName?: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
  basicEvents?: Array<{
    eventName: string;
    timestamp: string;
  }>;
}

export default function TrackOrderPage() {
  const [trackingData, setTrackingData] = useState<GuestTrackingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rateLimitInfo, setRateLimitInfo] = useState<{
    retryAfter?: number;
    message?: string;
  }>({});

  /**
   * Handle form submission
   */
  const handleTrackingSubmit = async (formData: GuestTrackingRequest) => {
    setLoading(true);
    setError('');
    setRateLimitInfo({});

    try {
      const response = await fetch('/api/customer/track-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setTrackingData(data.tracking);
      } else if (response.status === 429) {
        // Rate limited
        setError(data.error || 'Too many requests. Please try again later.');
        if (data.retryAfter) {
          setRateLimitInfo({
            retryAfter: data.retryAfter,
            message: `Please wait ${Math.ceil(data.retryAfter / 60)} minutes before trying again.`
          });
        }
      } else {
        setError(data.error || 'Failed to find order. Please check your details and try again.');
      }
    } catch (err) {
      console.error('Tracking lookup error:', err);
      setError('Unable to connect to tracking service. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle refresh tracking data
   */
  const handleRefresh = async () => {
    if (!trackingData) return;
    
    // For guest users, refresh means re-submitting the form
    // Since we don't store the original form data, we'll just show a message
    setError('Please use the "New Search" button to look up your order again for the latest information.');
  };

  /**
   * Handle back to form
   */
  const handleBack = () => {
    setTrackingData(null);
    setError('');
    setRateLimitInfo({});
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto px-2 sm:px-4">
        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Package className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold">Track Your Order</h1>
          </div>
          <p className="text-gray-600">
            Enter your order details to get real-time tracking information
          </p>
        </div>

        {/* Security Notice */}
        <Alert className="mb-6">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>Secure Tracking:</strong> We protect your privacy by only showing basic tracking information 
            and not storing any personal details during lookup.
          </AlertDescription>
        </Alert>

        {/* Main Content */}
        {!trackingData ? (
          <>
            {/* Tracking Form */}
            <GuestTrackingForm
              onSubmit={handleTrackingSubmit}
              loading={loading}
              error={error}
              className="mb-6"
            />

            {/* Rate Limit Info */}
            {rateLimitInfo.message && (
              <Alert variant="destructive" className="mb-6">
                <Clock className="h-4 w-4" />
                <AlertDescription>{rateLimitInfo.message}</AlertDescription>
              </Alert>
            )}

            {/* Information Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    What You Can Track
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Order status and progress</li>
                    <li>• Shipping carrier information</li>
                    <li>• Estimated delivery dates</li>
                    <li>• Basic tracking events</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    Need Help?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Check your order confirmation email</li>
                    <li>• Use the exact email or phone from your order</li>
                    <li>• Contact support for detailed assistance</li>
                    <li>• Allow up to 24hrs for tracking to update</li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Usage Limits Notice */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-2">
                  <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900 mb-1">Usage Limits</h4>
                    <p className="text-sm text-blue-700">
                      To prevent abuse, guest tracking is limited to 10 lookups per hour per device. 
                      For unlimited tracking, consider creating a free account.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          /* Tracking Results */
          <GuestTrackingResults
            tracking={trackingData}
            onRefresh={handleRefresh}
            onBack={handleBack}
            className="mb-6"
          />
        )}

        {/* Footer Links */}
        <div className="text-center mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-4">
            Having trouble tracking your order?
          </p>
          <div className="flex justify-center gap-2 sm:gap-4 flex-wrap">
            <a 
              href="/contact" 
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Contact Support
            </a>
            <span className="text-gray-300">•</span>
            <a 
              href="/faq" 
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              FAQ
            </a>
            <span className="text-gray-300">•</span>
            <a 
              href="/auth/signin" 
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Create Account
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}