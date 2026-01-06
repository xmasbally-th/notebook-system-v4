-- Migration: Remove reason column from loanRequests table
-- Date: 2026-01-06
-- Description: Remove the reason field as it's no longer needed in the loan request form

-- Drop the reason column if it exists
ALTER TABLE "public"."loanRequests" DROP COLUMN IF EXISTS "reason";
