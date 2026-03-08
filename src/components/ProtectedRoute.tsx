import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { ROUTES } from '@/constants/routes';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Protected route wrapper using Zustand auth store
 * SKILL.md: "Zustand for ALL global client state"
 * 
 * Redirects unauthenticated users to /auth with return path
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { session, loading } = useAuthStore();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    // Redirect to auth with return path
    return <Navigate to={ROUTES.AUTH} state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
