-- Update check constraint on loanRequests status to ensure 'returned' is allowed

DO $$
BEGIN
    -- Try to drop the constraint if it exists (using standard naming convention)
    ALTER TABLE "public"."loanRequests" DROP CONSTRAINT IF EXISTS "loanRequests_status_check";
    
    -- Re-add the constraint with 'returned' included
    ALTER TABLE "public"."loanRequests" ADD CONSTRAINT "loanRequests_status_check" 
    CHECK (status IN ('pending', 'approved', 'rejected', 'returned'));
    
EXCEPTION
    WHEN undefined_object THEN
        -- If constraint name is different, we might need to find it dynamically, 
        -- but for now we assume standard naming or just add if missing.
        -- This block captures cases where table might not exist etc.
        NULL;
END $$;
