-- Migration: Remove redundant columns from database
-- Date: 2026-01-06
-- Description: Cleanup redundant columns that are no longer used or have been replaced

-- ============================================
-- 1. Remove 'reason' from loanRequests
-- (Already removed from the form, not needed)
-- ============================================
ALTER TABLE "public"."loanRequests" DROP COLUMN IF EXISTS "reason";

-- ============================================
-- 2. Remove 'category' from equipment
-- (Replaced by equipment_type_id foreign key)
-- ============================================
ALTER TABLE "public"."equipment" DROP COLUMN IF EXISTS "category";

-- ============================================
-- 3. Remove 'department' (JSON) from profiles
-- (Replaced by department_id foreign key)
-- ============================================
ALTER TABLE "public"."profiles" DROP COLUMN IF EXISTS "department";

-- ============================================
-- Summary of changes:
-- - loanRequests.reason: Removed (form no longer uses it)
-- - equipment.category: Removed (use equipment_type_id instead)
-- - profiles.department: Removed (use department_id instead)
-- ============================================
