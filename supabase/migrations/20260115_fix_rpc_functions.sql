-- ============================================
-- Fix RPC Functions Permissions
-- Created: 2026-01-15
-- Purpose: Add SECURITY DEFINER and GRANT EXECUTE to RPC functions
-- ============================================

-- 1. Recreate check_combined_reservation_conflict with SECURITY DEFINER
CREATE OR REPLACE FUNCTION check_combined_reservation_conflict(
    target_equipment_id UUID,
    new_start_date TIMESTAMPTZ,
    new_end_date TIMESTAMPTZ,
    exclude_reservation_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    conflict_count INTEGER;
BEGIN
    -- Check reservations
    SELECT COUNT(*) INTO conflict_count
    FROM reservations 
    WHERE equipment_id = target_equipment_id
      AND status IN ('pending', 'approved', 'ready')
      AND (exclude_reservation_id IS NULL OR id != exclude_reservation_id)
      AND start_date <= new_end_date
      AND end_date >= new_start_date;
      
    IF conflict_count > 0 THEN
        RETURN TRUE;
    END IF;
    
    -- Check loan requests
    SELECT COUNT(*) INTO conflict_count
    FROM "loanRequests" 
    WHERE equipment_id = target_equipment_id
      AND status IN ('pending', 'approved')
      AND start_date <= new_end_date
      AND end_date >= new_start_date;
      
    RETURN conflict_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Recreate check_user_type_conflict with SECURITY DEFINER
CREATE OR REPLACE FUNCTION check_user_type_conflict(
    check_user_id UUID,
    check_equipment_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    target_type_id UUID;
    conflict_count INTEGER;
BEGIN
    -- Get equipment type
    SELECT type_id INTO target_type_id 
    FROM equipment 
    WHERE id = check_equipment_id;
    
    IF target_type_id IS NULL THEN
        RETURN FALSE;  -- No type assigned, allow
    END IF;
    
    -- Check existing reservations of same type
    SELECT COUNT(*) INTO conflict_count
    FROM reservations r
    JOIN equipment e ON r.equipment_id = e.id
    WHERE r.user_id = check_user_id
      AND r.status IN ('pending', 'approved', 'ready')
      AND e.type_id = target_type_id;
      
    IF conflict_count > 0 THEN
        RETURN TRUE;
    END IF;
    
    -- Check existing loans of same type
    SELECT COUNT(*) INTO conflict_count
    FROM "loanRequests" lr
    JOIN equipment e ON lr.equipment_id = e.id
    WHERE lr.user_id = check_user_id
      AND lr.status IN ('pending', 'approved')
      AND e.type_id = target_type_id;
      
    RETURN conflict_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION check_combined_reservation_conflict(UUID, TIMESTAMPTZ, TIMESTAMPTZ, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_user_type_conflict(UUID, UUID) TO authenticated;
