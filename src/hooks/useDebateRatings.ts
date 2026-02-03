import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface DebateRating {
  id: string;
  debate_id: string;
  model_id: string;
  round: number;
  rating: number;
}

export function useDebateRatings(debateId: string | null) {
  const { user } = useAuth();
  const [ratings, setRatings] = useState<DebateRating[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch ratings from database
  const fetchRatings = useCallback(async () => {
    if (!user || !debateId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('response_ratings')
        .select('*')
        .eq('user_id', user.id)
        .eq('history_id', debateId)
        .eq('history_type', 'debate');
      
      if (error) throw error;
      
      // Map to local type - parse round from model_id (e.g., "model-id:round:2")
      const mappedRatings: DebateRating[] = (data || []).map(r => {
        const parts = r.model_id.split(':round:');
        return {
          id: r.id,
          debate_id: r.history_id,
          model_id: parts[0],
          round: parseInt(parts[1]) || 1,
          rating: r.rating
        };
      });
      setRatings(mappedRatings);
    } catch (error) {
      console.error('Error fetching debate ratings:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, debateId]);

  useEffect(() => {
    fetchRatings();
  }, [fetchRatings]);

  // Rate a debate round response
  const rateResponse = useCallback(async (
    modelId: string,
    round: number,
    rating: number
  ) => {
    if (!user || !debateId) return;

    // Create a composite key for model+round
    const compositeModelId = `${modelId}:round:${round}`;

    try {
      // Check if rating exists
      const existingRating = ratings.find(
        r => r.model_id === modelId && r.round === round
      );

      if (existingRating) {
        // Update existing rating
        const { error } = await supabase
          .from('response_ratings')
          .update({ rating, updated_at: new Date().toISOString() })
          .eq('id', existingRating.id);
        
        if (error) throw error;
        
        setRatings(prev => 
          prev.map(r => 
            r.id === existingRating.id ? { ...r, rating } : r
          )
        );
      } else {
        // Create new rating
        const { data, error } = await supabase
          .from('response_ratings')
          .insert({
            user_id: user.id,
            history_id: debateId,
            history_type: 'debate',
            model_id: compositeModelId,
            rating
          })
          .select()
          .single();
        
        if (error) throw error;
        if (data) {
          const newRating: DebateRating = {
            id: data.id,
            debate_id: debateId,
            model_id: modelId,
            round,
            rating
          };
          setRatings(prev => [...prev, newRating]);
        }
      }
    } catch (error) {
      console.error('Error saving debate rating:', error);
    }
  }, [user, debateId, ratings]);

  // Get rating for a specific model and round
  const getRating = useCallback((modelId: string, round: number): number | null => {
    const rating = ratings.find(
      r => r.model_id === modelId && r.round === round
    );
    return rating?.rating ?? null;
  }, [ratings]);

  // Get average rating for a model across all rounds
  const getModelAverageRating = useCallback((modelId: string): number | null => {
    const modelRatings = ratings.filter(r => r.model_id === modelId);
    if (modelRatings.length === 0) return null;
    
    const sum = modelRatings.reduce((acc, r) => acc + r.rating, 0);
    return sum / modelRatings.length;
  }, [ratings]);

  return {
    ratings,
    isLoading,
    rateResponse,
    getRating,
    getModelAverageRating,
    refetch: fetchRatings
  };
}
