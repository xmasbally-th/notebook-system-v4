-- ============================================
-- Equipment Status Synchronization Triggers
-- Date: 2026-05-12
-- Description: Automatically sync equipment status when a loan request is approved or cancelled.
-- ============================================

-- Function to synchronize equipment status based on loan request status changes
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
  -- we must return the equipment to 'active'.
  -- (If it was pending, equipment was already active, so no need to change, but doing so is safe)
  IF NEW.status IN ('rejected', 'cancelled') AND OLD.status = 'approved' THEN
    UPDATE public.equipment 
    SET status = 'active', updated_at = NOW() 
    WHERE id = NEW.equipment_id;
  END IF;

  -- Note: We do NOT auto-update on 'returned' here.
  -- The processReturn application logic handles 'returned' manually
  -- because it needs to evaluate the 'condition' (good -> active, damaged -> maintenance).

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists (for idempotency)
DROP TRIGGER IF EXISTS on_loan_status_sync_equipment ON public."loanRequests";

-- Create the trigger
CREATE TRIGGER on_loan_status_sync_equipment
  AFTER UPDATE OF status ON public."loanRequests"
  FOR EACH ROW
  EXECUTE PROCEDURE public.sync_equipment_status_on_loan();
