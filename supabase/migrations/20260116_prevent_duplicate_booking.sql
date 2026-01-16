-- Migration: Prevent Duplicate/Concurrent Bookings
-- Created: 2026-01-16
-- Description: Database triggers to prevent overlapping reservations and loans

-- ==============================================================
-- 1. Function to check for overlapping reservations
-- ==============================================================
CREATE OR REPLACE FUNCTION prevent_overlapping_reservation()
RETURNS TRIGGER AS $$
BEGIN
    -- Check for overlapping reservations (excluding self and cancelled/rejected/expired/completed)
    IF EXISTS (
        SELECT 1 FROM reservations 
        WHERE equipment_id = NEW.equipment_id
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
        AND status IN ('pending', 'approved', 'ready')
        AND tsrange(NEW.start_date::timestamp, NEW.end_date::timestamp, '[]') && 
            tsrange(start_date::timestamp, end_date::timestamp, '[]')
    ) THEN
        RAISE EXCEPTION 'OVERLAP_RESERVATION: ช่วงเวลาที่เลือกมีการจองอุปกรณ์นี้อยู่แล้ว';
    END IF;
    
    -- Check for overlapping active loans
    IF EXISTS (
        SELECT 1 FROM "loanRequests"
        WHERE equipment_id = NEW.equipment_id
        AND status IN ('pending', 'approved')
        AND tsrange(NEW.start_date::timestamp, NEW.end_date::timestamp, '[]') && 
            tsrange(start_date::timestamp, end_date::timestamp, '[]')
    ) THEN
        RAISE EXCEPTION 'OVERLAP_LOAN: อุปกรณ์นี้อยู่ระหว่างการยืมในช่วงเวลาที่เลือก';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================
-- 2. Function to check for overlapping loans
-- ==============================================================
CREATE OR REPLACE FUNCTION prevent_overlapping_loan()
RETURNS TRIGGER AS $$
BEGIN
    -- Check for overlapping reservations
    IF EXISTS (
        SELECT 1 FROM reservations 
        WHERE equipment_id = NEW.equipment_id
        AND status IN ('pending', 'approved', 'ready')
        AND tsrange(NEW.start_date::timestamp, NEW.end_date::timestamp, '[]') && 
            tsrange(start_date::timestamp, end_date::timestamp, '[]')
    ) THEN
        RAISE EXCEPTION 'OVERLAP_RESERVATION: ช่วงเวลาที่เลือกมีการจองอุปกรณ์นี้อยู่แล้ว';
    END IF;
    
    -- Check for overlapping active loans (excluding self)
    IF EXISTS (
        SELECT 1 FROM "loanRequests"
        WHERE equipment_id = NEW.equipment_id
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
        AND status IN ('pending', 'approved')
        AND tsrange(NEW.start_date::timestamp, NEW.end_date::timestamp, '[]') && 
            tsrange(start_date::timestamp, end_date::timestamp, '[]')
    ) THEN
        RAISE EXCEPTION 'OVERLAP_LOAN: อุปกรณ์นี้อยู่ระหว่างการยืมในช่วงเวลาที่เลือก';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================
-- 3. Drop existing triggers if any
-- ==============================================================
DROP TRIGGER IF EXISTS check_reservation_overlap ON reservations;
DROP TRIGGER IF EXISTS check_loan_overlap ON "loanRequests";

-- ==============================================================
-- 4. Create triggers
-- ==============================================================

-- Trigger for reservations table
CREATE TRIGGER check_reservation_overlap
BEFORE INSERT OR UPDATE ON reservations
FOR EACH ROW 
WHEN (NEW.status IN ('pending', 'approved', 'ready'))
EXECUTE FUNCTION prevent_overlapping_reservation();

-- Trigger for loanRequests table
CREATE TRIGGER check_loan_overlap
BEFORE INSERT OR UPDATE ON "loanRequests"
FOR EACH ROW 
WHEN (NEW.status IN ('pending', 'approved'))
EXECUTE FUNCTION prevent_overlapping_loan();

-- ==============================================================
-- 5. Grant permissions
-- ==============================================================
GRANT EXECUTE ON FUNCTION prevent_overlapping_reservation() TO authenticated;
GRANT EXECUTE ON FUNCTION prevent_overlapping_loan() TO authenticated;
