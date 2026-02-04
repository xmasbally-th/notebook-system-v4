-- ============================================
-- CLEAN SLATE: Drop ALL policies and recreate correctly
-- Date: 2026-02-04
-- Description: Remove all duplicate/conflicting policies
-- ============================================

-- ============================================
-- STEP 1: DROP ALL POLICIES ON ALL TABLES
-- ============================================

-- profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON profiles;
DROP POLICY IF EXISTS "Public can view profiles" ON profiles;

-- equipment
DROP POLICY IF EXISTS "Approved users can view equipment" ON equipment;
DROP POLICY IF EXISTS "Admins can manage equipment" ON equipment;
DROP POLICY IF EXISTS "Admins can delete equipment" ON equipment;
DROP POLICY IF EXISTS "Admins can insert equipment" ON equipment;
DROP POLICY IF EXISTS "Admins can update equipment" ON equipment;
DROP POLICY IF EXISTS "Anyone can view equipment" ON equipment;
DROP POLICY IF EXISTS "Public can view equipment" ON equipment;

-- loanRequests
DROP POLICY IF EXISTS "Users access own requests" ON "loanRequests";
DROP POLICY IF EXISTS "Admins manage requests" ON "loanRequests";
DROP POLICY IF EXISTS "Staff can manage all loans" ON "loanRequests";
DROP POLICY IF EXISTS "Staff and Admins manage requests" ON "loanRequests";
DROP POLICY IF EXISTS "Staff view all requests" ON "loanRequests";
DROP POLICY IF EXISTS "Anyone can view loan requests" ON "loanRequests";

-- reservations
DROP POLICY IF EXISTS "Users can view own reservations" ON reservations;
DROP POLICY IF EXISTS "Users can create reservations" ON reservations;
DROP POLICY IF EXISTS "Users can cancel own reservations" ON reservations;
DROP POLICY IF EXISTS "Staff can view all reservations" ON reservations;
DROP POLICY IF EXISTS "Staff can manage reservations" ON reservations;

-- notifications
DROP POLICY IF EXISTS "Users see own notifications" ON notifications;
DROP POLICY IF EXISTS "Users update own notifications" ON notifications;
DROP POLICY IF EXISTS "Staff can create notifications" ON notifications;
DROP POLICY IF EXISTS "Admin can delete notifications" ON notifications;
DROP POLICY IF EXISTS "Admin can view all notifications" ON notifications;

-- staff_activity_log
DROP POLICY IF EXISTS "Admin can view all activity logs" ON staff_activity_log;
DROP POLICY IF EXISTS "Staff can view own logs" ON staff_activity_log;
DROP POLICY IF EXISTS "Staff can insert logs" ON staff_activity_log;

-- support_tickets
DROP POLICY IF EXISTS "Users view own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users create tickets" ON support_tickets;
DROP POLICY IF EXISTS "Staff view all tickets" ON support_tickets;
DROP POLICY IF EXISTS "Staff update all tickets" ON support_tickets;

-- support_messages
DROP POLICY IF EXISTS "Users view own ticket messages" ON support_messages;
DROP POLICY IF EXISTS "Users send messages" ON support_messages;
DROP POLICY IF EXISTS "Staff view all messages" ON support_messages;
DROP POLICY IF EXISTS "Staff reply messages" ON support_messages;
DROP POLICY IF EXISTS "Staff mark messages read" ON support_messages;
DROP POLICY IF EXISTS "Users mark messages read" ON support_messages;

-- evaluations
DROP POLICY IF EXISTS "Users can view own evaluations" ON evaluations;
DROP POLICY IF EXISTS "Users can create evaluations" ON evaluations;
DROP POLICY IF EXISTS "Admin can view all evaluations" ON evaluations;
DROP POLICY IF EXISTS "Admin can delete evaluations" ON evaluations;
DROP POLICY IF EXISTS "Users can view their own evaluations" ON evaluations;
DROP POLICY IF EXISTS "Users can create their own evaluations" ON evaluations;
DROP POLICY IF EXISTS "Admins can view all evaluations" ON evaluations;
DROP POLICY IF EXISTS "Admins can delete evaluations" ON evaluations;

