-- Migration: Fix Profile Protection Trigger
-- Date: 2026-06-10
-- Description: Allow Service Role Key to bypass the profile protection trigger

CREATE OR REPLACE FUNCTION public.protect_profile_fields_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow service role or postgres admin to bypass
  IF current_setting('request.jwt.claim.role', true) = 'service_role' OR current_user IN ('postgres', 'supabase_admin') THEN
    RETURN NEW;
  END IF;

  -- If not an admin, prevent modifying role and status
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
