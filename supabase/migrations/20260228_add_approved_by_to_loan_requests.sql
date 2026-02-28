-- Migration: Add approved_by column to loanRequests
-- Date: 2026-02-28
-- Description: loanRequests table was missing the approved_by column that
--              approveLoanRequests and rejectLoanRequests actions require.

ALTER TABLE "loanRequests"
    ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);
