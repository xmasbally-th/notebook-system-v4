-- Add rejection_reason and last_reminder_at to loanRequests table if they do not exist
ALTER TABLE public."loanRequests" ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE public."loanRequests" ADD COLUMN IF NOT EXISTS last_reminder_at TIMESTAMPTZ;

-- Add foreign key constraint to profiles table if not exists to allow PostgREST relations
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints tc 
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND tc.table_name = 'loanRequests'
          AND kcu.column_name = 'user_id'
          AND tc.constraint_name = 'fk_loanrequests_profiles'
    ) THEN
        ALTER TABLE public."loanRequests" 
        ADD CONSTRAINT fk_loanrequests_profiles 
        FOREIGN KEY (user_id) REFERENCES public.profiles(id) 
        ON DELETE SET NULL;
    END IF;
END $$;

-- Reload schema cache to ensure PostgREST picks up changes
NOTIFY pgrst, 'reload schema';
