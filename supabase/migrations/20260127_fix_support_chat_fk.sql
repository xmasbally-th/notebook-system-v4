-- ============================================
-- Fix Support Chat Foreign Keys
-- Purpose: Reference public.profiles instead of auth.users to enable PostgREST joins
-- ============================================

-- 1. Support Tickets: user_id
-- Drop inferred constraint (usually support_tickets_user_id_fkey)
ALTER TABLE support_tickets
  DROP CONSTRAINT IF EXISTS support_tickets_user_id_fkey;

-- Add new constraint referencing profiles
ALTER TABLE support_tickets
  ADD CONSTRAINT support_tickets_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES profiles(id)
  ON DELETE CASCADE;

-- 2. Support Messages: sender_id (Optional but good for completeness if we ever join messages to profiles)
ALTER TABLE support_messages
  DROP CONSTRAINT IF EXISTS support_messages_sender_id_fkey;

ALTER TABLE support_messages
  ADD CONSTRAINT support_messages_sender_id_fkey
  FOREIGN KEY (sender_id)
  REFERENCES profiles(id)
  ON DELETE SET NULL;
