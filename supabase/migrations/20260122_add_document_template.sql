-- Add document_template_url column to system_config table
-- This will store the URL of the uploaded DOCX template for document generation

ALTER TABLE system_config
ADD COLUMN IF NOT EXISTS document_template_url TEXT DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN system_config.document_template_url IS 'URL of the DOCX template file used for generating loan documents';
