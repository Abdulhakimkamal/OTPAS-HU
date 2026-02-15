-- Migration: Increase file column sizes
-- Date: 2026-02-11
-- Description: Increase varchar limits for file_path and file_name to accommodate longer filenames

-- Check if project_files table exists before altering
DO $$
BEGIN
  -- Increase file_path from 500 to 1000 characters
  ALTER TABLE project_files 
  ALTER COLUMN file_path TYPE VARCHAR(1000);

  -- Increase file_name from 255 to 500 characters  
  ALTER TABLE project_files 
  ALTER COLUMN file_name TYPE VARCHAR(500);

  -- Increase file_type from 50 to 100 characters (for longer MIME types)
  ALTER TABLE project_files 
  ALTER COLUMN file_type TYPE VARCHAR(100);

  -- Add comment
  COMMENT ON COLUMN project_files.file_path IS 'Path to the uploaded file on the server (increased to 1000 chars)';
  COMMENT ON COLUMN project_files.file_name IS 'Original filename (increased to 500 chars)';
  COMMENT ON COLUMN project_files.file_type IS 'MIME type of the file (increased to 100 chars)';
EXCEPTION WHEN undefined_table THEN
  -- Table doesn't exist yet, will be created by schema
  NULL;
END $$;
