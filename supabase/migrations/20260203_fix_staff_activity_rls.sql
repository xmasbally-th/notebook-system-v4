-- Migration: Fix Staff Activity Log RLS Policy
-- Date: 2026-02-03
-- Description: Allow admins to view ALL staff activity logs, not just their own
-- Issue: Admin can only see logs where they are the staff_id, missing all staff logs

-- ============================================
-- Fix RLS Policy for Staff Activity Log
-- ============================================

-- Drop the old admin policy that was too restrictive
DROP POLICY IF EXISTS "Admin can view all activity logs" ON staff_activity_log;

-- Create new policy that allows admin to view ALL logs (regardless of who created them)
-- This enables the admin/staff-activity page to show both admin AND staff activities
CREATE POLICY "Admin can view all activity logs" ON staff_activity_log 
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'admin' 
        AND status = 'approved'
    )
);

-- Keep existing policy for staff to view their own logs
-- (already exists, no change needed)
