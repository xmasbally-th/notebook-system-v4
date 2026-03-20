-- Migration: Add user_id to profiles and welpru_notifications_enabled to system_config

-- Add user_id (Student ID / Personnel ID) to profiles. It should be unique if provided.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_id TEXT UNIQUE;

-- Add toggle for WeLPRU notifications in system_config
ALTER TABLE system_config ADD COLUMN IF NOT EXISTS welpru_notifications_enabled BOOLEAN DEFAULT FALSE;
