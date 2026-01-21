-- Migration: Fix Special Loan Requests Foreign Keys
-- Date: 2026-01-21
-- Description: Change foreign keys to reference public.profiles instead of auth.users to allow PostgREST embedding

-- 1. Drop existing FK constraints (referencing auth.users)
ALTER TABLE special_loan_requests
    DROP CONSTRAINT IF EXISTS special_loan_requests_borrower_id_fkey,
    DROP CONSTRAINT IF EXISTS special_loan_requests_created_by_fkey,
    DROP CONSTRAINT IF EXISTS special_loan_requests_returned_by_fkey;

-- 2. Add new FK constraints (referencing public.profiles)
-- Note: public.profiles.id is 1:1 with auth.users.id
ALTER TABLE special_loan_requests
    ADD CONSTRAINT special_loan_requests_borrower_id_fkey 
    FOREIGN KEY (borrower_id) 
    REFERENCES public.profiles(id);

ALTER TABLE special_loan_requests
    ADD CONSTRAINT special_loan_requests_created_by_fkey 
    FOREIGN KEY (created_by) 
    REFERENCES public.profiles(id);

ALTER TABLE special_loan_requests
    ADD CONSTRAINT special_loan_requests_returned_by_fkey 
    FOREIGN KEY (returned_by) 
    REFERENCES public.profiles(id);
