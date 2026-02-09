

# Razorpay Payment Gateway Integration Plan

## Overview
This plan integrates Razorpay as the payment gateway for AI Arena's subscription system, enabling users to upgrade from Free to Pro ($15/month). The integration includes order creation, payment verification, subscription management, and comprehensive webhook handling.

---

## Razorpay Webhooks & Endpoints Reference

### Required Secrets (API Keys)
Before implementation, you'll need to add these secrets to Lovable Cloud:
- `RAZORPAY_KEY_ID` - Your Razorpay Key ID (from Dashboard > API Keys)
- `RAZORPAY_KEY_SECRET` - Your Razorpay Key Secret
- `RAZORPAY_WEBHOOK_SECRET` - Webhook secret for signature verification

---

## All Razorpay Webhook Events

### Payment Webhooks (ESSENTIAL)

| Event | Type | Description | Example Use Case |
|-------|------|-------------|------------------|
| `payment.authorized` | Essential | Payment is authorized but not yet captured | Show "Processing" status to user |
| `payment.captured` | Essential | Payment successfully captured and funds received | Upgrade user to Pro plan |
| `payment.failed` | Essential | Payment attempt failed | Show error message, allow retry |
| `order.paid` | Essential | Order is fully paid (recommended over payment.captured) | Primary trigger for plan upgrade |

### Subscription Webhooks (ESSENTIAL for recurring billing)

| Event | Type | Description | Example Use Case |
|-------|------|-------------|------------------|
| `subscription.authenticated` | Essential | Card authenticated for subscription | Send welcome email |
| `subscription.activated` | Essential | Subscription is now active | Grant Pro access |
| `subscription.charged` | Essential | Monthly charge successful | Extend subscription period |
| `subscription.pending` | Optional | Payment due but not yet processed | Send reminder notification |
| `subscription.halted` | Essential | Subscription paused due to failed payments | Downgrade to Free, notify user |
| `subscription.cancelled` | Essential | User cancelled subscription | Schedule downgrade at period end |
| `subscription.completed` | Optional | Fixed-term subscription ended | N/A (we use indefinite subscriptions) |
| `subscription.updated` | Optional | Subscription details changed | Sync plan changes |
| `subscription.paused` | Optional | Subscription manually paused | Pause Pro features |
| `subscription.resumed` | Optional | Subscription resumed after pause | Restore Pro features |

### Refund Webhooks (OPTIONAL but recommended)

| Event | Type | Description | Example Use Case |
|-------|------|-------------|------------------|
| `refund.created` | Optional | Refund initiated | Log for accounting |
| `refund.processed` | Recommended | Refund completed successfully | Downgrade user, notify them |
| `refund.failed` | Optional | Refund attempt failed | Alert admin for manual handling |
| `refund.speed_changed` | Optional | Refund speed changed (normal/instant) | Update refund ETA display |

### Invoice Webhooks (OPTIONAL)

| Event | Type | Description | Example Use Case |
|-------|------|-------------|------------------|
| `invoice.paid` | Optional | Invoice paid successfully | Generate receipt |
| `invoice.partially_paid` | Optional | Partial payment received | N/A (we use full payments) |
| `invoice.expired` | Optional | Invoice expired without payment | Cancel pending order |

### Payment Downtime Webhooks (OPTIONAL)

| Event | Type | Description | Example Use Case |
|-------|------|-------------|------------------|
| `payment.downtime.started` | Optional | Payment method experiencing issues | Show warning to users |
| `payment.downtime.resolved` | Optional | Payment issues resolved | Remove warning |

---

## Implementation Architecture

