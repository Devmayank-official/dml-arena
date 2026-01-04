import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import type { ModelResponse, ComparisonHistory, DebateHistory, Vote } from '@/types';

export function useHistory(enabled: boolean) {
  const { user } = useAuth();
  const [comparisonHistory, setComparisonHistory] = useState<ComparisonHistory[]>([]);
  const [debateHistory, setDebateHistory] = useState<DebateHistory[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchHistory = useCallback(async () => {
    if (!enabled || !user) {
      setComparisonHistory([]);
      setDebateHistory([]);
      setVotes([]);
      return;
    }
    
    setIsLoading(true);
    try {
      const [compRes, debRes, votesRes] = await Promise.all([
        supabase.from('comparison_history').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('debate_history').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('response_votes').select('*'),
      ]);

      if (compRes.data) {
        setComparisonHistory(compRes.data.map(item => ({
          id: item.id,
          query: item.query,
          responses: item.responses as unknown as ModelResponse[],
          created_at: item.created_at,
        })));
      }
      if (debRes.data) {
        setDebateHistory(debRes.data.map(item => ({
          id: item.id,
          query: item.query,
          models: item.models,
          settings: item.settings,
          round_responses: item.round_responses as unknown as any[],
          final_answer: item.final_answer,
          total_rounds: item.total_rounds,
          elapsed_time: item.elapsed_time,
          created_at: item.created_at,
        })));
      }
      if (votesRes.data) {
        setVotes(votesRes.data.map(item => ({
          id: item.id,
          history_id: item.history_id,
          history_type: item.history_type as 'comparison' | 'debate',
          model_id: item.model_id,
          vote_type: item.vote_type as 'up' | 'down',
        })));
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setIsLoading(false);
    }
  }, [enabled, user]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const saveComparison = async (query: string, responses: ModelResponse[]): Promise<string | null> => {
    if (!enabled || !user) return null;
    
    try {
      const { data, error } = await supabase
        .from('comparison_history')
        .insert({ query, responses: responses as any, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      
      const newItem: ComparisonHistory = {
        id: data.id,
        query: data.query,
        responses: data.responses as unknown as ModelResponse[],
        created_at: data.created_at,
      };
      setComparisonHistory(prev => [newItem, ...prev]);
      return data.id;
    } catch (error) {
      console.error('Error saving comparison:', error);
      return null;
    }
  };

  const saveDebate = async (
    query: string,
    models: string[],
    settings: any,
    roundResponses: any[],
    finalAnswer: string | null,
    totalRounds: number,
    elapsedTime: number
  ): Promise<string | null> => {
    if (!enabled || !user) return null;
    
    try {
      const { data, error } = await supabase
        .from('debate_history')
        .insert({
          query,
          models,
          settings: settings as any,
          round_responses: roundResponses as any,
          final_answer: finalAnswer,
          total_rounds: totalRounds,
          elapsed_time: elapsedTime,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      
      const newItem: DebateHistory = {
        id: data.id,
        query: data.query,
        models: data.models,
        settings: data.settings,
        round_responses: data.round_responses as unknown as any[],
        final_answer: data.final_answer,
        total_rounds: data.total_rounds,
        elapsed_time: data.elapsed_time,
        created_at: data.created_at,
      };
      setDebateHistory(prev => [newItem, ...prev]);
      return data.id;
    } catch (error) {
      console.error('Error saving debate:', error);
      return null;
    }
  };

  const vote = async (
    historyId: string,
    historyType: 'comparison' | 'debate',
    modelId: string,
    voteType: 'up' | 'down'
  ) => {
    try {
      const existingVote = votes.find(
        v => v.history_id === historyId && v.model_id === modelId
      );

      if (existingVote) {
        if (existingVote.vote_type === voteType) {
          await supabase.from('response_votes').delete().eq('id', existingVote.id);
          setVotes(prev => prev.filter(v => v.id !== existingVote.id));
        } else {
          await supabase
            .from('response_votes')
            .update({ vote_type: voteType })
            .eq('id', existingVote.id);
          setVotes(prev =>
            prev.map(v =>
              v.id === existingVote.id ? { ...v, vote_type: voteType } : v
            )
          );
        }
      } else {
        const { data, error } = await supabase
          .from('response_votes')
          .insert({ history_id: historyId, history_type: historyType, model_id: modelId, vote_type: voteType })
          .select()
          .single();

        if (error) throw error;
        const newVote: Vote = {
          id: data.id,
          history_id: data.history_id,
          history_type: data.history_type as 'comparison' | 'debate',
          model_id: data.model_id,
          vote_type: data.vote_type as 'up' | 'down',
        };
        setVotes(prev => [...prev, newVote]);
      }
    } catch (error) {
      console.error('Error voting:', error);
      toast({ title: 'Error', description: 'Failed to save vote', variant: 'destructive' });
    }
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
        .insert({ history_id: historyId, history_type: historyType })
        .select()
        .single();

      if (error) throw error;
      return data.share_code;
    } catch (error) {
      console.error('Error sharing:', error);
      return null;
    }
  };

  const clearHistory = async () => {
    try {
      await Promise.all([
        supabase.from('comparison_history').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('debate_history').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('response_votes').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      ]);
      setComparisonHistory([]);
      setDebateHistory([]);
      setVotes([]);
      toast({ title: 'History cleared', description: 'All saved history has been removed.' });
    } catch (error) {
      console.error('Error clearing history:', error);
    }
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
    refetch: fetchHistory,
  };
}
