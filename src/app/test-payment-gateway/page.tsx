'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, CreditCard, ArrowLeft } from 'lucide-react';

export default function TestPaymentGatewayPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [processing, setProcessing] = useState(false);

  // Extract payment details from URL params (normally from checkout)
  const amount = searchParams.get('amount') || '100.00';
  const currency = searchParams.get('currency') || 'MYR';
  const orderRef = searchParams.get('orderRef') || `ORD-${Date.now()}`;
  const returnUrl = searchParams.get('returnUrl') || '/checkout';

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(parseFloat(amount));
  };

  const handlePaymentAction = async (success: boolean) => {
    setProcessing(true);

    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simulate webhook callback to your backend
    const webhookUrl = success
      ? '/api/webhooks/payment-success'
      : '/api/webhooks/payment-failed';

    try {
      const webhookResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderReference: orderRef,
          amount: parseFloat(amount),
          currency,
          status: success ? 'PAID' : 'FAILED',
          transactionId: `txn_${Date.now()}`,
          timestamp: new Date().toISOString(),
        }),
      });

      if (webhookResponse.ok) {
        if (success) {
          // Get webhook response to check if membership was activated
          const webhookData = await webhookResponse.json();
          console.log('🎯 Webhook response:', webhookData);

          // For successful payments, redirect directly to thank-you page
          const thankYouParams = new URLSearchParams({
            orderRef,
            amount,
          });

          // Pass membership parameter if membership was activated
          if (webhookData.membershipActivated) {
            thankYouParams.set('membership', 'true');
            console.log(
              '🎉 Membership activated - adding membership=true to thank-you URL'
            );
          }

          console.log(
            '✅ Payment successful - redirecting to thank-you page with params:',
            thankYouParams.toString()
          );
          router.push(`/thank-you?${thankYouParams.toString()}`);
        } else {
          // For failed payments, redirect back to checkout with failure info
          const params = new URLSearchParams({
            payment: 'failed',
            orderRef,
            amount,
          });

          router.push(`${returnUrl}?${params.toString()}`);
        }
      } else {
        alert('Webhook failed - check server logs');
      }
    } catch (error) {
      console.error('Webhook error:', error);
      alert('Payment processing error');
    } finally {
      setProcessing(false);
    }
  };

  if (processing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <h2 className="text-xl font-semibold">Processing Payment...</h2>
              <p className="text-gray-600">
                Please wait while we process your payment
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-md mx-auto">
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded mb-6">
            <p className="text-sm font-medium">🧪 TEST PAYMENT GATEWAY</p>
            <p className="text-xs">
              This simulates a real payment gateway for testing
            </p>
          </div>
        )}

        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-xl">Secure Payment</CardTitle>
            <p className="text-gray-600">JRM E-commerce Test Gateway</p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Payment Details */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="font-medium">Amount:</span>
                <span className="font-bold text-lg">
                  {formatCurrency(amount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Order Reference:</span>
                <span className="text-sm font-mono">{orderRef}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Currency:</span>
                <Badge variant="outline">{currency}</Badge>
              </div>
            </div>

            {/* Test Payment Buttons */}
            <div className="space-y-3">
              <h3 className="font-medium text-center">
                Choose Payment Outcome:
              </h3>

              <Button
                onClick={() => handlePaymentAction(true)}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                size="lg"
                disabled={processing}
              >
                <CheckCircle className="w-5 h-5 mr-2" />✅ Simulate Successful
                Payment
              </Button>

              <Button
                onClick={() => handlePaymentAction(false)}
                variant="destructive"
                className="w-full"
                size="lg"
                disabled={processing}
              >
                <XCircle className="w-5 h-5 mr-2" />❌ Simulate Failed Payment
              </Button>

              <Button
                onClick={() => router.push(returnUrl)}
                variant="outline"
                className="w-full"
                disabled={processing}
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Cancel Payment
              </Button>
            </div>

            {/* Security Notice */}
            <div className="text-xs text-gray-500 text-center border-t pt-4">
              <p>🔒 This is a test payment gateway for development purposes</p>
              <p>No real payment processing occurs</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
