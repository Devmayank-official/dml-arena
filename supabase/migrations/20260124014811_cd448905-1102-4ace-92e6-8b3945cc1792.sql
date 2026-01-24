-- =============================================
-- PHASE 1: FIX RLS SECURITY VULNERABILITIES
-- =============================================

-- 1. Fix response_votes - currently has completely open policies
-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Anyone can delete response votes" ON public.response_votes;
DROP POLICY IF EXISTS "Anyone can insert response votes" ON public.response_votes;
DROP POLICY IF EXISTS "Anyone can read response votes" ON public.response_votes;
DROP POLICY IF EXISTS "Anyone can update response votes" ON public.response_votes;

-- Add user_id column to track vote ownership
ALTER TABLE public.response_votes ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create proper RLS policies for response_votes
CREATE POLICY "Users can view their own votes"
ON public.response_votes FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own votes"
ON public.response_votes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes"
ON public.response_votes FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes"
ON public.response_votes FOR DELETE
USING (auth.uid() = user_id);

-- 2. Fix shared_results - tighten INSERT policy
-- Currently anyone can insert, should require authentication
DROP POLICY IF EXISTS "Anyone can insert shared results" ON public.shared_results;

-- Add user_id to track who created the share
ALTER TABLE public.shared_results ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create proper INSERT policy - only authenticated users can share
CREATE POLICY "Authenticated users can create shared results"
ON public.shared_results FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Keep SELECT open since shares are meant to be public
-- (The "Anyone can read shared results" policy is intentional for sharing feature)

-- 3. Add UPDATE policy for comparison_history (for future editing)
CREATE POLICY "Users can update own comparison history"
ON public.comparison_history FOR UPDATE
USING (auth.uid() = user_id);

-- 4. Add UPDATE policy for debate_history (for future editing)
CREATE POLICY "Users can update own debate history"
ON public.debate_history FOR UPDATE
USING (auth.uid() = user_id);

-- 5. Enable leaked password protection for auth
-- (This is handled via Supabase dashboard, but we note it here)