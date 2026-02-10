-- Migration: Fix Reservation Cancellation Policy
-- Date: 2026-02-10
-- Description: Allow users to cancel their own pending/approved reservations by fixing the RLS policy.

-- Drop the old restricted policy
DROP POLICY IF EXISTS "Users can cancel own reservations" ON reservations;

-- Create new policy with correct CHECK clause
-- The USING clause checks the OLD row (must be pending/approved)
-- The WITH CHECK clause checks the NEW row (must be cancelled)
CREATE POLICY "Users can cancel own reservations" ON reservations 
FOR UPDATE USING (
    auth.uid() = user_id 
    AND status IN ('pending', 'approved')
) WITH CHECK (
    auth.uid() = user_id 
    AND status = 'cancelled'
);
