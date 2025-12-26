-- Migration: Fix loanRequests foreign key to reference profiles instead of auth.users
-- This enables PostgREST to detect the relationship and allow joining with profiles table.

DO $$ BEGIN
    -- 1. Try to drop the existing constraint if it exists (standard naming)
    -- Postgres usually names it "loanRequests_user_id_fkey"
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'loanRequests_user_id_fkey' 
        AND table_name = 'loanRequests'
    ) THEN
        ALTER TABLE "loanRequests" DROP CONSTRAINT "loanRequests_user_id_fkey";
    END IF;

    -- 2. Add the new constraint referencing profiles
    -- using the same standard name or a new clear name
    ALTER TABLE "loanRequests"
    ADD CONSTRAINT "loanRequests_user_id_fkey_profiles"
    FOREIGN KEY (user_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error executing migration: %', SQLERRM;
END $$;
