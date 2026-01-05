-- Equipment Types Table for category management
-- สร้างตารางประเภทอุปกรณ์

CREATE TABLE IF NOT EXISTS equipment_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT DEFAULT '📦', -- emoji icon
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE equipment_types ENABLE ROW LEVEL SECURITY;

-- Policies: Everyone can read, only admins can write
DROP POLICY IF EXISTS "Anyone can view equipment types" ON equipment_types;
CREATE POLICY "Anyone can view equipment types" ON equipment_types 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage equipment types" ON equipment_types;
CREATE POLICY "Admins can manage equipment types" ON equipment_types 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin' 
      AND status = 'approved'
    )
  );

-- Seed some default equipment types
INSERT INTO equipment_types (name, description, icon) VALUES
  ('โน้ตบุ๊ก', 'คอมพิวเตอร์โน้ตบุ๊กแบบพกพา', '💻'),
  ('โปรเจกเตอร์', 'เครื่องฉายภาพ', '📽️'),
  ('กล้องถ่ายรูป', 'กล้องถ่ายภาพดิจิทัล', '📷'),
  ('ไมโครโฟน', 'อุปกรณ์รับเสียง', '🎤'),
  ('ลำโพง', 'อุปกรณ์ขยายเสียง', '🔊'),
  ('อุปกรณ์อื่นๆ', 'อุปกรณ์ทั่วไป', '📦')
ON CONFLICT (name) DO NOTHING;
