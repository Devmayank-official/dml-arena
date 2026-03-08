/**
 * Zod schemas and TypeScript types
 * SKILL.md §2: "No 'any' — use 'unknown' + narrowing"
 * SKILL.md §2: "Zod for ALL external data validation"
 * 
 * Note: For database JSON fields that come as `Json` type from Supabase,
 * we use TypeScript interfaces. Zod schemas are used for form validation
 * and API responses where we control the data structure.
 */

import { z } from 'zod';

// ============================================================================
// TOKEN USAGE
// ============================================================================

export const tokenUsageSchema = z.object({
  prompt: z.number(),
  completion: z.number(),
  total: z.number(),
});

export type TokenUsage = z.infer<typeof tokenUsageSchema>;

// ============================================================================
// MODEL RESPONSE
// ============================================================================

export const modelResponseSchema = z.object({
  model: z.string(),
  response: z.string(),
  error: z.string().optional(),
  duration: z.number(),
  tokens: tokenUsageSchema.optional(),
  isStreaming: z.boolean().optional(),
  apiKeySource: z.enum(['user', 'system']).optional(),
});

export type ModelResponse = z.infer<typeof modelResponseSchema>;

// ============================================================================
// DEEP MODE SETTINGS (TypeScript interface for DB compatibility)
// ============================================================================

export type DebateStyle = 
  | 'collaborative' 
  | 'competitive' 
  | 'analytical' 
  | 'socratic' 
  | 'devils_advocate' 
  | 'consensus';

export type ResponseLength = 'concise' | 'balanced' | 'detailed' | 'more_detailed';

export type FocusArea = 'balanced' | 'technical' | 'creative' | 'practical' | 'theoretical';

export type ExpertPersona = 
  | 'none' 
  | 'scientist' 
  | 'engineer' 
  | 'philosopher' 
  | 'business' 
  | 'educator' 
  | 'critic' 
  | 'custom';

/**
 * Deep Mode settings - used in debates
 * Note: Stored as JSON in database, so using interface rather than Zod
 */
export interface DeepModeSettings {
  rounds: number;
  style: DebateStyle;
  responseLength: ResponseLength;
  focusArea: FocusArea;
  persona: ExpertPersona;
  customPersona?: string;
  synthesizer: string;
}

// Zod schema for validation when needed
export const deepModeSettingsSchema = z.object({
  rounds: z.number().min(2).max(5),
  style: z.enum(['collaborative', 'competitive', 'analytical', 'socratic', 'devils_advocate', 'consensus']),
  responseLength: z.enum(['concise', 'balanced', 'detailed', 'more_detailed']),
  focusArea: z.enum(['balanced', 'technical', 'creative', 'practical', 'theoretical']),
  persona: z.enum(['none', 'scientist', 'engineer', 'philosopher', 'business', 'educator', 'critic', 'custom']),
  customPersona: z.string().optional(),
  synthesizer: z.string(),
});

// ============================================================================
// ROUND RESPONSE (for debates)
// ============================================================================

export interface RoundResponse {
  round: number;
  model: string;
  response: string;
}

export const roundResponseSchema = z.object({
  round: z.number(),
  model: z.string(),
  response: z.string(),
});

// ============================================================================
// COMPARISON HISTORY
// ============================================================================

export interface ComparisonHistory {
  id: string;
  query: string;
  responses: ModelResponse[];
  created_at: string;
  category?: string | null;
  is_public?: boolean;
}

// ============================================================================
// DEBATE HISTORY
// ============================================================================

/**
 * Debate history as stored in database
 * Note: settings and round_responses are JSON fields
 */
export interface DebateHistory {
  id: string;
  query: string;
  models: string[];
  settings: DeepModeSettings;
  round_responses: RoundResponse[];
  final_answer: string | null;
  total_rounds: number;
  elapsed_time: number;
  created_at: string;
  is_public?: boolean;
}

// ============================================================================
// VOTES
// ============================================================================

export type VoteType = 'up' | 'down';
export type HistoryType = 'comparison' | 'debate';

export interface Vote {
  id: string;
  history_id: string;
  history_type: HistoryType;
  model_id: string;
  vote_type: VoteType;
}

// ============================================================================
// QUERY HISTORY (client-side tracking)
// ============================================================================

export interface QueryHistory {
  id: string | null;
  query: string;
  responses: ModelResponse[];
  timestamp: Date;
}

// ============================================================================
// CONVERSATION TYPES
// ============================================================================

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  model?: string;
  timestamp: Date;
}

