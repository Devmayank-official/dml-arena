/**
 * TanStack Query key factory
 * SKILL.md §6.3: "Centralized query keys factory"
 * 
 * All query keys should be defined here using the factory pattern.
 * This ensures type safety and prevents key collisions.
 * 
 * @example
 * const { data } = useQuery({
 *   queryKey: queryKeys.subscription.detail(userId),
 *   queryFn: fetchSubscription,
 * });
 */

export const queryKeys = {
  // Subscription & usage
  subscription: {
    all: ['subscription'] as const,
    detail: (userId: string) => ['subscription', 'detail', userId] as const,
    usage: (userId: string) => ['subscription', 'usage', userId] as const,
    rateLimits: (userId: string) => ['subscription', 'rate-limits', userId] as const,
  },

  // Comparison history
  history: {
    all: ['history'] as const,
    comparisons: (userId: string) => ['history', 'comparisons', userId] as const,
    debates: (userId: string) => ['history', 'debates', userId] as const,
    item: (id: string) => ['history', 'item', id] as const,
  },

  // Favorites / bookmarks
  favorites: {
    all: ['favorites'] as const,
    list: (userId: string) => ['favorites', 'list', userId] as const,
    item: (id: string) => ['favorites', 'item', id] as const,
  },

  // Votes
  votes: {
    all: ['votes'] as const,
    byUser: (userId: string) => ['votes', 'user', userId] as const,
    byHistory: (historyId: string) => ['votes', 'history', historyId] as const,
  },

  // Ratings
  ratings: {
    all: ['ratings'] as const,
    byUser: (userId: string) => ['ratings', 'user', userId] as const,
    byHistory: (historyId: string) => ['ratings', 'history', historyId] as const,
  },

  // Community
  community: {
    all: ['community'] as const,
    feed: (filters?: { page?: number; category?: string }) =>
      ['community', 'feed', filters] as const,
    item: (id: string) => ['community', 'item', id] as const,
    votes: (itemId: string) => ['community', 'votes', itemId] as const,
  },

  // Leaderboard
  leaderboard: {
    all: ['leaderboard'] as const,
    rankings: (timeRange?: string, category?: string) =>
      ['leaderboard', 'rankings', timeRange, category] as const,
    modelStats: (modelId: string) => ['leaderboard', 'model', modelId] as const,
    performance: (filters?: { timeRange?: string; modelId?: string }) =>
      ['leaderboard', 'performance', filters] as const,
  },

  // User profiles
  profiles: {
    all: ['profiles'] as const,
    detail: (userId: string) => ['profiles', 'detail', userId] as const,
    public: (userId: string) => ['profiles', 'public', userId] as const,
  },

  // Model performance metrics
  modelPerformance: {
    all: ['model-performance'] as const,
    byUser: (userId: string) => ['model-performance', 'user', userId] as const,
    byModel: (modelId: string) => ['model-performance', 'model', modelId] as const,
    aggregated: () => ['model-performance', 'aggregated'] as const,
  },

  // Shared results
  sharedResults: {
    all: ['shared-results'] as const,
    byCode: (shareCode: string) => ['shared-results', 'code', shareCode] as const,
    byUser: (userId: string) => ['shared-results', 'user', userId] as const,
  },

  // Debate ratings (per round)
  debateRatings: {
    all: ['debate-ratings'] as const,
    byDebate: (debateId: string) => ['debate-ratings', 'debate', debateId] as const,
  },

  // Pinned responses
  pinned: {
    all: ['pinned'] as const,
    list: (userId: string) => ['pinned', 'list', userId] as const,
  },
} as const;

/**
 * Type helper to extract query key types
 */
export type QueryKeys = typeof queryKeys;
