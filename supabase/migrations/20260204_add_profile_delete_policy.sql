-- ============================================
-- Add DELETE policy for profiles table
-- Date: 2026-02-04
-- Description: Allow admins to delete user profiles
-- ============================================

-- Add DELETE policy for profiles (admins can delete users)
CREATE POLICY "Admins can delete profiles" ON profiles 
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin' AND status = 'approved')
  );

-- ============================================
-- DONE!
-- ============================================
