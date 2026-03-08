import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

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

export interface UserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserComparison {
  id: string;
  query: string;
  responses: ModelResponse[];
  created_at: string;
  is_public: boolean;
}

export interface UserStats {
  totalComparisons: number;
  totalDebates: number;
  totalVotesReceived: number;
  modelsUsed: number;
}

export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [comparisons, setComparisons] = useState<UserComparison[]>([]);
  const [stats, setStats] = useState<UserStats>({ 
    totalComparisons: 0, 
    totalDebates: 0, 
    totalVotesReceived: 0,
    modelsUsed: 0 
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Get current user to check ownership
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      const ownerCheck = currentUser?.id === userId;
      setIsOwner(ownerCheck);

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (profileError) throw profileError;
      
      if (profileData) {
        setProfile({
          id: profileData.id,
          user_id: profileData.user_id,
          display_name: profileData.display_name,
          avatar_url: profileData.avatar_url,
          bio: profileData.bio,
          created_at: profileData.created_at,
          updated_at: profileData.updated_at,
        });
      }

      // Fetch user's public comparisons (or all if owner)
      let compQuery = supabase
        .from('comparison_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!ownerCheck) {
        compQuery = compQuery.eq('is_public', true);
      }

      const { data: compData } = await compQuery;

      if (compData) {
        setComparisons(compData.map(c => ({
          id: c.id,
          query: c.query,
          responses: c.responses as unknown as ModelResponse[],
          created_at: c.created_at,
          is_public: c.is_public ?? true,
        })));
      }

      // Fetch stats
      const [compCount, debCount, votesReceived] = await Promise.all([
        supabase.from('comparison_history').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('debate_history').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('community_votes').select('comparison_id', { count: 'exact', head: true })
          .in('comparison_id', (compData || []).map(c => c.id)),
      ]);

      // Count unique models used
      const allModels = new Set<string>();
      (compData || []).forEach(c => {
        const responses = c.responses as unknown as ModelResponse[];
        responses.forEach(r => allModels.add(r.model));
      });

      setStats({
        totalComparisons: compCount.count || 0,
        totalDebates: debCount.count || 0,
        totalVotesReceived: votesReceived.count || 0,
        modelsUsed: allModels.size,
      });
    } catch (error) {
      logger.error('error', 'Error fetching profile', { error: error instanceof Error ? error.message : 'Unknown' });
      toast({
        title: 'Error',
        description: 'Failed to load profile',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [userId, toast]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = async (updates: Partial<Pick<UserProfile, 'display_name' | 'bio' | 'avatar_url'>>) => {
    if (!profile || !isOwner) return false;

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', profile.user_id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, ...updates } : null);
      toast({ title: 'Profile updated', description: 'Your changes have been saved.' });
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({ title: 'Error', description: 'Failed to update profile', variant: 'destructive' });
      return false;
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!profile || !isOwner) return null;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${profile.user_id}/avatar.${fileExt}`;

      // Upload the file
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Add cache-busting parameter
      const avatarUrl = `${publicUrl}?t=${Date.now()}`;

      // Update the profile with the new avatar URL
      await updateProfile({ avatar_url: avatarUrl });

      return avatarUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({ title: 'Error', description: 'Failed to upload avatar', variant: 'destructive' });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const sendPasswordReset = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });
      if (error) throw error;
      toast({ title: 'Email sent', description: 'Check your inbox for the password reset link.' });
      return true;
    } catch (error) {
      console.error('Error sending password reset:', error);
      toast({ title: 'Error', description: 'Failed to send password reset email', variant: 'destructive' });
      return false;
    }
  };

  return {
    profile,
    comparisons,
    stats,
    isLoading,
    isOwner,
    isUploading,
    updateProfile,
    uploadAvatar,
    sendPasswordReset,
    refetch: fetchProfile,
  };
}
