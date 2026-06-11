-- Migration: Universal Notifications
-- Date: 2026-06-10
-- Description: Adds comprehensive in-app notification triggers for all roles

-- 1. Notify Admins on New User & Welcome User
CREATE OR REPLACE FUNCTION public.notify_admins_on_new_user()
RETURNS TRIGGER AS $$
DECLARE
  admin_rec RECORD;
BEGIN
  -- Notify the new user (Welcome message)
  PERFORM public.create_user_notification(
    NEW.id,
    'general',
    'ยินดีต้อนรับสู่ระบบยืมคืนอุปกรณ์ 💻',
    'บัญชีของคุณถูกสร้างเรียบร้อยแล้ว ปัจจุบันสถานะของคุณคือ "รอตรวจสอบ" (Pending) โปรดรอผู้ดูแลระบบอนุมัติบัญชีของคุณก่อนเริ่มใช้งาน',
    NEW.id
  );

  -- Notify all Admins and Staff
  FOR admin_rec IN SELECT id FROM public.profiles WHERE role IN ('admin', 'staff') LOOP
    PERFORM public.create_user_notification(
      admin_rec.id,
      'auth',
      'มีผู้สมัครสมาชิกใหม่ 👤',
      'ผู้ใช้ ' || COALESCE(NEW.first_name, 'Unknown') || ' (' || NEW.email || ') ได้สมัครสมาชิกและกำลังรอการอนุมัติ',
      NEW.id
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_admins_on_new_user ON public.profiles;
CREATE TRIGGER trg_notify_admins_on_new_user
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_on_new_user();


-- 2. Notify User on Profile Status Change
CREATE OR REPLACE FUNCTION public.notify_user_on_profile_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'approved' THEN
      PERFORM public.create_user_notification(
        NEW.id,
        'auth',
        'บัญชีได้รับการอนุมัติแล้ว 🎉',
        'บัญชีของคุณผ่านการอนุมัติ คุณสามารถเริ่มใช้งานฟีเจอร์ยืมและจองอุปกรณ์ได้ทันที',
        NEW.id
      );
    ELSIF NEW.status = 'rejected' THEN
      PERFORM public.create_user_notification(
        NEW.id,
        'auth',
        'บัญชีไม่ผ่านการอนุมัติ ❌',
        'บัญชีของคุณไม่ผ่านการอนุมัติสิทธิ์การใช้งาน กรุณาติดต่อผู้ดูแลระบบเพื่อสอบถามข้อมูลเพิ่มเติม',
        NEW.id
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_user_on_profile_status_change ON public.profiles;
CREATE TRIGGER trg_notify_user_on_profile_status_change
  AFTER UPDATE OF status ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_user_on_profile_status_change();


-- 3. Notify Staff on New Request (Loans & Reservations)
CREATE OR REPLACE FUNCTION public.notify_staff_on_new_loan()
RETURNS TRIGGER AS $$
DECLARE
  staff_rec RECORD;
BEGIN
  FOR staff_rec IN SELECT id FROM public.profiles WHERE role IN ('admin', 'staff') LOOP
    PERFORM public.create_user_notification(
      staff_rec.id,
      'loan',
      'มีคำขอยืมอุปกรณ์ใหม่ 📦',
      'ผู้ใช้ได้สร้างคำขอยืมอุปกรณ์ รหัสเอกสาร: ' || NEW.id || ' โปรดตรวจสอบ',
      NEW.id
    );
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.notify_staff_on_new_reservation()
RETURNS TRIGGER AS $$
DECLARE
  staff_rec RECORD;
BEGIN
  FOR staff_rec IN SELECT id FROM public.profiles WHERE role IN ('admin', 'staff') LOOP
    PERFORM public.create_user_notification(
      staff_rec.id,
      'reservation',
      'มีคำขอจองอุปกรณ์ใหม่ 📅',
      'ผู้ใช้ได้สร้างคำขอจองอุปกรณ์ รหัสเอกสาร: ' || NEW.id || ' โปรดตรวจสอบ',
      NEW.id
    );
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_staff_on_new_loan ON public."loanRequests";
CREATE TRIGGER trg_notify_staff_on_new_loan
  AFTER INSERT ON public."loanRequests"
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_staff_on_new_loan();

DROP TRIGGER IF EXISTS trg_notify_staff_on_new_reservation ON public.reservations;
CREATE TRIGGER trg_notify_staff_on_new_reservation
  AFTER INSERT ON public.reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_staff_on_new_reservation();


-- 4. Notify User on Reservation Status Change
CREATE OR REPLACE FUNCTION public.notify_reservation_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    CASE NEW.status
      WHEN 'approved' THEN
        PERFORM public.create_user_notification(NEW.user_id, 'reservation', 'คำขอจองได้รับการอนุมัติ ✅', 'คำขอจองอุปกรณ์ของคุณได้รับการอนุมัติแล้ว', NEW.id);
      WHEN 'rejected' THEN
        PERFORM public.create_user_notification(NEW.user_id, 'reservation', 'คำขอจองถูกปฏิเสธ ❌', 'คำขอจองอุปกรณ์ของคุณถูกปฏิเสธ', NEW.id);
      WHEN 'ready' THEN
        PERFORM public.create_user_notification(NEW.user_id, 'reservation', 'อุปกรณ์พร้อมรับแล้ว 📦', 'อุปกรณ์ที่คุณจองไว้พร้อมให้มารับแล้ว กรุณาติดต่อจุดบริการ', NEW.id);
      ELSE
        -- No notification for completed/cancelled to avoid spamming
        NULL;
    END CASE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_reservation_status_change ON public.reservations;
CREATE TRIGGER trg_notify_reservation_status_change
  AFTER UPDATE OF status ON public.reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_reservation_status_change();
