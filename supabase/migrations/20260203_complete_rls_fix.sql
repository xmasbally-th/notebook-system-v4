-- ============================================
-- COMPLETE FIX: Force drop functions and recreate all policies
-- Date: 2026-02-03
-- RUN THIS ENTIRE FILE AT ONCE
-- ============================================

-- Step 1: Force drop functions with CASCADE (removes all dependent policies automatically)
DROP FUNCTION IF EXISTS public.is_admin_or_staff() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.is_approved_user() CASCADE;

-- Step 2: Recreate ALL policies for ALL tables

-- ============================================
-- PROFILES TABLE
-- ============================================
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin' AND status = 'approved')
  );

CREATE POLICY "Admins can update profiles" ON profiles 
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin' AND status = 'approved')
  );

-- ============================================
-- EQUIPMENT TABLE
-- ============================================
DROP POLICY IF EXISTS "Approved users can view equipment" ON equipment;
DROP POLICY IF EXISTS "Admins can manage equipment" ON equipment;

CREATE POLICY "Approved users can view equipment" ON equipment 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status = 'approved')
  );

CREATE POLICY "Admins can manage equipment" ON equipment 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin' AND status = 'approved')
  );

-- ============================================
-- LOAN REQUESTS TABLE
-- ============================================
DROP POLICY IF EXISTS "Users access own requests" ON "loanRequests";
DROP POLICY IF EXISTS "Admins manage requests" ON "loanRequests";
DROP POLICY IF EXISTS "Staff can manage all loans" ON "loanRequests";

CREATE POLICY "Users access own requests" ON "loanRequests" 
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins manage requests" ON "loanRequests" 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin' AND status = 'approved')
  );

CREATE POLICY "Staff can manage all loans" ON "loanRequests"
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff', 'admin') AND status = 'approved')
  );

-- ============================================
-- RESERVATIONS TABLE
-- ============================================
DROP POLICY IF EXISTS "Users can view own reservations" ON reservations;
DROP POLICY IF EXISTS "Users can create reservations" ON reservations;
DROP POLICY IF EXISTS "Users can cancel own reservations" ON reservations;
DROP POLICY IF EXISTS "Staff can view all reservations" ON reservations;
DROP POLICY IF EXISTS "Staff can manage reservations" ON reservations;

CREATE POLICY "Users can view own reservations" ON reservations 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create reservations" ON reservations 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can cancel own reservations" ON reservations 
  FOR UPDATE USING (auth.uid() = user_id AND status IN ('pending', 'approved'));

CREATE POLICY "Staff can view all reservations" ON reservations 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff', 'admin') AND status = 'approved')
  );

CREATE POLICY "Staff can manage reservations" ON reservations 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff', 'admin') AND status = 'approved')
  );

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
DROP POLICY IF EXISTS "Users see own notifications" ON notifications;
DROP POLICY IF EXISTS "Users update own notifications" ON notifications;
DROP POLICY IF EXISTS "Staff can create notifications" ON notifications;

CREATE POLICY "Users see own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Staff can create notifications" ON notifications
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff', 'admin') AND status = 'approved')
  );

-- ============================================
-- STAFF ACTIVITY LOG TABLE
-- ============================================
DROP POLICY IF EXISTS "Admin can view all activity logs" ON staff_activity_log;
DROP POLICY IF EXISTS "Staff can view own logs" ON staff_activity_log;
DROP POLICY IF EXISTS "Staff can insert logs" ON staff_activity_log;

CREATE POLICY "Admin can view all activity logs" ON staff_activity_log 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin' AND status = 'approved')
  );

CREATE POLICY "Staff can view own logs" ON staff_activity_log 
  FOR SELECT USING (auth.uid() = staff_id);

CREATE POLICY "Staff can insert logs" ON staff_activity_log 
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff', 'admin') AND status = 'approved')
  );

-- ============================================
-- SUPPORT TICKETS TABLE
-- ============================================
DROP POLICY IF EXISTS "Users view own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users create tickets" ON support_tickets;
DROP POLICY IF EXISTS "Staff view all tickets" ON support_tickets;
DROP POLICY IF EXISTS "Staff update all tickets" ON support_tickets;

CREATE POLICY "Users view own tickets" ON support_tickets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users create tickets" ON support_tickets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Staff view all tickets" ON support_tickets
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff', 'admin') AND status = 'approved')
  );

CREATE POLICY "Staff update all tickets" ON support_tickets
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff', 'admin') AND status = 'approved')
  );

-- ============================================
-- SUPPORT MESSAGES TABLE
-- ============================================
DROP POLICY IF EXISTS "Users view own ticket messages" ON support_messages;
DROP POLICY IF EXISTS "Users send messages" ON support_messages;
DROP POLICY IF EXISTS "Staff view all messages" ON support_messages;
DROP POLICY IF EXISTS "Staff reply messages" ON support_messages;

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
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff', 'admin') AND status = 'approved')
  );

CREATE POLICY "Staff reply messages" ON support_messages
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff', 'admin') AND status = 'approved')
  );

-- ============================================
-- EVALUATIONS TABLE
-- ============================================
DROP POLICY IF EXISTS "Users can view own evaluations" ON evaluations;
DROP POLICY IF EXISTS "Users can create evaluations" ON evaluations;
DROP POLICY IF EXISTS "Admin can view all evaluations" ON evaluations;
DROP POLICY IF EXISTS "Admin can delete evaluations" ON evaluations;

CREATE POLICY "Users can view own evaluations" ON evaluations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create evaluations" ON evaluations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can view all evaluations" ON evaluations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin' AND status = 'approved')
  );

CREATE POLICY "Admin can delete evaluations" ON evaluations
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin' AND status = 'approved')
  );

-- ============================================
-- SPECIAL LOAN REQUESTS TABLE
-- ============================================
DROP POLICY IF EXISTS "Admin can manage special loans" ON special_loan_requests;
DROP POLICY IF EXISTS "Users can view active special loans" ON special_loan_requests;

CREATE POLICY "Admin can manage special loans" ON special_loan_requests
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin' AND status = 'approved')
  );

CREATE POLICY "Users can view active special loans" ON special_loan_requests
  FOR SELECT USING (
    status = 'active' AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status = 'approved')
  );

-- ============================================
-- DEPARTMENTS TABLE (if exists)
-- ============================================
DROP POLICY IF EXISTS "Admins can manage departments" ON departments;
DROP POLICY IF EXISTS "Anyone can view active departments" ON departments;

CREATE POLICY "Admins can manage departments" ON departments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin' AND status = 'approved')
  );

CREATE POLICY "Anyone can view active departments" ON departments
  FOR SELECT USING (is_active = true OR is_active IS NULL);

-- ============================================
-- DONE!
-- ============================================
