import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';

interface Rating {
  id: string;
  history_id: string;
  history_type: 'comparison' | 'debate';
  model_id: string;
  rating: number;
}

export function useRatings(enabled: boolean = true) {
  const { user } = useAuth();
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch ratings from database
  const fetchRatings = useCallback(async () => {
    if (!user || !enabled) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('response_ratings')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      // Map database response to local type
      const mappedRatings: Rating[] = (data || []).map(r => ({
        id: r.id,
        history_id: r.history_id,
        history_type: r.history_type as 'comparison' | 'debate',
        model_id: r.model_id,
        rating: r.rating
      }));
      setRatings(mappedRatings);
    } catch (error) {
      console.error('Error fetching ratings:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, enabled]);

  useEffect(() => {
    fetchRatings();
  }, [fetchRatings]);

  // Rate a response
  const rate = useCallback(async (
    historyId: string,
    historyType: 'comparison' | 'debate',
    modelId: string,
    rating: number
  ) => {
    if (!user) return;

    try {
      // Check if rating exists
      const existingRating = ratings.find(
        r => r.history_id === historyId && r.model_id === modelId
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
            history_id: historyId,
            history_type: historyType,
            model_id: modelId,
            rating
          })
          .select()
          .single();
        
        if (error) throw error;
        if (data) {
          const newRating: Rating = {
            id: data.id,
            history_id: data.history_id,
            history_type: data.history_type as 'comparison' | 'debate',
            model_id: data.model_id,
            rating: data.rating
          };
          setRatings(prev => [...prev, newRating]);
        }
      }
    } catch (error) {
      console.error('Error saving rating:', error);
    }
  }, [user, ratings]);

  // Get rating for a specific model response
  const getRating = useCallback((historyId: string, modelId: string): number | null => {
    const rating = ratings.find(
      r => r.history_id === historyId && r.model_id === modelId
    );
    return rating?.rating ?? null;
  }, [ratings]);

  // Get average rating for a model across all history
  const getModelAverageRating = useCallback((modelId: string): number | null => {
    const modelRatings = ratings.filter(r => r.model_id === modelId);
    if (modelRatings.length === 0) return null;
    
    const sum = modelRatings.reduce((acc, r) => acc + r.rating, 0);
    return sum / modelRatings.length;
  }, [ratings]);

  return {
    ratings,
    isLoading,
    rate,
    getRating,
    getModelAverageRating,
    refetch: fetchRatings
  };
}