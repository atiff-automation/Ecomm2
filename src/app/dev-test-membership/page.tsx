/**
 * Development Testing Dashboard - Membership Flow
 * FOR DEVELOPMENT TESTING ONLY
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  Database,
  TestTube,
  AlertTriangle,
} from 'lucide-react';

interface TestResult {
  success: boolean;
  message: string;
  data?: any;
  timestamp: string;
}

export default function MembershipTestingPage() {
  const [orderId, setOrderId] = useState('');
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);

  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
            <h1 className="text-2xl font-bold mb-2">
              Not Available in Production
            </h1>
            <p className="text-muted-foreground">
              This testing dashboard is only available in development mode.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const addResult = (result: Omit<TestResult, 'timestamp'>) => {
    setTestResults(prev => [
      {
        ...result,
        timestamp: new Date().toLocaleTimeString(),
      },
      ...prev,
    ]);
  };

  const testPaymentSuccess = async () => {
    if (!orderId) {
      addResult({
        success: false,
        message: 'Order ID is required',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/payment/test-simulator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          paymentStatus: 'success',
          delay: 1000,
        }),
      });

      const result = await response.json();
      addResult({
        success: response.ok,
        message: result.message,
        data: result,
      });
    } catch (error) {
      addResult({
        success: false,
        message:
          'Network error: ' +
          (error instanceof Error ? error.message : 'Unknown error'),
      });
    } finally {
      setLoading(false);
    }
  };

  const testPaymentFailure = async () => {
    if (!orderId) {
      addResult({
        success: false,
        message: 'Order ID is required',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/payment/test-simulator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          paymentStatus: 'failure',
          delay: 1000,
        }),
      });

      const result = await response.json();
      addResult({
        success: response.ok,
        message: result.message,
        data: result,
      });
    } catch (error) {
      addResult({
        success: false,
        message:
          'Network error: ' +
          (error instanceof Error ? error.message : 'Unknown error'),
      });
    } finally {
      setLoading(false);
    }
  };

  const checkPendingMemberships = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/membership/pending');
      const result = await response.json();

      addResult({
        success: response.ok,
        message: `Found ${result.count || 0} pending memberships`,
        data: result,
      });
    } catch (error) {
      addResult({
        success: false,
        message: 'Failed to check pending memberships',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          🧪 Membership Testing Dashboard
        </h1>
        <Badge variant="destructive" className="mb-4">
          DEVELOPMENT ONLY
        </Badge>
        <p className="text-muted-foreground">
          Test the end-to-end membership registration and payment flow
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Testing Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="w-5 h-5" />
              Payment Flow Testing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="orderId">Order ID to Test</Label>
              <Input
                id="orderId"
                value={orderId}
                onChange={e => setOrderId(e.target.value)}
                placeholder="Enter order ID (e.g., from checkout)"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Get this from the browser console after creating an order
              </p>
            </div>

            <div className="space-y-2">
              <Button
                onClick={testPaymentSuccess}
                disabled={loading || !orderId}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Simulate Payment Success
              </Button>

              <Button
                onClick={testPaymentFailure}
                disabled={loading || !orderId}
                variant="destructive"
                className="w-full"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Simulate Payment Failure
              </Button>

              <Button
                onClick={checkPendingMemberships}
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                <Database className="w-4 h-4 mr-2" />
                Check Pending Memberships
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Test Results */}
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {testResults.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  No test results yet
                </p>
              ) : (
                testResults.map((result, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      result.success
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {result.success ? (
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium">{result.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {result.timestamp}
                        </p>
                        {result.data && (
                          <details className="mt-2">
                            <summary className="text-xs cursor-pointer text-blue-600">
                              View Details
                            </summary>
                            <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                              {JSON.stringify(result.data, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {testResults.length > 0 && (
              <Button
                onClick={() => setTestResults([])}
                variant="outline"
                size="sm"
                className="w-full mt-3"
              >
                Clear Results
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Testing Instructions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>📋 Step-by-Step Testing Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">1️⃣ Setup Test Products</h3>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Go to Admin → Inventory</li>
                  <li>• Create products with qualifying categories</li>
                  <li>• Set regular price + member price</li>
                  <li>• Ensure category "qualifies for membership"</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">2️⃣ Test Cart (RM80+)</h3>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Add products worth RM80+ to cart</li>
                  <li>• Go to /cart - see membership progress</li>
                  <li>• Click "Proceed to Checkout"</li>
                  <li>• Should see membership banner</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">
                  3️⃣ Register for Membership
                </h3>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Click "Join Now" on membership banner</li>
                  <li>• Fill registration form</li>
                  <li>• Accept terms & conditions</li>
                  <li>• Should show "pending payment" message</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">4️⃣ Complete Order</h3>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Fill shipping/billing addresses</li>
                  <li>• Submit order (check console for Order ID)</li>
                  <li>• Copy the Order ID from response</li>
                  <li>• Use simulator above to test payment</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
