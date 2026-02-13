-- ============================================
-- Migration 012: Update file type constraint for course materials
-- ============================================

-- Drop the existing constraint
ALTER TABLE course_materials DROP CONSTRAINT IF EXISTS check_file_type;

-- Add updated constraint with image file types
ALTER TABLE course_materials ADD CONSTRAINT check_file_type 
CHECK (file_type IN ('pdf', 'docx', 'pptx', 'zip', 'doc', 'ppt', 'txt', 'jpg', 'jpeg', 'png', 'gif'));

-- Update any existing 'unknown' file types to 'txt' as a fallback
UPDATE course_materials SET file_type = 'txt' WHERE file_type = 'unknown';