-- Update Equipment Table
-- เพิ่มฟิลด์ใหม่ และเปลี่ยน status enum

-- 1. Add new columns
ALTER TABLE equipment 
  ADD COLUMN IF NOT EXISTS brand TEXT,
  ADD COLUMN IF NOT EXISTS model TEXT,
  ADD COLUMN IF NOT EXISTS equipment_type_id UUID REFERENCES equipment_types(id);

-- 2. Create new status enum
DO $$ BEGIN
    CREATE TYPE equipment_status_new AS ENUM ('ready', 'borrowed', 'maintenance', 'retired');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Update status column (handle migration from old to new values)
-- First, add temporary column
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS status_new equipment_status_new;

-- Map old values to new
UPDATE equipment SET status_new = 
  CASE 
    WHEN status::text = 'active' THEN 'ready'::equipment_status_new
    WHEN status::text = 'maintenance' THEN 'maintenance'::equipment_status_new
    WHEN status::text = 'retired' THEN 'retired'::equipment_status_new
    WHEN status::text = 'lost' THEN 'retired'::equipment_status_new
    ELSE 'ready'::equipment_status_new
  END
WHERE status_new IS NULL;

-- Set default for new column
ALTER TABLE equipment ALTER COLUMN status_new SET DEFAULT 'ready'::equipment_status_new;

-- 4. Create index for equipment_type_id
CREATE INDEX IF NOT EXISTS idx_equipment_type ON equipment(equipment_type_id);
CREATE INDEX IF NOT EXISTS idx_equipment_status_new ON equipment(status_new);

-- Note: After verifying the migration, you can drop the old status column
-- ALTER TABLE equipment DROP COLUMN status;
-- ALTER TABLE equipment RENAME COLUMN status_new TO status;
