-- Add document_logo_url column to system_config table
-- This will store the URL of the uploaded logo for document printing

ALTER TABLE system_config
ADD COLUMN IF NOT EXISTS document_logo_url TEXT DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN system_config.document_logo_url IS 'URL of the logo image used in printed documents like special loan forms';
