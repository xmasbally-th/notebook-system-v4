-- Migration: Performance indexes for loanRequests
-- Date: 2026-02-28
-- Description: Add composite indexes to speed up admin/loans queries.
--              getLoanRequests() filters by status and sorts by created_at DESC.
--              getActiveLoans() filters by status = 'approved'.

-- Composite index for getLoanRequests: ORDER BY created_at DESC (all statuses)
CREATE INDEX IF NOT EXISTS idx_loan_requests_status_created
    ON "loanRequests"(status, created_at DESC);

-- Partial index for getActiveLoans: only approved rows (smaller, faster)
CREATE INDEX IF NOT EXISTS idx_loan_requests_approved
    ON "loanRequests"(end_date ASC)
    WHERE status = 'approved';

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_loan_requests_user_status
    ON "loanRequests"(user_id, status);
