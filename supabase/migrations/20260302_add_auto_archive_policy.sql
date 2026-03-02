-- ============================================
-- Auto-Archive Policy Migration
-- Date: 2026-03-02
-- Description: Add retention policy columns to system_config
--              and create run_data_archive() function for bulk cleanup
-- ============================================

-- 1. Add archive policy columns to system_config
ALTER TABLE public.system_config
    ADD COLUMN IF NOT EXISTS archive_enabled BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS archive_support_after_days INTEGER DEFAULT 180,
    ADD COLUMN IF NOT EXISTS archive_notifications_after_days INTEGER DEFAULT 90,
    ADD COLUMN IF NOT EXISTS last_archived_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Create the archive function (SECURITY DEFINER = runs as table owner, bypasses RLS)
CREATE OR REPLACE FUNCTION public.run_data_archive()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    cfg RECORD;
    deleted_tickets INT := 0;
    deleted_notifs  INT := 0;
BEGIN
    -- Load current archive settings
    SELECT
        COALESCE(archive_support_after_days, 180) AS support_days,
        COALESCE(archive_notifications_after_days, 90) AS notif_days
    INTO cfg
    FROM public.system_config
    LIMIT 1;

    -- Delete closed support tickets older than threshold
    -- (support_messages cascade-delete via ON DELETE CASCADE)
    WITH deleted AS (
        DELETE FROM public.support_tickets
        WHERE status = 'closed'
          AND updated_at < NOW() - (cfg.support_days || ' days')::INTERVAL
        RETURNING id
    )
    SELECT COUNT(*) INTO deleted_tickets FROM deleted;

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
        'deleted_tickets',      deleted_tickets,
        'deleted_notifications', deleted_notifs,
        'archived_at',          NOW()
    );
END;
$$;

-- 3. Grant execute to authenticated users (RLS on calling action enforces admin-only)
GRANT EXECUTE ON FUNCTION public.run_data_archive() TO authenticated;
