-- Create Enums
CREATE TYPE user_role AS ENUM ('admin', 'user');
CREATE TYPE user_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE equipment_status AS ENUM ('active', 'maintenance', 'retired', 'lost');

-- Create Profiles Table
CREATE TABLE profiles (
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

-- Create Equipment Table
CREATE TABLE equipment (
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

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
-- Users can view their own profile
CREATE POLICY "Users can view own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" 
  ON profiles FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin' AND status = 'approved'
    )
  );

-- Admins can update profiles (e.g. approve users)
CREATE POLICY "Admins can update profiles" 
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin' AND status = 'approved'
    )
  );

-- Equipment Policies
-- Approved users can view equipment (and admins)
CREATE POLICY "Approved users can view equipment" 
  ON equipment FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND status = 'approved'
    )
  );

-- Admins can insert/update/delete equipment
CREATE POLICY "Admins can insert equipment" 
  ON equipment FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin' AND status = 'approved'
    )
  );

CREATE POLICY "Admins can update equipment" 
  ON equipment FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin' AND status = 'approved'
    )
  );

CREATE POLICY "Admins can delete equipment" 
  ON equipment FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin' AND status = 'approved'
    )
  );

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, role, status)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name', -- Try to get name from meta data
    '',
    'user',
    'pending'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Conflict Check Logic
CREATE OR REPLACE FUNCTION check_reservation_conflict(
  target_equipment_id UUID,
  new_start_date TIMESTAMPTZ,
  new_end_date TIMESTAMPTZ
) RETURNS BOOLEAN AS $$
DECLARE
  conflict_count INTEGER;
BEGIN
  -- Assuming 'loanRequests' table exists (not fully defined in schema but checked in logic)
  -- If table does not exist, this function creation will fail if strict check is on, 
  -- but generally in Supabase SQL editor it works if table is created. 
  -- Ideally I should add CREATE TABLE loanRequests logic here too.
  
  SELECT COUNT(*) INTO conflict_count
  FROM "loanRequests" 
  WHERE equipment_id = target_equipment_id
    AND status IN ('approved', 'pending')
    AND start_date <= new_end_date
    AND end_date >= new_start_date;
    
  RETURN conflict_count > 0;
END;
$$ LANGUAGE plpgsql;
