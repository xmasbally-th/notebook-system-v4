-- =======================================================
-- CONSOLIDATED FIX SCRIPT FOR NOTEBOOK SYSTEM V4
-- Run this ENTIRE script in Supabase SQL Editor
-- =======================================================

-- 0. Enable pgcrypto
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Create Enums (Safe handling)
DO $$ BEGIN CREATE TYPE user_role AS ENUM ('admin', 'user'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE user_status AS ENUM ('pending', 'approved', 'rejected'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE equipment_status AS ENUM ('active', 'maintenance', 'retired', 'lost'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE user_type AS ENUM ('student', 'lecturer', 'staff'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. Create Departments Table
CREATE TABLE IF NOT EXISTS departments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  code TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Everyone can view active departments" ON departments;
CREATE POLICY "Everyone can view active departments" ON departments FOR SELECT USING (is_active = true);

-- 3. Create Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) NOT NULL PRIMARY KEY,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role user_role DEFAULT 'user',
  status user_status DEFAULT 'pending',
  phone_number TEXT,
  title TEXT,
  user_type user_type,
  department_id UUID REFERENCES departments(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- If table exists, add missing columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_type user_type;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 4. Create Equipment Table
CREATE TABLE IF NOT EXISTS equipment (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  equipment_number TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  status equipment_status DEFAULT 'active',
  category JSONB DEFAULT '{}'::JSONB NOT NULL,
  images JSONB DEFAULT '[]'::JSONB NOT NULL,
  search_keywords TEXT[] DEFAULT '{}' NOT NULL,
  location JSONB DEFAULT '{}'::JSONB,
  specifications JSONB DEFAULT '{}'::JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;

-- 5. Create Loan Requests Table
CREATE TABLE IF NOT EXISTS "loanRequests" (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  equipment_id UUID REFERENCES equipment(id) NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'returned')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE "loanRequests" ENABLE ROW LEVEL SECURITY;

-- 6. Create System Config Table
CREATE TABLE IF NOT EXISTS system_config (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  max_loan_days INTEGER DEFAULT 7,
  max_active_loans INTEGER DEFAULT 3,
  opening_time TIME DEFAULT '09:00:00',
  closing_time TIME DEFAULT '17:00:00',
  allow_weekend_booking BOOLEAN DEFAULT FALSE,
  require_approval BOOLEAN DEFAULT TRUE,
  discord_webhook_url TEXT,
  email_notifications_enabled BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO system_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

-- 7. SECURITY DEFINER Functions (Fix RLS Recursion)
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin' AND status = 'approved'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_approved() RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND status = 'approved'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Handle New User Trigger (Auto-Admin for First User)
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
DECLARE
  is_first_user BOOLEAN;
BEGIN
  SELECT NOT EXISTS (SELECT 1 FROM public.profiles) INTO is_first_user;

  INSERT INTO public.profiles (id, email, first_name, role, status)
  VALUES (
    NEW.id, 
    NEW.email, 
    NEW.raw_user_meta_data->>'full_name', 
    CASE WHEN is_first_user THEN 'admin'::user_role ELSE 'user'::user_role END,
    CASE WHEN is_first_user THEN 'approved'::user_status ELSE 'pending'::user_status END
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 9. RLS Policies
-- Profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (is_admin());
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;
CREATE POLICY "Admins can update profiles" ON profiles FOR UPDATE USING (is_admin());

-- Equipment (Public Read)
DROP POLICY IF EXISTS "Public can view equipment" ON equipment;
CREATE POLICY "Public can view equipment" ON equipment FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage equipment" ON equipment;
CREATE POLICY "Admins can manage equipment" ON equipment FOR ALL USING (is_admin());

-- System Config (Public Read)
DROP POLICY IF EXISTS "Public can view config" ON system_config;
CREATE POLICY "Public can view config" ON system_config FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can update config" ON system_config;
CREATE POLICY "Admins can update config" ON system_config FOR UPDATE USING (is_admin());

-- Loan Requests
DROP POLICY IF EXISTS "Users access own requests" ON "loanRequests";
CREATE POLICY "Users access own requests" ON "loanRequests" FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins manage requests" ON "loanRequests";
CREATE POLICY "Admins manage requests" ON "loanRequests" FOR ALL USING (is_admin());

-- Departments
DROP POLICY IF EXISTS "Admins can manage departments" ON departments;
CREATE POLICY "Admins can manage departments" ON departments FOR ALL USING (is_admin());

-- =======================================================
-- DONE! Now try logging in again.
-- =======================================================
