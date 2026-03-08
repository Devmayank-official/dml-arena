/**
 * useSubscription hook
 * SKILL.md §6.1: Migrated to TanStack Query for state management
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { logger } from '@/lib/logger';
import { queryKeys } from '@/constants';

export type SubscriptionPlan = 'free' | 'pro';

export interface Subscription {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  monthly_usage: number;
  usage_reset_at: string;
  created_at: string;
  updated_at: string;
  billing_cycle?: string | null;
  subscription_start?: string | null;
  subscription_end?: string | null;
  cancelled_at?: string | null;
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

async function fetchSubscription(userId: string): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    logger.error('subscription', 'Failed to fetch subscription', { error: error.message });
    return null;
  }

  logger.logSubscription('Subscription loaded', data.plan);
  return {
    ...data,
    plan: data.plan as SubscriptionPlan,
  };
}

export const useSubscription = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: subscription, isLoading, refetch } = useQuery({
    queryKey: user ? queryKeys.subscription.detail(user.id) : ['subscription', 'none'],
    queryFn: () => (user ? fetchSubscription(user.id) : Promise.resolve(null)),
    enabled: !!user,
    staleTime: 30_000, // 30 seconds
  });

  const isPro = subscription?.plan === 'pro';
  const planLimits = isPro ? PRO_PLAN_LIMITS : FREE_PLAN_LIMITS;
  
  // For rate limits, we manage them separately as they come from mutations
  const rateLimits = emptyRateLimits;

  const remainingQueries = isPro 
    ? Infinity 
    : Math.max(0, planLimits.perMonth - (subscription?.monthly_usage || 0));

  const canUseModel = (modelId: string) => {
    if (isPro) return true;
    return FREE_PLAN_LIMITS.allowedModels.includes(modelId);
  };

  const canUseDeepMode = isPro;
  const canAccessCommunity = isPro;
  const canShare = isPro;
  const canExport = isPro;

  const isRateLimited = Object.values(rateLimits).some(limit => limit?.exceeded);
  const exceededLimit = Object.entries(rateLimits).find(([_, limit]) => limit?.exceeded)?.[0] as keyof RateLimits | undefined;
  const hasReachedLimit = !isPro && (isRateLimited || remainingQueries <= 0);

  const incrementUsageMutation = useMutation({
    mutationFn: async (): Promise<{
      success: boolean;
      error?: string;
      limits?: RateLimitInfo[];
      exceededWindow?: string;
    }> => {
      if (!user) return { success: false, error: 'Not authenticated' };

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { success: false, error: 'Not authenticated' };
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dml-track-usage`,
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
        const monthlyLimit = data.limits?.find((l: RateLimitInfo) => l.window === 'perMonth');
        if (monthlyLimit) {
          logger.logRateLimit(
            data.exceededWindow || 'unknown',
            monthlyLimit.usage,
            monthlyLimit.limit,
            true
          );
        }
        return {
          success: false,
          error: data.error || 'Rate limit exceeded',
          limits: data.limits,
          exceededWindow: data.exceededWindow,
        };
      }

      const monthlyLimit = data.limits?.find((l: RateLimitInfo) => l.window === 'perMonth');
      if (monthlyLimit) {
        logger.logRateLimit('perMonth', monthlyLimit.usage, monthlyLimit.limit, monthlyLimit.exceeded);
      }

      return { success: true, limits: data.limits };
    },
    onSuccess: () => {
      // Invalidate subscription to refetch updated usage
      if (user) {
        queryClient.invalidateQueries({ queryKey: queryKeys.subscription.detail(user.id) });
      }
    },
  });

  const incrementUsage = async () => incrementUsageMutation.mutateAsync();

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
    refetch,
    rateLimits,
    isRateLimited,
    exceededLimit,
    planLimits,
    getTimeUntilReset,
  };
};
