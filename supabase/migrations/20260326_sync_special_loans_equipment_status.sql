-- Sync equipment status for active special loans
-- Fixes items currently in active special loans that were left as 'ready' (or 'active')
BEGIN;

-- Update equipment status for existing active special loans
UPDATE equipment
SET status = 'borrowed'::equipment_status
WHERE id IN (
    SELECT DISTINCT unnest(equipment_ids)
    FROM special_loan_requests
    WHERE status = 'active'
);

-- Clean up any lingering 'active' statuses from previous bugs
-- (Note: If 'active' is not in equipment_status this cast might fail, but if it is in the table it will fix it)
DO $$
BEGIN
    UPDATE equipment
    SET status = 'ready'::equipment_status
    WHERE status::text = 'active';
EXCEPTION WHEN OTHERS THEN
    -- Ignore if there's no such status or cast fails
END $$;

COMMIT;
