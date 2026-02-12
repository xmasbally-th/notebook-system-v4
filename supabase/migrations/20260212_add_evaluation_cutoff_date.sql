-- Add evaluation cutoff date to system_config
-- Only loans returned AFTER this date will require mandatory evaluation
ALTER TABLE public.system_config ADD COLUMN IF NOT EXISTS evaluation_cutoff_date date DEFAULT NULL;

-- Set to today's date (adjust as needed)
UPDATE public.system_config SET evaluation_cutoff_date = '2026-02-12' WHERE id = 1;
