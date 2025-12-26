-- Allow public read access (guests) for equipment
-- This is necessary for the landing page to display equipment to unauthenticated users.

DROP POLICY IF EXISTS "Approved users can view equipment" ON equipment;

CREATE POLICY "Public can view equipment" 
ON equipment FOR SELECT 
USING (true);

-- Ensure system_config is also readable by public (for Operating Hours)
DROP POLICY IF EXISTS "Authenticated users can view config" ON system_config;

CREATE POLICY "Public can view config" 
ON system_config FOR SELECT 
USING (true);
