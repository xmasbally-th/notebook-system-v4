-- ============================================
-- Reservation Notifications Migration
-- Created: 2026-01-14
-- Purpose: Auto-notify users when reservation status changes
-- ============================================

-- 1. Update notification type constraint to include reservation types
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
  CHECK (type IN (
    'loan_approved', 
    'loan_rejected', 
    'equipment_due_soon', 
    'equipment_overdue',
    'reservation_confirmed', 
    'reservation_ready',
    'reservation_approved', 
    'reservation_rejected'
  ));

-- 2. Create trigger function for reservation status changes
CREATE OR REPLACE FUNCTION notify_reservation_status_change() 
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger when status actually changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    CASE NEW.status
      WHEN 'approved' THEN
        INSERT INTO notifications (user_id, type, title, message, related_entity_id)
        VALUES (
          NEW.user_id, 
          'reservation_approved', 
          'การจองได้รับการอนุมัติ', 
          'การจองอุปกรณ์ของคุณได้รับการอนุมัติแล้ว กรุณามารับอุปกรณ์ตามวันเวลาที่จอง', 
          NEW.id
        );
      WHEN 'rejected' THEN
        INSERT INTO notifications (user_id, type, title, message, related_entity_id)
        VALUES (
          NEW.user_id, 
          'reservation_rejected',
          'การจองถูกปฏิเสธ',
          COALESCE('เหตุผล: ' || NEW.rejection_reason, 'การจองอุปกรณ์ของคุณถูกปฏิเสธ กรุณาติดต่อเจ้าหน้าที่'),
          NEW.id
        );
      WHEN 'ready' THEN
        INSERT INTO notifications (user_id, type, title, message, related_entity_id)
        VALUES (
          NEW.user_id, 
          'reservation_ready',
          'อุปกรณ์พร้อมรับแล้ว!',
          'กรุณามารับอุปกรณ์ที่จองไว้ภายใน 5 นาที มิฉะนั้นการจองจะถูกยกเลิก',
          NEW.id
        );
    END CASE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create trigger on reservations table
DROP TRIGGER IF EXISTS on_reservation_status_change ON reservations;
CREATE TRIGGER on_reservation_status_change
  AFTER UPDATE ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION notify_reservation_status_change();

-- 4. Grant execute permission
GRANT EXECUTE ON FUNCTION notify_reservation_status_change() TO authenticated;
