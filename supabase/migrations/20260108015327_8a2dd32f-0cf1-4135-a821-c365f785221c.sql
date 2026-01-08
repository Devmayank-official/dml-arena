-- Create table for storing model performance metrics
CREATE TABLE public.model_performance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  model_id TEXT NOT NULL,
  response_time_ms INTEGER NOT NULL,
  tokens_used INTEGER,
  query_category TEXT,
  success BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_model_performance_user_id ON public.model_performance(user_id);
CREATE INDEX idx_model_performance_model_id ON public.model_performance(model_id);
CREATE INDEX idx_model_performance_created_at ON public.model_performance(created_at);
CREATE INDEX idx_model_performance_category ON public.model_performance(query_category);

-- Enable Row Level Security
ALTER TABLE public.model_performance ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own performance data" 
ON public.model_performance 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own performance data" 
ON public.model_performance 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create table for user favorites/bookmarks
CREATE TABLE public.user_favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  comparison_id UUID REFERENCES public.comparison_history(id) ON DELETE CASCADE,
  debate_id UUID REFERENCES public.debate_history(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT favorites_one_reference CHECK (
    (comparison_id IS NOT NULL AND debate_id IS NULL) OR 
    (comparison_id IS NULL AND debate_id IS NOT NULL)
  )
);

-- Create index for favorites
CREATE INDEX idx_user_favorites_user_id ON public.user_favorites(user_id);

-- Enable Row Level Security
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

-- Create policies for favorites
CREATE POLICY "Users can view their own favorites" 
ON public.user_favorites 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own favorites" 
ON public.user_favorites 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites" 
ON public.user_favorites 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add category column to comparison_history
ALTER TABLE public.comparison_history 
ADD COLUMN IF NOT EXISTS category TEXT;