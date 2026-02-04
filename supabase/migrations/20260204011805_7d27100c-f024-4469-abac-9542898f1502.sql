-- Create usage_logs table for granular rate limiting
CREATE TABLE public.usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    action_type TEXT NOT NULL DEFAULT 'comparison',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for fast time-range queries
CREATE INDEX idx_usage_logs_user_created ON public.usage_logs (user_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

-- Users can insert their own logs
CREATE POLICY "Users can insert own usage logs"
ON public.usage_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own logs
CREATE POLICY "Users can view own usage logs"
ON public.usage_logs
FOR SELECT
USING (auth.uid() = user_id);

-- Add comment for documentation
COMMENT ON TABLE public.usage_logs IS 'Tracks individual API calls for rate limiting with timestamps';