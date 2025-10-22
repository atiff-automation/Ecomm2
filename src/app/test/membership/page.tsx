/**
 * Membership Testing Dashboard - JRM E-commerce Platform
 * Comprehensive testing interface for membership registration and payment flow
 * DEVELOPMENT ONLY - Remove before production
 */

'use client';
import { fetchWithCSRF } from '@/lib/utils/fetch-with-csrf';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  CreditCard,
  ShoppingCart,
  User,
  Users,
  DollarSign,
  Info,
} from 'lucide-react';

interface TestOrder {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  paymentStatus: string;
  wasEligibleForMembership: boolean;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    isMember: boolean;
  };
  pendingMembership?: {
    id: string;
    qualifyingAmount: number;
    expiresAt: string;
  };
}

export default function MembershipTestingPage() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [testOrders, setTestOrders] = useState<TestOrder[]>([]);
  const [pendingOrders, setPendingOrders] = useState<TestOrder[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState('');

  // Prevent access in production
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      window.location.href = '/';
    }
  }, []);

  const addTestResult = (
    message: string,
    type: 'success' | 'error' | 'info' = 'info'
  ) => {
    const timestamp = new Date().toLocaleTimeString();
    const formattedMessage = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
    setTestResults(prev => [...prev, formattedMessage]);
  };

  const fetchPendingOrders = async () => {
    try {
      const response = await fetchWithCSRF('/api/admin/pending-memberships');
      if (response.ok) {
        const data = await response.json();
        setPendingOrders(data.pendingMemberships || []);
        addTestResult(
          `Found ${data.pendingMemberships?.length || 0} pending memberships`
        );
      }
    } catch (error) {
      addTestResult('Failed to fetch pending orders', 'error');
    }
  };

  const simulatePayment = async (
    orderId: string,
    status: 'success' | 'failure'
  ) => {
    setIsLoading(true);
    try {
      addTestResult(`Simulating ${status} payment for order ${orderId}...`);

      const response = await fetchWithCSRF('/api/payment/test-simulator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          paymentStatus: status,
          delay: 1000,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        addTestResult(data.message, 'success');
        if (data.membershipActivated) {
          addTestResult(
            `🎉 Membership activated for user: ${data.userEmail}`,
            'success'
          );
          addTestResult(
            `💰 Qualifying amount: RM${data.qualifyingAmount}`,
            'info'
          );
        }
        // Refresh pending orders
        await fetchPendingOrders();
      } else {
        addTestResult(data.message || 'Payment simulation failed', 'error');
      }
    } catch (error) {
      addTestResult(
        'Payment simulation error: ' + (error as Error).message,
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const createTestOrder = async (amount: number, userEmail: string) => {
    setIsLoading(true);
    try {
      addTestResult(`Creating test order for RM${amount} with ${userEmail}...`);

      // This would need to be implemented - create a test order API
      const response = await fetchWithCSRF('/api/test/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          userEmail,
          testMode: true,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        addTestResult(`Test order created: ${data.orderId}`, 'success');
        setSelectedOrderId(data.orderId);
        await fetchPendingOrders();
      } else {
        const data = await response.json();
        addTestResult(data.message || 'Failed to create test order', 'error');
      }
    } catch (error) {
      addTestResult(
        'Test order creation error: ' + (error as Error).message,
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const clearTestResults = () => {
    setTestResults([]);
  };

  useEffect(() => {
    fetchPendingOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Production check
  if (process.env.NODE_ENV === 'production') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Development Only
            </h2>
            <p className="text-gray-600">
              This testing page is not available in production.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Membership Testing Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Test the end-to-end membership registration and payment flow
          </p>

          <Alert className="mt-4 border-orange-200 bg-orange-50 max-w-2xl mx-auto">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>Development Only:</strong> This testing dashboard should
              be removed before production deployment.
            </AlertDescription>
          </Alert>
        </div>

        {/* Testing Instructions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Info className="mr-2 h-5 w-5" />
              How to Test Membership Flow
            </CardTitle>
            <CardDescription>
              Follow these steps to test the complete membership registration
              and payment flow
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="font-medium mb-2">1. Create Test User</h4>
                <p className="text-sm text-gray-600">
                  Go to <code>/dev-admin-setup</code> and create a customer
                  account (non-member)
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ShoppingCart className="h-6 w-6 text-green-600" />
                </div>
                <h4 className="font-medium mb-2">2. Add Products to Cart</h4>
                <p className="text-sm text-gray-600">
                  Log in as the test user and add products worth more than RM80
                  to cart
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <h4 className="font-medium mb-2">3. Register for Membership</h4>
                <p className="text-sm text-gray-600">
                  At checkout, the membership registration form should appear.
                  Fill it out.
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CreditCard className="h-6 w-6 text-orange-600" />
                </div>
                <h4 className="font-medium mb-2">4. Test Payment</h4>
                <p className="text-sm text-gray-600">
                  Use this dashboard to simulate payment success/failure and
                  verify membership activation
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pending Memberships */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Clock className="mr-2 h-5 w-5" />
                  Pending Memberships
                </span>
                <Button
                  onClick={fetchPendingOrders}
                  variant="outline"
                  size="sm"
                >
                  Refresh
                </Button>
              </CardTitle>
              <CardDescription>
                Orders waiting for payment to activate membership
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingOrders.length > 0 ? (
                <div className="space-y-4">
                  {pendingOrders.map(order => (
                    <div key={order.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="font-medium">
                            {order.orderNumber}
                          </span>
                          <Badge variant="outline" className="ml-2">
                            RM{order.total}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-yellow-100 text-yellow-800">
                            Pending Payment
                          </Badge>
                        </div>
                      </div>

                      <div className="text-sm text-gray-600 mb-3">
                        <p>
                          <strong>User:</strong> {order.user.firstName}{' '}
                          {order.user.lastName}
                        </p>
                        <p>
                          <strong>Email:</strong> {order.user.email}
                        </p>
                        {order.pendingMembership && (
                          <p>
                            <strong>Qualifying Amount:</strong> RM
                            {order.pendingMembership.qualifyingAmount}
                          </p>
                        )}
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          onClick={() => simulatePayment(order.id, 'success')}
                          disabled={isLoading}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Success
                        </Button>
                        <Button
                          onClick={() => simulatePayment(order.id, 'failure')}
                          disabled={isLoading}
                          variant="destructive"
                          size="sm"
                        >
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          Fail
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No pending memberships found</p>
                  <p className="text-sm mt-2">
                    Create an order with membership registration to see it here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Simulator */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="mr-2 h-5 w-5" />
                Payment Simulator
              </CardTitle>
              <CardDescription>
                Manually simulate payment success or failure for any order
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="orderId">Order ID</Label>
                <Input
                  id="orderId"
                  value={selectedOrderId}
                  onChange={e => setSelectedOrderId(e.target.value)}
                  placeholder="Enter order ID to test"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Select from pending orders above or enter manually
                </p>
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={() => simulatePayment(selectedOrderId, 'success')}
                  disabled={!selectedOrderId || isLoading}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Simulate Success
                </Button>
                <Button
                  onClick={() => simulatePayment(selectedOrderId, 'failure')}
                  disabled={!selectedOrderId || isLoading}
                  variant="destructive"
                  className="flex-1"
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Simulate Failure
                </Button>
              </div>

              {/* Quick Test Cases */}
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-3">Quick Test Scenarios:</h4>
                <div className="space-y-2">
                  <div className="text-sm">
                    <strong>Membership Activation:</strong> Order ≥RM80 +
                    Success Payment
                  </div>
                  <div className="text-sm">
                    <strong>Payment Failure:</strong> Order with Failure Payment
                  </div>
                  <div className="text-sm">
                    <strong>Non-Qualifying:</strong> Order &lt;RM80 (no
                    membership offered)
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Test Results Log */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Test Results Log</span>
              <Button onClick={clearTestResults} variant="outline" size="sm">
                Clear Log
              </Button>
            </CardTitle>
            <CardDescription>
              Real-time log of test operations and results
            </CardDescription>
          </CardHeader>
          <CardContent>
            {testResults.length > 0 ? (
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
                {testResults.map((result, index) => (
                  <div key={index} className="mb-1">
                    {result}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No test results yet. Start testing to see logs here.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Production Strategy */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="mr-2 h-5 w-5" />
              Production Payment Strategy
            </CardTitle>
            <CardDescription>
              Recommended approach for production payment integration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">
                  Billplz Integration (Recommended)
                </h4>
                <ul className="text-sm space-y-2 text-gray-600">
                  <li>• Malaysian payment gateway</li>
                  <li>• Supports local banking methods</li>
                  <li>• FPX, credit/debit cards</li>
                  <li>• Real-time webhooks</li>
                  <li>• 2.5% transaction fee</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-3">Implementation Steps</h4>
                <ol className="text-sm space-y-1 text-gray-600">
                  <li>1. Setup Billplz merchant account</li>
                  <li>2. Configure webhook URL in Billplz dashboard</li>
                  <li>3. Replace test simulator with Billplz API</li>
                  <li>4. Test in sandbox environment first</li>
                  <li>5. Go live with production credentials</li>
                </ol>
              </div>
            </div>

            <Alert className="mt-4 border-blue-200 bg-blue-50">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                The current payment webhook system is ready for production. Only
                the payment initiation needs to be replaced with Billplz API
                calls.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
