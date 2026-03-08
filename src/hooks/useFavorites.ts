/**
 * useFavorites hook
 * SKILL.md §6.1: Migrated to TanStack Query for state management
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { queryKeys } from '@/constants';
import { logger } from '@/lib/logger';

export interface Favorite {
  id: string;
  comparison_id: string | null;
  debate_id: string | null;
  created_at: string;
}

async function fetchFavorites(userId: string): Promise<Favorite[]> {
  const { data, error } = await supabase
    .from('user_favorites')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('error', 'Failed to fetch favorites', { error: error.message });
    return [];
  }
  return data || [];
}

export function useFavorites() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: favorites = [], isLoading, refetch } = useQuery({
    queryKey: user ? queryKeys.favorites.list(user.id) : ['favorites', 'none'],
    queryFn: () => (user ? fetchFavorites(user.id) : Promise.resolve([])),
    enabled: !!user,
    staleTime: 60_000, // 1 minute
  });

  const addFavoriteMutation = useMutation({
    mutationFn: async ({ type, id }: { type: 'comparison' | 'debate'; id: string }) => {
      if (!user) throw new Error('Not authenticated');

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
      return data;
    },
    onSuccess: () => {
      if (user) {
        queryClient.invalidateQueries({ queryKey: queryKeys.favorites.list(user.id) });
      }
      toast({ title: 'Added to favorites', description: 'Item has been bookmarked.' });
    },
    onError: (error) => {
      logger.error('error', 'Failed to add favorite', { error: error instanceof Error ? error.message : 'Unknown' });
      toast({ title: 'Error', description: 'Failed to add to favorites.', variant: 'destructive' });
    },
  });

  const removeFavoriteMutation = useMutation({
    mutationFn: async (favoriteId: string) => {
      const { error } = await supabase.from('user_favorites').delete().eq('id', favoriteId);
      if (error) throw error;
    },
    onSuccess: () => {
      if (user) {
        queryClient.invalidateQueries({ queryKey: queryKeys.favorites.list(user.id) });
      }
      toast({ title: 'Removed from favorites', description: 'Item has been unbookmarked.' });
    },
    onError: (error) => {
      logger.error('error', 'Failed to remove favorite', { error: error instanceof Error ? error.message : 'Unknown' });
      toast({ title: 'Error', description: 'Failed to remove from favorites.', variant: 'destructive' });
    },
  });

  const addFavorite = async (type: 'comparison' | 'debate', id: string): Promise<boolean> => {
    if (!user) {
      toast({ title: 'Sign in required', description: 'Please sign in to bookmark items.', variant: 'destructive' });
      return false;
    }
    try {
      await addFavoriteMutation.mutateAsync({ type, id });
      return true;
    } catch {
      return false;
    }
  };

  const removeFavorite = async (favoriteId: string): Promise<boolean> => {
    try {
      await removeFavoriteMutation.mutateAsync(favoriteId);
      return true;
    } catch {
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

  const toggleFavorite = async (type: 'comparison' | 'debate', id: string): Promise<boolean> => {
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
    refetch,
  };
}
