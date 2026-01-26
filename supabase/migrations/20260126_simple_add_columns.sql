-- Simple script to ensure columns exist without complex logic checks
-- Run this to force-add the columns if they are missing

ALTER TABLE "loanRequests" ADD COLUMN IF NOT EXISTS "return_time" time without time zone;
ALTER TABLE "loanRequests" ADD COLUMN IF NOT EXISTS "returned_at" timestamp with time zone;
ALTER TABLE "loanRequests" ADD COLUMN IF NOT EXISTS "return_condition" text;
ALTER TABLE "loanRequests" ADD COLUMN IF NOT EXISTS "return_notes" text;

-- Double check status constraint
ALTER TABLE "loanRequests" DROP CONSTRAINT IF EXISTS "loanRequests_status_check";
ALTER TABLE "loanRequests" ADD CONSTRAINT "loanRequests_status_check" 
    CHECK (status IN ('pending', 'approved', 'rejected', 'returned'));
