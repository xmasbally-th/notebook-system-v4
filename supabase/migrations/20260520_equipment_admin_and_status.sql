-- ============================================================
-- Migration: Equipment Admin-Only Permissions & 5-Status Lifecycle
-- Date: 2026-05-20
-- ============================================================

-- 1. Add 'reserved' value to equipment_status enum (safe check via DO block)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        JOIN pg_type ON pg_type.oid = pg_enum.enumtypid 
        WHERE typname = 'equipment_status' AND enumlabel = 'reserved'
    ) THEN
        ALTER TYPE equipment_status ADD VALUE 'reserved';
    END IF;
END $$;

-- 2. Update RLS policies on public.equipment
-- Drop all existing policies first
DROP POLICY IF EXISTS "Approved users view equipment"  ON public.equipment;
DROP POLICY IF EXISTS "Admins manage equipment"        ON public.equipment;
DROP POLICY IF EXISTS "equipment_select_approved"      ON public.equipment;
DROP POLICY IF EXISTS "equipment_all_admin"            ON public.equipment;
DROP POLICY IF EXISTS "equipment_all_staff"            ON public.equipment;

-- Select policy: Approved profiles can view equipment
CREATE POLICY "equipment_select_approved" ON public.equipment FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND status = 'approved'
        )
    );

-- Write policy: Only admins can manage equipment (INSERT, UPDATE, DELETE)
CREATE POLICY "equipment_all_admin" ON public.equipment FOR ALL
    USING (get_my_role() = 'admin');

-- 3. Clean up any remaining legacy 'active' statuses
UPDATE public.equipment
SET status = 'ready'::equipment_status
WHERE status::text = 'active';

-- 4. Update sync_equipment_status_on_loan to return to 'ready' instead of 'active'
CREATE OR REPLACE FUNCTION public.sync_equipment_status_on_loan()
RETURNS TRIGGER AS $$
BEGIN
  -- When a loan is approved, set the equipment to 'borrowed'
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    UPDATE public.equipment 
    SET status = 'borrowed', updated_at = NOW() 
    WHERE id = NEW.equipment_id;
  END IF;

  -- When a loan is rejected or cancelled, and it was previously 'approved',
  -- we must return the equipment to 'ready'.
  IF NEW.status IN ('rejected', 'cancelled') AND OLD.status = 'approved' THEN
    UPDATE public.equipment 
    SET status = 'ready', updated_at = NOW() 
    WHERE id = NEW.equipment_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create reservation status synchronization trigger
CREATE OR REPLACE FUNCTION public.sync_equipment_status_on_reservation()
RETURNS TRIGGER AS $$
BEGIN
  -- When a reservation is approved or marked ready, set the equipment to 'reserved'
  IF (TG_OP = 'INSERT' AND NEW.status IN ('approved', 'ready')) OR
     (TG_OP = 'UPDATE' AND NEW.status IN ('approved', 'ready') AND (OLD.status IS NULL OR OLD.status NOT IN ('approved', 'ready'))) THEN
    UPDATE public.equipment 
    SET status = 'reserved', updated_at = NOW() 
    WHERE id = NEW.equipment_id;
  END IF;

  -- When a reservation is cancelled, rejected, or expired, and it was previously approved/ready,
  -- return the equipment to 'ready'
  IF TG_OP = 'UPDATE' AND NEW.status IN ('rejected', 'cancelled', 'expired') AND (OLD.status IN ('approved', 'ready')) THEN
    UPDATE public.equipment 
    SET status = 'ready', updated_at = NOW() 
    WHERE id = NEW.equipment_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_reservation_status_sync_equipment ON public.reservations;
CREATE TRIGGER on_reservation_status_sync_equipment
  AFTER INSERT OR UPDATE OF status ON public.reservations
  FOR EACH ROW
  EXECUTE PROCEDURE public.sync_equipment_status_on_reservation();
