-- ============================================
-- Migration: Fix Notification Trigger CASE statement
-- Date: 2026-02-25 (v3 - fixes "CASE statement missing ELSE part")
-- ============================================

-- 1. Fix: notify_loan_status_change trigger function missing ELSE clause
-- This was causing Error 20000 "case not found" when status update to 'returned'
CREATE OR REPLACE FUNCTION public.notify_loan_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    CASE NEW.status
      WHEN 'approved' THEN
        PERFORM public.create_user_notification(NEW.user_id, 'loan_approved', 'คำขอยืมได้รับการอนุมัติ', 'คำขอยืมอุปกรณ์ของคุณได้รับการอนุมัติแล้ว', NEW.id);
      WHEN 'rejected' THEN
        PERFORM public.create_user_notification(NEW.user_id, 'loan_rejected', 'คำขอยืมถูกปฏิเสธ', 'คำขอยืมอุปกรณ์ของคุณถูกปฏิเสธ', NEW.id);
      ELSE
        -- No notification for other statuses like 'returned', 'pending', etc.
        -- Adding ELSE NULL prevents the "CASE statement is missing ELSE part" error.
        NULL;
    END CASE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public;

-- 2. Robust fix for constraints & columns (Re-run to ensure consistency)
ALTER TABLE public."loanRequests" ADD COLUMN IF NOT EXISTS returned_at TIMESTAMPTZ;
ALTER TABLE public."loanRequests" ADD COLUMN IF NOT EXISTS return_condition TEXT;
ALTER TABLE public."loanRequests" ADD COLUMN IF NOT EXISTS return_notes TEXT;

DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = '"loanRequests"'::regclass
          AND contype = 'c'
          AND pg_get_constraintdef(oid) ILIKE '%status%'
    LOOP
        EXECUTE format('ALTER TABLE public."loanRequests" DROP CONSTRAINT IF EXISTS %I', r.conname);
    END LOOP;
END;
$$;

ALTER TABLE public."loanRequests"
    ADD CONSTRAINT "loanRequests_status_check"
    CHECK (status IN ('pending', 'approved', 'rejected', 'returned'));
