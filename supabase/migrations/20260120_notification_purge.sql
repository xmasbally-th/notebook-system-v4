-- Migration: Notification Purge System
-- Date: 2026-01-20
-- Description: Add hard delete capability and auto-purge for notifications

-- ============================================
-- 1. RLS POLICIES - Admin can view and delete notifications
-- ============================================

-- Admin can SELECT all notifications (for delete preview)
DROP POLICY IF EXISTS "Admin can view all notifications" ON notifications;
CREATE POLICY "Admin can view all notifications" ON notifications
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'admin' 
        AND status = 'approved'
    )
);

-- Admin can DELETE notifications
DROP POLICY IF EXISTS "Admin can delete notifications" ON notifications;
CREATE POLICY "Admin can delete notifications" ON notifications
FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'admin' 
        AND status = 'approved'
    )
);

-- ============================================
-- 2. ADD NOTIFICATION RETENTION SETTING
-- ============================================
ALTER TABLE system_config 
ADD COLUMN IF NOT EXISTS notification_retention_days INTEGER DEFAULT 30;

-- ============================================
-- 3. AUTO-PURGE FUNCTION
-- ลบการแจ้งเตือนที่อ่านแล้วและเก่ากว่า retention_days
-- ============================================
CREATE OR REPLACE FUNCTION purge_old_notifications()
RETURNS INTEGER AS $$
DECLARE
    retention_days INTEGER;
    deleted_count INTEGER;
BEGIN
    -- Get retention days from system_config (default 30)
    SELECT COALESCE(notification_retention_days, 30) INTO retention_days
    FROM system_config
    LIMIT 1;

    -- Delete old read notifications
    DELETE FROM notifications
    WHERE is_read = TRUE
    AND created_at < NOW() - (retention_days || ' days')::INTERVAL;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. HELPER FUNCTION: Bulk delete notifications by IDs
-- สำหรับ Admin ลบผ่าน UI
-- ============================================
CREATE OR REPLACE FUNCTION delete_notifications_by_ids(notification_ids UUID[])
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Check if caller is admin
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'admin' 
        AND status = 'approved'
    ) THEN
        RAISE EXCEPTION 'Only admin can delete notifications';
    END IF;

    DELETE FROM notifications
    WHERE id = ANY(notification_ids);
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. INDEX สำหรับ purge performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_notifications_purge 
    ON notifications(is_read, created_at) 
    WHERE is_read = TRUE;
