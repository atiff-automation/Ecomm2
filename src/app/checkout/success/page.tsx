/**
 * Checkout Success Handler - toyyibPay Callback
 * Handles payment gateway callbacks and redirects to thank-you page
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [processing, setProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handlePaymentCallback = async () => {
      try {
        // Extract parameters from toyyibPay callback
        const statusId = searchParams.get('status_id');
        const billCode = searchParams.get('billcode');
        const orderNumber = searchParams.get('order_id'); // This should be the order number (JRM_ORD-...)
        const msg = searchParams.get('msg');
        const transactionId = searchParams.get('transaction_id');

        console.log('🔄 toyyibPay callback received:', {
          statusId,
          billCode,
          orderNumber,
          msg,
          transactionId,
        });

        if (!statusId || !billCode || !orderNumber) {
          throw new Error('Missing required payment callback parameters');
        }

        // Check payment status
        if (statusId === '1' && msg === 'ok') {
          console.log('✅ Payment successful, updating order status');

          try {
            // Update order status since webhook can't reach localhost
            // Extract actual order number from external reference
            const actualOrderNumber =
              orderNumber.match(/JRM_(ORD-[^_]+)_/)?.[1];

            if (actualOrderNumber) {
              console.log(`🔄 Updating order status for: ${actualOrderNumber}`);

              // Find order by order number and update status
              const updateResponse = await fetch(
                '/api/admin/orders/update-by-number',
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    orderNumber: actualOrderNumber,
                    status: 'CONFIRMED',
                    paymentStatus: 'PAID',
                    triggeredBy: 'toyyibpay-return-url',
                    metadata: {
                      billCode,
                      transactionId,
                      paymentStatusId: statusId,
                      returnMessage: msg,
                    },
                  }),
                }
              );

              if (updateResponse.ok) {
                console.log('✅ Order status updated successfully');
              } else {
                console.warn(
                  '⚠️ Order status update failed, but payment was successful'
                );
              }
            }
          } catch (updateError) {
            console.error('❌ Failed to update order status:', updateError);
            // Don't fail the redirect if status update fails
          }

          // Redirect to thank-you page with order reference
          const orderRef = orderNumber;
          router.replace(
            `/thank-you?orderRef=${encodeURIComponent(orderRef)}&paymentMethod=toyyibpay&transactionId=${encodeURIComponent(transactionId || '')}`
          );
        } else if (statusId === '2') {
          console.log('⏳ Payment pending');
          setError(
            'Payment is still pending. Please check back later or contact support.'
          );
        } else if (statusId === '3') {
          console.log('❌ Payment failed');
          setError('Payment failed. Please try again or contact support.');
        } else {
          throw new Error(`Unknown payment status: ${statusId}`);
        }
      } catch (error) {
        console.error('Error processing payment callback:', error);
        setError(
          error instanceof Error
            ? error.message
            : 'Failed to process payment callback'
        );
      } finally {
        setProcessing(false);
      }
    };

    // Only process if we have search parameters
    if (searchParams.toString()) {
      handlePaymentCallback();
    } else {
      // No parameters, redirect to checkout
      console.log('❌ No payment callback parameters, redirecting to checkout');
      router.replace('/checkout');
    }
  }, [searchParams, router]);

  if (processing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md">
          <CardContent className="text-center p-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Processing Payment</h2>
            <p className="text-gray-600">
              Please wait while we verify your payment...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md">
          <CardContent className="text-center p-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Payment Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="space-y-2">
              <button
                onClick={() => router.push('/checkout')}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
              >
                Try Again
              </button>
              <button
                onClick={() => router.push('/')}
                className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded hover:bg-gray-300"
              >
                Return Home
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // This should not be reached as we redirect on success
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="max-w-md">
        <CardContent className="text-center p-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Payment Successful</h2>
          <p className="text-gray-600">
            Redirecting to your order confirmation...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
