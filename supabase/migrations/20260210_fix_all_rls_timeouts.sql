-- Comprehensive RLS Fix: Profiles & System Config
-- Date: 2026-02-10

-- 1. Ensure the secure function exists (Idempotent)
CREATE OR REPLACE FUNCTION public.is_staff_or_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('staff', 'admin')
    AND status = 'approved'
  );
END;
$$;

-- 2. Fix Profiles RLS (Just in case)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff and Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Public profiles access" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT USING ( auth.uid() = id );

CREATE POLICY "Staff and Admins can view all profiles" ON profiles
FOR SELECT USING ( public.is_staff_or_admin() );

-- 3. Fix System Config RLS
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view system config" ON system_config;
DROP POLICY IF EXISTS "Admins can update system config" ON system_config;
DROP POLICY IF EXISTS "Staff can update system config" ON system_config;

-- Allow EVERYONE to read system config (needed for login page, creating requests, etc.)
CREATE POLICY "Anyone can view system config" ON system_config
FOR SELECT
USING ( true );

-- Allow only Staff/Admins to update
CREATE POLICY "Staff and Admins can update system config" ON system_config
FOR UPDATE
USING ( public.is_staff_or_admin() )
WITH CHECK ( public.is_staff_or_admin() );

-- 4. Fix Equipment RLS (Often a culprit too)
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view equipment" ON equipment;
CREATE POLICY "Public can view equipment" ON equipment
FOR SELECT USING ( true );

-- 5. Fix Loan Requests RLS (To prevent recursion there too)
ALTER TABLE "loanRequests" ENABLE ROW LEVEL SECURITY;
-- (Assuming standard policies, but ensuring View is safe)
DROP POLICY IF EXISTS "Staff can view all loans" ON "loanRequests";
CREATE POLICY "Staff can view all loans" ON "loanRequests"
FOR SELECT USING ( public.is_staff_or_admin() );
