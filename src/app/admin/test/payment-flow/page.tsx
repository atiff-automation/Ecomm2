'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Crown, TestTube } from 'lucide-react';

export default function PaymentFlowTestPage() {
  const { data: session, update: updateSession } = useSession();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [formData, setFormData] = useState({
    totalAmount: 100,
    qualifyingAmount: 100,
    activateMembership: true
  });

  const simulatePaymentSuccess = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/test/payment-success', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log('✅ Payment success response:', data);
        setResult(data);
        // Refresh session to get updated user data
        await updateSession();
      } else {
        console.error('❌ Payment error:', data);
        setResult({ error: data.message });
      }
    } catch (error) {
      setResult({ error: 'Failed to simulate payment' });
    } finally {
      setLoading(false);
    }
  };

  const resetMembership = async (isMember = false) => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/test/reset-membership', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isMember })
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log('✅ Reset response:', data);
        // Refresh session to get updated user data
        await updateSession();
        setResult({ 
          success: true,
          message: data.message || `Membership ${isMember ? 'activated' : 'deactivated'} for testing`,
          resetAction: isMember ? 'activated' : 'deactivated'
        });
      } else {
        console.error('❌ Reset error:', data);
        setResult({ error: data.message });
      }
    } catch (error) {
      setResult({ error: 'Failed to reset membership status' });
    } finally {
      setLoading(false);
    }
  };

  if (process.env.NODE_ENV === 'production') {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>Test endpoints are not available in production</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <TestTube className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold">Payment Success Flow Testing</h1>
          <p className="text-gray-600">Test membership activation after successful payment</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current User Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5" />
              Current User Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-sm font-medium">Name</Label>
              <p className="text-sm text-gray-600">{session?.user?.name || 'Not logged in'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Email</Label>
              <p className="text-sm text-gray-600">{session?.user?.email || 'N/A'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Membership Status</Label>
              <div className="flex items-center gap-2">
                <Badge variant={session?.user?.isMember ? 'default' : 'secondary'}>
                  {session?.user?.isMember ? 'Member' : 'Non-Member'}
                </Badge>
                {session?.user?.isMember && <Crown className="h-4 w-4 text-yellow-500" />}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Test Parameters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="totalAmount">Total Amount (MYR)</Label>
              <Input
                id="totalAmount"
                type="number"
                value={formData.totalAmount}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  totalAmount: parseFloat(e.target.value) || 0
                }))}
                min="0"
                step="0.01"
              />
            </div>
            
            <div>
              <Label htmlFor="qualifyingAmount">Qualifying Amount (MYR)</Label>
              <Input
                id="qualifyingAmount"
                type="number"
                value={formData.qualifyingAmount}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  qualifyingAmount: parseFloat(e.target.value) || 0
                }))}
                min="0"
                step="0.01"
              />
              <p className="text-xs text-gray-500 mt-1">
                Membership threshold is MYR 80.00
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="activateMembership"
                checked={formData.activateMembership}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  activateMembership: e.target.checked
                }))}
                className="rounded"
              />
              <Label htmlFor="activateMembership">Activate membership if qualifying</Label>
            </div>

            <div className="space-y-2">
              <Button
                onClick={simulatePaymentSuccess}
                disabled={loading || !session?.user}
                className="w-full"
                size="lg"
              >
                {loading ? 'Simulating...' : 'Simulate Payment Success'}
              </Button>
              
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => resetMembership(false)}
                  disabled={loading || !session?.user}
                  variant="outline"
                  size="sm"
                >
                  Reset to Non-Member
                </Button>
                <Button
                  onClick={() => resetMembership(true)}
                  disabled={loading || !session?.user}
                  variant="outline"
                  size="sm"
                >
                  Set as Member
                </Button>
              </div>
            </div>

            {!session?.user && (
              <p className="text-sm text-red-600 text-center">
                Please log in to test payment flow
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.error ? (
                <>
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  Test Failed
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Test Results
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result.error ? (
              <div className="text-red-600">
                <p className="font-medium">Error:</p>
                <p className="text-sm">{result.error}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="font-medium">Order ID</Label>
                    <p className="text-sm text-gray-600 font-mono">{result.orderId}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Membership Activated</Label>
                    <Badge variant={result.membershipActivated ? 'default' : 'secondary'}>
                      {result.membershipActivated ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                </div>

                <div>
                  <Label className="font-medium">Test Data</Label>
                  <pre className="text-xs bg-gray-100 p-3 rounded mt-1 overflow-auto">
{JSON.stringify(result.testData, null, 2)}
                  </pre>
                </div>

                <div className="bg-green-50 border border-green-200 rounded p-3">
                  <p className="text-sm text-green-800">
                    ✅ Payment success simulation completed! 
                    {result.membershipActivated && ' Membership has been activated.'}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Refresh the page or navigate to checkout to see the updated membership status.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}