```text
+------------------+     +----------------------+     +------------------+
|   Frontend       |     |   Edge Functions     |     |   Razorpay       |
|   (React)        |     |   (Deno)             |     |   API            |
+------------------+     +----------------------+     +------------------+
        |                         |                          |
        |  1. Click "Upgrade"     |                          |
        |------------------------>|                          |
        |                         |  2. Create Order         |
        |                         |------------------------->|
        |                         |  3. Order ID             |
        |                         |<-------------------------|
        |  4. Order Details       |                          |
        |<------------------------|                          |
        |                         |                          |
        |  5. Open Razorpay       |                          |
        |     Checkout Modal      |                          |
        |                         |                          |
        |  6. Payment Success     |                          |
        |------------------------>|                          |
        |                         |  7. Verify Signature     |
        |                         |------------------------->|
        |                         |  8. Confirmed            |
        |                         |<-------------------------|
        |                         |  9. Update DB            |
        |                         |                          |
        |  10. Success UI         |                          |
        |<------------------------|                          |
        |                         |                          |
        |                         |  11. Webhook (async)     |
        |                         |<-------------------------|
        |                         |  12. Verify & Update     |
        |                         |                          |
```

---

## Files to Create/Modify

### New Edge Functions

#### 1. `supabase/functions/razorpay-create-order/index.ts`
Creates a Razorpay order for Pro subscription purchase.

**Endpoint**: `POST /functions/v1/razorpay-create-order`
**Auth**: Required (JWT)
**Response**: `{ orderId, amount, currency, keyId }`

#### 2. `supabase/functions/razorpay-verify-payment/index.ts`
Verifies payment signature after checkout completion.

**Endpoint**: `POST /functions/v1/razorpay-verify-payment`
**Auth**: Required (JWT)
**Body**: `{ razorpay_order_id, razorpay_payment_id, razorpay_signature }`
**Response**: `{ success, subscription }`

#### 3. `supabase/functions/razorpay-webhook/index.ts`
Handles all Razorpay webhook events.

**Endpoint**: `POST /functions/v1/razorpay-webhook`
**Auth**: None (uses webhook signature verification)
**Headers**: `X-Razorpay-Signature`

**Implemented Events:**
- `payment.captured` / `order.paid` - Upgrade to Pro
- `subscription.charged` - Extend subscription
- `subscription.halted` / `subscription.cancelled` - Downgrade to Free
- `refund.processed` - Handle refund

#### 4. `supabase/functions/razorpay-create-subscription/index.ts` (Optional)
For recurring billing via Razorpay Subscriptions API.

**Endpoint**: `POST /functions/v1/razorpay-create-subscription`
**Auth**: Required (JWT)
**Response**: `{ subscriptionId, shortUrl }`

#### 5. `supabase/functions/razorpay-cancel-subscription/index.ts`
Cancels user's subscription.

**Endpoint**: `POST /functions/v1/razorpay-cancel-subscription`
**Auth**: Required (JWT)
**Response**: `{ success, cancelledAt }`

### Database Changes

**New table: `payments`**
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  razorpay_order_id TEXT UNIQUE,
  razorpay_payment_id TEXT UNIQUE,
  razorpay_subscription_id TEXT,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT NOT NULL, -- 'created', 'authorized', 'captured', 'failed', 'refunded'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Modify `subscriptions` table:**
```sql
ALTER TABLE subscriptions ADD COLUMN razorpay_subscription_id TEXT;
ALTER TABLE subscriptions ADD COLUMN subscription_start TIMESTAMPTZ;
ALTER TABLE subscriptions ADD COLUMN subscription_end TIMESTAMPTZ;
ALTER TABLE subscriptions ADD COLUMN cancelled_at TIMESTAMPTZ;
```

### Frontend Changes

#### 1. New Hook: `src/hooks/useRazorpay.ts`
Manages Razorpay checkout flow, order creation, and payment verification.

#### 2. Modify: `src/pages/Pricing.tsx`
Add actual payment flow to "Upgrade to Pro" button.

#### 3. New Component: `src/components/PaymentButton.tsx`
Reusable payment button with loading states.

#### 4. Modify: `src/pages/Settings.tsx`
Add subscription management (cancel, view billing history).

