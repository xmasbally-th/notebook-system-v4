-- ============================================
-- Notifications System Migration
-- Created: 2026-01-13
-- Purpose: User event notifications with RLS
-- ============================================

-- 1. Create notifications table (stores user events only)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'loan_approved',
    'loan_rejected', 
    'equipment_due_soon',
    'equipment_overdue',
    'reservation_confirmed',
    'reservation_ready'
  )),
  title TEXT NOT NULL,
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  related_entity_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_notifications_user 
  ON notifications(user_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_unread 
  ON notifications(user_id) WHERE is_read = FALSE;

-- 3. Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Users can only see their own notifications
DROP POLICY IF EXISTS "Users see own notifications" ON notifications;
CREATE POLICY "Users see own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
DROP POLICY IF EXISTS "Users update own notifications" ON notifications;
CREATE POLICY "Users update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Staff/Admin can insert notifications for any user
DROP POLICY IF EXISTS "Staff can create notifications" ON notifications;
CREATE POLICY "Staff can create notifications" ON notifications
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('staff', 'admin') 
      AND status = 'approved'
    )
  );

-- 5. Helper function to create user notifications
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

-- 6. Auto-notify user when loan request status changes
CREATE OR REPLACE FUNCTION notify_loan_status_change() 
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger when status changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    CASE NEW.status
      WHEN 'approved' THEN
        INSERT INTO notifications (user_id, type, title, message, related_entity_id)
        VALUES (
          NEW.user_id,
          'loan_approved',
          'คำขอยืมได้รับการอนุมัติ',
          'คำขอยืมอุปกรณ์ของคุณได้รับการอนุมัติแล้ว',
          NEW.id
        );
      WHEN 'rejected' THEN
        INSERT INTO notifications (user_id, type, title, message, related_entity_id)
        VALUES (
          NEW.user_id,
          'loan_rejected',
          'คำขอยืมถูกปฏิเสธ',
          'คำขอยืมอุปกรณ์ของคุณถูกปฏิเสธ',
          NEW.id
        );
    END CASE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for loan status changes
DROP TRIGGER IF EXISTS on_loan_status_change ON "loanRequests";
CREATE TRIGGER on_loan_status_change
  AFTER UPDATE ON "loanRequests"
  FOR EACH ROW
  EXECUTE FUNCTION notify_loan_status_change();
