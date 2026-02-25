-- Fix equipment status enum and sync existing active special loans

-- PART 1: Run this first and COMMIT
-- Add missing values to the equipment_status enum
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        JOIN pg_type ON pg_type.oid = pg_enum.enumtypid 
        WHERE typname = 'equipment_status' AND enumlabel = 'borrowed'
    ) THEN
        ALTER TYPE equipment_status ADD VALUE 'borrowed';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        JOIN pg_type ON pg_type.oid = pg_enum.enumtypid 
        WHERE typname = 'equipment_status' AND enumlabel = 'ready'
    ) THEN
        ALTER TYPE equipment_status ADD VALUE 'ready';
    END IF;
END $$;

-- PART 2: Run this AFTER Part 1 is successfully committed
-- Update equipment status for existing active special loans
UPDATE equipment
SET status = 'borrowed'::equipment_status
WHERE id IN (
    SELECT DISTINCT unnest(equipment_ids)
    FROM special_loan_requests
    WHERE status::text = 'active'
)
AND status::text = 'active';


