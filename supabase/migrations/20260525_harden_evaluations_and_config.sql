-- Migration: Harden Evaluations RLS and Expose Safe Public Config RPCs
-- Date: 2026-05-25
-- Description: 
--   1. Harden public.evaluations INSERT policy to verify the user actually owns the loan.
--   2. Expose a secure parameter function get_evaluation_cutoff_date() for non-admin users.
--   3. Expose a secure parameter function get_public_system_config() to allow users to read safe configuration values.

-- 1. Harden Evaluations RLS Policy
DROP POLICY IF EXISTS "evaluations_insert_own" ON public.evaluations;

CREATE POLICY "evaluations_insert_own" ON public.evaluations FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND 
  EXISTS (
    SELECT 1 FROM public."loanRequests" 
    WHERE id = loan_id AND user_id = auth.uid()
  )
);

-- 2. Expose Secure RPC for Cutoff Date
CREATE OR REPLACE FUNCTION public.get_evaluation_cutoff_date()
RETURNS DATE AS $$
  SELECT evaluation_cutoff_date FROM public.system_config LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_evaluation_cutoff_date() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_evaluation_cutoff_date() TO anon;

-- 3. Expose Secure RPC for Safe Public System Configuration
CREATE OR REPLACE FUNCTION public.get_public_system_config()
RETURNS JSONB AS $$
  SELECT jsonb_build_object(
    'max_advance_booking_days', max_advance_booking_days,
    'reservation_expiry_minutes', reservation_expiry_minutes,
    'max_reservations_per_user', max_reservations_per_user,
    'evaluation_cutoff_date', evaluation_cutoff_date,
    'welpru_notifications_enabled', welpru_notifications_enabled,
    'loan_limits_by_type', loan_limits_by_type,
    'opening_time', opening_time,
    'closing_time', closing_time,
    'break_start_time', break_start_time,
    'break_end_time', break_end_time,
    'closed_dates', closed_dates
  ) FROM public.system_config LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_public_system_config() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_system_config() TO anon;
