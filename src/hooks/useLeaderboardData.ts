import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ALL_MODELS } from '@/lib/models';

interface TokenUsage {
  prompt?: number;
  completion?: number;
  total?: number;
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
}

interface ModelResponse {
  model: string;
  response: string;
  error?: string;
  duration: number;
  tokens?: TokenUsage;
  tokenUsage?: TokenUsage;
}

interface Vote {
  model_id: string;
  vote_type: 'up' | 'down';
}

export interface ModelStats {
  modelId: string;
  modelName: string;
  provider: string;
  color: string;
  totalResponses: number;
  avgResponseTime: number;
  totalTokens: number;
  avgTokensPerResponse: number;
  upvotes: number;
  downvotes: number;
  winRate: number;
  responseTimes: { date: string; time: number }[];
}

export interface LeaderboardData {
  modelStats: ModelStats[];
  totalComparisons: number;
  totalDebates: number;
  totalVotes: number;
  isLoading: boolean;
  refetch: () => void;
}

export function useLeaderboardData(): LeaderboardData {
  const [modelStats, setModelStats] = useState<ModelStats[]>([]);
  const [totalComparisons, setTotalComparisons] = useState(0);
  const [totalDebates, setTotalDebates] = useState(0);
  const [totalVotes, setTotalVotes] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [compRes, debRes, votesRes] = await Promise.all([
        supabase.from('comparison_history').select('*').order('created_at', { ascending: false }),
        supabase.from('debate_history').select('*').order('created_at', { ascending: false }),
        supabase.from('response_votes').select('*'),
      ]);

      const comparisons = compRes.data || [];
      const debates = debRes.data || [];
      const votes = (votesRes.data || []) as Vote[];

      setTotalComparisons(comparisons.length);
      setTotalDebates(debates.length);
      setTotalVotes(votes.length);

      // Initialize stats for all models
      const statsMap = new Map<string, {
        responses: number;
        totalTime: number;
        totalTokens: number;
        upvotes: number;
        downvotes: number;
        responseTimes: { date: string; time: number }[];
      }>();

      ALL_MODELS.forEach(model => {
        statsMap.set(model.id, {
          responses: 0,
          totalTime: 0,
          totalTokens: 0,
          upvotes: 0,
          downvotes: 0,
          responseTimes: [],
        });
      });

      // Process comparison history
      comparisons.forEach(comp => {
        const responses = comp.responses as unknown as ModelResponse[];
        const date = new Date(comp.created_at).toLocaleDateString();
        
        responses.forEach(resp => {
          const stats = statsMap.get(resp.model);
          if (stats) {
            stats.responses++;
            stats.totalTime += resp.duration || 0;
            // Handle both token formats: {total} and {total_tokens}
            const tokenData = resp.tokens || resp.tokenUsage;
            const totalTokens = tokenData?.total || tokenData?.total_tokens || 0;
            stats.totalTokens += totalTokens;
            stats.responseTimes.push({ date, time: resp.duration || 0 });
          }
        });
      });

      // Process debate history
      debates.forEach(debate => {
        const roundResponses = debate.round_responses as unknown as any[];
        const date = new Date(debate.created_at).toLocaleDateString();
        
        roundResponses.forEach(roundResp => {
          const stats = statsMap.get(roundResp.model);
          if (stats && roundResp.duration) {
            stats.responses++;
            stats.totalTime += roundResp.duration || 0;
            stats.responseTimes.push({ date, time: roundResp.duration || 0 });
          }
        });
      });

      // Process votes
      votes.forEach(vote => {
        const stats = statsMap.get(vote.model_id);
        if (stats) {
          if (vote.vote_type === 'up') {
            stats.upvotes++;
          } else {
            stats.downvotes++;
          }
        }
      });

      // Convert to array with calculated metrics
      const statsArray: ModelStats[] = AI_MODELS.map(model => {
        const stats = statsMap.get(model.id)!;
        const totalVotesForModel = stats.upvotes + stats.downvotes;
        
        return {
          modelId: model.id,
          modelName: model.name,
          provider: model.provider,
          color: model.color,
          totalResponses: stats.responses,
          avgResponseTime: stats.responses > 0 ? stats.totalTime / stats.responses : 0,
          totalTokens: stats.totalTokens,
          avgTokensPerResponse: stats.responses > 0 ? stats.totalTokens / stats.responses : 0,
          upvotes: stats.upvotes,
          downvotes: stats.downvotes,
          winRate: totalVotesForModel > 0 ? (stats.upvotes / totalVotesForModel) * 100 : 0,
          responseTimes: stats.responseTimes.slice(-20), // Last 20 data points
        };
      });

      // Sort by win rate, then by total responses
      statsArray.sort((a, b) => {
        if (b.winRate !== a.winRate) return b.winRate - a.winRate;
        return b.totalResponses - a.totalResponses;
      });

      setModelStats(statsArray);
    } catch (error) {
      console.error('Error fetching leaderboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Real-time subscription for auto-refresh
  useEffect(() => {
    const channel = supabase
      .channel('leaderboard-updates')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'comparison_history' },
        () => fetchData()
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'debate_history' },
        () => fetchData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'response_votes' },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  return {
    modelStats,
    totalComparisons,
    totalDebates,
    totalVotes,
    isLoading,
    refetch: fetchData,
  };
}
