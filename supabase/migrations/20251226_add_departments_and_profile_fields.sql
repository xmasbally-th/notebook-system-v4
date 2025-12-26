-- 1. Create Departments Table
CREATE TABLE IF NOT EXISTS departments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  code TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- Policies for departments
-- Everyone can view active departments (needed for registration form)
DROP POLICY IF EXISTS "Everyone can view active departments" ON departments;
CREATE POLICY "Everyone can view active departments" ON departments
  FOR SELECT USING (is_active = true);

-- Admins can manage departments
DROP POLICY IF EXISTS "Admins can manage departments" ON departments;
CREATE POLICY "Admins can manage departments" ON departments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin' AND status = 'approved'
    )
  );

-- 2. Create User Type Enum
DO $$ BEGIN
    CREATE TYPE user_type AS ENUM ('student', 'lecturer', 'staff');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Update Profiles Table
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS user_type user_type,
  ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id);

-- Drop old department column if it exists (careful if data exists, but we are dev)
ALTER TABLE profiles DROP COLUMN IF EXISTS department;
