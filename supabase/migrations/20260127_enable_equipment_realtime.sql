-- ============================================
-- Enable Realtime for Equipment
-- Created: 2026-01-27
-- Purpose: Add equipment to supabase_realtime publication
-- ============================================

DO $$
BEGIN
  -- Add equipment table to publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'equipment'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE equipment;
  END IF;
END $$;
