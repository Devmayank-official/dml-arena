import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { User } from '@supabase/supabase-js';

interface TokenUsage {
  prompt: number;
  completion: number;
  total: number;
}

interface ModelResponse {
  model: string;
  response: string;
  error?: string;
  duration: number;
  tokens?: TokenUsage;
}

export interface CommunityComparison {
  id: string;
  query: string;
  responses: ModelResponse[];
  created_at: string;
  user_id: string;
  upvotes: number;
  downvotes: number;
  userVote: 'up' | 'down' | null;
}

interface CommunityVote {
  id: string;
  comparison_id: string;
  user_id: string;
  vote_type: 'up' | 'down';
}

export function useCommunityFeed() {
  const [comparisons, setComparisons] = useState<CommunityComparison[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();

  // Listen for auth state
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchFeed = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch public comparisons
      const { data: compData, error: compError } = await supabase
        .from('comparison_history')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(50);

      if (compError) throw compError;

      // Fetch all community votes
      const { data: votesData, error: votesError } = await supabase
        .from('community_votes')
        .select('*');

      if (votesError) throw votesError;

      const votes = votesData as CommunityVote[];

      // Map comparisons with vote counts
      const mappedComparisons: CommunityComparison[] = (compData || []).map(comp => {
        const compVotes = votes.filter(v => v.comparison_id === comp.id);
        const upvotes = compVotes.filter(v => v.vote_type === 'up').length;
        const downvotes = compVotes.filter(v => v.vote_type === 'down').length;
        const userVote = user 
          ? compVotes.find(v => v.user_id === user.id)?.vote_type as 'up' | 'down' | null ?? null
          : null;

        return {
          id: comp.id,
          query: comp.query,
          responses: comp.responses as unknown as ModelResponse[],
          created_at: comp.created_at,
          user_id: comp.user_id || '',
          upvotes,
          downvotes,
          userVote,
        };
      });

      setComparisons(mappedComparisons);
    } catch (error) {
      console.error('Error fetching community feed:', error);
      toast({
        title: 'Error',
        description: 'Failed to load community feed',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  const vote = async (comparisonId: string, voteType: 'up' | 'down') => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to vote on comparisons',
        variant: 'destructive',
      });
      return;
    }

    try {
      const comparison = comparisons.find(c => c.id === comparisonId);
      if (!comparison) return;

      if (comparison.userVote === voteType) {
        // Remove vote
        const { error } = await supabase
          .from('community_votes')
          .delete()
          .eq('comparison_id', comparisonId)
          .eq('user_id', user.id);

        if (error) throw error;

        setComparisons(prev => prev.map(c => 
          c.id === comparisonId 
            ? {
                ...c,
                userVote: null,
                upvotes: voteType === 'up' ? c.upvotes - 1 : c.upvotes,
                downvotes: voteType === 'down' ? c.downvotes - 1 : c.downvotes,
              }
            : c
        ));
      } else if (comparison.userVote) {
        // Change vote
        const { error } = await supabase
          .from('community_votes')
          .update({ vote_type: voteType })
          .eq('comparison_id', comparisonId)
          .eq('user_id', user.id);

        if (error) throw error;

        setComparisons(prev => prev.map(c => 
          c.id === comparisonId 
            ? {
                ...c,
                userVote: voteType,
                upvotes: voteType === 'up' ? c.upvotes + 1 : c.upvotes - 1,
                downvotes: voteType === 'down' ? c.downvotes + 1 : c.downvotes - 1,
              }
            : c
        ));
      } else {
        // New vote
        const { error } = await supabase
          .from('community_votes')
          .insert({ comparison_id: comparisonId, user_id: user.id, vote_type: voteType });

        if (error) throw error;

        setComparisons(prev => prev.map(c => 
          c.id === comparisonId 
            ? {
                ...c,
                userVote: voteType,
                upvotes: voteType === 'up' ? c.upvotes + 1 : c.upvotes,
                downvotes: voteType === 'down' ? c.downvotes + 1 : c.downvotes,
              }
            : c
        ));
      }
    } catch (error) {
      console.error('Error voting:', error);
      toast({
        title: 'Error',
        description: 'Failed to save vote',
        variant: 'destructive',
      });
    }
  };

  return {
    comparisons,
    isLoading,
    user,
    vote,
    refetch: fetchFeed,
  };
}
