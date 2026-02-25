-- ============================================
-- V5 Security Hardening Migration
-- Date: 2026-02-25
-- Description: 
--   1. Add get_my_role() helper to replace recursive RLS sub-selects
--   2. Drop & recreate ALL RLS policies using the new helper (non-recursive)
--   3. Restrict system_config SELECT to approved users only
--   4. Add SET search_path = public to all SECURITY DEFINER functions
-- ============================================

-- ============================================================
-- STEP 1: Create get_my_role() — cached, SECURITY DEFINER helper
-- Avoids the "N+1 profiles lookup" inside every RLS check.
-- STABLE tells Postgres it can cache the result within a query.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
  SELECT role::TEXT FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER
   SET search_path = public;

-- ============================================================
-- STEP 2: Fix SECURITY DEFINER functions — add search_path
-- Prevents search_path injection attacks.
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  metadata jsonb;
BEGIN
  metadata := NEW.raw_user_meta_data;
  
  INSERT INTO public.profiles (id, email, first_name, role, status, avatar_url)
  VALUES (
    NEW.id, 
    NEW.email, 
    metadata->>'full_name', 
    'user', 
    'pending',
    COALESCE(metadata->>'avatar_url', metadata->>'picture')
  )
  ON CONFLICT (id) DO UPDATE SET
    avatar_url = EXCLUDED.avatar_url,
    updated_at = NOW();
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public;

CREATE OR REPLACE FUNCTION public.create_user_notification(
  target_user_id UUID,
  notification_type TEXT,
  notification_title TEXT,
  notification_message TEXT DEFAULT NULL,
  entity_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, related_entity_id)
  VALUES (target_user_id, notification_type, notification_title, notification_message, entity_id)
  RETURNING id INTO new_id;
  RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public;

CREATE OR REPLACE FUNCTION public.notify_loan_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    CASE NEW.status
      WHEN 'approved' THEN
        PERFORM public.create_user_notification(NEW.user_id, 'loan_approved', 'คำขอยืมได้รับการอนุมัติ', 'คำขอยืมอุปกรณ์ของคุณได้รับการอนุมัติแล้ว', NEW.id);
      WHEN 'rejected' THEN
        PERFORM public.create_user_notification(NEW.user_id, 'loan_rejected', 'คำขอยืมถูกปฏิเสธ', 'คำขอยืมอุปกรณ์ของคุณถูกปฏิเสธ', NEW.id);
    END CASE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public;

CREATE OR REPLACE FUNCTION public.check_combined_reservation_conflict(
    target_equipment_id UUID,
    new_start_date TIMESTAMPTZ,
    new_end_date TIMESTAMPTZ,
    exclude_reservation_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    conflict_count INTEGER;
BEGIN
    -- Check reservations
    SELECT COUNT(*) INTO conflict_count
    FROM public.reservations 
    WHERE equipment_id = target_equipment_id
      AND status IN ('pending', 'approved', 'ready')
      AND (exclude_reservation_id IS NULL OR id != exclude_reservation_id)
      AND start_date <= new_end_date
      AND end_date >= new_start_date;
      
    IF conflict_count > 0 THEN RETURN TRUE; END IF;
    
    -- Check loan requests
    SELECT COUNT(*) INTO conflict_count
    FROM public."loanRequests" 
    WHERE equipment_id = target_equipment_id
      AND status IN ('pending', 'approved')
      AND start_date <= new_end_date
      AND end_date >= new_start_date;
    
    IF conflict_count > 0 THEN RETURN TRUE; END IF;
    
    -- Check special loan requests
    SELECT COUNT(*) INTO conflict_count
    FROM public.special_loan_requests slr
    WHERE target_equipment_id = ANY(slr.equipment_ids)
      AND slr.status = 'active'
      AND slr.loan_date <= new_end_date::date
      AND slr.return_date >= new_start_date::date;
      
    RETURN conflict_count > 0;
END;
$$ LANGUAGE plpgsql
   SET search_path = public;

-- ============================================================
-- STEP 3: Drop ALL existing RLS policies and recreate them
-- using get_my_role() — eliminates recursive profile lookups.
-- ============================================================

-- --- Profiles ---
DROP POLICY IF EXISTS "Users view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins update profiles" ON public.profiles;

CREATE POLICY "profiles_select_own"    ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own"    ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_select_admin"  ON public.profiles FOR SELECT USING (get_my_role() = 'admin');
CREATE POLICY "profiles_update_admin"  ON public.profiles FOR UPDATE USING (get_my_role() = 'admin');

-- --- Equipment ---
DROP POLICY IF EXISTS "Approved users view equipment" ON public.equipment;
DROP POLICY IF EXISTS "Admins manage equipment" ON public.equipment;

CREATE POLICY "equipment_select_approved" ON public.equipment FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND status = 'approved'));
CREATE POLICY "equipment_all_admin" ON public.equipment FOR ALL
  USING (get_my_role() = 'admin');

-- --- Loan Requests ---
DROP POLICY IF EXISTS "Users access own requests" ON public."loanRequests";
DROP POLICY IF EXISTS "Staff manage all loans" ON public."loanRequests";

CREATE POLICY "loanrequests_all_own"   ON public."loanRequests" FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "loanrequests_all_staff" ON public."loanRequests" FOR ALL USING (get_my_role() IN ('staff', 'admin'));

-- --- Reservations ---
DROP POLICY IF EXISTS "Users view own reservations" ON public.reservations;
DROP POLICY IF EXISTS "Users create reservations" ON public.reservations;
DROP POLICY IF EXISTS "Users cancel own reservations" ON public.reservations;
DROP POLICY IF EXISTS "Staff manage reservations" ON public.reservations;

