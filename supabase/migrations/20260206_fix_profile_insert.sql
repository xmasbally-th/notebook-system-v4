-- Allow users to insert their own profile
-- This is necessary if the auto-create trigger fails or if we want robust upsert behavior.

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);