#### 5. Add Razorpay Script: `index.html`
```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

---

## Webhook Implementation Details

### Signature Verification (Critical Security)
```typescript
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";

function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = createHmac("sha256", secret)
    .update(body)
    .digest("hex");
  return expectedSignature === signature;
}
```

### Webhook Handler Structure
```typescript
serve(async (req) => {
  const body = await req.text();
  const signature = req.headers.get("X-Razorpay-Signature");
  
  if (!verifyWebhookSignature(body, signature, WEBHOOK_SECRET)) {
    return new Response("Invalid signature", { status: 401 });
  }
  
  const event = JSON.parse(body);
  
  switch (event.event) {
    case "payment.captured":
    case "order.paid":
      await handlePaymentSuccess(event.payload);
      break;
    case "subscription.charged":
      await handleSubscriptionCharged(event.payload);
      break;
    case "subscription.halted":
    case "subscription.cancelled":
      await handleSubscriptionEnded(event.payload);
      break;
    case "refund.processed":
      await handleRefund(event.payload);
      break;
  }
  
  return new Response(JSON.stringify({ received: true }), { status: 200 });
});
```

---

## Configuration Steps

### 1. Razorpay Dashboard Setup
1. Create account at razorpay.com
2. Generate API Keys (Settings > API Keys)
3. Create a Plan for Pro subscription:
   - Amount: 1500 (INR 15.00 = ~$15)
   - Period: monthly
   - Interval: 1

### 2. Webhook Configuration
1. Go to Settings > Webhooks
2. Add webhook URL: `https://czzxzhjcyfogpkpjpuzs.supabase.co/functions/v1/razorpay-webhook`
3. Select events:
   - `payment.authorized`
   - `payment.captured`
   - `payment.failed`
   - `order.paid`
   - `subscription.authenticated`
   - `subscription.activated`
   - `subscription.charged`
   - `subscription.halted`
   - `subscription.cancelled`
   - `refund.processed`
4. Copy webhook secret for signature verification

---

## Summary of Essential vs Optional

### Must Implement (Core Flow)
1. `razorpay-create-order` - Create payment order
2. `razorpay-verify-payment` - Verify after checkout
3. `razorpay-webhook` with events:
   - `order.paid` - Primary success trigger
   - `payment.captured` - Backup success trigger
   - `subscription.halted` - Handle failed renewals
   - `subscription.cancelled` - Handle cancellations

### Recommended (Better UX)
4. `razorpay-create-subscription` - Recurring billing
5. `razorpay-cancel-subscription` - User self-service
6. Webhook: `refund.processed` - Track refunds
7. Webhook: `subscription.charged` - Extend renewals

### Optional (Nice to Have)
8. Webhook: `payment.downtime.*` - Show status warnings
9. Webhook: `invoice.*` - Receipt generation
10. Webhook: `subscription.paused/resumed` - Pause feature

---

## Technical Considerations

### Security
- All webhook endpoints verify signatures before processing
- API keys stored as Lovable Cloud secrets (never in code)
- Payment verification happens server-side only
- RLS policies prevent unauthorized access to payment data

### Idempotency
- Webhooks may fire multiple times for same event
- Use `razorpay_payment_id` as unique key to prevent duplicate processing
- Check payment status before upgrading plan

### Error Handling
- Log all webhook events for debugging
- Implement retry logic for failed database updates
- Send admin alerts for critical failures
---
User Edited 
---
So i wanted some changes before this Integrated:
1) Pro Plan currently Unlimited Credits to 1000 Per Month only and also Suggest me Some more things related to Credit Based System bcz i don't wanted to lose money overnight.
2) I wanted Monthly Subscription not Payment 
3) I also Wanted Yearly Subscription with 15-20% Off if Choose Yearly instead of Monthly.
4) i wanted Production Grade, Modular Architecture, Scalable, Enterprises Level, Low Latency support , Privacy and Secure , world class UI and UX and more.

