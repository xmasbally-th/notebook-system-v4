-- Migration: Add new system config fields for enhanced settings
-- 1. Lunch break times
-- 2. Closed dates (holidays, special days)
-- 3. Loan limits by user type

ALTER TABLE public.system_config
  ADD COLUMN IF NOT EXISTS break_start_time TIME DEFAULT '12:00:00',
  ADD COLUMN IF NOT EXISTS break_end_time TIME DEFAULT '13:00:00',
  ADD COLUMN IF NOT EXISTS closed_dates JSONB DEFAULT '[]'::JSONB,
  ADD COLUMN IF NOT EXISTS loan_limits_by_type JSONB DEFAULT '{
    "student": {"max_days": 3, "max_items": 1},
    "lecturer": {"max_days": 7, "max_items": 3},
    "staff": {"max_days": 5, "max_items": 2}
  }'::JSONB;

-- Add comment for documentation
COMMENT ON COLUMN public.system_config.break_start_time IS 'Lunch break start time';
COMMENT ON COLUMN public.system_config.break_end_time IS 'Lunch break end time';
COMMENT ON COLUMN public.system_config.closed_dates IS 'Array of closed dates in YYYY-MM-DD format';
COMMENT ON COLUMN public.system_config.loan_limits_by_type IS 'JSON object with loan limits per user type (student, lecturer, staff)';
