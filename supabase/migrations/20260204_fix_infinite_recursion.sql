-- ============================================
-- FIX INFINITE RECURSION: Use SECURITY DEFINER functions
-- Date: 2026-02-04
-- Issue: Policies on profiles table checking profiles causes infinite loop
-- Solution: SECURITY DEFINER functions bypass RLS
-- ============================================

-- STEP 1: Create helper functions that bypass RLS
-- These functions use SECURITY DEFINER which runs with the privileges of the function owner
-- not the current user, so they bypass RLS policies

-- Drop existing functions if any
DROP FUNCTION IF EXISTS public.rls_is_admin();
DROP FUNCTION IF EXISTS public.rls_is_staff_or_admin();
DROP FUNCTION IF EXISTS public.rls_is_approved_user();

CREATE OR REPLACE FUNCTION public.rls_is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
    AND status = 'approved'
  );
$$;

CREATE OR REPLACE FUNCTION public.rls_is_staff_or_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('staff', 'admin')
    AND status = 'approved'
  );
$$;

CREATE OR REPLACE FUNCTION public.rls_is_approved_user()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND status = 'approved'
  );
$$;

-- STEP 2: Drop all existing policies
-- PROFILES
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;

-- EQUIPMENT
DROP POLICY IF EXISTS "Approved users can view equipment" ON equipment;
DROP POLICY IF EXISTS "Admins can manage equipment" ON equipment;

-- LOAN REQUESTS
DROP POLICY IF EXISTS "Users access own requests" ON "loanRequests";
DROP POLICY IF EXISTS "Staff can manage all loans" ON "loanRequests";

-- RESERVATIONS
DROP POLICY IF EXISTS "Users can view own reservations" ON reservations;
DROP POLICY IF EXISTS "Users can create reservations" ON reservations;
DROP POLICY IF EXISTS "Users can cancel own reservations" ON reservations;
DROP POLICY IF EXISTS "Staff can view all reservations" ON reservations;
DROP POLICY IF EXISTS "Staff can manage reservations" ON reservations;

-- NOTIFICATIONS  
DROP POLICY IF EXISTS "Users see own notifications" ON notifications;
DROP POLICY IF EXISTS "Users update own notifications" ON notifications;
DROP POLICY IF EXISTS "Staff can create notifications" ON notifications;

-- STAFF ACTIVITY LOG
DROP POLICY IF EXISTS "Admin can view all activity logs" ON staff_activity_log;
DROP POLICY IF EXISTS "Staff can view own logs" ON staff_activity_log;
DROP POLICY IF EXISTS "Staff can insert logs" ON staff_activity_log;

-- SUPPORT TICKETS
DROP POLICY IF EXISTS "Users view own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users create tickets" ON support_tickets;
DROP POLICY IF EXISTS "Staff view all tickets" ON support_tickets;
DROP POLICY IF EXISTS "Staff update all tickets" ON support_tickets;

-- SUPPORT MESSAGES
DROP POLICY IF EXISTS "Users view own ticket messages" ON support_messages;
DROP POLICY IF EXISTS "Users send messages" ON support_messages;
DROP POLICY IF EXISTS "Staff view all messages" ON support_messages;
DROP POLICY IF EXISTS "Staff reply messages" ON support_messages;

-- EVALUATIONS
DROP POLICY IF EXISTS "Users can view own evaluations" ON evaluations;
DROP POLICY IF EXISTS "Users can create evaluations" ON evaluations;
DROP POLICY IF EXISTS "Admin can view all evaluations" ON evaluations;
DROP POLICY IF EXISTS "Admin can delete evaluations" ON evaluations;

-- SPECIAL LOAN REQUESTS
DROP POLICY IF EXISTS "Admin can manage special loans" ON special_loan_requests;
DROP POLICY IF EXISTS "Users can view active special loans" ON special_loan_requests;

-- DEPARTMENTS
DROP POLICY IF EXISTS "Admins can manage departments" ON departments;
DROP POLICY IF EXISTS "Anyone can view active departments" ON departments;

-- EQUIPMENT TYPES
DROP POLICY IF EXISTS "Admins can manage equipment types" ON equipment_types;
DROP POLICY IF EXISTS "Anyone can view equipment types" ON equipment_types;

-- SYSTEM CONFIG
DROP POLICY IF EXISTS "Admins can update config" ON system_config;
DROP POLICY IF EXISTS "Anyone can view config" ON system_config;

-- DATA BACKUPS
DROP POLICY IF EXISTS "Admin can manage backups" ON data_backups;

-- STEP 3: Create new policies using the SECURITY DEFINER functions

