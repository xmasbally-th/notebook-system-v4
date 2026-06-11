-- ============================================
-- Migration: Fix missing columns + CHECK constraint + RLS
-- Date: 2026-02-25 (v2 - adds missing columns)
-- ============================================

-- ============================================================
-- FIX 1: Add missing columns to loanRequests (IF NOT EXISTS)
-- The old schema may not have these columns since
-- CREATE TABLE IF NOT EXISTS skips column additions.
-- ============================================================

ALTER TABLE public."loanRequests"
    ADD COLUMN IF NOT EXISTS returned_at TIMESTAMPTZ;

ALTER TABLE public."loanRequests"
    ADD COLUMN IF NOT EXISTS return_condition TEXT;

ALTER TABLE public."loanRequests"
    ADD COLUMN IF NOT EXISTS return_notes TEXT;

-- ============================================================
-- FIX 2: Fix status CHECK constraint (robust — drops any name)
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

ALTER TABLE public."loanRequests"
    ADD CONSTRAINT "loanRequests_status_check"
    CHECK (status IN ('pending', 'approved', 'rejected', 'returned'));

-- ============================================================
-- FIX 3: Equipment RLS policies
-- ============================================================

DROP POLICY IF EXISTS "Approved users view equipment"  ON public.equipment;
DROP POLICY IF EXISTS "Admins manage equipment"        ON public.equipment;
DROP POLICY IF EXISTS "equipment_select_approved"      ON public.equipment;
DROP POLICY IF EXISTS "equipment_all_admin"            ON public.equipment;
DROP POLICY IF EXISTS "equipment_all_staff"            ON public.equipment;

CREATE POLICY "equipment_select_approved" ON public.equipment FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND status = 'approved'
        )
    );

CREATE POLICY "equipment_all_staff" ON public.equipment FOR ALL
    USING (get_my_role() IN ('staff', 'admin'));

-- ============================================================
-- FIX 4: loanRequests staff/admin policy
-- ============================================================

DROP POLICY IF EXISTS "Staff manage all loans"  ON public."loanRequests";
DROP POLICY IF EXISTS "loanrequests_all_staff"  ON public."loanRequests";

CREATE POLICY "loanrequests_all_staff" ON public."loanRequests" FOR ALL
    USING (get_my_role() IN ('staff', 'admin'));

-- ============================================================
-- FIX 5: Performance index
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_profiles_id_status
    ON public.profiles(id, status);
