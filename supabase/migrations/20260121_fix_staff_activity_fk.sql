-- Migration: Fix Staff Activity Log Foreign Keys
-- Date: 2026-01-21
-- Description: Change foreign keys to reference public.profiles instead of auth.users
-- This allows PostgREST embedding to valid targets

-- 1. Drop existing FK constraints (referencing auth.users)
ALTER TABLE staff_activity_log
    DROP CONSTRAINT IF EXISTS staff_activity_log_staff_id_fkey,
    DROP CONSTRAINT IF EXISTS staff_activity_log_target_user_id_fkey;

-- 2. Add new FK constraints (referencing public.profiles)
-- Note: public.profiles.id is 1:1 with auth.users.id
ALTER TABLE staff_activity_log
    ADD CONSTRAINT staff_activity_log_staff_id_fkey 
    FOREIGN KEY (staff_id) 
    REFERENCES public.profiles(id);

ALTER TABLE staff_activity_log
    ADD CONSTRAINT staff_activity_log_target_user_id_fkey 
    FOREIGN KEY (target_user_id) 
    REFERENCES public.profiles(id);
