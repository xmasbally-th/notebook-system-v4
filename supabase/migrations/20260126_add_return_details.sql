-- Add return details columns to loanRequests table if they don't exist

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loanRequests' AND column_name = 'returned_at') THEN
        ALTER TABLE "public"."loanRequests" ADD COLUMN "returned_at" timestamp with time zone;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loanRequests' AND column_name = 'return_condition') THEN
        ALTER TABLE "public"."loanRequests" ADD COLUMN "return_condition" text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loanRequests' AND column_name = 'return_notes') THEN
        ALTER TABLE "public"."loanRequests" ADD COLUMN "return_notes" text;
    END IF;
END $$;

-- Add comments
COMMENT ON COLUMN "public"."loanRequests"."returned_at" IS 'Timestamp when the equipment was actually returned';
COMMENT ON COLUMN "public"."loanRequests"."return_condition" IS 'Condition of the equipment upon return (good, damaged, missing_parts)';
COMMENT ON COLUMN "public"."loanRequests"."return_notes" IS 'Additional notes about the return, especially for damaged items';
