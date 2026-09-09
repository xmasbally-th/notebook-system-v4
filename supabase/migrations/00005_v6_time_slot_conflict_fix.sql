-- Migration: 00005_v6_time_slot_conflict_fix.sql
-- Description: Upgrade conflict checking to timestamp/time-slot precision
-- Allows same-day borrowing when return time is before existing reservation pickup time.

CREATE OR REPLACE FUNCTION public.check_combined_reservation_conflict(
    target_equipment_id uuid,
    new_start_date timestamp with time zone,
    new_end_date timestamp with time zone,
    exclude_reservation_id uuid DEFAULT NULL::uuid,
    exclude_loan_id uuid DEFAULT NULL::uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $
DECLARE
    conflict_count INTEGER;
BEGIN
    -- 1. Check reservations (time-slot overlap: r_start < new_end_date AND r_end > new_start_date)
    SELECT COUNT(*) INTO conflict_count
    FROM public.reservations r
    WHERE r.equipment_id = target_equipment_id
      AND r.status IN ('pending', 'approved', 'ready')
      AND (exclude_reservation_id IS NULL OR r.id != exclude_reservation_id)
      AND (
          ((r.start_date AT TIME ZONE 'Asia/Bangkok')::date + COALESCE(r.pickup_time, '08:00:00'::time)) AT TIME ZONE 'Asia/Bangkok' < new_end_date
          AND
          ((r.end_date AT TIME ZONE 'Asia/Bangkok')::date + COALESCE(r.return_time, '17:00:00'::time)) AT TIME ZONE 'Asia/Bangkok' > new_start_date
      );
      
    IF conflict_count > 0 THEN RETURN TRUE; END IF;
    
    -- 2. Check loan requests (time-slot overlap: l_start < new_end_date AND l_end > new_start_date)
    SELECT COUNT(*) INTO conflict_count
    FROM public." loanRequests\ l
 WHERE l.equipment_id = target_equipment_id
 AND l.status IN ('pending', 'approved')
 AND (exclude_loan_id IS NULL OR l.id != exclude_loan_id)
 AND (
 l.start_date < new_end_date
 AND
 ((l.end_date AT TIME ZONE 'Asia/Bangkok')::date + COALESCE(l.return_time, '17:00:00'::time)) AT TIME ZONE 'Asia/Bangkok' > new_start_date
 );
 
 IF conflict_count > 0 THEN RETURN TRUE; END IF;
 
 -- 3. Check special loan requests (day-level with 08:00 - 17:00 window)
 SELECT COUNT(*) INTO conflict_count
 FROM public.special_loan_requests slr
 WHERE target_equipment_id = ANY(slr.equipment_ids)
 AND slr.status = 'active'
 AND (
 (slr.loan_date + '08:00:00'::time) AT TIME ZONE 'Asia/Bangkok' < new_end_date
 AND
 (slr.return_date + '17:00:00'::time) AT TIME ZONE 'Asia/Bangkok' > new_start_date
 );
 
 RETURN conflict_count > 0;
END;
$;
