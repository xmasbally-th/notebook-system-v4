-- Migration: Add booking conflict triggers, status sync improvements, and RLS security hardening.
-- Created at: 2026-05-21

-- ============================================================
-- STEP 1: Redefine check_combined_reservation_conflict
-- ============================================================
DROP FUNCTION IF EXISTS public.check_combined_reservation_conflict(UUID, TIMESTAMPTZ, TIMESTAMPTZ, UUID);

CREATE OR REPLACE FUNCTION public.check_combined_reservation_conflict(
    target_equipment_id UUID,
    new_start_date TIMESTAMPTZ,
    new_end_date TIMESTAMPTZ,
    exclude_reservation_id UUID DEFAULT NULL,
    exclude_loan_id UUID DEFAULT NULL
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
      AND (exclude_loan_id IS NULL OR id != exclude_loan_id)
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
   SECURITY DEFINER
   SET search_path = public;

-- ============================================================
-- STEP 2: Create overlap triggers
-- ============================================================

-- Trigger function for Reservations
CREATE OR REPLACE FUNCTION public.check_reservation_overlap_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF public.check_combined_reservation_conflict(
    NEW.equipment_id, 
    NEW.start_date, 
    NEW.end_date, 
    NEW.id, 
    NULL
  ) THEN
    RAISE EXCEPTION 'OVERLAP_RESERVATION: ช่วงเวลาที่เลือกซ้อนทับกับการจองหรือยืมอื่น';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_check_reservation_overlap ON public.reservations;
CREATE TRIGGER trg_check_reservation_overlap
  BEFORE INSERT OR UPDATE OF start_date, end_date, equipment_id, status ON public.reservations
  FOR EACH ROW
  WHEN (NEW.status IN ('pending', 'approved', 'ready'))
  EXECUTE FUNCTION public.check_reservation_overlap_trigger();

-- Trigger function for Loan Requests
CREATE OR REPLACE FUNCTION public.check_loan_overlap_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF public.check_combined_reservation_conflict(
    NEW.equipment_id, 
    NEW.start_date, 
    NEW.end_date, 
    NULL, 
    NEW.id
  ) THEN
    RAISE EXCEPTION 'OVERLAP_LOAN: ช่วงเวลาที่เลือกซ้อนทับกับการจองหรือยืมอื่น';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_check_loan_overlap ON public."loanRequests";
CREATE TRIGGER trg_check_loan_overlap
  BEFORE INSERT OR UPDATE OF start_date, end_date, equipment_id, status ON public."loanRequests"
  FOR EACH ROW
  WHEN (NEW.status IN ('pending', 'approved'))
  EXECUTE FUNCTION public.check_loan_overlap_trigger();

-- ============================================================
-- STEP 3: Improve equipment status sync trigger on loanRequests
-- ============================================================
CREATE OR REPLACE FUNCTION public.sync_equipment_status_on_loan()
RETURNS TRIGGER AS $$
BEGIN
  -- When a loan is approved (on insert or update), set the equipment to 'borrowed'
  IF (TG_OP = 'INSERT' AND NEW.status = 'approved') OR
     (TG_OP = 'UPDATE' AND NEW.status = 'approved' AND OLD.status != 'approved') THEN
    UPDATE public.equipment 
    SET status = 'borrowed', updated_at = NOW() 
    WHERE id = NEW.equipment_id;
  END IF;

  -- When a loan is rejected or cancelled, and it was previously 'approved',
  -- we return the equipment to 'ready'.
  IF TG_OP = 'UPDATE' AND NEW.status IN ('rejected', 'cancelled') AND OLD.status = 'approved' THEN
    UPDATE public.equipment 
    SET status = 'ready', updated_at = NOW() 
    WHERE id = NEW.equipment_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_loan_status_sync_equipment ON public."loanRequests";
CREATE TRIGGER on_loan_status_sync_equipment
  AFTER INSERT OR UPDATE OF status ON public."loanRequests"
  FOR EACH ROW
  EXECUTE PROCEDURE public.sync_equipment_status_on_loan();

-- ============================================================
-- STEP 4: Prevent Privilege Escalation on profiles table
-- ============================================================
CREATE OR REPLACE FUNCTION public.protect_profile_fields_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- If not an admin, prevent modifying role and status
  IF public.get_my_role() IS DISTINCT FROM 'admin' THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      NEW.role := OLD.role;
    END IF;
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      NEW.status := OLD.status;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_profile_fields ON public.profiles;
CREATE TRIGGER trg_protect_profile_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_fields_trigger();

-- ============================================================
-- STEP 5: Harden RLS Policies
-- ============================================================

-- 1. Profiles: allow staff to SELECT profiles (was only admin)
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_staff" ON public.profiles;
CREATE POLICY "profiles_select_staff" ON public.profiles FOR SELECT
  USING (public.get_my_role() IN ('staff', 'admin'));

-- 2. Reservations: limit user update to cancellation only
DROP POLICY IF EXISTS "reservations_update_own" ON public.reservations;
CREATE POLICY "reservations_update_own" ON public.reservations FOR UPDATE
  USING (auth.uid() = user_id AND status IN ('pending', 'approved'))
  WITH CHECK (status = 'cancelled');

-- 3. Loan Requests: replace broad FOR ALL policy for own requests
DROP POLICY IF EXISTS "loanrequests_all_own" ON public."loanRequests";
DROP POLICY IF EXISTS "loanrequests_select_own" ON public."loanRequests";
DROP POLICY IF EXISTS "loanrequests_insert_own" ON public."loanRequests";

CREATE POLICY "loanrequests_select_own" ON public."loanRequests" FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "loanrequests_insert_own" ON public."loanRequests" FOR INSERT 
  WITH CHECK (auth.uid() = user_id AND status = 'pending');
