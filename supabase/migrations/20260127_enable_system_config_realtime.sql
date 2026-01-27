-- ============================================
-- Enable Realtime for System Config
-- Created: 2026-01-27
-- Purpose: Add system_config to supabase_realtime publication
-- ============================================

DO $$
BEGIN
  -- Add system_config table to publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'system_config'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE system_config;
  END IF;
END $$;
