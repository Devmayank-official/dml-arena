import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
  initialize: () => () => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    (set) => ({
      user: null,
      session: null,
      loading: true,

      setUser: (user) => set({ user }, false, 'setUser'),
      setSession: (session) => set({ session }, false, 'setSession'),
      setLoading: (loading) => set({ loading }, false, 'setLoading'),

      initialize: () => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, session) => {
            set({ session, user: session?.user ?? null, loading: false }, false, 'authStateChange');
            logger.logAuth(`Auth state changed: ${event}`, {
              userId: session?.user?.id,
              email: session?.user?.email,
            });
          }
        );

        supabase.auth.getSession().then(({ data: { session } }) => {
          set({ session, user: session?.user ?? null, loading: false }, false, 'getSession');
        });

        return () => subscription.unsubscribe();
      },

      signUp: async (email, password) => {
        const redirectUrl = `${window.location.origin}/chat`;
        logger.logAuth('Sign up attempted', { email });
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: redirectUrl },
        });
        if (error) {
          logger.error('auth', 'Sign up failed', { email, error: error.message });
        } else {
          logger.logAuth('Sign up successful', { email });
        }
        return { error };
      },

      signIn: async (email, password) => {
        logger.logAuth('Sign in attempted', { email });
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          logger.error('auth', 'Sign in failed', { email, error: error.message });
        } else {
          logger.logAuth('Sign in successful', { email });
        }
        return { error };
      },

      signOut: async () => {
        logger.logAuth('Sign out initiated');
        const { error } = await supabase.auth.signOut();
        if (error) {
          logger.error('auth', 'Sign out failed', { error: error.message });
        } else {
          logger.logAuth('Sign out successful');
        }
        return { error };
      },
    }),
    { name: 'AuthStore' }
  )
);
