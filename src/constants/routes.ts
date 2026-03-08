/**
 * Route path constants
 * SKILL.md §16: "No hardcoded route strings"
 * 
 * All route paths should be referenced from this file.
 * Never use hardcoded strings like "/chat/settings" in components.
 */

export const ROUTES = {
  // Public routes
  HOME: '/',
  LANDING: '/',
  AUTH: '/auth',
  PRICING: '/pricing',
  INSTALL: '/install',
  
  // Protected routes (require authentication)
  CHAT: '/chat',
  COMMUNITY: '/chat/community',
  COMMUNITY_ITEM: (id: string) => `/chat/community/${id}` as const,
  PROFILE: (userId: string) => `/chat/profile/${userId}` as const,
  SETTINGS: '/chat/settings',
  HISTORY: '/chat/history',
  DASHBOARD: '/chat/dashboard',
  INSIGHTS: '/chat/insights',
  PINNED: '/chat/pinned',
  LEADERBOARD: '/chat/leaderboard', // Redirects to community
  SHARED_RESULT: (code: string) => `/chat/share/${code}` as const,
} as const;

/**
 * Type for static routes (excludes dynamic route functions)
 */
export type StaticRoute = Exclude<
  (typeof ROUTES)[keyof typeof ROUTES],
  (...args: unknown[]) => string
>;

/**
 * Check if a path is a protected route
 */
export function isProtectedRoute(path: string): boolean {
  return path.startsWith('/chat');
}

/**
 * Check if a path is a public route
 */
export function isPublicRoute(path: string): boolean {
  const publicRoutes = [ROUTES.HOME, ROUTES.AUTH, ROUTES.PRICING, ROUTES.INSTALL];
  return publicRoutes.includes(path as StaticRoute);
}

/**
 * Get the redirect path after authentication
 */
export function getPostAuthRedirect(intendedPath?: string): string {
  if (intendedPath && isProtectedRoute(intendedPath)) {
    return intendedPath;
  }
  return ROUTES.CHAT;
}