CREATE POLICY "reservations_select_own" ON public.reservations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "reservations_insert_own" ON public.reservations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reservations_update_own" ON public.reservations FOR UPDATE
  USING (auth.uid() = user_id AND status IN ('pending', 'approved'));
CREATE POLICY "reservations_all_staff" ON public.reservations FOR ALL
  USING (get_my_role() IN ('staff', 'admin'));

-- --- Notifications ---
DROP POLICY IF EXISTS "Users see own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Staff create notifications" ON public.notifications;

CREATE POLICY "notifications_select_own" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "notifications_insert_staff" ON public.notifications FOR INSERT
  WITH CHECK (get_my_role() IN ('staff', 'admin'));
-- Allow DB triggers (SECURITY DEFINER functions) to insert notifications for any user
CREATE POLICY "notifications_insert_system" ON public.notifications FOR INSERT
  WITH CHECK (true);

-- --- Support Tickets ---
DROP POLICY IF EXISTS "Users view own tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users create tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Staff manage tickets" ON public.support_tickets;

CREATE POLICY "tickets_select_own"   ON public.support_tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "tickets_insert_own"   ON public.support_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tickets_all_staff"    ON public.support_tickets FOR ALL USING (get_my_role() IN ('staff', 'admin'));

-- --- Support Messages ---
DROP POLICY IF EXISTS "Users view own messages" ON public.support_messages;
DROP POLICY IF EXISTS "Users send messages" ON public.support_messages;
DROP POLICY IF EXISTS "Staff manage messages" ON public.support_messages;

CREATE POLICY "messages_select_own" ON public.support_messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.support_tickets
    WHERE support_tickets.id = support_messages.ticket_id
      AND support_tickets.user_id = auth.uid()
  ));
CREATE POLICY "messages_insert_own" ON public.support_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.support_tickets
      WHERE support_tickets.id = support_messages.ticket_id
        AND support_tickets.user_id = auth.uid()
    ) AND auth.uid() = sender_id
  );
CREATE POLICY "messages_all_staff" ON public.support_messages FOR ALL
  USING (get_my_role() IN ('staff', 'admin'));

-- --- Evaluations ---
DROP POLICY IF EXISTS "Users view own evaluations" ON public.evaluations;
DROP POLICY IF EXISTS "Users create evaluations" ON public.evaluations;
DROP POLICY IF EXISTS "Admins manage evaluations" ON public.evaluations;

CREATE POLICY "evaluations_select_own" ON public.evaluations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "evaluations_insert_own" ON public.evaluations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "evaluations_all_admin"  ON public.evaluations FOR ALL USING (get_my_role() = 'admin');

-- --- Special Loans ---
DROP POLICY IF EXISTS "Admin manage special loans" ON public.special_loan_requests;
DROP POLICY IF EXISTS "Users view active special loans" ON public.special_loan_requests;

CREATE POLICY "special_loans_all_admin"   ON public.special_loan_requests FOR ALL
  USING (get_my_role() = 'admin');
CREATE POLICY "special_loans_select_staff" ON public.special_loan_requests FOR SELECT
  USING (get_my_role() IN ('staff', 'admin'));

-- --- Departments ---
DROP POLICY IF EXISTS "Admins manage departments" ON public.departments;
DROP POLICY IF EXISTS "Anyone view departments" ON public.departments;

CREATE POLICY "departments_all_admin"    ON public.departments FOR ALL USING (get_my_role() = 'admin');
CREATE POLICY "departments_select_all"   ON public.departments FOR SELECT USING (is_active = true OR is_active IS NULL);

-- --- Equipment Types ---
DROP POLICY IF EXISTS "Admins manage equipment_types" ON public.equipment_types;
DROP POLICY IF EXISTS "Anyone view equipment_types" ON public.equipment_types;

CREATE POLICY "equip_types_all_admin"  ON public.equipment_types FOR ALL USING (get_my_role() = 'admin');
CREATE POLICY "equip_types_select_all" ON public.equipment_types FOR SELECT USING (true);

-- ============================================================
-- STEP 4: Harden system_config access
-- This is a single-row config table (id = 1, integer PK).
-- There is no "key" column. RLS is row-level only, so we cannot
-- restrict individual columns (e.g. discord webhook URLs).
-- Strategy: allow only staff/admin to SELECT directly.
-- Regular users never need to read system_config;
-- public settings are served via server-side API/actions instead.
-- ============================================================

DROP POLICY IF EXISTS "Anyone view config" ON public.system_config;
DROP POLICY IF EXISTS "Admins update config" ON public.system_config;
DROP POLICY IF EXISTS "system_config_select_public" ON public.system_config;
DROP POLICY IF EXISTS "system_config_select_admin" ON public.system_config;

-- Staff and admin can read config (needed for admin settings pages)
CREATE POLICY "system_config_select_staff" ON public.system_config FOR SELECT
  USING (get_my_role() IN ('staff', 'admin'));

-- Write: admin only
CREATE POLICY "system_config_all_admin" ON public.system_config FOR ALL
  USING (get_my_role() = 'admin');

-- --- Activity Log & Backups ---
DROP POLICY IF EXISTS "Staff manage logs" ON public.staff_activity_log;
DROP POLICY IF EXISTS "Admins manage backups" ON public.data_backups;

CREATE POLICY "logs_all_staff"     ON public.staff_activity_log FOR ALL USING (get_my_role() IN ('staff', 'admin'));
CREATE POLICY "backups_all_admin"  ON public.data_backups FOR ALL USING (get_my_role() = 'admin');

