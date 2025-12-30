-- Seed initial departments data
-- Run this in Supabase SQL Editor

INSERT INTO departments (name, code, is_active)
VALUES 
  ('สาขาวิชาการบัญชี', 'ACC', true),
  ('สาขาวิชาการจัดการธุรกิจดิจิทัล', 'DBM', true),
  ('สาขาวิชาการจัดการ', 'MGT', true),
  ('สำนักงานคณบดี', 'DEAN', true)
ON CONFLICT (name) DO NOTHING;
