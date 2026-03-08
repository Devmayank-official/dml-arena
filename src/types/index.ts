/**
 * Zod schemas and TypeScript types
 * SKILL.md §2: "No 'any' — use 'unknown' + narrowing"
 * SKILL.md §2: "Zod for ALL external data validation"
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
// DEEP MODE SETTINGS
// ============================================================================

export const debateStyleSchema = z.enum([
  'collaborative',
  'competitive',
  'analytical',
  'socratic',
  'devils_advocate',
  'consensus',
]);

export const responseLengthSchema = z.enum([
  'concise',
  'balanced',
  'detailed',
  'more_detailed',
]);

export const focusAreaSchema = z.enum([
  'balanced',
  'technical',
  'creative',
  'practical',
  'theoretical',
]);

export const expertPersonaSchema = z.enum([
  'none',
  'scientist',
  'engineer',
  'philosopher',
  'business',
  'educator',
  'critic',
  'custom',
]);

export const deepModeSettingsSchema = z.object({
  rounds: z.number().min(2).max(5),
  style: debateStyleSchema,
  responseLength: responseLengthSchema,
  focusArea: focusAreaSchema,
  persona: expertPersonaSchema,
  customPersona: z.string().optional(),
  synthesizer: z.string(),
});

export type DeepModeSettings = z.infer<typeof deepModeSettingsSchema>;
export type DebateStyle = z.infer<typeof debateStyleSchema>;
export type ResponseLength = z.infer<typeof responseLengthSchema>;
export type FocusArea = z.infer<typeof focusAreaSchema>;
export type ExpertPersona = z.infer<typeof expertPersonaSchema>;

// ============================================================================
// ROUND RESPONSE (for debates)
// ============================================================================

export const roundResponseSchema = z.object({
  round: z.number(),
  model: z.string(),
  response: z.string(),
});

export type RoundResponse = z.infer<typeof roundResponseSchema>;

// ============================================================================
// COMPARISON HISTORY
// ============================================================================

export const comparisonHistorySchema = z.object({
  id: z.string().uuid(),
  query: z.string(),
  responses: z.array(modelResponseSchema),
  created_at: z.string(),
  category: z.string().nullable().optional(),
  is_public: z.boolean().optional(),
});

export type ComparisonHistory = z.infer<typeof comparisonHistorySchema>;

// ============================================================================
// DEBATE HISTORY
// ============================================================================

export const debateHistorySchema = z.object({
  id: z.string().uuid(),
  query: z.string(),
  models: z.array(z.string()),
  settings: deepModeSettingsSchema,
  round_responses: z.array(roundResponseSchema),
  final_answer: z.string().nullable(),
  total_rounds: z.number(),
  elapsed_time: z.number(),
  created_at: z.string(),
  is_public: z.boolean().optional(),
});

export type DebateHistory = z.infer<typeof debateHistorySchema>;

// ============================================================================
// VOTES
// ============================================================================

export const voteTypeSchema = z.enum(['up', 'down']);
export const historyTypeSchema = z.enum(['comparison', 'debate']);

export const voteSchema = z.object({
  id: z.string().uuid(),
  history_id: z.string().uuid(),
  history_type: historyTypeSchema,
  model_id: z.string(),
  vote_type: voteTypeSchema,
});

export type Vote = z.infer<typeof voteSchema>;
export type VoteType = z.infer<typeof voteTypeSchema>;
export type HistoryType = z.infer<typeof historyTypeSchema>;

// ============================================================================
// QUERY HISTORY (client-side tracking)
// ============================================================================

export const queryHistorySchema = z.object({
  id: z.string().uuid().nullable(),
  query: z.string(),
  responses: z.array(modelResponseSchema),
  timestamp: z.date(),
});

export type QueryHistory = z.infer<typeof queryHistorySchema>;

// ============================================================================
// CONVERSATION TYPES
// ============================================================================

export const conversationMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  model: z.string().optional(),
  timestamp: z.date(),
});

export type ConversationMessage = z.infer<typeof conversationMessageSchema>;

export const conversationTurnSchema = z.object({
  id: z.string(),
  query: z.string(),
  responses: z.array(modelResponseSchema),
  timestamp: z.date(),
});

export type ConversationTurn = z.infer<typeof conversationTurnSchema>;

export const conversationSchema = z.object({
  id: z.string(),
  turns: z.array(conversationTurnSchema),
  selectedModels: z.array(z.string()),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Conversation = z.infer<typeof conversationSchema>;

// ============================================================================
// EXPORT DATA
// ============================================================================

export const exportDataSchema = z.object({
  query: z.string(),
  responses: z.array(modelResponseSchema),
  createdAt: z.string().optional(),
  type: historyTypeSchema.optional(),
  debateRounds: z.array(roundResponseSchema).optional(),
  finalAnswer: z.string().optional(),
});

export type ExportData = z.infer<typeof exportDataSchema>;

// ============================================================================
// SUBSCRIPTION
// ============================================================================

export const subscriptionPlanSchema = z.enum(['free', 'pro']);

export const subscriptionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  plan: subscriptionPlanSchema,
  monthly_usage: z.number(),
  usage_reset_at: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  subscription_start: z.string().nullable().optional(),
  subscription_end: z.string().nullable().optional(),
  cancelled_at: z.string().nullable().optional(),
  razorpay_subscription_id: z.string().nullable().optional(),
  billing_cycle: z.string().nullable().optional(),
});

export type Subscription = z.infer<typeof subscriptionSchema>;
export type SubscriptionPlan = z.infer<typeof subscriptionPlanSchema>;

// ============================================================================
// RATE LIMITS
// ============================================================================

export const rateLimitInfoSchema = z.object({
  window: z.string(),
  usage: z.number(),
  limit: z.number(),
  remaining: z.number(),
  resetAt: z.string(),
  exceeded: z.boolean(),
});

export type RateLimitInfo = z.infer<typeof rateLimitInfoSchema>;

export const rateLimitsSchema = z.object({
  perMinute: rateLimitInfoSchema.nullable(),
  perHour: rateLimitInfoSchema.nullable(),
  perDay: rateLimitInfoSchema.nullable(),
  perMonth: rateLimitInfoSchema.nullable(),
});

export type RateLimits = z.infer<typeof rateLimitsSchema>;

// ============================================================================
// FAVORITES
// ============================================================================

export const favoriteSchema = z.object({
  id: z.string().uuid(),
  comparison_id: z.string().uuid().nullable(),
  debate_id: z.string().uuid().nullable(),
  created_at: z.string(),
});

export type Favorite = z.infer<typeof favoriteSchema>;

// ============================================================================
// PROFILE
// ============================================================================

export const profileSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  display_name: z.string().nullable(),
  avatar_url: z.string().nullable(),
  bio: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Profile = z.infer<typeof profileSchema>;

// ============================================================================
// FORM SCHEMAS
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

export const apiKeyConfigSchema = z.object({
  openrouter: z.string().optional(),
  openai: z.string().optional(),
  anthropic: z.string().optional(),
  google: z.string().optional(),
  mistral: z.string().optional(),
  groq: z.string().optional(),
});

export type ApiKeyConfig = z.infer<typeof apiKeyConfigSchema>;

// ============================================================================
// STREAMING EVENTS
// ============================================================================

export const streamEventTypeSchema = z.enum(['start', 'delta', 'complete', 'error']);

export const streamEventSchema = z.object({
  type: streamEventTypeSchema,
  model: z.string(),
  content: z.string().optional(),
  duration: z.number().optional(),
  tokens: tokenUsageSchema.optional(),
  error: z.string().optional(),
  apiKeySource: z.enum(['user', 'system']).optional(),
});

export type StreamEvent = z.infer<typeof streamEventSchema>;
export type StreamEventType = z.infer<typeof streamEventTypeSchema>;

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
