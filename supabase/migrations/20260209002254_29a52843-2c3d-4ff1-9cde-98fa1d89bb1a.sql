-- Add storage policies for avatars bucket (if not exist)
-- This ensures only authenticated users can upload to their own folder

-- First, ensure the bucket exists with correct settings
UPDATE storage.buckets 
SET public = true 
WHERE id = 'avatars';

-- Drop existing policies if they exist to recreate them properly
DROP POLICY IF EXISTS "Public avatar access" ON storage.objects;
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

-- SELECT policy: Anyone can read avatars (public display)
CREATE POLICY "Public avatar access"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- INSERT policy: Users can only upload to their own folder
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- UPDATE policy: Users can only update their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- DELETE policy: Users can only delete their own avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Add policy to shared_results to require pro subscription for sharing
DROP POLICY IF EXISTS "Pro users can share" ON public.shared_results;
DROP POLICY IF EXISTS "Authenticated users can create shared results" ON public.shared_results;

CREATE POLICY "Pro users can share"
ON public.shared_results FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM subscriptions
    WHERE user_id = auth.uid()
    AND plan = 'pro'
  )
);