-- Migration: Fix protect_profile_fields_trigger to reliably allow service_role bypass
-- Date: 2026-06-25
-- Description:
--   The trigger protect_profile_fields_trigger was blocking service_role updates
--   because:
--   1. get_my_role() calls auth.uid() which returns NULL for service_role requests
--   2. NULL IS DISTINCT FROM 'admin' = TRUE → trigger resets status to old value
--   3. The previous bypass check (request.jwt.claim.role) may not be set in all
--      Supabase hosted environments
--
--   Fix: Add `current_user = 'service_role'` as the primary bypass check,
--   which is the most reliable way to detect service_role in PostgreSQL.

CREATE OR REPLACE FUNCTION public.protect_profile_fields_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Primary bypass: check current PostgreSQL role (most reliable)
  -- When Supabase JS uses service_role key, PostgREST executes:
  --   SET LOCAL ROLE service_role
  -- making current_user = 'service_role' inside this transaction.
  IF current_user = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Secondary bypass: JWT claim check (for edge cases / future compatibility)
  IF current_setting('request.jwt.claim.role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Tertiary bypass: direct postgres/supabase_admin access
  IF current_user IN ('postgres', 'supabase_admin') THEN
    RETURN NEW;
  END IF;

  -- If not an admin user, prevent modifying role and status
  IF public.get_my_role() IS DISTINCT FROM 'admin' THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      NEW.role := OLD.role;
    END IF;
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      NEW.status := OLD.status;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
