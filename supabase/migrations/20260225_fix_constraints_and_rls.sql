-- ============================================
-- Migration: Fix loanRequests CHECK constraint + Equipment RLS
-- Date: 2026-02-25
-- Description:
--   1. Fix loanRequests status CHECK constraint (add 'returned')
--      Uses system catalog to drop constraint by ANY name (robust)
--   2. Ensure equipment SELECT policy exists for approved users
--   3. Ensure staff/admin can UPDATE equipment (needed for return flow)
--   4. Add composite index on profiles(id, status) for RLS performance
-- ============================================

-- ============================================================
-- FIX 1: loanRequests status CHECK constraint
-- Drop ALL CHECK constraints on "loanRequests" that reference
-- the status column — regardless of their name.
-- (Old DB may have system-generated or differently-named constraints)
-- ============================================================

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = '"loanRequests"'::regclass
          AND contype = 'c'
          AND pg_get_constraintdef(oid) ILIKE '%status%'
    LOOP
        EXECUTE format('ALTER TABLE public."loanRequests" DROP CONSTRAINT IF EXISTS %I', r.conname);
        RAISE NOTICE 'Dropped constraint: %', r.conname;
    END LOOP;
END;
$$;

-- Add the correct CHECK constraint with all valid statuses
ALTER TABLE public."loanRequests"
    ADD CONSTRAINT "loanRequests_status_check"
    CHECK (status IN ('pending', 'approved', 'rejected', 'returned'));

-- ============================================================
-- FIX 2: Equipment RLS policies
-- Ensure correct policies exist for all roles
-- ============================================================

DROP POLICY IF EXISTS "Approved users view equipment"  ON public.equipment;
DROP POLICY IF EXISTS "Admins manage equipment"        ON public.equipment;
DROP POLICY IF EXISTS "equipment_select_approved"      ON public.equipment;
DROP POLICY IF EXISTS "equipment_all_admin"            ON public.equipment;
DROP POLICY IF EXISTS "equipment_all_staff"            ON public.equipment;

-- All approved users can SELECT equipment
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
-- FIX 3: loanRequests staff/admin policy
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
