/**
 * Features — unified barrel export
 * SKILL.md §4: Feature-based folder structure
 *
 * Import from feature modules directly for treeshaking:
 *   import { useAuth } from '@/features/auth';
 *   import { useHistory } from '@/features/history';
 *
 * This file provides a convenience re-export for discovery.
 */
export * from './auth';
export * from './arena';
export * from './community';
export * from './debate';
export * from './export';
export * from './history';
export * from './leaderboard';
export * from './settings';
export * from './subscription';
