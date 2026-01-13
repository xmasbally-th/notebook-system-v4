-- Migration: Fix system_config RLS policy for public read access
-- Date: 2026-01-13
-- Description: Allow anonymous users to read system_config for client-side validation

-- Drop the old authenticated-only policy
DROP POLICY IF EXISTS "Authenticated users can view config" ON system_config;

-- Create new policy that allows everyone (including anonymous) to read config
CREATE POLICY "Everyone can view config" 
ON system_config FOR SELECT 
TO public 
USING (true);

-- Note: The admin-only update policy remains unchanged
