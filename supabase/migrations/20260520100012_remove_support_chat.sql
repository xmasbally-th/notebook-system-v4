-- ============================================
-- Remove Support Chat Migration
-- Date: 2026-05-20
-- Description: Drop support_messages and support_tickets tables.
--              Remove support-related configuration columns from system_config.
--              Update run_data_archive() function to exclude tickets.
-- ============================================

-- 1. Drop RLS policies
DROP POLICY IF EXISTS "tickets_select_own" ON public.support_tickets;
DROP POLICY IF EXISTS "tickets_insert_own" ON public.support_tickets;
DROP POLICY IF EXISTS "tickets_all_staff" ON public.support_tickets;
DROP POLICY IF EXISTS "messages_select_own" ON public.support_messages;
DROP POLICY IF EXISTS "messages_insert_own" ON public.support_messages;
DROP POLICY IF EXISTS "messages_all_staff" ON public.support_messages;

-- 2. Drop tables
DROP TABLE IF EXISTS public.support_messages CASCADE;
DROP TABLE IF EXISTS public.support_tickets CASCADE;

-- 3. Remove columns from system_config
ALTER TABLE public.system_config 
    DROP COLUMN IF EXISTS support_auto_reply_enabled,
    DROP COLUMN IF EXISTS support_auto_reply_message,
    DROP COLUMN IF EXISTS archive_support_after_days;

-- 4. Recreate run_data_archive function
CREATE OR REPLACE FUNCTION public.run_data_archive()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    cfg RECORD;
    deleted_notifs  INT := 0;
BEGIN
    -- Load current archive settings
    SELECT
        COALESCE(archive_notifications_after_days, 90) AS notif_days
    INTO cfg
    FROM public.system_config
    LIMIT 1;

    -- Delete notifications older than threshold
    WITH deleted AS (
        DELETE FROM public.notifications
        WHERE created_at < NOW() - (cfg.notif_days || ' days')::INTERVAL
        RETURNING id
    )
    SELECT COUNT(*) INTO deleted_notifs FROM deleted;

    -- Update last_archived_at timestamp
    UPDATE public.system_config
    SET last_archived_at = NOW()
    WHERE id = (SELECT id FROM public.system_config LIMIT 1);

    RETURN jsonb_build_object(
        'deleted_tickets',      0,
        'deleted_notifications', deleted_notifs,
        'archived_at',          NOW()
    );
END;
$$;
