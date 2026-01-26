-- Fix CASE statement errors in notification triggers
-- These functions were missing an ELSE clause, causing 'case not found' errors
-- when status changed to a value not explicitly handled (e.g. 'returned', 'completed')

-- 1. Fix Loan Notification Trigger
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
      ELSE
        -- Do nothing for other statuses (pending, returned, etc.)
        NULL;
    END CASE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION notify_loan_status_change() TO authenticated;


-- 2. Fix Reservation Notification Trigger
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
      ELSE
        -- Do nothing for other statuses (pending, completed, cancelled, expired)
        NULL;
    END CASE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION notify_reservation_status_change() TO authenticated;
