-- ============================================
-- Read Receipts Feature Migration
-- Created: 2026-01-30
-- Purpose: Add read status tracking to support messages
-- ============================================

-- 1. Add read_at column to support_messages
ALTER TABLE support_messages
ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Create index for unread messages queries
CREATE INDEX IF NOT EXISTS idx_messages_unread 
ON support_messages(ticket_id, is_staff_reply) 
WHERE read_at IS NULL;

-- 3. Enable Realtime for UPDATE events (already enabled for INSERT)
-- The table should already be in supabase_realtime publication
-- This ensures UPDATE events (for read_at) are broadcast
