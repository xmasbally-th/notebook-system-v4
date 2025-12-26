-- Fix infinite recursion in RLS policies by using SECURITY DEFINER functions

-- 1. Function to check if current user is admin (Bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
      AND role = 'admin'
      AND status = 'approved'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Function to check if current user is approved (Bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_approved()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
      AND status = 'approved'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update Profiles Policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;
CREATE POLICY "Admins can update profiles" ON profiles FOR UPDATE USING (is_admin());

-- 4. Update Equipment Policies
-- Drop old policy
DROP POLICY IF EXISTS "Approved users can view equipment" ON equipment;
-- Create new policy (using function)
CREATE POLICY "Approved users can view equipment" ON equipment FOR SELECT USING (is_approved());

DROP POLICY IF EXISTS "Admins can manage equipment" ON equipment;
CREATE POLICY "Admins can manage equipment" ON equipment FOR ALL USING (is_admin());

-- 5. Update Loan Requests Policies
DROP POLICY IF EXISTS "Admins manage requests" ON "loanRequests";
CREATE POLICY "Admins manage requests" ON "loanRequests" FOR ALL USING (is_admin());
