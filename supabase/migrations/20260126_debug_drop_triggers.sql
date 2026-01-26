-- Debugging: Drop potential conflicting triggers temporarily to isolate the 400 Bad Request cause

-- 1. Drop check_loan_overlap trigger (from prevent_duplicate_booking.sql)
DROP TRIGGER IF EXISTS "check_loan_overlap" ON "loanRequests";

-- 2. Drop any other potential triggers on loanRequests
DROP TRIGGER IF EXISTS "check_special_loan_conflict_trigger" ON "loanRequests";

-- 3. Also drop the function if it's being called by an unknown trigger (optional, effectively disables the check)
-- DROP FUNCTION IF EXISTS prevent_overlapping_loan(); -- Keep function for now, just drop trigger.

-- 4. Re-verify the status check constraint (just in case)
ALTER TABLE "public"."loanRequests" DROP CONSTRAINT IF EXISTS "loanRequests_status_check";
ALTER TABLE "public"."loanRequests" ADD CONSTRAINT "loanRequests_status_check" 
    CHECK (status IN ('pending', 'approved', 'rejected', 'returned'));
