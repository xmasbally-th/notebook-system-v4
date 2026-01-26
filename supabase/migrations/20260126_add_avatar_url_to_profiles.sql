-- Migration: Add avatar_url to profiles
-- Date: 2026-01-26
-- Description: Adds avatar_url column, updates trigger to sync from auth metadata, and backfills existing users.

-- 1. Add column
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Update Trigger Function to capture avatar_url/picture
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
DECLARE
  metadata jsonb;
BEGIN
  metadata := NEW.raw_user_meta_data;
  
  INSERT INTO public.profiles (id, email, first_name, role, status, avatar_url)
  VALUES (
    NEW.id, 
    NEW.email, 
    metadata->>'full_name', 
    'user', 
    'pending',
    COALESCE(metadata->>'avatar_url', metadata->>'picture') -- Try avatar_url first (Supabase default), then picture (Google)
  )
  ON CONFLICT (id) DO UPDATE SET
    avatar_url = EXCLUDED.avatar_url,
    updated_at = NOW();
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Backfill existing users
-- We need to access auth.users which is in the auth schema.
-- SECURITY DEFINER functions or direct SQL by superuser can access it.
DO $$
BEGIN
  UPDATE profiles p
  SET avatar_url = COALESCE(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture')
  FROM auth.users u
  WHERE p.id = u.id
  AND p.avatar_url IS NULL;
END $$;
