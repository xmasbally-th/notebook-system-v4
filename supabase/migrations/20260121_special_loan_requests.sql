-- Migration: Special Loan Requests System
-- Date: 2026-01-21
-- Description: Equipment bulk loan system for lecturers (admin-created)

-- ============================================
-- 1. SPECIAL LOAN REQUESTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS special_loan_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Borrower (lecturer)
    borrower_id UUID REFERENCES auth.users(id) NOT NULL,
    borrower_name TEXT NOT NULL,
    borrower_phone TEXT,
    
    -- Equipment
    equipment_type_id UUID REFERENCES equipment_types(id),
    equipment_type_name TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    equipment_ids UUID[],         -- References to equipment.id for conflict checking
    equipment_numbers TEXT[],     -- Equipment numbers for display/print
    
    -- Period
    loan_date DATE NOT NULL,
    return_date DATE NOT NULL,
    
    -- Details
    purpose TEXT NOT NULL,
    notes TEXT,
    
    -- Status: active (ยืมอยู่), returned (คืนแล้ว), cancelled (ยกเลิก)
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'returned', 'cancelled')),
    
    -- Admin tracking
    created_by UUID REFERENCES auth.users(id) NOT NULL,
    returned_at TIMESTAMPTZ,
    returned_by UUID REFERENCES auth.users(id),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraint: return_date >= loan_date
    CONSTRAINT valid_date_range CHECK (return_date >= loan_date)
);

-- ============================================
-- 2. ENABLE RLS
-- ============================================
ALTER TABLE special_loan_requests ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. RLS POLICIES
-- ============================================

-- Admin can do everything
DROP POLICY IF EXISTS "Admin can manage special loans" ON special_loan_requests;
CREATE POLICY "Admin can manage special loans" ON special_loan_requests
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'admin' 
        AND status = 'approved'
    )
);

-- All approved users can view active special loans (for dashboard notice)
DROP POLICY IF EXISTS "Users can view active special loans" ON special_loan_requests;
CREATE POLICY "Users can view active special loans" ON special_loan_requests
FOR SELECT USING (
    status = 'active' AND
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND status = 'approved'
    )
);

-- ============================================
-- 4. UPDATE CONFLICT CHECK FUNCTION
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
    
    IF conflict_count > 0 THEN
        RETURN TRUE;
    END IF;
    
    -- Check special loan requests (NEW)
    SELECT COUNT(*) INTO conflict_count
    FROM special_loan_requests slr
    WHERE target_equipment_id = ANY(slr.equipment_ids)
      AND slr.status = 'active'
      AND slr.loan_date <= new_end_date::date
      AND slr.return_date >= new_start_date::date;
      
    RETURN conflict_count > 0;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_special_loans_borrower_id ON special_loan_requests(borrower_id);
CREATE INDEX IF NOT EXISTS idx_special_loans_status ON special_loan_requests(status);
CREATE INDEX IF NOT EXISTS idx_special_loans_loan_date ON special_loan_requests(loan_date);
CREATE INDEX IF NOT EXISTS idx_special_loans_return_date ON special_loan_requests(return_date);
CREATE INDEX IF NOT EXISTS idx_special_loans_equipment_ids ON special_loan_requests USING GIN(equipment_ids);

-- ============================================
-- 6. COMMENT
-- ============================================
COMMENT ON TABLE special_loan_requests IS 'Special bulk loan requests for lecturers (e.g., 23 notebooks for exam)';
