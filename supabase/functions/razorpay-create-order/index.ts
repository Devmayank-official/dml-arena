import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Pricing configuration (amounts in paise for INR)
const PRICING = {
  monthly: { amount: 150000, currency: 'INR', description: 'AI Arena Pro - Monthly' }, // ₹1500
  yearly: { amount: 1530000, currency: 'INR', description: 'AI Arena Pro - Yearly (15% off)' }, // ₹15300 (₹1500*12 = ₹18000, 15% off = ₹15300)
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid user token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { billing_cycle = 'monthly' } = await req.json().catch(() => ({}));
    
    if (!['monthly', 'yearly'].includes(billing_cycle)) {
      return new Response(
        JSON.stringify({ error: 'Invalid billing cycle. Use "monthly" or "yearly".' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Razorpay credentials
    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID');
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET');

    if (!razorpayKeyId || !razorpayKeySecret) {
      console.error('Razorpay credentials not configured');
      return new Response(
        JSON.stringify({ error: 'Payment gateway not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET secrets.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const pricing = PRICING[billing_cycle as keyof typeof PRICING];

    // Create Razorpay order
    const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(`${razorpayKeyId}:${razorpayKeySecret}`)}`,
      },
      body: JSON.stringify({
        amount: pricing.amount,
        currency: pricing.currency,
        receipt: `receipt_${user.id}_${Date.now()}`,
        notes: {
          user_id: user.id,
          billing_cycle,
          plan: 'pro',
        },
      }),
    });

    if (!razorpayResponse.ok) {
      const errorData = await razorpayResponse.text();
      console.error('Razorpay order creation failed:', errorData);
      return new Response(
        JSON.stringify({ error: 'Failed to create payment order' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const order = await razorpayResponse.json();

    // Store order in payments table
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    await adminClient.from('payments').insert({
      user_id: user.id,
      razorpay_order_id: order.id,
      amount: pricing.amount,
      currency: pricing.currency,
      status: 'created',
      billing_cycle,
      metadata: { receipt: order.receipt },
    });

    return new Response(
      JSON.stringify({
        orderId: order.id,
        amount: pricing.amount,
        currency: pricing.currency,
        keyId: razorpayKeyId,
        billing_cycle,
        description: pricing.description,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in razorpay-create-order:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
