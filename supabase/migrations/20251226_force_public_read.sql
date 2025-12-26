-- Comprehensive RLS fix for equipment table
-- Drop all existing SELECT policies to ensure a clean slate for reading
DROP POLICY IF EXISTS "Equipment is viewable by everyone" ON equipment;
DROP POLICY IF EXISTS "Public can view equipment" ON equipment;
DROP POLICY IF EXISTS "Authenticated users can view equipment" ON equipment;
DROP POLICY IF EXISTS "Approved users can view equipment" ON equipment;

-- Re-create a single, simple public read policy
CREATE POLICY "Public can view equipment" 
ON equipment FOR SELECT 
USING (true);

-- Ensure system_config is also readable
DROP POLICY IF EXISTS "Public can view config" ON system_config;
DROP POLICY IF EXISTS "Authenticated users can view config" ON system_config;

CREATE POLICY "Public can view config" 
ON system_config FOR SELECT 
USING (true);
