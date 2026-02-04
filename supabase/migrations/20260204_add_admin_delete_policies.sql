-- ============================================
-- Add DELETE policies for admin to delete user-related data
-- Date: 2026-02-04
-- Description: Allow admins to delete records from all tables 
--              needed to fully delete a user profile
-- ============================================

-- Notifications - Admin can delete
DROP POLICY IF EXISTS "Admin can delete notifications" ON notifications;
CREATE POLICY "Admin can delete notifications" ON notifications 
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin' AND status = 'approved')
  );

-- Evaluations - already has delete policy from clean_slate, but double check
DROP POLICY IF EXISTS "Admin can delete evaluations" ON evaluations;
CREATE POLICY "Admin can delete evaluations" ON evaluations 
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin' AND status = 'approved')
  );

-- LoanRequests - Admin can delete (note: staff already has FOR ALL)
DROP POLICY IF EXISTS "Admin can delete loan requests" ON "loanRequests";
CREATE POLICY "Admin can delete loan requests" ON "loanRequests" 
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin' AND status = 'approved')
  );

-- Reservations - Staff already has FOR ALL, but explicit delete for safety
DROP POLICY IF EXISTS "Admin can delete reservations" ON reservations;
CREATE POLICY "Admin can delete reservations" ON reservations 
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin' AND status = 'approved')
  );

-- Support Tickets - Admin can delete
DROP POLICY IF EXISTS "Admin can delete support tickets" ON support_tickets;
CREATE POLICY "Admin can delete support tickets" ON support_tickets 
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin' AND status = 'approved')
  );

-- Support Messages - Admin can delete
DROP POLICY IF EXISTS "Admin can delete support messages" ON support_messages;
CREATE POLICY "Admin can delete support messages" ON support_messages 
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin' AND status = 'approved')
  );

-- Staff Activity Log - Admin can delete
DROP POLICY IF EXISTS "Admin can delete activity logs" ON staff_activity_log;
CREATE POLICY "Admin can delete activity logs" ON staff_activity_log 
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin' AND status = 'approved')
  );

-- ============================================
-- DONE!
-- ============================================
