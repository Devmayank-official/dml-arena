import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { logger } from '@/lib/logger';

export type SubscriptionPlan = 'free' | 'pro';

export interface Subscription {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  monthly_usage: number;
  usage_reset_at: string;
  created_at: string;
  updated_at: string;
}

export interface RateLimitInfo {
  window: string;
  usage: number;
  limit: number;
  remaining: number;
  resetAt: string;
  exceeded: boolean;
}

export interface RateLimits {
  perMinute: RateLimitInfo | null;
  perHour: RateLimitInfo | null;
  perDay: RateLimitInfo | null;
  perMonth: RateLimitInfo | null;
}

// Plan limits
export const FREE_PLAN_LIMITS = {
  perMinute: 2,
  perHour: 5,
  perDay: 5,
  perMonth: 5,
  allowedModels: ['google/gemini-2.5-flash-lite', 'openai/gpt-5-nano'],
  maxModelsPerComparison: 2,
};

export const PRO_PLAN_LIMITS = {
  perMinute: 10,
  perHour: 100,
  perDay: 300,
  perMonth: 1000,
  maxModelsPerComparison: 5,
};

const emptyRateLimits: RateLimits = {
  perMinute: null,
  perHour: null,
  perDay: null,
  perMonth: null,
};

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [rateLimits, setRateLimits] = useState<RateLimits>(emptyRateLimits);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSubscription = useCallback(async () => {
    if (!user) {
      setSubscription(null);
      setRateLimits(emptyRateLimits);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching subscription:', error);
        logger.error('subscription', 'Failed to fetch subscription', { error: error.message });
        setSubscription(null);
      } else {
        setSubscription({
          ...data,
          plan: data.plan as SubscriptionPlan,
        });
        logger.logSubscription('Subscription loaded', data.plan);
      }
    } catch (err) {
      console.error('Error in fetchSubscription:', err);
      logger.error('subscription', 'Unexpected error fetching subscription', { 
        error: err instanceof Error ? err.message : 'Unknown error' 
      });
      setSubscription(null);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const isPro = subscription?.plan === 'pro';
  
  const planLimits = isPro ? PRO_PLAN_LIMITS : FREE_PLAN_LIMITS;
  
  const remainingQueries = rateLimits.perMonth 
    ? rateLimits.perMonth.remaining 
    : (isPro ? Infinity : Math.max(0, planLimits.perMonth - (subscription?.monthly_usage || 0)));

  const canUseModel = (modelId: string) => {
    if (isPro) return true;
    return FREE_PLAN_LIMITS.allowedModels.includes(modelId);
  };

  const canUseDeepMode = isPro;
  const canAccessCommunity = isPro;
  const canShare = isPro;
  const canExport = isPro;

  // Check if any rate limit is exceeded
  const isRateLimited = Object.values(rateLimits).some(limit => limit?.exceeded);
  
  // Get the specific exceeded limit
  const exceededLimit = Object.entries(rateLimits).find(([_, limit]) => limit?.exceeded)?.[0] as keyof RateLimits | undefined;

  const hasReachedLimit = !isPro && (isRateLimited || remainingQueries <= 0);

  const incrementUsage = async (): Promise<{ 
    success: boolean; 
    error?: string; 
    limits?: RateLimitInfo[];
    exceededWindow?: string;
  }> => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { success: false, error: 'Not authenticated' };
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-usage`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        // Update rate limits from server response
        if (data.limits) {
          updateRateLimitsFromResponse(data.limits);
        }
        
        // Log rate limit exceeded
        logger.logRateLimit(
          data.exceededWindow || 'unknown',
          data.limits?.[0]?.usage || 0,
          data.limits?.[0]?.limit || 0,
          true
        );
        
        return { 
          success: false, 
          error: data.error || 'Rate limit exceeded',
          limits: data.limits,
          exceededWindow: data.exceededWindow,
        };
      }

      // Update local state with server response
      if (data.limits) {
        updateRateLimitsFromResponse(data.limits);
        
        // Log successful usage increment
        const monthlyLimit = data.limits.find((l: RateLimitInfo) => l.window === 'perMonth');
        if (monthlyLimit) {
          logger.logRateLimit('perMonth', monthlyLimit.usage, monthlyLimit.limit, monthlyLimit.exceeded);
        }
        
        // Also update subscription monthly usage
        if (monthlyLimit) {
          setSubscription(prev => prev ? {
            ...prev,
            monthly_usage: monthlyLimit.usage,
          } : null);
        }
      }

      return { success: true, limits: data.limits };
    } catch (err) {
      console.error('Error incrementing usage:', err);
      return { success: false, error: 'Network error' };
    }
  };

  const updateRateLimitsFromResponse = (limits: RateLimitInfo[]) => {
    const newLimits: RateLimits = { ...emptyRateLimits };
    for (const limit of limits) {
      if (limit.window in newLimits) {
        newLimits[limit.window as keyof RateLimits] = limit;
      }
    }
    setRateLimits(newLimits);
  };

  // Get formatted time until reset for a specific window
  const getTimeUntilReset = (window: keyof RateLimits): string | null => {
    const limit = rateLimits[window];
    if (!limit) return null;

    const resetTime = new Date(limit.resetAt);
    const now = new Date();
    const diffMs = resetTime.getTime() - now.getTime();

    if (diffMs <= 0) return 'now';

    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffSeconds < 60) return `${diffSeconds}s`;
    if (diffMinutes < 60) return `${diffMinutes}m`;
    return `${diffHours}h`;
  };

  return {
    subscription,
    isLoading,
    isPro,
    remainingQueries,
    canUseModel,
    canUseDeepMode,
    canAccessCommunity,
    canShare,
    canExport,
    hasReachedLimit,
    incrementUsage,
    refetch: fetchSubscription,
    // New rate limit properties
    rateLimits,
    isRateLimited,
    exceededLimit,
    planLimits,
    getTimeUntilReset,
  };
};
