-- Migration: Add multiple discord webhooks and fix RLS for profiles
-- Date: 2026-02-10

-- 1. Add new webhook columns to system_config
ALTER TABLE public.system_config
ADD COLUMN IF NOT EXISTS discord_webhook_auth TEXT,        -- For signups/logins
ADD COLUMN IF NOT EXISTS discord_webhook_reservations TEXT, -- For reservation events
ADD COLUMN IF NOT EXISTS discord_webhook_maintenance TEXT;  -- For equipment issues/maintenance

-- 2. Allow 'staff' and 'admin' to view all profiles
-- This fixes the issue where staff cannot see borrower names in return notifications
-- We drop the existing policy if it exists (it might be named differently, so we use DO block or just CREATE OR REPLACE logic if possible, but PG doesn't support CREATE OR REPLACE POLICY directly)

-- Drop likely existing policies to be safe and recreate
DROP POLICY IF EXISTS "Staff can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Create unified policy for staff and admins
CREATE POLICY "Staff and Admins can view all profiles" ON profiles
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role IN ('staff', 'admin')
        AND status = 'approved'
    )
);

-- Ensure public can view config if not already (for initial load)
-- (Already handled in previous migrations, but reinforcing)
