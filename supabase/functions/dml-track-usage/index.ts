import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limits by plan
const RATE_LIMITS = {
  free: {
    perMinute: 2,
    perHour: 5,
    perDay: 5,
    perMonth: 5,
  },
  pro: {
    perMinute: 10,
    perHour: 100,
    perDay: 300,
    perMonth: 1000,
  },
};

// Time windows in seconds
const TIME_WINDOWS = {
  perMinute: 60,
  perHour: 60 * 60,
  perDay: 60 * 60 * 24,
  perMonth: 60 * 60 * 24 * 30,
};

interface RateLimitResult {
  window: string;
  usage: number;
  limit: number;
  remaining: number;
  resetAt: string;
  exceeded: boolean;
}

interface RateLimitResponse {
  success: boolean;
  plan: string;
  limits: RateLimitResult[];
  error?: string;
  exceededWindow?: string;
}

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

    // Use service role to access data (bypasses RLS for reads)
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

    const plan = subscription.plan as 'free' | 'pro';
    const limits = RATE_LIMITS[plan];
    const now = new Date();

    // Check all rate limit windows
    const rateLimitResults: RateLimitResult[] = [];
    let exceededWindow: string | null = null;

    for (const [windowName, seconds] of Object.entries(TIME_WINDOWS)) {
      const windowStart = new Date(now.getTime() - seconds * 1000);
      
      // Count usage in this window
      const { count, error: countError } = await adminClient
        .from('usage_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', windowStart.toISOString());

      if (countError) {
        console.error(`Error counting usage for ${windowName}:`, countError);
        continue;
      }

      const usage = count || 0;
      const limit = limits[windowName as keyof typeof limits];
      const remaining = Math.max(0, limit - usage);
      const exceeded = usage >= limit;

      // Calculate reset time
      let resetAt: Date;
      if (windowName === 'perMinute') {
        resetAt = new Date(now.getTime() + (60 - (now.getSeconds())) * 1000);
      } else if (windowName === 'perHour') {
        resetAt = new Date(now.getTime() + (60 - now.getMinutes()) * 60 * 1000);
      } else if (windowName === 'perDay') {
        resetAt = new Date(now);
        resetAt.setHours(24, 0, 0, 0);
      } else {
        // Per month - next month start
        resetAt = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      }

      rateLimitResults.push({
        window: windowName,
        usage,
        limit,
        remaining,
        resetAt: resetAt.toISOString(),
        exceeded,
      });

      if (exceeded && !exceededWindow) {
        exceededWindow = windowName;
      }
    }

    // If any limit is exceeded, return 429
    if (exceededWindow) {
      const response: RateLimitResponse = {
        success: false,
        plan,
        limits: rateLimitResults,
        error: getErrorMessage(exceededWindow, rateLimitResults.find(r => r.window === exceededWindow)!),
        exceededWindow,
      };

      return new Response(
        JSON.stringify(response),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert usage log
    const { error: insertError } = await adminClient
      .from('usage_logs')
      .insert({
        user_id: user.id,
        action_type: 'comparison',
      });

    if (insertError) {
      console.error('Error inserting usage log:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to track usage' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update the usage counts after insertion
    const updatedResults = rateLimitResults.map(r => ({
      ...r,
      usage: r.usage + 1,
      remaining: Math.max(0, r.remaining - 1),
    }));

    // Also update the legacy monthly_usage in subscriptions table for backward compatibility
    await adminClient
      .from('subscriptions')
      .update({ 
        monthly_usage: updatedResults.find(r => r.window === 'perMonth')?.usage || 0,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    const response: RateLimitResponse = {
      success: true,
      plan,
      limits: updatedResults,
    };

    return new Response(
      JSON.stringify(response),
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

function getErrorMessage(window: string, result: RateLimitResult): string {
  const resetTime = new Date(result.resetAt);
  const now = new Date();
  const diffMs = resetTime.getTime() - now.getTime();
  const diffSeconds = Math.ceil(diffMs / 1000);
  const diffMinutes = Math.ceil(diffMs / (1000 * 60));

  switch (window) {
    case 'perMinute':
      return `Slow down! You've made too many requests. Try again in ${diffSeconds} seconds.`;
    case 'perHour':
      return `Hourly limit reached. Resets in ${diffMinutes} minutes.`;
    case 'perDay':
      return `Daily limit reached. Resets at midnight.`;
    case 'perMonth':
      return `Monthly limit reached. Upgrade to Pro for 1000 credits/month.`;
    default:
      return 'Rate limit exceeded.';
  }
}
