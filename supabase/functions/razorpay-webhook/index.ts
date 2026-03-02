import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function verifyWebhookSignature(body: string, signature: string, secret: string): boolean {
  const expectedSignature = createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  return expectedSignature === signature;
}

function getAdminClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  return createClient(supabaseUrl, serviceRoleKey);
}

// ─── Handler: Payment Success (payment.captured / order.paid) ───
async function handlePaymentSuccess(payload: any) {
  const adminClient = getAdminClient();
  const payment = payload.payment?.entity || payload.order?.entity;
  
  if (!payment) {
    console.error('No payment/order entity in payload');
    return;
  }

  const orderId = payment.order_id || payment.id;
  const paymentId = payload.payment?.entity?.id;
  const notes = payment.notes || {};
  const userId = notes.user_id;
  const billingCycle = notes.billing_cycle || 'monthly';

  if (!userId) {
    console.error('No user_id in payment notes');
    return;
  }

  // Idempotency: check if already processed
  if (paymentId) {
    const { data: existing } = await adminClient
      .from('payments')
      .select('status')
      .eq('razorpay_payment_id', paymentId)
      .single();

    if (existing?.status === 'captured') {
      console.log('Payment already processed, skipping:', paymentId);
      return;
    }
  }

  // Update payment record
  if (orderId) {
    await adminClient
      .from('payments')
      .update({
        razorpay_payment_id: paymentId,
        status: 'captured',
        updated_at: new Date().toISOString(),
      })
      .eq('razorpay_order_id', orderId);
  }

  // Upgrade user to Pro
  const now = new Date();
  const subscriptionEnd = new Date(now);
  if (billingCycle === 'yearly') {
    subscriptionEnd.setFullYear(subscriptionEnd.getFullYear() + 1);
  } else {
    subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1);
  }

  await adminClient
    .from('subscriptions')
    .update({
      plan: 'pro',
      billing_cycle: billingCycle,
      subscription_start: now.toISOString(),
      subscription_end: subscriptionEnd.toISOString(),
      cancelled_at: null,
      updated_at: now.toISOString(),
    })
    .eq('user_id', userId);

  console.log(`User ${userId} upgraded to Pro (${billingCycle})`);
}

// ─── Handler: Subscription Charged (recurring renewal) ───
async function handleSubscriptionCharged(payload: any) {
  const adminClient = getAdminClient();
  const subscription = payload.subscription?.entity;
  
  if (!subscription) return;

  const notes = subscription.notes || {};
  const userId = notes.user_id;
  if (!userId) return;

  const billingCycle = notes.billing_cycle || 'monthly';
  const now = new Date();
  const subscriptionEnd = new Date(now);
  if (billingCycle === 'yearly') {
    subscriptionEnd.setFullYear(subscriptionEnd.getFullYear() + 1);
  } else {
    subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1);
  }

  // Extend subscription and reset usage
  await adminClient
    .from('subscriptions')
    .update({
      subscription_end: subscriptionEnd.toISOString(),
      monthly_usage: 0,
      usage_reset_at: subscriptionEnd.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq('user_id', userId);

  console.log(`Subscription renewed for user ${userId}`);
}

// ─── Handler: Subscription Ended (halted / cancelled) ───
async function handleSubscriptionEnded(payload: any) {
  const adminClient = getAdminClient();
  const subscription = payload.subscription?.entity;
  
  if (!subscription) return;

  const notes = subscription.notes || {};
  const userId = notes.user_id;
  if (!userId) return;

  await adminClient
    .from('subscriptions')
    .update({
      plan: 'free',
      cancelled_at: new Date().toISOString(),
      razorpay_subscription_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  console.log(`Subscription ended for user ${userId}`);
}

// ─── Handler: Refund Processed ───
async function handleRefund(payload: any) {
  const adminClient = getAdminClient();
  const refund = payload.refund?.entity;
  const payment = payload.payment?.entity;
  
  if (!refund || !payment) return;

  const paymentId = payment.id;

  // Update payment status
  await adminClient
    .from('payments')
    .update({
      status: 'refunded',
      updated_at: new Date().toISOString(),
    })
    .eq('razorpay_payment_id', paymentId);

  // Downgrade user
  const notes = payment.notes || {};
  const userId = notes.user_id;
  if (userId) {
    await adminClient
      .from('subscriptions')
      .update({
        plan: 'free',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);
    
    console.log(`Refund processed, user ${userId} downgraded`);
  }
}

// ─── Handler: Payment Failed ───
async function handlePaymentFailed(payload: any) {
  const adminClient = getAdminClient();
  const payment = payload.payment?.entity;
  
  if (!payment) return;

  const orderId = payment.order_id;
  if (orderId) {
    await adminClient
      .from('payments')
      .update({
        status: 'failed',
        metadata: { error: payment.error_description || 'Payment failed' },
        updated_at: new Date().toISOString(),
      })
      .eq('razorpay_order_id', orderId);
  }

  console.log(`Payment failed for order ${orderId}`);
}

// ─── Main Webhook Handler ───
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const webhookSecret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET');
    if (!webhookSecret) {
      console.error('RAZORPAY_WEBHOOK_SECRET not configured');
      return new Response(
        JSON.stringify({ error: 'Webhook secret not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.text();
    const signature = req.headers.get('X-Razorpay-Signature');

    if (!signature || !verifyWebhookSignature(body, signature, webhookSecret)) {
      console.error('Invalid webhook signature');
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const event = JSON.parse(body);
    console.log('Webhook event received:', event.event);

    switch (event.event) {
      // ── Payment Events ──
      case 'payment.captured':
      case 'order.paid':
        await handlePaymentSuccess(event.payload);
        break;

      case 'payment.failed':
        await handlePaymentFailed(event.payload);
        break;

      // ── Subscription Events ──
      case 'subscription.authenticated':
      case 'subscription.activated':
        console.log(`Subscription event: ${event.event}`);
        // TODO: Send welcome email or notification
        break;

      case 'subscription.charged':
        await handleSubscriptionCharged(event.payload);
        break;

      case 'subscription.halted':
      case 'subscription.cancelled':
        await handleSubscriptionEnded(event.payload);
        break;

      case 'subscription.pending':
        console.log('Subscription payment pending');
        // TODO: Send reminder notification
        break;

      case 'subscription.paused':
        console.log('Subscription paused');
        // TODO: Pause Pro features
        break;

      case 'subscription.resumed':
        console.log('Subscription resumed');
        // TODO: Restore Pro features
        break;

      // ── Refund Events ──
      case 'refund.processed':
        await handleRefund(event.payload);
        break;

      case 'refund.created':
      case 'refund.failed':
        console.log(`Refund event: ${event.event}`);
        break;

      // ── Invoice Events ──
      case 'invoice.paid':
        console.log('Invoice paid');
        // TODO: Generate receipt
        break;

      // ── Payment Downtime Events ──
      case 'payment.downtime.started':
        console.log('Payment downtime started');
        // TODO: Show warning to users
        break;

      case 'payment.downtime.resolved':
        console.log('Payment downtime resolved');
        // TODO: Remove warning
        break;

      default:
        console.log(`Unhandled webhook event: ${event.event}`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in razorpay-webhook:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
