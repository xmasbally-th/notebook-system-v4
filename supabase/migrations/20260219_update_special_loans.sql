-- Migration: Update Special Loans for External Borrowers
-- Date: 2026-02-19
-- Description: Allow special loans for external departments/organizations by making borrower_id nullable and adding external borrower fields.

-- 1. Alter special_loan_requests table
ALTER TABLE special_loan_requests
    ALTER COLUMN borrower_id DROP NOT NULL;

ALTER TABLE special_loan_requests
    ADD COLUMN external_borrower_name TEXT,
    ADD COLUMN external_borrower_org TEXT;

-- 2. Add check constraint to ensure either borrower_id or external_borrower_name is present
ALTER TABLE special_loan_requests
    ADD CONSTRAINT check_borrower_presence 
    CHECK (
        (borrower_id IS NOT NULL) OR 
        (external_borrower_name IS NOT NULL AND external_borrower_name <> '')
    );

-- 3. Comment
COMMENT ON COLUMN special_loan_requests.external_borrower_name IS 'Name of external borrower (if not a registered user)';
COMMENT ON COLUMN special_loan_requests.external_borrower_org IS 'Organization/Department of external borrower';
