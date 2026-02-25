-- ============================================
-- Migration: Fix loanRequests CHECK constraint + Equipment RLS
-- Date: 2026-02-25
-- Description:
--   1. Fix loanRequests status CHECK constraint (add 'returned')
--   2. Ensure equipment SELECT policy exists for approved users
--   3. Ensure staff can SELECT/UPDATE equipment (needed for return flow)
--   4. Add composite index on profiles(id, status) for RLS performance
-- ============================================

-- ============================================================
-- FIX 1: loanRequests status CHECK constraint
-- The old DB may have a CHECK without 'returned', causing 400
-- on PATCH when staff/admin try to update status to 'returned'.
-- ============================================================

-- Drop all possible old CHECK constraint names
ALTER TABLE public."loanRequests"
    DROP CONSTRAINT IF EXISTS "loanRequests_status_check";

ALTER TABLE public."loanRequests"
    DROP CONSTRAINT IF EXISTS "loan_requests_status_check";

-- Re-create with all valid statuses including 'returned'
ALTER TABLE public."loanRequests"
    ADD CONSTRAINT "loanRequests_status_check"
    CHECK (status IN ('pending', 'approved', 'rejected', 'returned'));

-- ============================================================
-- FIX 2: Ensure equipment SELECT policy covers all approved users
-- (Handles case where migration 00004 policy may not have applied)
-- ============================================================

-- Drop all known variants (old and new names)
DROP POLICY IF EXISTS "Approved users view equipment"  ON public.equipment;
DROP POLICY IF EXISTS "Admins manage equipment"        ON public.equipment;
DROP POLICY IF EXISTS "equipment_select_approved"      ON public.equipment;
DROP POLICY IF EXISTS "equipment_all_admin"            ON public.equipment;
DROP POLICY IF EXISTS "equipment_all_staff"            ON public.equipment;

-- All approved users (user/staff/admin) can SELECT equipment
CREATE POLICY "equipment_select_approved" ON public.equipment FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND status = 'approved'
        )
    );

-- Staff and admin can manage equipment (needed for status update on return)
CREATE POLICY "equipment_all_staff" ON public.equipment FOR ALL
    USING (get_my_role() IN ('staff', 'admin'));

-- ============================================================
-- FIX 3: Ensure loanRequests staff policy exists
-- (Handles case where 00004 migration policy was not applied)
-- ============================================================

DROP POLICY IF EXISTS "Staff manage all loans"  ON public."loanRequests";
DROP POLICY IF EXISTS "loanrequests_all_staff"  ON public."loanRequests";

CREATE POLICY "loanrequests_all_staff" ON public."loanRequests" FOR ALL
    USING (get_my_role() IN ('staff', 'admin'));

-- ============================================================
-- FIX 4: Performance index for equipment SELECT RLS sub-select
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_profiles_id_status
    ON public.profiles(id, status);
