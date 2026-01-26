-- Add returned_at column to loanRequests table
ALTER TABLE "public"."loanRequests" ADD COLUMN "returned_at" timestamp with time zone;

-- Comment on column
COMMENT ON COLUMN "public"."loanRequests"."returned_at" IS 'Timestamp when the equipment was actually returned';
