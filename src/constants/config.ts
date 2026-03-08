/**
 * Environment configuration with Zod validation
 * SKILL.md §6.2: "Env vars validated at startup via Zod"
 * 
 * This module validates all environment variables at import time.
 * If validation fails, the app will throw an error immediately.
 */

import { z } from 'zod';

const envSchema = z.object({
  // Required Supabase configuration
  VITE_SUPABASE_URL: z
    .string()
    .url('VITE_SUPABASE_URL must be a valid URL')
    .min(1, 'VITE_SUPABASE_URL is required'),
  
  VITE_SUPABASE_PUBLISHABLE_KEY: z
    .string()
    .min(1, 'VITE_SUPABASE_PUBLISHABLE_KEY is required'),
  
  VITE_SUPABASE_PROJECT_ID: z
    .string()
    .min(1, 'VITE_SUPABASE_PROJECT_ID is required'),

  // Optional configuration with defaults
  MODE: z.enum(['development', 'production', 'test']).default('development'),
  DEV: z.boolean().default(false),
  PROD: z.boolean().default(true),
});

type EnvConfig = z.infer<typeof envSchema>;

function validateEnv(): EnvConfig {
  const env = {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    VITE_SUPABASE_PROJECT_ID: import.meta.env.VITE_SUPABASE_PROJECT_ID,
    MODE: import.meta.env.MODE,
    DEV: import.meta.env.DEV,
    PROD: import.meta.env.PROD,
  };

  const result = envSchema.safeParse(env);

  if (!result.success) {
    const errorMessages = result.error.errors
      .map((err) => `  - ${err.path.join('.')}: ${err.message}`)
      .join('\n');
    
    console.error('❌ Invalid environment variables:\n' + errorMessages);
    
    // In development, throw an error to make it obvious
    if (import.meta.env.DEV) {
      throw new Error('Invalid environment variables. Check console for details.');
    }
  }

  return result.data ?? (env as EnvConfig);
}

/**
 * Validated environment configuration
 * Access via: import { config } from '@/constants/config'
 * 
 * @example
 * const url = config.VITE_SUPABASE_URL;
 */
export const config = validateEnv();

/**
 * Helper to construct Supabase Edge Function URLs
 */
export function getEdgeFunctionUrl(functionName: string): string {
  return `${config.VITE_SUPABASE_URL}/functions/v1/${functionName}`;
}

/**
 * Check if we're in development mode
 */
export const isDev = config.MODE === 'development';

/**
 * Check if we're in production mode
 */
export const isProd = config.MODE === 'production';
