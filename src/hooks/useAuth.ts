import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth.store';

/**
 * Backward-compatible useAuth hook powered by Zustand.
 * Drop-in replacement — same API surface.
 */
export function useAuth() {
  const store = useAuthStore();

  useEffect(() => {
    const unsubscribe = store.initialize();
    return unsubscribe;
  }, []);

  return {
    user: store.user,
    session: store.session,
    loading: store.loading,
    signUp: store.signUp,
    signIn: store.signIn,
    signOut: store.signOut,
  };
}