-- PROFILES (uses functions to avoid recursion)
CREATE POLICY "Users can view own profile" ON profiles 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles 
  FOR SELECT USING (public.rls_is_admin());

CREATE POLICY "Admins can update profiles" ON profiles 
  FOR UPDATE USING (public.rls_is_admin());

-- EQUIPMENT
CREATE POLICY "Approved users can view equipment" ON equipment 
  FOR SELECT USING (public.rls_is_approved_user());

CREATE POLICY "Admins can manage equipment" ON equipment 
  FOR ALL USING (public.rls_is_admin());

-- LOAN REQUESTS
CREATE POLICY "Users access own requests" ON "loanRequests" 
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Staff can manage all loans" ON "loanRequests"
  FOR ALL USING (public.rls_is_staff_or_admin());

-- RESERVATIONS
CREATE POLICY "Users can view own reservations" ON reservations 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create reservations" ON reservations 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can cancel own reservations" ON reservations 
  FOR UPDATE USING (auth.uid() = user_id AND status IN ('pending', 'approved'));

CREATE POLICY "Staff can view all reservations" ON reservations 
  FOR SELECT USING (public.rls_is_staff_or_admin());

CREATE POLICY "Staff can manage reservations" ON reservations 
  FOR ALL USING (public.rls_is_staff_or_admin());

-- NOTIFICATIONS
CREATE POLICY "Users see own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Staff can create notifications" ON notifications
  FOR INSERT WITH CHECK (public.rls_is_staff_or_admin());

-- STAFF ACTIVITY LOG
CREATE POLICY "Admin can view all activity logs" ON staff_activity_log 
  FOR SELECT USING (public.rls_is_admin());

CREATE POLICY "Staff can view own logs" ON staff_activity_log 
  FOR SELECT USING (auth.uid() = staff_id);

CREATE POLICY "Staff can insert logs" ON staff_activity_log 
  FOR INSERT WITH CHECK (public.rls_is_staff_or_admin());

-- SUPPORT TICKETS
CREATE POLICY "Users view own tickets" ON support_tickets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users create tickets" ON support_tickets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Staff view all tickets" ON support_tickets
  FOR SELECT USING (public.rls_is_staff_or_admin());

CREATE POLICY "Staff update all tickets" ON support_tickets
  FOR UPDATE USING (public.rls_is_staff_or_admin());

-- SUPPORT MESSAGES
CREATE POLICY "Users view own ticket messages" ON support_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM support_tickets 
      WHERE support_tickets.id = support_messages.ticket_id 
      AND support_tickets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users send messages" ON support_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM support_tickets 
      WHERE support_tickets.id = support_messages.ticket_id 
      AND support_tickets.user_id = auth.uid()
    )
    AND auth.uid() = sender_id
  );

CREATE POLICY "Staff view all messages" ON support_messages
  FOR SELECT USING (public.rls_is_staff_or_admin());

CREATE POLICY "Staff reply messages" ON support_messages
  FOR INSERT WITH CHECK (public.rls_is_staff_or_admin());

-- EVALUATIONS
CREATE POLICY "Users can view own evaluations" ON evaluations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create evaluations" ON evaluations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can view all evaluations" ON evaluations
  FOR SELECT USING (public.rls_is_admin());

CREATE POLICY "Admin can delete evaluations" ON evaluations
  FOR DELETE USING (public.rls_is_admin());

-- SPECIAL LOAN REQUESTS
CREATE POLICY "Admin can manage special loans" ON special_loan_requests
  FOR ALL USING (public.rls_is_admin());

CREATE POLICY "Users can view active special loans" ON special_loan_requests
  FOR SELECT USING (status = 'active' AND public.rls_is_approved_user());

-- DEPARTMENTS
CREATE POLICY "Admins can manage departments" ON departments
  FOR ALL USING (public.rls_is_admin());

CREATE POLICY "Anyone can view active departments" ON departments
  FOR SELECT USING (is_active = true OR is_active IS NULL);

-- EQUIPMENT TYPES
CREATE POLICY "Admins can manage equipment types" ON equipment_types
  FOR ALL USING (public.rls_is_admin());

CREATE POLICY "Anyone can view equipment types" ON equipment_types
  FOR SELECT USING (true);

-- SYSTEM CONFIG
CREATE POLICY "Admins can update config" ON system_config
  FOR ALL USING (public.rls_is_admin());

CREATE POLICY "Anyone can view config" ON system_config
  FOR SELECT USING (true);

-- DATA BACKUPS
CREATE POLICY "Admin can manage backups" ON data_backups
  FOR ALL USING (public.rls_is_admin());

-- ============================================
-- DONE! Functions in public schema bypass RLS
-- ============================================
