-- Migration: Sync Equipment Status on Special Loans & Fix Borrower ID Check
-- Date: 2026-06-09

-- 1. Fix trigger for checking external borrower
CREATE OR REPLACE FUNCTION public.check_borrower_is_approved_trigger()
RETURNS TRIGGER AS $$
DECLARE
    user_prof_status public.user_status;
BEGIN
    -- Only check profile if it's an internal user (borrower_id is not null)
    IF NEW.borrower_id IS NOT NULL THEN
        SELECT status INTO user_prof_status 
        FROM public.profiles 
        WHERE id = NEW.borrower_id;

        IF user_prof_status IS NULL OR user_prof_status != 'approved' THEN
            RAISE EXCEPTION 'USER_NOT_APPROVED: เฉพาะผู้ใช้ที่ได้รับการอนุมัติแล้วเท่านั้นจึงจะสามารถทำรายการได้';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create Equipment Sync Trigger for Special Loans
CREATE OR REPLACE FUNCTION public.sync_equipment_status_on_special_loan()
RETURNS TRIGGER AS $$
BEGIN
  -- When special loan is created or updated to active
  IF (TG_OP = 'INSERT' AND NEW.status = 'active') OR 
     (TG_OP = 'UPDATE' AND NEW.status = 'active' AND OLD.status != 'active') THEN
     UPDATE public.equipment 
     SET status = 'borrowed', updated_at = NOW() 
     WHERE id = ANY(NEW.equipment_ids);
  END IF;

  -- When special loan is returned or cancelled
  IF TG_OP = 'UPDATE' AND NEW.status IN ('returned', 'cancelled') AND OLD.status = 'active' THEN
     UPDATE public.equipment 
     SET status = 'ready', updated_at = NOW() 
     WHERE id = ANY(NEW.equipment_ids);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_sync_equipment_on_special_loan ON public.special_loan_requests;
CREATE TRIGGER trg_sync_equipment_on_special_loan
  AFTER INSERT OR UPDATE OF status ON public.special_loan_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_equipment_status_on_special_loan();

-- 3. Update existing RPCs to remove redundant equipment updates 
-- (They are now handled by the trigger)
CREATE OR REPLACE FUNCTION public.complete_special_loan(
    p_loan_id UUID,
    p_admin_id UUID
) RETURNS VOID AS $$
DECLARE
    v_status TEXT;
BEGIN
    SELECT status INTO v_status
    FROM public.special_loan_requests 
    WHERE id = p_loan_id
    FOR UPDATE;
    
    IF v_status IS NULL OR v_status != 'active' THEN
        RAISE EXCEPTION 'Special loan not found or already completed';
    END IF;
    
    UPDATE public.special_loan_requests SET 
        status = 'returned', returned_at = NOW(), 
        returned_by = p_admin_id, updated_at = NOW()
    WHERE id = p_loan_id;
    
    -- Note: Equipment status update is now handled by trg_sync_equipment_on_special_loan
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.cancel_special_loan(
    p_loan_id UUID
) RETURNS VOID AS $$
DECLARE
    v_status TEXT;
BEGIN
    SELECT status INTO v_status
    FROM public.special_loan_requests 
    WHERE id = p_loan_id
    FOR UPDATE;
    
    IF v_status IS NULL OR v_status != 'active' THEN
        RAISE EXCEPTION 'Special loan not found or already cancelled';
    END IF;
    
    UPDATE public.special_loan_requests SET 
        status = 'cancelled', updated_at = NOW()
    WHERE id = p_loan_id;
    
    -- Note: Equipment status update is now handled by trg_sync_equipment_on_special_loan
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
