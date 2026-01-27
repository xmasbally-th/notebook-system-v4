-- ============================================
-- Enable Realtime (Replication) Migration
-- Created: 2026-01-27
-- Purpose: Add tables to supabase_realtime publication
-- ============================================

-- 1. Enable replication for 'notifications' table
-- Check if table exists first to be safe
DO $$
BEGIN
  -- Add notifications table to publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;

  -- Add loanRequests table to publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'loanRequests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE "loanRequests";
  END IF;

  -- Add reservations table to publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'reservations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE reservations;
  END IF;
  -- Add profiles table to publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
  END IF;
END $$;
