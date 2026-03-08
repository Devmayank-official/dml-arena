import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { logger } from '@/lib/logger';
import type { QueryCategory } from '@/lib/queryCategories';

interface PerformanceRecord {
  id: string;
  model_id: string;
  response_time_ms: number;
  tokens_used: number | null;
  query_category: string | null;
  success: boolean;
  created_at: string;
}

interface ModelStats {
  modelId: string;
  avgResponseTime: number;
  totalRequests: number;
  successRate: number;
  avgTokens: number;
}

interface CategoryStats {
  category: string;
  count: number;
}

export function useModelPerformance() {
  const { user } = useAuth();
  const [records, setRecords] = useState<PerformanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPerformance = useCallback(async () => {
    if (!user) {
      setRecords([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('model_performance')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) {
        logger.error('error', 'Error fetching performance', { error: error.message });
        return;
      }

      setRecords(data || []);
    } catch (err) {
      logger.error('error', 'Error in fetchPerformance', { error: err instanceof Error ? err.message : 'Unknown' });
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPerformance();
  }, [fetchPerformance]);

  const trackPerformance = useCallback(async (
    modelId: string,
    responseTimeMs: number,
    tokensUsed: number | null,
    queryCategory: QueryCategory | null,
    success: boolean
  ) => {
    if (!user) return;

    try {
      await supabase
        .from('model_performance')
        .insert({
          user_id: user.id,
          model_id: modelId,
          response_time_ms: responseTimeMs,
          tokens_used: tokensUsed,
          query_category: queryCategory,
          success,
        });

      // Update local state
      fetchPerformance();
    } catch (err) {
      console.error('Error tracking performance:', err);
    }
  }, [user, fetchPerformance]);

  // Calculate model statistics
  const getModelStats = useCallback((): ModelStats[] => {
    const statsMap = new Map<string, {
      totalTime: number;
      totalTokens: number;
      successCount: number;
      totalCount: number;
      tokenCount: number;
    }>();

    for (const record of records) {
      const existing = statsMap.get(record.model_id) || {
        totalTime: 0,
        totalTokens: 0,
        successCount: 0,
        totalCount: 0,
        tokenCount: 0,
      };

      existing.totalTime += record.response_time_ms;
      existing.totalCount++;
      if (record.success) existing.successCount++;
      if (record.tokens_used) {
        existing.totalTokens += record.tokens_used;
        existing.tokenCount++;
      }

      statsMap.set(record.model_id, existing);
    }

    return Array.from(statsMap.entries()).map(([modelId, stats]) => ({
      modelId,
      avgResponseTime: Math.round(stats.totalTime / stats.totalCount),
      totalRequests: stats.totalCount,
      successRate: Math.round((stats.successCount / stats.totalCount) * 100),
      avgTokens: stats.tokenCount > 0 ? Math.round(stats.totalTokens / stats.tokenCount) : 0,
    }));
  }, [records]);

  // Get category distribution
  const getCategoryStats = useCallback((): CategoryStats[] => {
    const counts = new Map<string, number>();
    
    for (const record of records) {
      if (record.query_category) {
        counts.set(record.query_category, (counts.get(record.query_category) || 0) + 1);
      }
    }

    return Array.from(counts.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
  }, [records]);

  // Get recent activity (last 7 days)
  const getRecentActivity = useCallback(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const dailyCounts = new Map<string, number>();
    
    for (const record of records) {
      const date = new Date(record.created_at);
      if (date >= sevenDaysAgo) {
        const dateKey = date.toISOString().split('T')[0];
        dailyCounts.set(dateKey, (dailyCounts.get(dateKey) || 0) + 1);
      }
    }

    // Fill in missing days
    const result: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateKey = date.toISOString().split('T')[0];
      result.push({
        date: dateKey,
        count: dailyCounts.get(dateKey) || 0,
      });
    }

    return result;
  }, [records]);

  // Get favorite models (most used)
  const getFavoriteModels = useCallback(() => {
    const modelCounts = new Map<string, number>();
    
    for (const record of records) {
      modelCounts.set(record.model_id, (modelCounts.get(record.model_id) || 0) + 1);
    }

    return Array.from(modelCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([modelId, count]) => ({ modelId, count }));
  }, [records]);

  return {
    records,
    isLoading,
    trackPerformance,
    getModelStats,
    getCategoryStats,
    getRecentActivity,
    getFavoriteModels,
    refetch: fetchPerformance,
    totalQueries: records.length,
  };
}
