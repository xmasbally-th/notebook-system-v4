-- Migration: Add staff role to loanRequests RLS policies
-- Issue: Staff members cannot approve/reject loan requests because the RLS policy only allows 'admin' role

-- 1. Drop existing admin-only policy
DROP POLICY IF EXISTS "Admins manage requests" ON "loanRequests";

-- 2. Create new policy that includes both staff and admin roles
CREATE POLICY "Staff and Admins manage requests" ON "loanRequests" 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('staff', 'admin') 
        AND status = 'approved'
    )
);

-- 3. Also ensure staff can SELECT all loan requests (for viewing)
DROP POLICY IF EXISTS "Staff view all requests" ON "loanRequests";
CREATE POLICY "Staff view all requests" ON "loanRequests" 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('staff', 'admin') 
        AND status = 'approved'
    )
);