-- special_loan_requests
DROP POLICY IF EXISTS "Admin can manage special loans" ON special_loan_requests;
DROP POLICY IF EXISTS "Users can view active special loans" ON special_loan_requests;

-- departments
DROP POLICY IF EXISTS "Admins can manage departments" ON departments;
DROP POLICY IF EXISTS "Anyone can view active departments" ON departments;
DROP POLICY IF EXISTS "Everyone can view active departments" ON departments;

-- equipment_types
DROP POLICY IF EXISTS "Admins can manage equipment types" ON equipment_types;
DROP POLICY IF EXISTS "Anyone can view equipment types" ON equipment_types;

-- system_config
DROP POLICY IF EXISTS "Admins can update config" ON system_config;
DROP POLICY IF EXISTS "Anyone can read config" ON system_config;
DROP POLICY IF EXISTS "Anyone can view config" ON system_config;
DROP POLICY IF EXISTS "Everyone can view config" ON system_config;
DROP POLICY IF EXISTS "Public can view config" ON system_config;

-- data_backups
DROP POLICY IF EXISTS "Admin can delete backups" ON data_backups;
DROP POLICY IF EXISTS "Admin can insert backups" ON data_backups;
DROP POLICY IF EXISTS "Admin can update backups" ON data_backups;
DROP POLICY IF EXISTS "Admin can view all backups" ON data_backups;

-- ============================================
-- STEP 2: RECREATE ALL POLICIES CORRECTLY
-- ============================================

-- PROFILES
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

-- EQUIPMENT
CREATE POLICY "Approved users can view equipment" ON equipment 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status = 'approved')
  );

CREATE POLICY "Admins can manage equipment" ON equipment 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin' AND status = 'approved')
  );

-- LOAN REQUESTS
CREATE POLICY "Users access own requests" ON "loanRequests" 
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Staff can manage all loans" ON "loanRequests"
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff', 'admin') AND status = 'approved')
  );

-- RESERVATIONS
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

-- NOTIFICATIONS
CREATE POLICY "Users see own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Staff can create notifications" ON notifications
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff', 'admin') AND status = 'approved')
  );

-- STAFF ACTIVITY LOG
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

-- SUPPORT TICKETS
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
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff', 'admin') AND status = 'approved')
  );

CREATE POLICY "Staff reply messages" ON support_messages
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff', 'admin') AND status = 'approved')
  );

-- EVALUATIONS
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

-- SPECIAL LOAN REQUESTS
CREATE POLICY "Admin can manage special loans" ON special_loan_requests
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin' AND status = 'approved')
  );

CREATE POLICY "Users can view active special loans" ON special_loan_requests
  FOR SELECT USING (
    status = 'active' AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status = 'approved')
  );

-- DEPARTMENTS
CREATE POLICY "Admins can manage departments" ON departments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin' AND status = 'approved')
  );

CREATE POLICY "Anyone can view active departments" ON departments
  FOR SELECT USING (is_active = true OR is_active IS NULL);

-- EQUIPMENT TYPES
CREATE POLICY "Admins can manage equipment types" ON equipment_types
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin' AND status = 'approved')
  );

CREATE POLICY "Anyone can view equipment types" ON equipment_types
  FOR SELECT USING (true);

-- SYSTEM CONFIG
CREATE POLICY "Admins can update config" ON system_config
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin' AND status = 'approved')
  );

CREATE POLICY "Anyone can view config" ON system_config
  FOR SELECT USING (true);

-- DATA BACKUPS
CREATE POLICY "Admin can manage backups" ON data_backups
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin' AND status = 'approved')
  );

-- ============================================
-- DONE!
-- ============================================
