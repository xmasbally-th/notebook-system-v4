-- Migration: Fix equipment status sync when loan is returned
-- Date: 2026-06-09

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

  -- ✅ FIX: When a loan is returned, return the equipment to 'ready'
  IF TG_OP = 'UPDATE' AND NEW.status = 'returned' AND OLD.status = 'approved' THEN
    UPDATE public.equipment 
    SET status = 'ready', updated_at = NOW() 
    WHERE id = NEW.equipment_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
