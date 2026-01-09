import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface Favorite {
  id: string;
  comparison_id: string | null;
  debate_id: string | null;
  created_at: string;
}

export function useFavorites() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchFavorites = useCallback(async () => {
    if (!user) {
      setFavorites([]);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_favorites')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFavorites(data || []);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const addFavorite = async (
    type: 'comparison' | 'debate',
    id: string
  ): Promise<boolean> => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to bookmark items.',
        variant: 'destructive',
      });
      return false;
    }

    try {
      const insertData = {
        user_id: user.id,
        comparison_id: type === 'comparison' ? id : null,
        debate_id: type === 'debate' ? id : null,
      };

      const { data, error } = await supabase
        .from('user_favorites')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      setFavorites((prev) => [data, ...prev]);
      toast({
        title: 'Added to favorites',
        description: 'Item has been bookmarked.',
      });
      return true;
    } catch (error) {
      console.error('Error adding favorite:', error);
      toast({
        title: 'Error',
        description: 'Failed to add to favorites.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const removeFavorite = async (favoriteId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('id', favoriteId);

      if (error) throw error;

      setFavorites((prev) => prev.filter((f) => f.id !== favoriteId));
      toast({
        title: 'Removed from favorites',
        description: 'Item has been unbookmarked.',
      });
      return true;
    } catch (error) {
      console.error('Error removing favorite:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove from favorites.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const isFavorite = (type: 'comparison' | 'debate', id: string): boolean => {
    return favorites.some(
      (f) =>
        (type === 'comparison' && f.comparison_id === id) ||
        (type === 'debate' && f.debate_id === id)
    );
  };

  const getFavoriteId = (type: 'comparison' | 'debate', id: string): string | null => {
    const favorite = favorites.find(
      (f) =>
        (type === 'comparison' && f.comparison_id === id) ||
        (type === 'debate' && f.debate_id === id)
    );
    return favorite?.id || null;
  };

  const toggleFavorite = async (
    type: 'comparison' | 'debate',
    id: string
  ): Promise<boolean> => {
    const favoriteId = getFavoriteId(type, id);
    if (favoriteId) {
      return removeFavorite(favoriteId);
    } else {
      return addFavorite(type, id);
    }
  };

  return {
    favorites,
    isLoading,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    getFavoriteId,
    refetch: fetchFavorites,
  };
}
