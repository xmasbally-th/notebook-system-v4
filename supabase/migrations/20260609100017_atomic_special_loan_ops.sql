-- Migration: Atomic Operations for Special Loans
-- Date: 2026-06-09

CREATE OR REPLACE FUNCTION public.complete_special_loan(
    p_loan_id UUID,
    p_admin_id UUID
) RETURNS VOID AS $$
DECLARE
    v_equipment_ids UUID[];
BEGIN
    SELECT equipment_ids INTO v_equipment_ids
    FROM public.special_loan_requests 
    WHERE id = p_loan_id AND status = 'active'
    FOR UPDATE;
    
    IF v_equipment_ids IS NULL THEN
        RAISE EXCEPTION 'Special loan not found or already completed';
    END IF;
    
    UPDATE public.special_loan_requests SET 
        status = 'returned', returned_at = NOW(), 
        returned_by = p_admin_id, updated_at = NOW()
    WHERE id = p_loan_id;
    
    UPDATE public.equipment SET status = 'ready', updated_at = NOW()
    WHERE id = ANY(v_equipment_ids);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.cancel_special_loan(
    p_loan_id UUID
) RETURNS VOID AS $$
DECLARE
    v_equipment_ids UUID[];
BEGIN
    SELECT equipment_ids INTO v_equipment_ids
    FROM public.special_loan_requests 
    WHERE id = p_loan_id AND status = 'active'
    FOR UPDATE;
    
    IF v_equipment_ids IS NULL THEN
        RAISE EXCEPTION 'Special loan not found or already cancelled';
    END IF;
    
    UPDATE public.special_loan_requests SET 
        status = 'cancelled', updated_at = NOW()
    WHERE id = p_loan_id;
    
    UPDATE public.equipment SET status = 'ready', updated_at = NOW()
    WHERE id = ANY(v_equipment_ids);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
