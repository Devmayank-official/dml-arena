/**
 * Form validation schemas
 * SKILL.md §6.4: Zod schemas for all user-facing forms
 */
import { z } from 'zod';

/** Auth forms */
export const authSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address').max(255, 'Email too long'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128, 'Password too long'),
});
export type AuthFormData = z.infer<typeof authSchema>;

/** Chat input */
export const chatInputSchema = z.object({
  message: z.string().trim().min(1, 'Message cannot be empty').max(10_000, 'Message too long (max 10,000 characters)'),
});
export type ChatInputFormData = z.infer<typeof chatInputSchema>;

/** Profile edit */
export const profileSchema = z.object({
  display_name: z.string().trim().max(100, 'Display name too long').nullable(),
  bio: z.string().trim().max(500, 'Bio too long (max 500 characters)').nullable(),
});
export type ProfileFormData = z.infer<typeof profileSchema>;

/** Settings - delete confirmation */
export const deleteConfirmSchema = z.object({
  confirmText: z.string().refine((val) => val.toUpperCase() === 'DELETE', {
    message: 'Please type DELETE to confirm',
  }),
  understandConfirmation: z.literal(true, {
    errorMap: () => ({ message: 'Please check the confirmation box' }),
  }),
});
export type DeleteConfirmFormData = z.infer<typeof deleteConfirmSchema>;