export interface ConversationTurn {
  id: string;
  query: string;
  responses: ModelResponse[];
  timestamp: Date;
}

export interface Conversation {
  id: string;
  turns: ConversationTurn[];
  selectedModels: string[];
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// EXPORT DATA
// ============================================================================

export interface ExportData {
  query: string;
  responses: ModelResponse[];
  createdAt?: string;
  type?: HistoryType;
  debateRounds?: RoundResponse[];
  finalAnswer?: string;
}

// ============================================================================
// SUBSCRIPTION
// ============================================================================

export type SubscriptionPlan = 'free' | 'pro';

export interface Subscription {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  monthly_usage: number;
  usage_reset_at: string;
  created_at: string;
  updated_at: string;
  subscription_start?: string | null;
  subscription_end?: string | null;
  cancelled_at?: string | null;
  razorpay_subscription_id?: string | null;
  billing_cycle?: string | null;
}

// ============================================================================
// RATE LIMITS
// ============================================================================

export interface RateLimitInfo {
  window: string;
  usage: number;
  limit: number;
  remaining: number;
  resetAt: string;
  exceeded: boolean;
}

export interface RateLimits {
  perMinute: RateLimitInfo | null;
  perHour: RateLimitInfo | null;
  perDay: RateLimitInfo | null;
  perMonth: RateLimitInfo | null;
}

// ============================================================================
// FAVORITES
// ============================================================================

export interface Favorite {
  id: string;
  comparison_id: string | null;
  debate_id: string | null;
  created_at: string;
}

// ============================================================================
// PROFILE
// ============================================================================

export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// FORM SCHEMAS (Zod for validation)
// ============================================================================

export const chatInputSchema = z.object({
  message: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(10000, 'Message must be less than 10,000 characters'),
});

export type ChatInput = z.infer<typeof chatInputSchema>;

export const authFormSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type AuthFormData = z.infer<typeof authFormSchema>;

export const profileFormSchema = z.object({
  display_name: z.string().max(100, 'Display name must be less than 100 characters').optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  avatar_url: z.string().url('Invalid URL').optional().or(z.literal('')),
});

export type ProfileFormData = z.infer<typeof profileFormSchema>;

// ============================================================================
// API KEY CONFIG
// ============================================================================

export interface ApiKeyConfig {
  openrouter?: string;
  openai?: string;
  anthropic?: string;
  google?: string;
  mistral?: string;
  groq?: string;
}

export const apiKeyConfigSchema = z.object({
  openrouter: z.string().optional(),
  openai: z.string().optional(),
  anthropic: z.string().optional(),
  google: z.string().optional(),
  mistral: z.string().optional(),
  groq: z.string().optional(),
});

// ============================================================================
// STREAMING EVENTS
// ============================================================================

export type StreamEventType = 'start' | 'delta' | 'complete' | 'error';

export interface StreamEvent {
  type: StreamEventType;
  model: string;
  content?: string;
  duration?: number;
  tokens?: TokenUsage;
  error?: string;
  apiKeySource?: 'user' | 'system';
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Safely parse and validate data against a Zod schema
 * Returns typed data or null if validation fails
 */
export function safeParseData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): T | null {
  const result = schema.safeParse(data);
  return result.success ? result.data : null;
}

/**
 * Parse data with detailed error information
 */
export function parseWithErrors<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

/**
 * Type guard for ModelResponse
 */
export function isModelResponse(obj: unknown): obj is ModelResponse {
  if (!obj || typeof obj !== 'object') return false;
  const response = obj as Record<string, unknown>;
  return (
    typeof response.model === 'string' &&
    typeof response.response === 'string' &&
    typeof response.duration === 'number'
  );
}

/**
 * Type guard for RoundResponse
 */
export function isRoundResponse(obj: unknown): obj is RoundResponse {
  if (!obj || typeof obj !== 'object') return false;
  const response = obj as Record<string, unknown>;
  return (
    typeof response.round === 'number' &&
    typeof response.model === 'string' &&
    typeof response.response === 'string'
  );
}

/**
 * Type guard for DeepModeSettings
 */
export function isDeepModeSettings(obj: unknown): obj is DeepModeSettings {
  if (!obj || typeof obj !== 'object') return false;
  const settings = obj as Record<string, unknown>;
  return (
    typeof settings.rounds === 'number' &&
    typeof settings.style === 'string' &&
    typeof settings.responseLength === 'string' &&
    typeof settings.focusArea === 'string' &&
    typeof settings.persona === 'string' &&
    typeof settings.synthesizer === 'string'
  );
}
