-- ============================================
-- Migration: HOTFIX - Fix RLS infinite recursion
-- Date: 2026-02-03
-- Description: Fix profiles table RLS that causes 500 errors
-- Issue: Using (SELECT auth.uid()) in profiles table causes recursion
-- ============================================

-- The issue is that profiles table policies check profiles table
-- which creates infinite recursion when using subquery pattern

-- ============================================
-- 1. FIX PROFILES TABLE - Use direct auth.uid() (no caching needed for PK lookup)
-- ============================================

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles 
  FOR SELECT USING (auth.uid() = id);

-- For admin checks, we need to use a security definer function
-- Or use direct pattern since it's a PK lookup (fast anyway)

DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() 
      AND p.role = 'admin' 
      AND p.status = 'approved'
    )
  );

DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;
CREATE POLICY "Admins can update profiles" ON profiles 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() 
      AND p.role = 'admin' 
      AND p.status = 'approved'
    )
  );

-- Also add policy for users to update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- ============================================
-- 2. FIX OTHER TABLES - Use helper function instead
-- ============================================

-- Create a security definer function to check admin/staff status
-- This bypasses RLS and is called once per query
CREATE OR REPLACE FUNCTION public.is_admin_or_staff()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('staff', 'admin')
    AND status = 'approved'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
    AND status = 'approved'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_approved_user()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND status = 'approved'
  );
$$;

-- ============================================
-- 3. UPDATE EQUIPMENT POLICIES
-- ============================================

DROP POLICY IF EXISTS "Approved users can view equipment" ON equipment;
CREATE POLICY "Approved users can view equipment" ON equipment 
  FOR SELECT USING (public.is_approved_user());

DROP POLICY IF EXISTS "Admins can manage equipment" ON equipment;
CREATE POLICY "Admins can manage equipment" ON equipment 
  FOR ALL USING (public.is_admin());

-- ============================================
-- 4. UPDATE LOAN REQUESTS POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users access own requests" ON "loanRequests";
CREATE POLICY "Users access own requests" ON "loanRequests" 
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins manage requests" ON "loanRequests";
CREATE POLICY "Admins manage requests" ON "loanRequests" 
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Staff can manage all loans" ON "loanRequests";
CREATE POLICY "Staff can manage all loans" ON "loanRequests"
  FOR ALL USING (public.is_admin_or_staff());

-- ============================================
-- 5. UPDATE RESERVATIONS POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view own reservations" ON reservations;
CREATE POLICY "Users can view own reservations" ON reservations 
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create reservations" ON reservations;
CREATE POLICY "Users can create reservations" ON reservations 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can cancel own reservations" ON reservations;
CREATE POLICY "Users can cancel own reservations" ON reservations 
  FOR UPDATE USING (
    auth.uid() = user_id 
    AND status IN ('pending', 'approved')
  );

DROP POLICY IF EXISTS "Staff can view all reservations" ON reservations;
CREATE POLICY "Staff can view all reservations" ON reservations 
  FOR SELECT USING (public.is_admin_or_staff());

DROP POLICY IF EXISTS "Staff can manage reservations" ON reservations;
CREATE POLICY "Staff can manage reservations" ON reservations 
  FOR ALL USING (public.is_admin_or_staff());

-- ============================================
-- 6. UPDATE NOTIFICATIONS POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users see own notifications" ON notifications;
CREATE POLICY "Users see own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own notifications" ON notifications;
CREATE POLICY "Users update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Staff can create notifications" ON notifications;
CREATE POLICY "Staff can create notifications" ON notifications
  FOR INSERT WITH CHECK (public.is_admin_or_staff());

-- ============================================
-- 7. UPDATE STAFF ACTIVITY LOG POLICIES
-- ============================================

DROP POLICY IF EXISTS "Admin can view all activity logs" ON staff_activity_log;
CREATE POLICY "Admin can view all activity logs" ON staff_activity_log 
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Staff can view own logs" ON staff_activity_log;
CREATE POLICY "Staff can view own logs" ON staff_activity_log 
  FOR SELECT USING (auth.uid() = staff_id);

DROP POLICY IF EXISTS "Staff can insert logs" ON staff_activity_log;
CREATE POLICY "Staff can insert logs" ON staff_activity_log 
  FOR INSERT WITH CHECK (public.is_admin_or_staff());

-- ============================================
-- 8. UPDATE SUPPORT TICKETS POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users view own tickets" ON support_tickets;
CREATE POLICY "Users view own tickets" ON support_tickets
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users create tickets" ON support_tickets;
CREATE POLICY "Users create tickets" ON support_tickets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Staff view all tickets" ON support_tickets;
CREATE POLICY "Staff view all tickets" ON support_tickets
  FOR SELECT USING (public.is_admin_or_staff());

DROP POLICY IF EXISTS "Staff update all tickets" ON support_tickets;
CREATE POLICY "Staff update all tickets" ON support_tickets
  FOR UPDATE USING (public.is_admin_or_staff());

-- ============================================
-- 9. UPDATE SUPPORT MESSAGES POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users view own ticket messages" ON support_messages;
CREATE POLICY "Users view own ticket messages" ON support_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM support_tickets 
      WHERE support_tickets.id = support_messages.ticket_id 
      AND support_tickets.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users send messages" ON support_messages;
CREATE POLICY "Users send messages" ON support_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM support_tickets 
      WHERE support_tickets.id = support_messages.ticket_id 
      AND support_tickets.user_id = auth.uid()
    )
    AND auth.uid() = sender_id
  );

DROP POLICY IF EXISTS "Staff view all messages" ON support_messages;
CREATE POLICY "Staff view all messages" ON support_messages
  FOR SELECT USING (public.is_admin_or_staff());

DROP POLICY IF EXISTS "Staff reply messages" ON support_messages;
CREATE POLICY "Staff reply messages" ON support_messages
  FOR INSERT WITH CHECK (public.is_admin_or_staff());

-- ============================================
-- 10. UPDATE EVALUATIONS POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view own evaluations" ON evaluations;
CREATE POLICY "Users can view own evaluations" ON evaluations
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create evaluations" ON evaluations;
CREATE POLICY "Users can create evaluations" ON evaluations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admin can view all evaluations" ON evaluations;
CREATE POLICY "Admin can view all evaluations" ON evaluations
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admin can delete evaluations" ON evaluations;
CREATE POLICY "Admin can delete evaluations" ON evaluations
  FOR DELETE USING (public.is_admin());

-- ============================================
-- 11. UPDATE SPECIAL LOAN REQUESTS POLICIES
-- ============================================

DROP POLICY IF EXISTS "Admin can manage special loans" ON special_loan_requests;
CREATE POLICY "Admin can manage special loans" ON special_loan_requests
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Users can view active special loans" ON special_loan_requests;
CREATE POLICY "Users can view active special loans" ON special_loan_requests
  FOR SELECT USING (
    status = 'active' AND public.is_approved_user()
  );

-- ============================================
-- DONE - This should fix the 500 errors
-- ============================================
