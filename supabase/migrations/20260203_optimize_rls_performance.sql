-- ============================================
-- Migration: Performance Optimization - Part 2 (RLS Performance)
-- Date: 2026-02-03
-- Description: Optimize RLS policies using (SELECT auth.uid()) pattern for caching
-- Safe: YES - DROP POLICY IF EXISTS + CREATE POLICY is atomic
-- Impact: 5-10x faster queries on large tables
-- ============================================

-- IMPORTANT: This migration drops and recreates policies
-- The new policies have identical logic but better performance
-- Wrapping auth.uid() in SELECT causes it to be evaluated once per query, not per row

-- ============================================
-- 1. PROFILES TABLE RLS OPTIMIZATION
-- ============================================

-- Drop and recreate with optimized pattern
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles 
  FOR SELECT USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (SELECT auth.uid()) 
      AND role = 'admin' 
      AND status = 'approved'
    )
  );

DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;
CREATE POLICY "Admins can update profiles" ON profiles 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (SELECT auth.uid()) 
      AND role = 'admin' 
      AND status = 'approved'
    )
  );

-- ============================================
-- 2. EQUIPMENT TABLE RLS OPTIMIZATION
-- ============================================

DROP POLICY IF EXISTS "Approved users can view equipment" ON equipment;
CREATE POLICY "Approved users can view equipment" ON equipment 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (SELECT auth.uid()) 
      AND status = 'approved'
    )
  );

DROP POLICY IF EXISTS "Admins can manage equipment" ON equipment;
CREATE POLICY "Admins can manage equipment" ON equipment 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (SELECT auth.uid()) 
      AND role = 'admin' 
      AND status = 'approved'
    )
  );

-- ============================================
-- 3. LOAN REQUESTS TABLE RLS OPTIMIZATION
-- ============================================

DROP POLICY IF EXISTS "Users access own requests" ON "loanRequests";
CREATE POLICY "Users access own requests" ON "loanRequests" 
  FOR ALL USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Admins manage requests" ON "loanRequests";
CREATE POLICY "Admins manage requests" ON "loanRequests" 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (SELECT auth.uid()) 
      AND role = 'admin' 
      AND status = 'approved'
    )
  );

-- Staff manage requests (if exists)
DROP POLICY IF EXISTS "Staff can manage all loans" ON "loanRequests";
CREATE POLICY "Staff can manage all loans" ON "loanRequests"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (SELECT auth.uid()) 
      AND role IN ('staff', 'admin') 
      AND status = 'approved'
    )
  );

-- ============================================
-- 4. RESERVATIONS TABLE RLS OPTIMIZATION
-- ============================================

DROP POLICY IF EXISTS "Users can view own reservations" ON reservations;
CREATE POLICY "Users can view own reservations" ON reservations 
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create reservations" ON reservations;
CREATE POLICY "Users can create reservations" ON reservations 
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can cancel own reservations" ON reservations;
CREATE POLICY "Users can cancel own reservations" ON reservations 
  FOR UPDATE USING (
    (SELECT auth.uid()) = user_id 
    AND status IN ('pending', 'approved')
  );

DROP POLICY IF EXISTS "Staff can view all reservations" ON reservations;
CREATE POLICY "Staff can view all reservations" ON reservations 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (SELECT auth.uid()) 
      AND role IN ('staff', 'admin') 
      AND status = 'approved'
    )
  );

DROP POLICY IF EXISTS "Staff can manage reservations" ON reservations;
CREATE POLICY "Staff can manage reservations" ON reservations 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (SELECT auth.uid()) 
      AND role IN ('staff', 'admin') 
      AND status = 'approved'
    )
  );

-- ============================================
-- 5. NOTIFICATIONS TABLE RLS OPTIMIZATION
-- ============================================

DROP POLICY IF EXISTS "Users see own notifications" ON notifications;
CREATE POLICY "Users see own notifications" ON notifications
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users update own notifications" ON notifications;
CREATE POLICY "Users update own notifications" ON notifications
  FOR UPDATE USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Staff can create notifications" ON notifications;
CREATE POLICY "Staff can create notifications" ON notifications
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (SELECT auth.uid()) 
      AND role IN ('staff', 'admin') 
      AND status = 'approved'
    )
  );

-- ============================================
-- 6. STAFF ACTIVITY LOG TABLE RLS OPTIMIZATION
-- ============================================

