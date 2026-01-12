-- Migration: Add 'staff' role to user_role enum
-- Date: 2026-01-12
-- Description: Adds the 'staff' role for loan service officers between 'user' and 'admin'

-- Add 'staff' value to user_role enum
-- Note: PostgreSQL enum values are ordered by creation, not alphabetically
-- We add 'staff' which will be checked with role hierarchy in application code
DO $$
BEGIN
    -- Check if 'staff' value already exists in the enum
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'staff' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    ) THEN
        ALTER TYPE user_role ADD VALUE 'staff';
    END IF;
END $$;

-- Add comment for documentation
COMMENT ON TYPE user_role IS 'User roles: admin (full access), staff (loan management), user (borrower)';
