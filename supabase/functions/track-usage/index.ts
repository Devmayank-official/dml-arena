import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header to identify the user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with the user's auth token
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid user token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role to update subscription (bypasses RLS for increment)
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Get current subscription
    const { data: subscription, error: subError } = await adminClient
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (subError || !subscription) {
      console.error('Error fetching subscription:', subError);
      return new Response(
        JSON.stringify({ error: 'Subscription not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Pro users don't need usage tracking
    if (subscription.plan === 'pro') {
      return new Response(
        JSON.stringify({ 
          success: true, 
          plan: 'pro',
          message: 'Pro users have unlimited queries'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if usage needs reset (monthly reset)
    const resetDate = new Date(subscription.usage_reset_at);
    const now = new Date();
    
    let currentUsage = subscription.monthly_usage;
    
    if (now >= resetDate) {
      // Reset usage and set next reset date
      const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      
      const { error: resetError } = await adminClient
        .from('subscriptions')
        .update({ 
          monthly_usage: 1, 
          usage_reset_at: nextReset.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (resetError) {
        console.error('Error resetting usage:', resetError);
        return new Response(
          JSON.stringify({ error: 'Failed to reset usage' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: true,
          plan: 'free',
          usage: 1,
          limit: 5,
          remaining: 4,
          wasReset: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has reached limit
    const FREE_LIMIT = 5;
    if (currentUsage >= FREE_LIMIT) {
      return new Response(
        JSON.stringify({ 
          error: 'Usage limit reached',
          plan: 'free',
          usage: currentUsage,
          limit: FREE_LIMIT,
          remaining: 0
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Increment usage
    const newUsage = currentUsage + 1;
    const { error: updateError } = await adminClient
      .from('subscriptions')
      .update({ 
        monthly_usage: newUsage,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error updating usage:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update usage' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        plan: 'free',
        usage: newUsage,
        limit: FREE_LIMIT,
        remaining: FREE_LIMIT - newUsage
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in track-usage function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
