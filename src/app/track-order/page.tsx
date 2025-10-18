'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Package, Search, Loader2, AlertCircle } from 'lucide-react';
import { TrackingDisplay } from '@/components/tracking/TrackingDisplay';
import { OrderStatus } from '@prisma/client';

/**
 * Track Order Page
 *
 * Single page for order tracking (guest and logged-in users)
 * Following @CLAUDE.md: Type Safety, Error Handling, KISS
 */

interface TrackingResult {
  orderNumber: string;
  status: OrderStatus;
  courierName: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
}

export default function TrackOrderPage() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [rateLimitInfo, setRateLimitInfo] = useState<{
    retryAfter?: number;
  }>({});

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim()) {
      setError('Please enter an order number or tracking number');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);
    setRateLimitInfo({});

    try {
      const response = await fetch('/api/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trackingInput: input.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResult(data.order);
      } else if (response.status === 429) {
        // Rate limited
        setError(data.error);
        if (data.retryAfter) {
          setRateLimitInfo({ retryAfter: data.retryAfter });
        }
      } else {
        setError(data.error || 'Failed to track order');
      }
    } catch (err) {
      console.error('Tracking error:', err);
      setError('Unable to connect to tracking service. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle new search
   */
  const handleNewSearch = () => {
    setInput('');
    setResult(null);
    setError('');
    setRateLimitInfo({});
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Page Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Package className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Track Your Order</h1>
        </div>
        <p className="text-gray-600">
          Enter your order number or tracking number to get real-time updates
        </p>
      </div>

      {/* Search Form */}
      {!result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Track Shipment
            </CardTitle>
            <CardDescription>
              Enter your order number (e.g., ORD-20250821-A1B2) or tracking number
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Input Field */}
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Enter order number or tracking number"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={loading}
                  className="flex-1"
                  autoFocus
                />
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Tracking...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Track
                    </>
                  )}
                </Button>
              </div>

              {/* Error Display */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Help Text */}
              <div className="text-sm text-gray-600">
                <p className="font-medium mb-1">Accepted formats:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Order number: ORD-20250821-A1B2 (with or without dashes)</li>
                  <li>Tracking number: EP1234567890</li>
                </ul>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tracking Results */}
      {result && (
        <div className="space-y-4">
          <TrackingDisplay order={result} />

          {/* New Search Button */}
          <Button
            variant="outline"
            className="w-full"
            onClick={handleNewSearch}
          >
            <Search className="w-4 h-4 mr-2" />
            Track Another Order
          </Button>
        </div>
      )}

      {/* Instructions (shown when no result) */}
      {!result && !loading && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">How to Track Your Order</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• You can find your order number in the confirmation email</p>
              <p>• Tracking numbers are provided when your order ships</p>
              <p>• Enter either one to track your shipment status</p>
              <p>• Rate limit: 10 tracking requests per hour</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
