-- ============================================
-- Admin-Initiated Chat Support
-- Created: 2026-02-23
-- Purpose: Allow staff/admins to create support tickets on behalf of users
-- ============================================

-- Staff/Admins can create tickets for any user
DROP POLICY IF EXISTS "Staff create tickets" ON support_tickets;
CREATE POLICY "Staff create tickets" ON support_tickets
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('staff', 'admin') 
      AND status = 'approved'
    )
  );
