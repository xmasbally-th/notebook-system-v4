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

-- 3. RLS Policies for UPDATE (marking messages as read)
-- Users can mark staff messages as read in their own tickets
DROP POLICY IF EXISTS "Users mark messages read" ON support_messages;
CREATE POLICY "Users mark messages read" ON support_messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM support_tickets 
      WHERE support_tickets.id = support_messages.ticket_id 
      AND support_tickets.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM support_tickets 
      WHERE support_tickets.id = support_messages.ticket_id 
      AND support_tickets.user_id = auth.uid()
    )
  );

-- Staff/Admins can mark user messages as read in any ticket
DROP POLICY IF EXISTS "Staff mark messages read" ON support_messages;
CREATE POLICY "Staff mark messages read" ON support_messages
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff', 'admin') AND status = 'approved')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff', 'admin') AND status = 'approved')
  );
