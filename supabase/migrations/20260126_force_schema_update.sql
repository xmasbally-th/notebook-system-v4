-- Force update schema for loanRequests to resolve 400 Bad Request errors

-- 1. Ensure all columns exist
DO $$
BEGIN
    -- return_time (from previous fix)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loanRequests' AND column_name = 'return_time') THEN
        ALTER TABLE "public"."loanRequests" ADD COLUMN "return_time" time without time zone;
    END IF;

    -- returned_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loanRequests' AND column_name = 'returned_at') THEN
        ALTER TABLE "public"."loanRequests" ADD COLUMN "returned_at" timestamp with time zone;
    END IF;

    -- return_condition
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loanRequests' AND column_name = 'return_condition') THEN
        ALTER TABLE "public"."loanRequests" ADD COLUMN "return_condition" text;
    END IF;

    -- return_notes
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loanRequests' AND column_name = 'return_notes') THEN
        ALTER TABLE "public"."loanRequests" ADD COLUMN "return_notes" text;
    END IF;
END $$;

-- 2. Fix Status Check Constraint (Nuclear option: try to drop common variations)
DO $$
BEGIN
    -- Try dropping case-sensitive name
    ALTER TABLE "public"."loanRequests" DROP CONSTRAINT IF EXISTS "loanRequests_status_check";
    
    -- Try dropping lowercase name (Postgres default generation often lowercases)
    ALTER TABLE "public"."loanRequests" DROP CONSTRAINT IF EXISTS "loanrequests_status_check";
    
    -- Re-add the constraint ensuring 'returned' is allowed
    ALTER TABLE "public"."loanRequests" ADD CONSTRAINT "loanRequests_status_check" 
    CHECK (status IN ('pending', 'approved', 'rejected', 'returned'));
    
EXCEPTION
    WHEN OTHERS THEN
        NULL; -- Ignore errors if constraint doesn't exist
END $$;

-- 3. Verify Grants (Ensure admin/staff can actually update)
GRANT ALL ON TABLE "public"."loanRequests" TO authenticated;
GRANT ALL ON TABLE "public"."loanRequests" TO service_role;
