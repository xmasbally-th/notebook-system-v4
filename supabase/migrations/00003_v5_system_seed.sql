-- ============================================
-- V5 Baseline Migration: Layer 3 (System Seeds)
-- Date: 2026-02-24
-- Description: Consolidated seed data for departments, equipment types, and configuration
-- ============================================

-- 1. Departments
INSERT INTO departments (name, code, is_active)
VALUES 
  ('สาขาวิชาการบัญชี', 'ACC', true),
  ('สาขาวิชาการจัดการธุรกิจดิจิทัล', 'DBM', true),
  ('สาขาวิชาการจัดการ', 'MGT', true),
  ('สาขาวิชาเศรษฐศาสตร์ดิจิทัล', 'ECO', true),
  ('สาขาวิชาอุตสาหกรรมการท่องเที่ยว', 'TRM', true),
  ('สำนักงานคณบดี', 'DEAN', true)
ON CONFLICT (name) DO NOTHING;

-- 2. Equipment Types
INSERT INTO equipment_types (name, description, icon)
VALUES
  ('โน้ตบุ๊ก', 'คอมพิวเตอร์โน้ตบุ๊กแบบพกพา', '💻'),
  ('โปรเจกเตอร์', 'เครื่องฉายภาพ', '📽️'),
  ('กล้องถ่ายรูป', 'กล้องถ่ายภาพดิจิทัล', '📷'),
  ('ไมโครโฟน', 'อุปกรณ์รับเสียง', '🎤'),
  ('ลำโพง', 'อุปกรณ์ขยายเสียง', '🔊'),
  ('อุปกรณ์อื่นๆ', 'อุปกรณ์ทั่วไป', '📦')
ON CONFLICT (name) DO NOTHING;

-- 3. System Configuration
-- Initialize base config rows for easy access
INSERT INTO system_config (key, value, max_advance_booking_days, reservation_expiry_minutes, max_reservations_per_user)
VALUES (
    'general_settings', 
    '{"site_name": "Notebook System V5", "contact_email": "admin@example.com"}'::JSONB,
    30, 5, 3
) ON CONFLICT (key) DO NOTHING;

INSERT INTO system_config (key, value, discord_notifications_enabled)
VALUES (
    'discord_webhooks', 
    '{"maintenance": "", "loans": "", "reservations": ""}'::JSONB,
    false
) ON CONFLICT (key) DO NOTHING;

INSERT INTO system_config (key, value)
VALUES (
    'loan_limits', 
    '{"student": 1, "lecturer": 5, "staff": 2}'::JSONB
) ON CONFLICT (key) DO NOTHING;

INSERT INTO system_config (key, value, support_auto_reply_enabled, support_auto_reply_message)
VALUES (
    'support_settings', 
    '{}'::JSONB,
    true,
    'ขอบคุณที่ติดต่อระบบ Notebook System เจ้าหน้าที่จะตอบกลับโดยเร็วที่สุดครับ'
) ON CONFLICT (key) DO NOTHING;
