-- ============================================
-- Inventory Status Notifications Migration
-- Created: 2026-01-27
-- Purpose: Notify Admin/Staff when equipment status changes (Maintenance/Retired/Ready)
-- ============================================

-- 1. Update Notification Type Check Constraint
-- We need to drop the old constraint and add a new one with the expanded list of values
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (type IN (
  'loan_approved',
  'loan_rejected',
  'equipment_due_soon',
  'equipment_overdue',
  'reservation_confirmed',
  'reservation_ready',
  'reservation_approved',
  'reservation_rejected',
  'equipment_maintenance', -- NEW: Sent when status -> maintenance
  'equipment_retired',     -- NEW: Sent when status -> retired
  'equipment_ready'        -- NEW: Sent when status -> ready (from maintenance/retired)
));

-- 2. Function to notify staff on status change
CREATE OR REPLACE FUNCTION notify_equipment_status_change()
RETURNS TRIGGER AS $$
DECLARE
  staff_user RECORD;
  notif_type TEXT := NULL;
  notif_title TEXT := NULL;
  notif_message TEXT := NULL;
BEGIN
  -- Only trigger when status changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    
    -- Determine notification details based on new status
    IF NEW.status = 'maintenance' THEN
      notif_type := 'equipment_maintenance';
      notif_title := 'อุปกรณ์ถูกส่งซ่อม';
      notif_message := 'อุปกรณ์ ' || NEW.equipment_number || ' (' || NEW.name || ') ถูกเปลี่ยนสถานะเป็นส่งซ่อมบำรุง';
    ELSIF NEW.status = 'retired' THEN
      notif_type := 'equipment_retired';
      notif_title := 'อุปกรณ์ถูกจำหน่ายออก';
      notif_message := 'อุปกรณ์ ' || NEW.equipment_number || ' (' || NEW.name || ') ถูกเปลี่ยนสถานะเป็นจำหน่ายออก/เลิกใช้งาน';
    ELSIF OLD.status IN ('maintenance', 'retired') AND NEW.status = 'ready' THEN
      notif_type := 'equipment_ready';
      notif_title := 'อุปกรณ์พร้อมใช้งาน';
      notif_message := 'อุปกรณ์ ' || NEW.equipment_number || ' (' || NEW.name || ') กลับมาพร้อมใช้งานแล้ว';
    END IF;

    -- If we have a notification to send
    IF notif_type IS NOT NULL THEN
      -- Loop through all active Staff and Admins
      FOR staff_user IN 
        SELECT id FROM profiles 
        WHERE role IN ('admin', 'staff') AND status = 'approved'
      LOOP
        INSERT INTO notifications (user_id, type, title, message, related_entity_id)
        VALUES (
          staff_user.id,
          notif_type,
          notif_title,
          notif_message,
          NEW.id
        );
      END LOOP;
    END IF;
    
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create Trigger
DROP TRIGGER IF EXISTS on_equipment_status_change ON equipment;
CREATE TRIGGER on_equipment_status_change
  AFTER UPDATE ON equipment
  FOR EACH ROW
  EXECUTE FUNCTION notify_equipment_status_change();
