-- Migration: 20260512_welpru_api_key.sql
-- เพิ่ม column welpru_api_key ใน system_config
-- เพื่อให้ Admin กรอก API Key จากหน้าตั้งค่าได้โดยตรง

ALTER TABLE system_config
ADD COLUMN IF NOT EXISTS welpru_api_key TEXT DEFAULT NULL;

COMMENT ON COLUMN system_config.welpru_api_key IS 'WeLPRU Push Notification API Key - ขอรับได้จาก https://api.lpruhub.com';
