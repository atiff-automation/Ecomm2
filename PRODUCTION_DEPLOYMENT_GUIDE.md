# Production Deployment Guide - JRM E-commerce Platform

## Critical toyyibPay Production Considerations

### ⚠️ LOCALHOST WEBHOOK LIMITATION

**Development Issue:**
- toyyibPay sandbox **cannot send webhooks to localhost URLs**
- During development, payment status updates fail because webhooks never reach `http://localhost:3000/api/webhooks/toyyibpay`

**Current Development Solution:**
- We implemented a **return URL-based status update system** in `/src/app/checkout/success/page.tsx`
- This system updates order status using GET parameters from the payment return URL
- This is a **temporary workaround for development only**

**Production Requirements:**
1. **Public Domain Required:** Deploy to a public domain (e.g., `https://yourdomain.com`)
2. **SSL Certificate Required:** toyyibPay requires HTTPS for webhook callbacks
3. **Webhook Configuration:** Update webhook URLs in production:
   ```typescript
   // In production, this will work:
   callbackUrl: `https://yourdomain.com/api/webhooks/toyyibpay`
   
   // In development, this fails:
   callbackUrl: `http://localhost:3000/api/webhooks/toyyibpay`
   ```

### Production Deployment Checklist

#### 1. Environment Configuration
- [ ] Set `NEXT_PUBLIC_APP_URL` to production domain
- [ ] Configure toyyibPay production credentials (not sandbox)
- [ ] Update category code for production environment
- [ ] Verify SSL certificate is active

#### 2. toyyibPay Configuration
- [ ] Switch from `dev.toyyibpay.com` to `toyyibpay.com`
- [ ] Create production category in toyyibPay portal
- [ ] Update `userSecretKey` for production account
- [ ] Test webhook endpoint accessibility from external networks

#### 3. Webhook System
- [ ] **Remove return URL status update system** (development workaround)
- [ ] **Enable proper webhook handling** in `/src/app/api/webhooks/toyyibpay/route.ts`
- [ ] Test webhook delivery from toyyibPay production environment
- [ ] Verify order status updates work via webhooks

#### 4. Security Considerations
- [ ] Add webhook signature verification
- [ ] Rate limiting for webhook endpoints
- [ ] IP whitelisting for toyyibPay webhook servers
- [ ] Secure credential storage (environment variables)

#### 5. Testing in Production
- [ ] Test complete payment flow with real bank accounts
- [ ] Verify webhook delivery and order status updates
- [ ] Test Telegram notifications for successful payments
- [ ] Verify admin order management shows correct statuses

### Code Changes Required for Production

#### Remove Development Workaround
```typescript
// File: /src/app/checkout/success/page.tsx
// REMOVE this entire status update section in production:
try {
  // Update order status since webhook can't reach localhost
  const updateResponse = await fetch('/api/admin/orders/update-by-number', {
    // ... development workaround code
  });
} catch (updateError) {
  // ... error handling
}
```

#### Enable Proper Webhook Flow
```typescript
// File: /src/lib/config/toyyibpay-config.ts
export function getWebhookUrls(environment: 'sandbox' | 'production') {
  // Production: Use actual domain
  const baseUrl = environment === 'production' 
    ? process.env.NEXT_PUBLIC_APP_URL || 'https://yourdomain.com'
    : 'http://localhost:3000'; // Development only
  
  return {
    returnUrl: `${baseUrl}/checkout/success`,
    callbackUrl: `${baseUrl}/api/webhooks/toyyibpay`, // This will work in production
    failedUrl: `${baseUrl}/checkout/failed`
  };
}
```

### Environment Variables for Production

```env
# Production Environment Variables
NEXT_PUBLIC_APP_URL=https://yourdomain.com
TOYYIBPAY_ENVIRONMENT=production
TOYYIBPAY_USER_SECRET_KEY=your_production_secret_key
TOYYIBPAY_CATEGORY_CODE=your_production_category_code

# Telegram Configuration
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_ORDERS_CHAT_ID=your_orders_chat_id

# Database
DATABASE_URL=your_production_database_url

# Security
NEXTAUTH_SECRET=your_production_secret
NEXTAUTH_URL=https://yourdomain.com
```

### Monitoring and Alerts

#### Webhook Health Monitoring
- Monitor webhook delivery success rates
- Alert on webhook failures
- Log payment status update failures
- Track order status discrepancies

#### Production Testing Schedule
- [ ] Weekly payment flow tests
- [ ] Monthly webhook delivery verification  
- [ ] Quarterly full system integration tests

### Rollback Plan

If webhooks fail in production:
1. **Temporary:** Re-enable return URL status update system
2. **Monitor:** Track failed webhook deliveries
3. **Debug:** Check toyyibPay webhook logs
4. **Fix:** Resolve webhook connectivity issues
5. **Restore:** Disable return URL system once webhooks work

### Documentation References

- **toyyibPay API Documentation:** Lines 155 in `/Users/atiffriduan/Desktop/toyyib_api_docs.txt`
- **Webhook Implementation:** `/src/app/api/webhooks/toyyibpay/route.ts`
- **Development Workaround:** `/src/app/checkout/success/page.tsx`
- **Status Update Handler:** `/src/lib/notifications/order-status-handler.ts`

---

## Important Notes

⚠️ **Critical:** The current system works perfectly for development but requires webhook functionality for production.

✅ **Ready for Production:** All other components (order creation, payment routing, admin management) are production-ready.

🔄 **Migration Path:** Clear steps provided above to transition from development to production webhook handling.

📞 **Support:** Contact toyyibPay support if webhook delivery issues persist in production environment.

---

*Last Updated: 2025-08-22*  
*Status: Development workaround active - Production deployment required for full webhook functionality*