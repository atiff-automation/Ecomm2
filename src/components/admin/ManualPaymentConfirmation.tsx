'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CheckCircle, CreditCard, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ManualPaymentConfirmationProps {
  orderId: string;
  orderNumber: string;
  currentStatus: string;
  paymentStatus: string;
  onStatusUpdate?: () => void;
}

export default function ManualPaymentConfirmation({
  orderId,
  orderNumber,
  currentStatus,
  paymentStatus,
  onStatusUpdate,
}: ManualPaymentConfirmationProps) {
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  const handleConfirmPayment = async () => {
    if (!paymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'CONFIRMED',
          paymentStatus: 'PAID',
          triggeredBy: 'admin-manual',
          metadata: {
            paymentMethod,
            reference: reference || undefined,
            adminNotes: notes || undefined,
            confirmedAt: new Date().toISOString(),
          },
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success('Payment confirmed! Telegram notification sent.');
        console.log('Payment confirmation result:', result);
        
        // Clear form
        setPaymentMethod('');
        setReference('');
        setNotes('');
        
        // Notify parent component
        if (onStatusUpdate) {
          onStatusUpdate();
        }
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to confirm payment');
      }
    } catch (error) {
      console.error('Payment confirmation error:', error);
      toast.error('Failed to confirm payment');
    } finally {
      setLoading(false);
    }
  };

  // Don't show if already paid
  if (paymentStatus === 'PAID') {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Payment Already Confirmed</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Manual Payment Confirmation
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Confirm payment for order {orderNumber}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="payment-method">Payment Method</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                <SelectItem value="cash-deposit">Cash Deposit</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
                <SelectItem value="cash-on-delivery">Cash on Delivery</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="reference">Reference Number (Optional)</Label>
            <Input
              id="reference"
              placeholder="Transaction reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="notes">Admin Notes (Optional)</Label>
          <Textarea
            id="notes"
            placeholder="Additional notes about the payment..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>

        <Button
          onClick={handleConfirmPayment}
          disabled={loading || !paymentMethod}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Confirming Payment...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirm Payment & Send Notifications
            </>
          )}
        </Button>

        <div className="text-xs text-muted-foreground bg-gray-50 p-3 rounded">
          <strong>What happens when you confirm:</strong>
          <ul className="mt-1 space-y-1 list-disc list-inside">
            <li>Order status changes to CONFIRMED</li>
            <li>Payment status changes to PAID</li>
            <li>Telegram notification is sent automatically</li>
            <li>Email confirmation is sent to customer</li>
            <li>All changes are logged for audit</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}