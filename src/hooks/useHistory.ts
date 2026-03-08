/**
 * useHistory hook
 * SKILL.md §6.1: Migrated to TanStack Query for state management
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';
import { queryKeys } from '@/constants';
import type { ModelResponse, ComparisonHistory, DebateHistory, Vote, DeepModeSettings, RoundResponse } from '@/types';

interface HistoryData {
  comparisons: ComparisonHistory[];
  debates: DebateHistory[];
  votes: Vote[];
}

async function fetchHistoryData(userId: string): Promise<HistoryData> {
  const [compRes, debRes, votesRes] = await Promise.all([
    supabase.from('comparison_history').select('*').order('created_at', { ascending: false }).limit(50),
    supabase.from('debate_history').select('*').order('created_at', { ascending: false }).limit(50),
    supabase.from('response_votes').select('*'),
  ]);

  const comparisons: ComparisonHistory[] = (compRes.data || []).map(item => ({
    id: item.id,
    query: item.query,
    responses: item.responses as unknown as ModelResponse[],
    created_at: item.created_at,
  }));

  const debates: DebateHistory[] = (debRes.data || []).map(item => ({
    id: item.id,
    query: item.query,
    models: item.models,
    settings: item.settings as unknown as DeepModeSettings,
    round_responses: item.round_responses as unknown as RoundResponse[],
    final_answer: item.final_answer,
    total_rounds: item.total_rounds,
    elapsed_time: item.elapsed_time,
    created_at: item.created_at,
  }));

  const votes: Vote[] = (votesRes.data || []).map(item => ({
    id: item.id,
    history_id: item.history_id,
    history_type: item.history_type as 'comparison' | 'debate',
    model_id: item.model_id,
    vote_type: item.vote_type as 'up' | 'down',
  }));

  return { comparisons, debates, votes };
}

export function useHistory(enabled: boolean) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: user ? queryKeys.history.comparisons(user.id) : ['history', 'none'],
    queryFn: () => (user ? fetchHistoryData(user.id) : Promise.resolve({ comparisons: [], debates: [], votes: [] })),
    enabled: enabled && !!user,
    staleTime: 60_000, // 1 minute
  });

  const comparisonHistory = data?.comparisons || [];
  const debateHistory = data?.debates || [];
  const votes = data?.votes || [];

  const saveComparisonMutation = useMutation({
    mutationFn: async ({ query, responses }: { query: string; responses: ModelResponse[] }) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('comparison_history')
        .insert([{ query, responses: responses as unknown as Record<string, unknown>[], user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      if (user) {
        queryClient.invalidateQueries({ queryKey: queryKeys.history.comparisons(user.id) });
      }
    },
    onError: (error) => {
      logger.error('comparison', 'Failed to save comparison', { error: error instanceof Error ? error.message : 'Unknown' });
    },
  });

  const saveDebateMutation = useMutation({
    mutationFn: async (params: {
      query: string;
      models: string[];
      settings: DeepModeSettings;
      roundResponses: RoundResponse[];
      finalAnswer: string | null;
      totalRounds: number;
      elapsedTime: number;
    }) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('debate_history')
        .insert([{
          query: params.query,
          models: params.models,
          settings: params.settings as unknown as Record<string, unknown>,
          round_responses: params.roundResponses as unknown as Record<string, unknown>[],
          final_answer: params.finalAnswer,
          total_rounds: params.totalRounds,
          elapsed_time: params.elapsedTime,
          user_id: user.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      if (user) {
        queryClient.invalidateQueries({ queryKey: queryKeys.history.comparisons(user.id) });
      }
    },
    onError: (error) => {
      logger.error('debate', 'Failed to save debate', { error: error instanceof Error ? error.message : 'Unknown' });
    },
  });

  const voteMutation = useMutation({
    mutationFn: async ({ historyId, historyType, modelId, voteType }: {
      historyId: string;
      historyType: 'comparison' | 'debate';
      modelId: string;
      voteType: 'up' | 'down';
    }) => {
      const existingVote = votes.find(v => v.history_id === historyId && v.model_id === modelId);

      if (existingVote) {
        if (existingVote.vote_type === voteType) {
          await supabase.from('response_votes').delete().eq('id', existingVote.id);
          return { action: 'removed', voteId: existingVote.id };
        } else {
          await supabase.from('response_votes').update({ vote_type: voteType }).eq('id', existingVote.id);
          return { action: 'updated', voteId: existingVote.id, voteType };
        }
      } else {
        const { data, error } = await supabase
          .from('response_votes')
          .insert({ history_id: historyId, history_type: historyType, model_id: modelId, vote_type: voteType, user_id: user?.id })
          .select()
          .single();
        if (error) throw error;
        return { action: 'created', data };
      }
    },
    onSuccess: () => {
      if (user) {
        queryClient.invalidateQueries({ queryKey: queryKeys.history.comparisons(user.id) });
      }
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to save vote', variant: 'destructive' });
    },
  });

  const clearHistoryMutation = useMutation({
    mutationFn: async () => {
      await Promise.all([
        supabase.from('comparison_history').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('debate_history').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('response_votes').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      ]);
    },
    onSuccess: () => {
      if (user) {
        queryClient.invalidateQueries({ queryKey: queryKeys.history.comparisons(user.id) });
      }
      toast({ title: 'History cleared', description: 'All saved history has been removed.' });
    },
    onError: (error) => {
      logger.error('error', 'Failed to clear history', { error: error instanceof Error ? error.message : 'Unknown' });
    },
  });

  const saveComparison = async (query: string, responses: ModelResponse[]): Promise<string | null> => {
    if (!enabled || !user) return null;
    try {
      const result = await saveComparisonMutation.mutateAsync({ query, responses });
      return result.id;
    } catch {
      return null;
    }
  };

  const saveDebate = async (
    query: string,
    models: string[],
    settings: DeepModeSettings,
    roundResponses: RoundResponse[],
    finalAnswer: string | null,
    totalRounds: number,
    elapsedTime: number
  ): Promise<string | null> => {
    if (!enabled || !user) return null;
    try {
      const result = await saveDebateMutation.mutateAsync({
        query, models, settings, roundResponses, finalAnswer, totalRounds, elapsedTime
      });
      return result.id;
    } catch {
      return null;
    }
  };

  const vote = async (
    historyId: string,
    historyType: 'comparison' | 'debate',
    modelId: string,
    voteType: 'up' | 'down'
  ) => {
    await voteMutation.mutateAsync({ historyId, historyType, modelId, voteType });
  };

  const getVote = (historyId: string, modelId: string): 'up' | 'down' | null => {
    const found = votes.find(v => v.history_id === historyId && v.model_id === modelId);
    return found ? found.vote_type : null;
  };

  const getVoteCounts = (historyId: string, modelId: string) => {
    const modelVotes = votes.filter(v => v.history_id === historyId && v.model_id === modelId);
    return {
      up: modelVotes.filter(v => v.vote_type === 'up').length,
      down: modelVotes.filter(v => v.vote_type === 'down').length,
    };
  };

  const shareResult = async (historyId: string, historyType: 'comparison' | 'debate'): Promise<string | null> => {
    try {
      const { data: existing } = await supabase
        .from('shared_results')
        .select('share_code')
        .eq('history_id', historyId)
        .single();

      if (existing) {
        return existing.share_code;
      }

      const { data, error } = await supabase
        .from('shared_results')
        .insert({ history_id: historyId, history_type: historyType, user_id: user?.id })
        .select()
        .single();

      if (error) throw error;
      return data.share_code;
    } catch (error) {
      logger.error('error', 'Failed to share result', { error: error instanceof Error ? error.message : 'Unknown' });
      return null;
    }
  };

  const clearHistory = async () => {
    await clearHistoryMutation.mutateAsync();
  };

  return {
    comparisonHistory,
    debateHistory,
    votes,
    isLoading,
    user,
    saveComparison,
    saveDebate,
    vote,
    getVote,
    getVoteCounts,
    shareResult,
    clearHistory,
    refetch,
  };
}
