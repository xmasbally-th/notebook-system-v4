-- Migration: Add reject_reason column to profiles table
-- Date: 2026-06-25
-- Description: The admin approval flow requires storing a rejection reason
-- when an account is rejected. This column was referenced in the application
-- code but was never added to the schema.

ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS reject_reason TEXT DEFAULT NULL;

COMMENT ON COLUMN profiles.reject_reason IS 'Reason provided by admin when rejecting a user account. Null when approved or pending.';
