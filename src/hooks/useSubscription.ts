import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

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

// Free plan limits
export const FREE_PLAN_LIMITS = {
  monthlyQueries: 5,
  allowedModels: ['google/gemini-2.5-flash-lite', 'openai/gpt-5-nano'],
};

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSubscription = useCallback(async () => {
    if (!user) {
      setSubscription(null);
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
        setSubscription(null);
      } else {
        // Cast plan to proper type
        setSubscription({
          ...data,
          plan: data.plan as SubscriptionPlan,
        });
      }
    } catch (err) {
      console.error('Error in fetchSubscription:', err);
      setSubscription(null);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const isPro = subscription?.plan === 'pro';
  
  const remainingQueries = isPro 
    ? Infinity 
    : Math.max(0, FREE_PLAN_LIMITS.monthlyQueries - (subscription?.monthly_usage || 0));

  const canUseModel = (modelId: string) => {
    if (isPro) return true;
    return FREE_PLAN_LIMITS.allowedModels.includes(modelId);
  };

  const canUseDeepMode = isPro;
  const canAccessCommunity = isPro;
  const canShare = isPro;
  const canExport = isPro;

  const hasReachedLimit = !isPro && remainingQueries <= 0;

  const incrementUsage = async () => {
    if (!subscription || isPro) return;

    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ monthly_usage: (subscription.monthly_usage || 0) + 1 })
        .eq('user_id', user?.id);

      if (!error) {
        setSubscription(prev => prev ? {
          ...prev,
          monthly_usage: (prev.monthly_usage || 0) + 1,
        } : null);
      }
    } catch (err) {
      console.error('Error incrementing usage:', err);
    }
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
  };
};
