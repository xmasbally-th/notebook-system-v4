-- ============================================
-- V5 Baseline Migration: Layer 2 (Security & Triggers)
-- Date: 2026-02-24
-- Description: Consolidated RLS policies, security-definer functions, and triggers
-- ============================================

-- 1. Security-Definer Functions

-- Handle New User Registration
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper to create user notifications
CREATE OR REPLACE FUNCTION create_user_notification(
  target_user_id UUID,
  notification_type TEXT,
  notification_title TEXT,
  notification_message TEXT DEFAULT NULL,
  entity_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO notifications (user_id, type, title, message, related_entity_id)
  VALUES (target_user_id, notification_type, notification_title, notification_message, entity_id)
  RETURNING id INTO new_id;
  RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-notify on loan status change
CREATE OR REPLACE FUNCTION notify_loan_status_change() RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    CASE NEW.status
      WHEN 'approved' THEN
        PERFORM create_user_notification(NEW.user_id, 'loan_approved', 'คำขอยืมได้รับการอนุมัติ', 'คำขอยืมอุปกรณ์ของคุณได้รับการอนุมัติแล้ว', NEW.id);
      WHEN 'rejected' THEN
        PERFORM create_user_notification(NEW.user_id, 'loan_rejected', 'คำขอยืมถูกปฏิเสธ', 'คำขอยืมอุปกรณ์ของคุณถูกปฏิเสธ', NEW.id);
    END CASE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Triggers

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

DROP TRIGGER IF EXISTS on_loan_status_change ON "loanRequests";
CREATE TRIGGER on_loan_status_change AFTER UPDATE ON "loanRequests" FOR EACH ROW EXECUTE FUNCTION notify_loan_status_change();

-- 3. RLS Enablement

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE "loanRequests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE special_loan_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_backups ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies (Consolidated)

-- Profiles
CREATE POLICY "Users view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins view all profiles" ON profiles FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin' AND status = 'approved'));
CREATE POLICY "Admins update profiles" ON profiles FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin' AND status = 'approved'));

-- Equipment
CREATE POLICY "Approved users view equipment" ON equipment FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status = 'approved'));
CREATE POLICY "Admins manage equipment" ON equipment FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin' AND status = 'approved'));

-- Loan Requests
CREATE POLICY "Users access own requests" ON "loanRequests" FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Staff manage all loans" ON "loanRequests" FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff', 'admin') AND status = 'approved'));

-- Reservations
CREATE POLICY "Users view own reservations" ON reservations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create reservations" ON reservations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users cancel own reservations" ON reservations FOR UPDATE USING (auth.uid() = user_id AND status IN ('pending', 'approved'));
CREATE POLICY "Staff manage reservations" ON reservations FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff', 'admin') AND status = 'approved'));

-- Notifications
CREATE POLICY "Users see own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Staff create notifications" ON notifications FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff', 'admin') AND status = 'approved'));

-- Support
CREATE POLICY "Users view own tickets" ON support_tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create tickets" ON support_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Staff manage tickets" ON support_tickets FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff', 'admin') AND status = 'approved'));

CREATE POLICY "Users view own messages" ON support_messages FOR SELECT USING (EXISTS (SELECT 1 FROM support_tickets WHERE support_tickets.id = support_messages.ticket_id AND support_tickets.user_id = auth.uid()));
CREATE POLICY "Users send messages" ON support_messages FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM support_tickets WHERE support_tickets.id = support_messages.ticket_id AND support_tickets.user_id = auth.uid()) AND auth.uid() = sender_id);
CREATE POLICY "Staff manage messages" ON support_messages FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff', 'admin') AND status = 'approved'));

-- Evaluations
CREATE POLICY "Users view own evaluations" ON evaluations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create evaluations" ON evaluations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage evaluations" ON evaluations FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin' AND status = 'approved'));

-- Special Loans
CREATE POLICY "Admin manage special loans" ON special_loan_requests FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin' AND status = 'approved'));
CREATE POLICY "Users view active special loans" ON special_loan_requests FOR SELECT USING (status = 'active' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status = 'approved'));

-- Departments & Types
CREATE POLICY "Admins manage departments" ON departments FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin' AND status = 'approved'));
CREATE POLICY "Anyone view departments" ON departments FOR SELECT USING (is_active = true OR is_active IS NULL);

CREATE POLICY "Admins manage equipment_types" ON equipment_types FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin' AND status = 'approved'));
CREATE POLICY "Anyone view equipment_types" ON equipment_types FOR SELECT USING (true);

-- System Config
CREATE POLICY "Admins update config" ON system_config FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin' AND status = 'approved'));
CREATE POLICY "Anyone view config" ON system_config FOR SELECT USING (true);

-- Activity Log & Backups
CREATE POLICY "Staff manage logs" ON staff_activity_log FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff', 'admin') AND status = 'approved'));
CREATE POLICY "Admins manage backups" ON data_backups FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin' AND status = 'approved'));
