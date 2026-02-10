-- Fix: Infinite Recursion in Profiles RLS Policy
-- Date: 2026-02-10

-- 1. Create a secure function to check user role (Bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_staff_or_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the creator (superuser/admin), bypassing RLS
SET search_path = public -- Secure search path
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

-- 2. Update the policy to use the secure function
DROP POLICY IF EXISTS "Staff and Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles; -- Cleanup old policies if present
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles; -- Cleanup old policies if present

CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT
USING ( auth.uid() = id );

CREATE POLICY "Staff and Admins can view all profiles" ON profiles
FOR SELECT
USING ( public.is_staff_or_admin() );

-- 3. Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
