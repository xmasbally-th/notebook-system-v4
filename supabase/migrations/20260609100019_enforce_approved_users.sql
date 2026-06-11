-- Migration: Enforce Approved Status on Borrowing Endpoints
-- Created at: 2026-06-09
-- Description:
--   1. Create trigger function check_user_is_approved_trigger()
--   2. Attach BEFORE INSERT trigger to loanRequests, reservations, special_loan_requests
--   3. Update RLS policies to enforce 'approved' profile status.

-- 1. Create trigger functions
CREATE OR REPLACE FUNCTION public.check_user_is_approved_trigger()
RETURNS TRIGGER AS $$
DECLARE
    user_prof_status public.user_status;
BEGIN
    SELECT status INTO user_prof_status 
    FROM public.profiles 
    WHERE id = NEW.user_id;

    IF user_prof_status IS NULL OR user_prof_status != 'approved' THEN
        RAISE EXCEPTION 'USER_NOT_APPROVED: เฉพาะผู้ใช้ที่ได้รับการอนุมัติแล้วเท่านั้นจึงจะสามารถทำรายการได้';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.check_borrower_is_approved_trigger()
RETURNS TRIGGER AS $$
DECLARE
    user_prof_status public.user_status;
BEGIN
    SELECT status INTO user_prof_status 
    FROM public.profiles 
    WHERE id = NEW.borrower_id;

    IF user_prof_status IS NULL OR user_prof_status != 'approved' THEN
        RAISE EXCEPTION 'USER_NOT_APPROVED: เฉพาะผู้ใช้ที่ได้รับการอนุมัติแล้วเท่านั้นจึงจะสามารถทำรายการได้';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Attach Trigger
DROP TRIGGER IF EXISTS trg_check_user_approved_loan ON public."loanRequests";
CREATE TRIGGER trg_check_user_approved_loan
  BEFORE INSERT ON public."loanRequests"
  FOR EACH ROW
  EXECUTE FUNCTION public.check_user_is_approved_trigger();

DROP TRIGGER IF EXISTS trg_check_user_approved_res ON public.reservations;
CREATE TRIGGER trg_check_user_approved_res
  BEFORE INSERT ON public.reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.check_user_is_approved_trigger();

DROP TRIGGER IF EXISTS trg_check_user_approved_special ON public.special_loan_requests;
CREATE TRIGGER trg_check_user_approved_special
  BEFORE INSERT ON public.special_loan_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.check_borrower_is_approved_trigger();

-- 3. Harden RLS Policies
-- loanRequests
DROP POLICY IF EXISTS "loanrequests_insert_own" ON public."loanRequests";
CREATE POLICY "loanrequests_insert_own" ON public."loanRequests" FOR INSERT 
  WITH CHECK (
      auth.uid() = user_id 
      AND status = 'pending'
      AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND status = 'approved')
  );

-- reservations
DROP POLICY IF EXISTS "reservations_insert_own" ON public.reservations;
CREATE POLICY "reservations_insert_own" ON public.reservations FOR INSERT 
  WITH CHECK (
      auth.uid() = user_id
      AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND status = 'approved')
  );

-- special_loan_requests
DROP POLICY IF EXISTS "special_loan_requests_insert_own" ON public.special_loan_requests;
CREATE POLICY "special_loan_requests_insert_own" ON public.special_loan_requests FOR INSERT
  WITH CHECK (
      auth.uid() = borrower_id
      AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND status = 'approved')
  );
