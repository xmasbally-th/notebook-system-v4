-- Enable pgcrypto for UUIDs (usually enabled by default but good practice)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Create Enums (Safe handling for existing types)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE equipment_status AS ENUM ('active', 'maintenance', 'retired', 'lost');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) NOT NULL PRIMARY KEY,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role user_role DEFAULT 'user',
  status user_status DEFAULT 'pending',
  department JSONB,
  phone_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Equipment Table
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

-- 4. Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;

-- 5. Policies (Drop first to avoid errors on re-run)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin' AND status = 'approved'));

DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;
CREATE POLICY "Admins can update profiles" ON profiles FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin' AND status = 'approved'));

DROP POLICY IF EXISTS "Approved users can view equipment" ON equipment;
CREATE POLICY "Approved users can view equipment" ON equipment FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status = 'approved'));

DROP POLICY IF EXISTS "Admins can manage equipment" ON equipment;
CREATE POLICY "Admins can manage equipment" ON equipment FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin' AND status = 'approved'));

-- 6. Setup Triggers for New User
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, role, status)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', 'user', 'pending')
  ON CONFLICT (id) DO NOTHING; -- Handle case where profile already exists
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger first if exists to safely recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 7. Create Loan Requests Table
CREATE TABLE IF NOT EXISTS "loanRequests" (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  equipment_id UUID REFERENCES equipment(id) NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'returned')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE "loanRequests" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users access own requests" ON "loanRequests";
CREATE POLICY "Users access own requests" ON "loanRequests" FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins manage requests" ON "loanRequests";
CREATE POLICY "Admins manage requests" ON "loanRequests" FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin' AND status = 'approved'));

-- 8. Conflict Check Function
CREATE OR REPLACE FUNCTION check_reservation_conflict(
  target_equipment_id UUID,
  new_start_date TIMESTAMPTZ,
  new_end_date TIMESTAMPTZ
) RETURNS BOOLEAN AS $$
DECLARE
  conflict_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO conflict_count
  FROM "loanRequests" 
  WHERE equipment_id = target_equipment_id
    AND status IN ('approved', 'pending')
    AND start_date <= new_end_date
    AND end_date >= new_start_date;
    
  RETURN conflict_count > 0;
END;
$$ LANGUAGE plpgsql;
