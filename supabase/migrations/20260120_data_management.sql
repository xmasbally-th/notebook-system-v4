-- Migration: Data Management System
-- Date: 2026-01-20
-- Description: Create data_backups table for soft delete and add new action types

-- ============================================
-- 1. DATA BACKUPS TABLE (Soft Delete Storage)
-- ============================================
CREATE TABLE IF NOT EXISTS data_backups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,               -- 'loanRequests', 'reservations', 'equipment'
    original_id UUID NOT NULL,              -- Original record ID
    data JSONB NOT NULL,                    -- Complete data snapshot
    deleted_by UUID REFERENCES auth.users(id),
    deleted_at TIMESTAMPTZ DEFAULT NOW(),
    restore_until TIMESTAMPTZ,              -- Auto-purge date (optional, default 30 days)
    restore_reason TEXT,                    -- If restored, why
    restored_at TIMESTAMPTZ,
    restored_by UUID REFERENCES auth.users(id)
);

-- ============================================
-- 2. ENABLE RLS
-- ============================================
ALTER TABLE data_backups ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. RLS POLICIES - Admin Only
-- ============================================
DROP POLICY IF EXISTS "Admin can view all backups" ON data_backups;
CREATE POLICY "Admin can view all backups" ON data_backups
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'admin' 
        AND status = 'approved'
    )
);

DROP POLICY IF EXISTS "Admin can insert backups" ON data_backups;
CREATE POLICY "Admin can insert backups" ON data_backups
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'admin' 
        AND status = 'approved'
    )
);

DROP POLICY IF EXISTS "Admin can update backups" ON data_backups;
CREATE POLICY "Admin can update backups" ON data_backups
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'admin' 
        AND status = 'approved'
    )
);

DROP POLICY IF EXISTS "Admin can delete backups" ON data_backups;
CREATE POLICY "Admin can delete backups" ON data_backups
FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'admin' 
        AND status = 'approved'
    )
);

-- ============================================
-- 4. INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_backups_table_original ON data_backups(table_name, original_id);
CREATE INDEX IF NOT EXISTS idx_backups_deleted_at ON data_backups(deleted_at);
CREATE INDEX IF NOT EXISTS idx_backups_deleted_by ON data_backups(deleted_by);

-- ============================================
-- 5. ADD DATA MANAGEMENT SETTINGS TO SYSTEM_CONFIG
-- ============================================
ALTER TABLE system_config 
ADD COLUMN IF NOT EXISTS backup_retention_days INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS max_export_records INTEGER DEFAULT 10000,
ADD COLUMN IF NOT EXISTS max_import_records INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS max_delete_records INTEGER DEFAULT 50;

-- ============================================
-- 6. HELPER FUNCTION: Auto-set restore_until
-- ============================================
CREATE OR REPLACE FUNCTION set_restore_until()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.restore_until IS NULL THEN
        NEW.restore_until := NEW.deleted_at + INTERVAL '30 days';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_restore_until_trigger ON data_backups;
CREATE TRIGGER set_restore_until_trigger
    BEFORE INSERT ON data_backups
    FOR EACH ROW
    EXECUTE FUNCTION set_restore_until();
