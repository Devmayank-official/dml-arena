/**
 * Auth feature module — public API
 * SKILL.md §4: Feature-based folder structure
 */
export { useAuthStore } from '@/stores/auth.store';
export { useAuth } from '@/hooks/useAuth';
export { authSchema, type AuthFormData } from '@/lib/schemas';
