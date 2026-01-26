-- Add return_time column to loan_requests table
ALTER TABLE "public"."loanRequests" ADD COLUMN "return_time" time without time zone;

-- Comment on column
COMMENT ON COLUMN "public"."loanRequests"."return_time" IS 'Time component for return (only used for immediate loans)';
