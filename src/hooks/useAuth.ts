import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Log auth state changes
        logger.logAuth(`Auth state changed: ${event}`, {
          userId: session?.user?.id,
          email: session?.user?.email,
        });
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/chat`;
    
    logger.logAuth('Sign up attempted', { email });
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    
    if (error) {
      logger.error('auth', 'Sign up failed', { email, error: error.message });
    } else {
      logger.logAuth('Sign up successful', { email });
    }
    
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    logger.logAuth('Sign in attempted', { email });
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      logger.error('auth', 'Sign in failed', { email, error: error.message });
    } else {
      logger.logAuth('Sign in successful', { email });
    }
    
    return { error };
  };

  const signOut = async () => {
    logger.logAuth('Sign out initiated');
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      logger.error('auth', 'Sign out failed', { error: error.message });
    } else {
      logger.logAuth('Sign out successful');
    }
    
    return { error };
  };

  return {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
  };
}
