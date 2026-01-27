-- Migration: Change staff_activity_log target_id to TEXT
-- Date: 2026-01-27
-- Description: Allow storing non-UUID values (like 'bulk') in target_id

ALTER TABLE staff_activity_log
ALTER COLUMN target_id TYPE TEXT;