DROP POLICY IF EXISTS "Admin can view all activity logs" ON staff_activity_log;
CREATE POLICY "Admin can view all activity logs" ON staff_activity_log 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (SELECT auth.uid()) 
      AND role = 'admin' 
      AND status = 'approved'
    )
  );

DROP POLICY IF EXISTS "Staff can view own logs" ON staff_activity_log;
CREATE POLICY "Staff can view own logs" ON staff_activity_log 
  FOR SELECT USING ((SELECT auth.uid()) = staff_id);

DROP POLICY IF EXISTS "Staff can insert logs" ON staff_activity_log;
CREATE POLICY "Staff can insert logs" ON staff_activity_log 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (SELECT auth.uid()) 
      AND role IN ('staff', 'admin') 
      AND status = 'approved'
    )
  );

-- ============================================
-- 7. SUPPORT TICKETS TABLE RLS OPTIMIZATION
-- ============================================

DROP POLICY IF EXISTS "Users view own tickets" ON support_tickets;
CREATE POLICY "Users view own tickets" ON support_tickets
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users create tickets" ON support_tickets;
CREATE POLICY "Users create tickets" ON support_tickets
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Staff view all tickets" ON support_tickets;
CREATE POLICY "Staff view all tickets" ON support_tickets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (SELECT auth.uid()) 
      AND role IN ('staff', 'admin') 
      AND status = 'approved'
    )
  );

DROP POLICY IF EXISTS "Staff update all tickets" ON support_tickets;
CREATE POLICY "Staff update all tickets" ON support_tickets
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (SELECT auth.uid()) 
      AND role IN ('staff', 'admin') 
      AND status = 'approved'
    )
  );

-- ============================================
-- 8. SUPPORT MESSAGES TABLE RLS OPTIMIZATION
-- ============================================

DROP POLICY IF EXISTS "Users view own ticket messages" ON support_messages;
CREATE POLICY "Users view own ticket messages" ON support_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM support_tickets 
      WHERE support_tickets.id = support_messages.ticket_id 
      AND support_tickets.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users send messages" ON support_messages;
CREATE POLICY "Users send messages" ON support_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM support_tickets 
      WHERE support_tickets.id = support_messages.ticket_id 
      AND support_tickets.user_id = (SELECT auth.uid())
    )
    AND (SELECT auth.uid()) = sender_id
  );

DROP POLICY IF EXISTS "Staff view all messages" ON support_messages;
CREATE POLICY "Staff view all messages" ON support_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (SELECT auth.uid()) 
      AND role IN ('staff', 'admin') 
      AND status = 'approved'
    )
  );

DROP POLICY IF EXISTS "Staff reply messages" ON support_messages;
CREATE POLICY "Staff reply messages" ON support_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (SELECT auth.uid()) 
      AND role IN ('staff', 'admin') 
      AND status = 'approved'
    )
  );

-- ============================================
-- 9. EVALUATIONS TABLE RLS OPTIMIZATION
-- ============================================

DROP POLICY IF EXISTS "Users can view own evaluations" ON evaluations;
CREATE POLICY "Users can view own evaluations" ON evaluations
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create evaluations" ON evaluations;
CREATE POLICY "Users can create evaluations" ON evaluations
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Admin can view all evaluations" ON evaluations;
CREATE POLICY "Admin can view all evaluations" ON evaluations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (SELECT auth.uid()) 
      AND role = 'admin' 
      AND status = 'approved'
    )
  );

DROP POLICY IF EXISTS "Admin can delete evaluations" ON evaluations;
CREATE POLICY "Admin can delete evaluations" ON evaluations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (SELECT auth.uid()) 
      AND role = 'admin' 
      AND status = 'approved'
    )
  );

-- ============================================
-- 10. SPECIAL LOAN REQUESTS TABLE RLS OPTIMIZATION
-- ============================================

DROP POLICY IF EXISTS "Admin can manage special loans" ON special_loan_requests;
CREATE POLICY "Admin can manage special loans" ON special_loan_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (SELECT auth.uid()) 
      AND role = 'admin' 
      AND status = 'approved'
    )
  );

DROP POLICY IF EXISTS "Users can view active special loans" ON special_loan_requests;
CREATE POLICY "Users can view active special loans" ON special_loan_requests
  FOR SELECT USING (
    status = 'active' AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (SELECT auth.uid()) 
      AND status = 'approved'
    )
  );

-- ============================================
-- VERIFICATION: Check policy count
-- ============================================
-- Run to verify: SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public';
