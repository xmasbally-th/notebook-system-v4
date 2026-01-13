-- Migration: Create Reservations System
-- Date: 2026-01-13
-- Description: Equipment reservation system with status workflow and staff activity logging

-- ============================================
-- 1. RESERVATION STATUS ENUM
-- ============================================
DO $$ BEGIN
    CREATE TYPE reservation_status AS ENUM (
        'pending',    -- รออนุมัติ
        'approved',   -- อนุมัติแล้ว รอวันรับ
        'ready',      -- ถึงวันรับ พร้อมรับอุปกรณ์
        'completed',  -- แปลงเป็น Loan แล้ว
        'rejected',   -- ปฏิเสธ
        'cancelled',  -- ผู้ใช้ยกเลิก
        'expired'     -- ไม่มารับภายใน 5 นาที
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- 2. RESERVATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    equipment_id UUID REFERENCES equipment(id) NOT NULL,
    
    -- Reservation period
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    
    -- Status tracking
    status reservation_status DEFAULT 'pending',
    rejection_reason TEXT,
    
    -- Linked loan (after conversion)
    loan_id UUID REFERENCES "loanRequests"(id),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES auth.users(id),
    ready_at TIMESTAMPTZ,       -- When marked as ready (for 5-min countdown)
    ready_by UUID REFERENCES auth.users(id),
    completed_at TIMESTAMPTZ,
    completed_by UUID REFERENCES auth.users(id)
);

-- ============================================
-- 3. STAFF ACTIVITY LOG TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS staff_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID REFERENCES auth.users(id) NOT NULL,
    staff_role TEXT NOT NULL,         -- 'staff' or 'admin'
    action_type TEXT NOT NULL,        -- 'approve_loan', 'reject_reservation', etc.
    target_type TEXT NOT NULL,        -- 'loan' or 'reservation'
    target_id UUID NOT NULL,          -- loanRequest.id or reservation.id
    target_user_id UUID REFERENCES auth.users(id), -- User who made the request
    is_self_action BOOLEAN DEFAULT FALSE,  -- Staff/Admin did this for themselves
    details JSONB DEFAULT '{}',       -- { reason, old_status, new_status, etc. }
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. ADD RESERVATION SETTINGS TO SYSTEM_CONFIG
-- ============================================
ALTER TABLE system_config 
ADD COLUMN IF NOT EXISTS max_advance_booking_days INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS reservation_expiry_minutes INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS max_reservations_per_user INTEGER DEFAULT 3;

-- ============================================
-- 5. ENABLE RLS
-- ============================================
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_activity_log ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. RLS POLICIES FOR RESERVATIONS
-- ============================================

-- Users can view their own reservations
DROP POLICY IF EXISTS "Users can view own reservations" ON reservations;
CREATE POLICY "Users can view own reservations" ON reservations 
FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own reservations
DROP POLICY IF EXISTS "Users can create reservations" ON reservations;
CREATE POLICY "Users can create reservations" ON reservations 
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can cancel their own pending/approved reservations
DROP POLICY IF EXISTS "Users can cancel own reservations" ON reservations;
CREATE POLICY "Users can cancel own reservations" ON reservations 
FOR UPDATE USING (
    auth.uid() = user_id 
    AND status IN ('pending', 'approved')
);

-- Staff can view all reservations
DROP POLICY IF EXISTS "Staff can view all reservations" ON reservations;
CREATE POLICY "Staff can view all reservations" ON reservations 
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('staff', 'admin') 
        AND status = 'approved'
    )
);

-- Staff can manage all reservations
DROP POLICY IF EXISTS "Staff can manage reservations" ON reservations;
CREATE POLICY "Staff can manage reservations" ON reservations 
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('staff', 'admin') 
        AND status = 'approved'
    )
);

-- ============================================
-- 7. RLS POLICIES FOR STAFF ACTIVITY LOG
-- ============================================

-- Only Admin can view all logs
DROP POLICY IF EXISTS "Admin can view all activity logs" ON staff_activity_log;
CREATE POLICY "Admin can view all activity logs" ON staff_activity_log 
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'admin' 
        AND status = 'approved'
    )
);

-- Staff can view their own logs
DROP POLICY IF EXISTS "Staff can view own logs" ON staff_activity_log;
CREATE POLICY "Staff can view own logs" ON staff_activity_log 
FOR SELECT USING (auth.uid() = staff_id);

-- Staff and Admin can insert logs
DROP POLICY IF EXISTS "Staff can insert logs" ON staff_activity_log;
CREATE POLICY "Staff can insert logs" ON staff_activity_log 
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('staff', 'admin') 
        AND status = 'approved'
    )
);

-- ============================================
-- 8. CONFLICT CHECK FUNCTION (Reservations + Loans)
-- ============================================
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
$$ LANGUAGE plpgsql;

-- ============================================
-- 9. TYPE CONFLICT CHECK FUNCTION
-- ============================================
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
$$ LANGUAGE plpgsql;

-- ============================================
-- 10. INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_equipment_id ON reservations(equipment_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_start_date ON reservations(start_date);
CREATE INDEX IF NOT EXISTS idx_staff_activity_staff_id ON staff_activity_log(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_activity_created_at ON staff_activity_log(created_at);
