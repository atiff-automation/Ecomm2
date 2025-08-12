# Payment Integration Guide - Any Payment Method

This guide shows how to integrate **ANY** payment method with the order notification system.

## New Unified System

Instead of requiring specific payment gateway webhooks, we now have a unified system that triggers notifications when order status changes to 'PAID' - regardless of how the payment was processed.

## Option 1: Generic Order Status API (Recommended)

### Endpoint
```
PATCH /api/orders/{orderId}/status
```

### Usage Examples

#### Example 1: Bank Transfer Confirmation
```javascript
// After admin confirms bank transfer payment
const response = await fetch('/api/orders/order_123/status', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-admin-token'
  },
  body: JSON.stringify({
    status: 'CONFIRMED',
    paymentStatus: 'PAID',
    triggeredBy: 'bank-transfer-admin',
    metadata: {
      bankReference: 'TXN123456',
      verifiedBy: 'admin_user_id',
      bankAccount: '****1234'
    }
  })
});
```

#### Example 2: Cash on Delivery
```javascript
// When delivery is completed and cash collected
await fetch('/api/orders/order_456/status', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    status: 'DELIVERED',
    paymentStatus: 'PAID',
    triggeredBy: 'cod-delivery',
    metadata: {
      deliveryAgent: 'agent_123',
      cashReceived: 150.00,
      deliveredAt: new Date().toISOString()
    }
  })
});
```

#### Example 3: Custom Payment Gateway Webhook
```javascript
// Your custom payment gateway webhook handler
export async function POST(request) {
  const paymentData = await request.json();
  
  if (paymentData.status === 'success') {
    // Update order status - this will automatically trigger Telegram notification
    await fetch(`/api/orders/${paymentData.orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        triggeredBy: 'custom-gateway-webhook',
        webhookSecret: process.env.ORDER_WEBHOOK_SECRET,
        metadata: {
          gatewayTransactionId: paymentData.transactionId,
          gatewayName: 'YourGateway',
          amount: paymentData.amount
        }
      })
    });
  }
  
  return Response.json({ received: true });
}
```

## Option 2: Direct Function Call

```javascript
import { updateOrderStatus } from '@/lib/notifications/order-status-handler';

// In your payment processing logic
await updateOrderStatus(
  orderId,
  'CONFIRMED',      // new order status
  'PAID',          // new payment status
  'manual-payment', // triggered by
  {                // metadata
    paymentMethod: 'Bank Transfer',
    reference: 'REF123'
  }
);
```

## Option 3: Admin Interface Integration

Add to your admin panel:

```tsx
const markAsPaid = async (orderId: string) => {
  try {
    const response = await fetch(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        triggeredBy: 'admin-manual'
      })
    });
    
    if (response.ok) {
      alert('Payment confirmed! Telegram notification sent.');
    }
  } catch (error) {
    alert('Failed to update payment status');
  }
};
```

## Supported Payment Methods

✅ **Billplz** - Auto webhook integration  
✅ **Stripe** - Auto webhook integration (when implemented)  
✅ **Bank Transfer** - Manual admin confirmation  
✅ **Cash on Delivery** - Delivery agent confirmation  
✅ **PayPal** - Webhook integration  
✅ **Crypto payments** - Blockchain confirmation  
✅ **Mobile wallets** - API integration  
✅ **Custom gateways** - Webhook implementation  

## What Happens When Status Changes to 'PAID'

1. **Database Update** - Order status and payment status updated
2. **Telegram Notification** - Automatic notification with order details
3. **Email Confirmation** - Customer receives email receipt  
4. **Audit Log** - All changes tracked for compliance
5. **Inventory Update** - Stock levels adjusted
6. **Membership Activation** - If applicable

## Environment Variables

Add to your `.env` file:

```bash
# Webhook security (optional)
ORDER_WEBHOOK_SECRET=your-secure-secret-key

# Telegram settings (already configured)
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_ORDERS_CHAT_ID=your-chat-id
```

## Testing

Test with any payment method:

```bash
curl -X PATCH http://localhost:3000/api/orders/your-order-id/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "CONFIRMED",
    "paymentStatus": "PAID",
    "triggeredBy": "test-payment",
    "webhookSecret": "your-webhook-secret"
  }'
```

## Security Notes

- Admin endpoints require authentication
- Webhook endpoints require secret verification  
- All status changes are logged for audit
- Failed notifications don't break payment processing

This system works with **any payment method** - you just need to call the status update API when payment is confirmed!