-- ============================================
-- FIX: Admin can view all equipment
-- Date: 2026-02-04
-- Issue: Admin can't see equipment on admin/equipment page
-- ============================================

-- Add explicit SELECT policy for admins
DROP POLICY IF EXISTS "Admins can view all equipment" ON equipment;
CREATE POLICY "Admins can view all equipment" ON equipment 
  FOR SELECT USING (public.rls_is_admin());

-- Also make sure staff can view equipment for their work
DROP POLICY IF EXISTS "Staff can view all equipment" ON equipment;
CREATE POLICY "Staff can view all equipment" ON equipment 
  FOR SELECT USING (public.rls_is_staff_or_admin());
