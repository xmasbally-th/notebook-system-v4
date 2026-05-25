-- Migration: Align system_config PK to Integer, consolidate rows, and restrict SELECT to admins only.
-- Date: 2026-05-25

-- 1. Safely handle PK alignment from UUID to Integer
DO $$
DECLARE
    col_type text;
BEGIN
    SELECT data_type INTO col_type
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'system_config' AND column_name = 'id';

    IF col_type = 'uuid' THEN
        -- Drop primary key constraint
        ALTER TABLE public.system_config DROP CONSTRAINT IF EXISTS system_config_pkey;
        -- Drop the column
        ALTER TABLE public.system_config DROP COLUMN id;
        -- Add integer id column as PK
        ALTER TABLE public.system_config ADD COLUMN id SERIAL PRIMARY KEY;
    END IF;
END $$;

-- 2. Consolidate separate rows (e.g. from legacy seeds) into id = 1
DO $$
DECLARE
    has_key BOOLEAN;
    v_max_advance INT;
    v_expiry INT;
    v_max_res INT;
    v_discord_enabled BOOLEAN;
    v_limits JSONB;
    v_support_enabled BOOLEAN;
    v_support_msg TEXT;
BEGIN
    -- Check if key column exists in the database to avoid compile-time column not found errors
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'system_config' 
          AND column_name = 'key'
    ) INTO has_key;

    IF has_key THEN
        -- Capture values from seed rows using dynamic SQL if they exist before deleting
        EXECUTE 'SELECT max_advance_booking_days, reservation_expiry_minutes, max_reservations_per_user 
                 FROM public.system_config WHERE key = ''general_settings'' LIMIT 1'
        INTO v_max_advance, v_expiry, v_max_res;

        EXECUTE 'SELECT discord_notifications_enabled 
                 FROM public.system_config WHERE key = ''discord_webhooks'' LIMIT 1'
        INTO v_discord_enabled;

        -- Capture custom limits if present
        EXECUTE 'SELECT value FROM public.system_config WHERE key = ''loan_limits'' LIMIT 1'
        INTO v_limits;

        EXECUTE 'SELECT support_auto_reply_enabled, support_auto_reply_message 
                 FROM public.system_config WHERE key = ''support_settings'' LIMIT 1'
        INTO v_support_enabled, v_support_msg;
    END IF;

    -- Ensure we have at least one row
    IF NOT EXISTS (SELECT 1 FROM public.system_config) THEN
        -- Using dynamic SQL for insert to prevent issues if key column is NOT NULL
        IF has_key THEN
            EXECUTE 'INSERT INTO public.system_config (id, key, value) VALUES (1, ''general_settings'', ''{}''::jsonb)';
        ELSE
            INSERT INTO public.system_config (id) VALUES (1);
        END IF;
    END IF;

    -- Force the first row's ID to be 1
    UPDATE public.system_config 
    SET id = 1 
    WHERE id = (SELECT id FROM public.system_config ORDER BY id LIMIT 1);

    -- Update row 1 with consolidated settings if we captured them
    IF has_key THEN
        UPDATE public.system_config
        SET
            max_advance_booking_days = COALESCE(v_max_advance, max_advance_booking_days, 30),
            reservation_expiry_minutes = COALESCE(v_expiry, reservation_expiry_minutes, 5),
            max_reservations_per_user = COALESCE(v_max_res, max_reservations_per_user, 3),
            discord_notifications_enabled = COALESCE(v_discord_enabled, discord_notifications_enabled, false),
            loan_limits_by_type = COALESCE(v_limits, loan_limits_by_type, '{"student": {"max_days": 3, "max_items": 1}, "lecturer": {"max_days": 7, "max_items": 3}, "staff": {"max_days": 5, "max_items": 2}}'::jsonb),
            support_auto_reply_enabled = COALESCE(v_support_enabled, support_auto_reply_enabled, true),
            support_auto_reply_message = COALESCE(v_support_msg, support_auto_reply_message)
        WHERE id = 1;

        -- Drop key and value columns if they exist as they are no longer used
        ALTER TABLE public.system_config DROP COLUMN IF EXISTS key;
        ALTER TABLE public.system_config DROP COLUMN IF EXISTS value;
    END IF;

    -- Remove any other config rows
    DELETE FROM public.system_config WHERE id != 1;
END $$;

-- 3. Harden RLS Policies
-- Drop old policies on system_config
DROP POLICY IF EXISTS "system_config_select_staff" ON public.system_config;
DROP POLICY IF EXISTS "system_config_all_admin" ON public.system_config;
DROP POLICY IF EXISTS "system_config_select_public" ON public.system_config;
DROP POLICY IF EXISTS "system_config_select_admin" ON public.system_config;
DROP POLICY IF EXISTS "Anyone view config" ON public.system_config;
DROP POLICY IF EXISTS "Admins update config" ON public.system_config;

-- Create single admin-only policy for read/write
CREATE POLICY "system_config_admin_all" ON public.system_config
    FOR ALL USING (get_my_role() = 'admin');

-- Ensure RPC is correctly defined and granted
GRANT EXECUTE ON FUNCTION public.get_public_system_config() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_system_config() TO anon;
